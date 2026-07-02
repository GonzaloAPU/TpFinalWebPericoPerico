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

module.exports = pasajeroCtrl;
