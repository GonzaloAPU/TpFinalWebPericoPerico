const { Usuario, Chofer, Pasajero, Admin } = require('../models/relaciones');

const jwt = require('jsonwebtoken');

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const usuarioCtrl = {};

// Obtener todos los usuarios
usuarioCtrl.obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: {
        exclude: ['passwordHash'] // Oculta la contraseña
      }
    });

    return res.status(200).json(usuarios);
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al obtener los usuarios',
      error: error.message
    });
  }
};


//logueo con google
usuarioCtrl.loginGoogle = async (req, res) => {
  const { token } = req.body;

  try {

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const email = payload.email;
    const nombre = payload.given_name || '';
    const apellido = payload.family_name || '';

    let usuario = await Usuario.findOne({
      where: { email }
    });

    // Si no existe lo crea automáticamente
    if (!usuario) {

      usuario = await Usuario.create({
        nombre,
        apellido,
        email,
        passwordHash: '',
        activo: true,
        rol: 'PASAJERO'
      });

    }

    const jwtToken = jwt.sign(
      {
        idUsuario: usuario.idUsuario,
        rol: usuario.rol
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h'
      }
    );

    return res.json({
      status: 1,
      msg: 'Login Google exitoso',
      token: jwtToken,
      usuario
    });

  } catch (error) {

    return res.status(401).json({
      status: 0,
      msg: 'Token Google inválido',
      error: error.message
    });

  }
};

// Login único para todos los usuarios
usuarioCtrl.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: 0,
      msg: 'Faltan credenciales',
    });
  }

  try {
    const usuario = await Usuario.findOne({
      where: {
        email,
        passwordHash: password,
      },
      include: [
        {
          model: Chofer,
          as: 'perfilChofer',
          required: false,
        },
        {
          model: Pasajero,
          as: 'perfilPasajero',
          required: false,
        },
        {
          model: Admin,
          as: 'perfilAdmin',
          required: false,
        },
      ],
    });

    if (!usuario) {
      return res.json({
        status: 0,
        msg: 'Credenciales incorrectas',
      });
    }

    if (!usuario.activo) {
      return res.json({
        status: 0,
        msg: 'La cuenta de usuario no esta activa',
      });
    }

    // ==========================
    // LOGIN ADMIN
    // ==========================
    if (usuario.rol === 'ADMIN') {
      if (!usuario.perfilAdmin) {
        return res.json({
          status: 0,
          msg: 'No se encontro el perfil de admin asociado',
        });
      }

      if (usuario.perfilAdmin.estadoAdmin !== 'ACTIVO') {
        return res.json({
          status: 0,
          msg: 'La cuenta de admin no esta activa',
        });
      }

      //token de 1 hora de expiracion para admin
      const token = jwt.sign({idUsuario: usuario.idUsuario,rol: usuario.rol},process.env.JWT_SECRET,{expiresIn: '1h'});

      return res.json({
        status: 1,
        msg: 'success',
        rol: 'ADMIN',
        idUsuario: usuario.idUsuario,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        token: token
      });
    }

    // ==========================
    // LOGIN CHOFER
    // ==========================
    if (usuario.rol === 'CHOFER') {
      const ESTADOS_CHOFER_HABILITADOS = [
        'DISPONIBLE',
        'EN_VIAJE',
        'DESCANSO',
      ];

      if (!usuario.perfilChofer) {
        return res.json({
          status: 0,
          msg: 'No se encontró el perfil de chofer asociado',
        });
      }

      if (
        !ESTADOS_CHOFER_HABILITADOS.includes(
          usuario.perfilChofer.estadoChofer
        )
      ) {
        return res.json({
          status: 0,
          msg: 'La cuenta de chofer no está habilitada para ingresar',
        });
      }

      //token de 1 hora de expiracion para chofer
      const token = jwt.sign(
        {
          idUsuario: usuario.idUsuario,
          rol: usuario.rol
        },
        process.env.JWT_SECRET,
        {
          expiresIn: '1h'
        }
      );

      return res.json({
        status: 1,
        msg: 'success',
        rol: 'CHOFER',
        idUsuario: usuario.idUsuario,
        idChofer: usuario.perfilChofer.idChofer,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        estadoChofer: usuario.perfilChofer.estadoChofer,
        token: token
      });
    }

    // ==========================
    // LOGIN PASAJERO
    // ==========================
    if (usuario.rol === 'PASAJERO') {
      if (!usuario.perfilPasajero) {
        return res.json({
          status: 0,
          msg: 'No se encontró el perfil de pasajero asociado',
        });
      }

      if (usuario.perfilPasajero.estadoPasajero !== 'ACTIVO') {
        return res.json({
          status: 0,
          msg: 'La cuenta de pasajero no está activa',
        });
      }

      //token de 1 hora de expiracion para pasajero
      const token = jwt.sign(
        {
          idUsuario: usuario.idUsuario,
          rol: usuario.rol
        },
        process.env.JWT_SECRET,
        {
          expiresIn: '1h'
        }
      );

      return res.json({
        status: 1,
        msg: 'success',
        rol: 'PASAJERO',
        idUsuario: usuario.idUsuario,
        idPasajero: usuario.perfilPasajero.idPasajero,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        estadoPasajero: usuario.perfilPasajero.estadoPasajero,
        token: token
      });
    }

    return res.json({
      status: 0,
      msg: 'Rol no válido',
    });

  } catch (error) {
    return res.status(500).json({
      status: 0,
      msg: 'error',
      error: error.message,
    });
  }
};

module.exports = usuarioCtrl;
