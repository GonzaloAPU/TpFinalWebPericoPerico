const express = require('express');
const reservaCtrl = require('../controllers/reserva.controller');

const router = express.Router();

router.get('/', reservaCtrl.obtenerReservas);
router.post('/', reservaCtrl.registrarReserva);
router.post('/webhook', reservaCtrl.recibirNotificacionPago);

module.exports = router;
