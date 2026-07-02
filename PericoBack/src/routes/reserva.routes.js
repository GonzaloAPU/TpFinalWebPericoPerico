const express = require('express');
const reservaCtrl = require('../controllers/reserva.controller');

const router = express.Router();

router.get('/', reservaCtrl.obtenerReservas);
router.post('/', reservaCtrl.registrarReserva);

module.exports = router;
