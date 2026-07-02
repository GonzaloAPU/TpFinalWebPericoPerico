const { sequelize, Usuario, Chofer } = require('../models/relaciones');

const choferCtrl = {};

// Evita devolver el passwordHash en las respuestas del servidor.
const quitarPassword = (usuario) => {
  const usuarioSinPassword = usuario.toJSON();
  delete usuarioSinPassword.passwordHash;

  return usuarioSinPassword;
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


//estructura para el login de lo s choferes, se busca el usuario con el email y password, y que tenga rol CHOFER. 
// Si se encuentra, se devuelve la información del usuario y del perfil de chofer asociado. 
// Si no se encuentra, se devuelve un mensaje de error.
choferCtrl.loginChofer = async (req, res) => {
  const ESTADOS_CHOFER_HABILITADOS = ['DISPONIBLE','EN_VIAJE'];
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: 0, msg: 'Faltan credenciales' });
  }

  try {
    // Criterio de busqueda estricto: deben coincidir email, password y rol CHOFER
    const usuario = await Usuario.findOne({
      where: {
        email,
        passwordHash: password,
        rol: 'CHOFER',
      },
      include: [
        {
          model: Chofer,
          as: 'perfilChofer',
        },
      ],
    });

    if (!usuario) {
      return res.json({ status: 0, msg: 'Credenciales incorrectas' });
    }

    if (!usuario.perfilChofer) {
      return res.json({ status: 0, msg: 'No se encontro el perfil de chofer asociado' });
    }

    if (!ESTADOS_CHOFER_HABILITADOS.includes(usuario.perfilChofer.estadoChofer)) {
      return res.json({ status: 0, msg: 'La cuenta de chofer no esta habilitada para ingresar' });
    }

    return res.json({
      status: 1,
      msg: 'success',
      idUsuario: usuario.idUsuario,
      idChofer: usuario.perfilChofer.idChofer,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol,
      estadoChofer: usuario.perfilChofer.estadoChofer,
    });
  } catch (error) {
    return res.status(500).json({ status: 0, msg: 'error', error: error.message });
  }
};

module.exports = choferCtrl;
