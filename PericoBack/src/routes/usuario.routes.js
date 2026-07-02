const express = require('express');
const usuarioController = require('../controllers/usuario.controller');

const router = express.Router();

router.get('/', usuarioController.obtenerUsuarios);
router.post('/login', usuarioController.login);

module.exports = router;