const express = require('express');
const choferController = require('../controllers/chofer.controller');

const router = express.Router();

router.get('/', choferController.obtenerChoferes);
router.post('/', choferController.registrarChofer);

module.exports = router;
