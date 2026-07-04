const express = require('express');
const usuarioController = require('../controllers/usuario.controller');
const autCtrl = require('./../controllers/auth.controller');

const router = express.Router();

router.get('/', usuarioController.obtenerUsuarios);
router.post('/login', usuarioController.login);
router.post('/login-google', usuarioController.loginGoogle);

module.exports = router;