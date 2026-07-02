const express = require('express');
const pasajeroCtrl = require('../controllers/pasajero.controller');

const router = express.Router();

router.get('/', pasajeroCtrl.obtenerPasajeros);
router.post('/', pasajeroCtrl.registrarPasajero);

module.exports = router;
