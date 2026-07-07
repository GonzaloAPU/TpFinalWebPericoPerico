const express = require('express');
const choferCtrl = require('../controllers/chofer.controller');
const authCtrl = require('../controllers/auth.controller');

const router = express.Router();

router.get('/', authCtrl.verifyToken, authCtrl.verificarRol('ADMIN'), choferCtrl.obtenerChoferes);
router.post('/', choferCtrl.registrarChofer);

// Frontend: trae datos completos del chofer.
router.get('/:idChofer', authCtrl.verifyToken, choferCtrl.obtenerChoferPorId);

// Frontend: cambia el estado del chofer (DISPONIBLE, DESCANSO, EN_VIAJE, etc.).
router.patch('/:idChofer/estado', authCtrl.verifyToken, choferCtrl.cambiarEstadoChofer);

// Frontend: actualiza la ubicacion actual del chofer.
router.patch('/:idChofer/ubicacion', authCtrl.verifyToken, choferCtrl.actualizarUbicacionChofer);

// Frontend: trae todos los autos relacionados a ese chofer.
router.get('/:idChofer/autos', authCtrl.verifyToken, choferCtrl.obtenerAutosDelChofer);

// Frontend: trae los viajes del boton "Ver Mis Viajes".
router.get('/:idChofer/viajes', authCtrl.verifyToken, choferCtrl.obtenerViajesDelChofer);

// Frontend: actualiza los datos del chofer (incluye password).
router.patch('/:idChofer', authCtrl.verifyToken, choferCtrl.actualizarChofer);

module.exports = router;