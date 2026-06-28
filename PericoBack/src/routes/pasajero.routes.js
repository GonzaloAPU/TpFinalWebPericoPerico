const express = require('express');
const pasajeroController = require('../controllers/pasajero.controller');

const router = express.Router();

router.get('/', pasajeroController.obtenerPasajeros);
router.post('/', pasajeroController.registrarPasajero);


module.exports = router;
