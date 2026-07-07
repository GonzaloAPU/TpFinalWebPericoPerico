const express = require('express');
const pasajeroCtrl = require('../controllers/pasajero.controller');
const authCtrl = require('../controllers/auth.controller');

const router = express.Router();

router.get('/', authCtrl.verifyToken, authCtrl.verificarRol('ADMIN'), pasajeroCtrl.obtenerPasajeros);
router.get('/:idPasajero/historial', authCtrl.verifyToken, pasajeroCtrl.obtenerHistorialPasajero);
router.patch('/:idPasajero/ubicacion', authCtrl.verifyToken, pasajeroCtrl.actualizarUbicacionPasajero);
router.get('/:idPasajero', authCtrl.verifyToken, pasajeroCtrl.obtenerPasajero);
router.post('/', pasajeroCtrl.registrarPasajero);
router.patch('/:idPasajero', authCtrl.verifyToken, pasajeroCtrl.actualizarPasajero);

module.exports = router;