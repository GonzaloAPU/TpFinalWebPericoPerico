const { sequelize, Usuario, Chofer, Auto, Viaje } = require('../models/relaciones');

const choferCtrl = {};

// El chofer modifica sus propios datos (perfil Usuario + perfil Chofer).
choferCtrl.actualizarChofer = async (req, res) => {
  const {
    nombre,
    apellido,
    email,
    telefono,
    activo,
    password,
    licenciaConducir,
    fechaHabilitacion,
    estadoChofer,
  } = req.body;

  const transaction = await sequelize.transaction();

  try {
    const chofer = await Chofer.findByPk(req.params.idChofer, {
      include: [{ model: Usuario, as: 'usuario' }],
      transaction,
    });

    if (!chofer) {
      await transaction.rollback();
      return res.status(404).json({
        status: '0',
        msg: 'Chofer no encontrado.',
      });
    }

    const usuario = chofer.usuario;

    // Solo se actualizan los campos que el cliente mando en el body.
    if (nombre !== undefined) usuario.nombre = nombre;
    if (apellido !== undefined) usuario.apellido = apellido;
    if (email !== undefined) usuario.email = email;
    if (telefono !== undefined) usuario.telefono = telefono;
    if (activo !== undefined) usuario.activo = activo;

    // Si mandan "password", se reasigna passwordHash: el hook beforeUpdate
    // del modelo Usuario se encarga de hashearla con bcrypt automaticamente.
    if (password !== undefined && password !== '') {
      usuario.passwordHash = password;
    }

    await usuario.save({ transaction });

    if (licenciaConducir !== undefined) chofer.licenciaConducir = licenciaConducir;
    if (fechaHabilitacion !== undefined) chofer.fechaHabilitacion = fechaHabilitacion;
    if (estadoChofer !== undefined) chofer.estadoChofer = estadoChofer;

    await chofer.save({ transaction });

    await transaction.commit();

    return res.status(200).json({
      status: '1',
      msg: 'Chofer actualizado correctamente.',
      usuario: quitarPassword(usuario),
      chofer,
    });
  } catch (error) {
    await transaction.rollback();

    return res.status(400).json({
      status: '0',
      msg: 'No se pudo actualizar el chofer.',
      error: error.message,
    });
  }
};

// Evita devolver el passwordHash en las respuestas del servidor.
const quitarPassword = (usuario) => {
  const usuarioSinPassword = usuario.toJSON();
  delete usuarioSinPassword.passwordHash;

  return usuarioSinPassword;
};

const validarUbicacion = (latitud, longitud, precision) => {
  const latitudNumero = Number(latitud);
  const longitudNumero = Number(longitud);
  const precisionNumero = precision !== undefined && precision !== null ? Number(precision) : null;

  if (!Number.isFinite(latitudNumero) || latitudNumero < -90 || latitudNumero > 90) {
    return { error: 'Latitud no valida.' };
  }

  if (!Number.isFinite(longitudNumero) || longitudNumero < -180 || longitudNumero > 180) {
    return { error: 'Longitud no valida.' };
  }

  if (precisionNumero !== null && (!Number.isFinite(precisionNumero) || precisionNumero < 0)) {
    return { error: 'Precision no valida.' };
  }

  return {
    ubicacion: {
      latitud: latitudNumero,
      longitud: longitudNumero,
      precision: precisionNumero,
    },
  };
};

choferCtrl.registrarChofer = async (req, res) => {
  const {
    nombre,
    apellido,
    email,
    passwordHash,
    telefono,
    activo,
    licenciaConducir,
    estadoChofer,
    fechaHabilitacion,
    calificacion,
  } = req.body;

  const transaction = await sequelize.transaction();

  try {
    // Primero se crea el Usuario con los datos comunes.
    const usuario = await Usuario.create(
      {
        nombre,
        apellido,
        email,
        passwordHash,
        telefono,
        activo,
        rol: 'CHOFER',
      },
      { transaction }
    );

    // Luego se crea el perfil Chofer asociado al Usuario.
    const chofer = await Chofer.create(
      {
        idUsuario: usuario.idUsuario,
        licenciaConducir,
        estadoChofer,
        fechaHabilitacion,
        calificacion,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      mensaje: 'Chofer registrado correctamente',
      usuario: quitarPassword(usuario),
      chofer,
    });
  } catch (error) {
    await transaction.rollback();

    return res.status(400).json({
      mensaje: 'No se pudo registrar el chofer',
      error: error.message,
    });
  }
};

choferCtrl.obtenerChoferes = async (req, res) => {
  try {
    // Trae los choferes junto con los datos del usuario relacionado.
    const choferes = await Chofer.findAll({
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: { exclude: ['passwordHash'] },
        },
      ],
    });

    return res.status(200).json(choferes);
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al obtener los choferes',
      error: error.message,
    });
  }
};

