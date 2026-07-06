const express = require('express');
const pasajeroCtrl = require('../controllers/pasajero.controller');

const router = express.Router();

router.get('/', pasajeroCtrl.obtenerPasajeros);
router.get('/:idPasajero/historial', pasajeroCtrl.obtenerHistorialPasajero);
router.patch('/:idPasajero/ubicacion', pasajeroCtrl.actualizarUbicacionPasajero);
router.get('/:idPasajero', pasajeroCtrl.obtenerPasajero);
router.post('/', pasajeroCtrl.registrarPasajero);
router.put('/email/:email', pasajeroCtrl.actualizarPasajero);

module.exports = router;
