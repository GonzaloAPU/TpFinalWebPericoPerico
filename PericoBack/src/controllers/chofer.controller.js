const { sequelize, Usuario, Chofer } = require('../models/relaciones');

// Evita devolver el passwordHash en las respuestas del servidor.
const quitarPassword = (usuario) => {
  const usuarioSinPassword = usuario.toJSON();
  delete usuarioSinPassword.passwordHash;

  return usuarioSinPassword;
};

const registrarChofer = async (req, res) => {
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

const obtenerChoferes = async (req, res) => {
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

module.exports = {
  registrarChofer,
  obtenerChoferes,
};
