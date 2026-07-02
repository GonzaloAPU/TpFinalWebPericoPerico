// defino controlador para el manejo de CRUD de Viajes
const viajeCtrl = require('../controllers/viaje.controller'); // Asegúrate de que la ruta a tu controlador sea la correcta
// creamos el manejador de rutas
const express = require('express');
const router = express.Router();

// definimos las rutas para la gestion de Viajes
router.get('/', viajeCtrl.getViajes);
router.get('/:id', viajeCtrl.getViaje);
router.post('/', viajeCtrl.createViaje);
router.put('/:id', viajeCtrl.editViaje);
router.patch('/:id/estado', viajeCtrl.changeEstado);
router.delete('/:id', viajeCtrl.deleteViaje);

// exportamos el modulo de rutas
module.exports = router;