const express = require('express');
const controller = require('../controllers/reserva.controller');

const router = express.Router();

router.get('/', controller.obtenerReservas);
router.post('/', controller.registrarReserva);

module.exports = router;