// Trae los datos completos de un chofer puntual junto con su usuario.
choferCtrl.obtenerChoferPorId = async (req, res) => {
  try {
    const chofer = await Chofer.findByPk(req.params.idChofer, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: { exclude: ['passwordHash'] },
        },
      ],
    });

    if (!chofer) {
      return res.status(404).json({
        status: '0',
        msg: 'Chofer no encontrado.',
      });
    }

    return res.status(200).json(chofer);
  } catch (error) {
    return res.status(500).json({
      status: '0',
      msg: 'Error al obtener el chofer.',
      error: error.message,
    });
  }
};

// Cambia solo el estado operativo del chofer.
choferCtrl.cambiarEstadoChofer = async (req, res) => {
  try {
    const estadoChofer = req.body.estadoChofer || req.body.estado;
    const estadosValidos = [
      'DISPONIBLE',
      'EN_VIAJE',
      'DESCANSO',
      'SUSPENDIDO',
      'INACTIVO',
      'ELIMINADO',
    ];

    if (!estadosValidos.includes(estadoChofer)) {
      return res.status(400).json({
        status: '0',
        msg: 'Estado de chofer no valido.',
      });
    }

    const chofer = await Chofer.findByPk(req.params.idChofer);

    if (!chofer) {
      return res.status(404).json({
        status: '0',
        msg: 'Chofer no encontrado.',
      });
    }

    chofer.estadoChofer = estadoChofer;
    await chofer.save();

    return res.status(200).json({
      status: '1',
      msg: 'Estado del chofer actualizado.',
      chofer,
    });
  } catch (error) {
    return res.status(500).json({
      status: '0',
      msg: 'Error al actualizar el estado del chofer.',
      error: error.message,
    });
  }
};

// Actualiza la ubicacion actual del chofer.
choferCtrl.actualizarUbicacionChofer = async (req, res) => {
  try {
    const { latitud, longitud, precision } = req.body;
    const resultado = validarUbicacion(latitud, longitud, precision);

    if (resultado.error) {
      return res.status(400).json({
        status: '0',
        msg: resultado.error,
      });
    }

    const chofer = await Chofer.findByPk(req.params.idChofer, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: { exclude: ['passwordHash'] },
        },
      ],
    });

    if (!chofer) {
      return res.status(404).json({
        status: '0',
        msg: 'Chofer no encontrado.',
      });
    }

    chofer.latitud = resultado.ubicacion.latitud;
    chofer.longitud = resultado.ubicacion.longitud;
    chofer.precision = resultado.ubicacion.precision;
    await chofer.save();

    const viajeActivo = await Viaje.findOne({
      where: {
        idChofer: chofer.idChofer,
        estado: 'EN_CURSO' 
      }
    });

    // SOLO EMITIMOS POR SOCKET SI EL CHOFER TIENE UN VIAJE EN CURSO
    if (viajeActivo) {
      req.io.emit(`ubicacion_chofer_viaje_${viajeActivo.idViaje}`, {
        idChofer: chofer.idChofer,
        idViaje: viajeActivo.idViaje,
        latitud: chofer.latitud,
        longitud: chofer.longitud,
        precision: chofer.precision
      });
    }

    return res.status(200).json({
      status: '1',
      msg: 'Ubicacion del chofer actualizada.',
      chofer,
    });
  } catch (error) {
    return res.status(500).json({
      status: '0',
      msg: 'Error al actualizar la ubicacion del chofer.',
      error: error.message,
    });
  }
};


// Trae todos los autos relacionados al chofer por sus turnos.
choferCtrl.obtenerAutosDelChofer = async (req, res) => {
  try {
    const chofer = await Chofer.findByPk(req.params.idChofer, {
      include: [
        {
          model: Auto,
          as: 'autos',
        },
      ],
    });

    if (!chofer) {
      return res.status(404).json({
        status: '0',
        msg: 'Chofer no encontrado.',
      });
    }

    return res.status(200).json(chofer.autos);
  } catch (error) {
    return res.status(500).json({
      status: '0',
      msg: 'Error al obtener los autos del chofer.',
      error: error.message,
    });
  }
};

// Trae los viajes que se muestran en el boton "Ver Mis Viajes".
choferCtrl.obtenerViajesDelChofer = async (req, res) => {
  try {
    const chofer = await Chofer.findByPk(req.params.idChofer);

    if (!chofer) {
      return res.status(404).json({
        status: '0',
        msg: 'Chofer no encontrado.',
      });
    }

    const viajes = await Viaje.findAll({
      where: { idChofer: req.params.idChofer },
      include: ['auto', 'reservas'],
      order: [
        ['fechaSalida', 'DESC'],
        ['horaSalida', 'DESC'],
      ],
    });

    return res.status(200).json(viajes);
  } catch (error) {
    return res.status(500).json({
      status: '0',
      msg: 'Error al obtener los viajes del chofer.',
      error: error.message,
    });
  }
};

module.exports = choferCtrl;
