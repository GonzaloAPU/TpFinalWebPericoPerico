const express = require('express');
const reservaCtrl = require('../controllers/reserva.controller');

const router = express.Router();

router.get('/', reservaCtrl.obtenerReservas);
router.post('/', reservaCtrl.registrarReserva);
router.post('/webhook', reservaCtrl.recibirNotificacionPago);
router.patch('/:idReserva/estado', reservaCtrl.cambiarEstadoReserva);
router.patch('/:idReserva/cancelar', reservaCtrl.cancelarReserva);


module.exports = router;
