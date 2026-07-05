const express = require('express');
const choferCtrl = require('../controllers/chofer.controller');

const router = express.Router();

router.get('/', choferCtrl.obtenerChoferes);
router.post('/', choferCtrl.registrarChofer);

// Frontend: trae datos completos del chofer.
router.get('/:idChofer', choferCtrl.obtenerChoferPorId);

// Frontend: cambia el estado del chofer (DISPONIBLE, DESCANSO, EN_VIAJE, etc.).
router.patch('/:idChofer/estado', choferCtrl.cambiarEstadoChofer);

// Frontend: actualiza la ubicacion actual del chofer.
router.patch('/:idChofer/ubicacion', choferCtrl.actualizarUbicacionChofer);

// Frontend: trae todos los autos relacionados a ese chofer.
router.get('/:idChofer/autos', choferCtrl.obtenerAutosDelChofer);

// Frontend: trae los viajes del boton "Ver Mis Viajes".
router.get('/:idChofer/viajes', choferCtrl.obtenerViajesDelChofer);

module.exports = router;
