const express = require('express');
const choferCtrl = require('../controllers/chofer.controller');

const router = express.Router();

router.get('/', choferCtrl.obtenerChoferes);
router.post('/', choferCtrl.registrarChofer);

module.exports = router;
