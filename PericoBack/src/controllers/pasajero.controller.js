const { sequelize, Usuario, Pasajero } = require('../models/relaciones');

const pasajeroCtrl = {};

// Evita devolver el passwordHash en las respuestas del servidor.
const quitarPassword = (usuario) => {
  const usuarioSinPassword = usuario.toJSON();
  delete usuarioSinPassword.passwordHash;

  return usuarioSinPassword;
};

pasajeroCtrl.registrarPasajero = async (req, res) => {
  const {
    nombre,
    apellido,
    email,
    passwordHash,
    telefono,
    activo,
    calificacion,
    cantidadReservas,
    estadoPasajero,
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
        rol: 'PASAJERO',
      },
      { transaction }
    );

    // Luego se crea el perfil Pasajero asociado al Usuario.
    const pasajero = await Pasajero.create(
      {
        idUsuario: usuario.idUsuario,
        calificacion,
        cantidadReservas,
        estadoPasajero,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      mensaje: 'Pasajero registrado correctamente',
      usuario: quitarPassword(usuario),
      pasajero,
    });
  } catch (error) {
    await transaction.rollback();

    return res.status(400).json({
      mensaje: 'No se pudo registrar el pasajero',
      error: error.message,
    });
  }
};

pasajeroCtrl.obtenerPasajeros = async (req, res) => {
  try {
    // Trae los pasajeros junto con los datos del usuario relacionado.
    const pasajeros = await Pasajero.findAll({
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: { exclude: ['passwordHash'] },
        },
      ],
    });

    return res.status(200).json(pasajeros);
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al obtener los pasajeros',
      error: error.message,
    });
  }
};


// Estructura de logueo para los pasajeros. 
// Se busca un usuario con el email y password proporcionados, y que tenga rol PASAJERO. 
// Luego se verifica que el perfil de pasajero esté activo.
pasajeroCtrl.loginPasajero = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: 0, msg: 'Faltan credenciales' });
  }

  try {
    // Criterio de busqueda estricto: deben coincidir email, password y rol PASAJERO
    const usuario = await Usuario.findOne({
      where: {
        email,
        passwordHash: password,
        rol: 'PASAJERO',
      },
      include: [
        {
          model: Pasajero,
          as: 'perfilPasajero',
        },
      ],
    });

    if (!usuario) {
      return res.json({ status: 0, msg: 'Credenciales incorrectas' });
    }

    if (!usuario.perfilPasajero) {
      return res.json({ status: 0, msg: 'No se encontro el perfil de pasajero asociado' });
    }

    if (usuario.perfilPasajero.estadoPasajero !== 'ACTIVO') {
      return res.json({ status: 0, msg: 'La cuenta de pasajero no esta activa' });
    }

    return res.json({
      status: 1,
      msg: 'success',
      idUsuario: usuario.idUsuario,
      idPasajero: usuario.perfilPasajero.idPasajero,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol,
      estadoPasajero: usuario.perfilPasajero.estadoPasajero,
    });
  } catch (error) {
    return res.status(500).json({ status: 0, msg: 'error', error: error.message });
  }
};

module.exports = pasajeroCtrl;
