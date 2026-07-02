const { sequelize, Usuario, Admin } = require('../models/relaciones');

const adminCtrl = {};

// Evita devolver el passwordHash en las respuestas del servidor.
const quitarPassword = (usuario) => {
  const usuarioSinPassword = usuario.toJSON();
  delete usuarioSinPassword.passwordHash;

  return usuarioSinPassword;
};

adminCtrl.registrarAdmin = async (req, res) => {
  const {
    nombre,
    apellido,
    email,
    passwordHash,
    telefono,
    activo,
    estadoAdmin,
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
        rol: 'ADMIN',
      },
      { transaction }
    );

    // Luego se crea el perfil Admin asociado al Usuario.
    const admin = await Admin.create(
      {
        idUsuario: usuario.idUsuario,
        estadoAdmin,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      mensaje: 'Admin registrado correctamente',
      usuario: quitarPassword(usuario),
      admin,
    });
  } catch (error) {
    await transaction.rollback();

    return res.status(400).json({
      mensaje: 'No se pudo registrar el admin',
      error: error.message,
    });
  }
};

adminCtrl.obtenerAdmins = async (req, res) => {
  try {
    // Trae los admins junto con los datos del usuario relacionado.
    const admins = await Admin.findAll({
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: { exclude: ['passwordHash'] },
        },
      ],
    });

    return res.status(200).json(admins);
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al obtener los admins',
      error: error.message,
    });
  }
};

module.exports = adminCtrl;
