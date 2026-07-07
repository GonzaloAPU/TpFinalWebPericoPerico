// defino controlador para el manejo de CRUD de Viajes
const viajeCtrl = require('../controllers/viaje.controller');
const authCtrl = require('../controllers/auth.controller');
// creamos el manejador de rutas
const express = require('express');
const router = express.Router();

// Consultar viajes: cualquier usuario logueado (el pasajero necesita ver los disponibles).
router.get('/', authCtrl.verifyToken, viajeCtrl.getViajes);
router.get('/disponibles', authCtrl.verifyToken, viajeCtrl.getViajesDisponibles);
router.get('/:id', authCtrl.verifyToken, viajeCtrl.getViaje);

// Actualizar asientos: se dispara al reservar, cualquier logueado puede disparar el flujo.
router.post('/:id/actualizar-asientos-disponibles', authCtrl.verifyToken, viajeCtrl.actualizarAsientosDisponibles);

// Crear/editar/borrar viajes (asignar chofer y auto): exclusivo de ADMIN.
router.post('/', authCtrl.verifyToken, authCtrl.verificarRol('ADMIN'), viajeCtrl.createViaje);
router.put('/:id', authCtrl.verifyToken, authCtrl.verificarRol('ADMIN'), viajeCtrl.editViaje);
router.delete('/:id', authCtrl.verifyToken, authCtrl.verificarRol('ADMIN'), viajeCtrl.deleteViaje);

// Cambiar estado del viaje (iniciar/finalizar): ADMIN o el chofer asignado (se valida adentro del controller).
router.patch('/:id/estado', authCtrl.verifyToken, authCtrl.verificarRol('ADMIN', 'CHOFER'), viajeCtrl.changeEstado);

// exportamos el modulo de rutas
module.exports = router;