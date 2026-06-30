//defino controlador para el manejo de CRUD
const autoCtrl = require('../controllers/auto.controller');
//creamos el manejador de rutas
const express = require('express');
const router = express.Router();
//definimos las rutas para la gestion de agente
router.get('/', autoCtrl.getAutos);
router.get('/:id',autoCtrl.getAuto)
router.post('/', autoCtrl.createAuto);
router.put('/:id', autoCtrl.editAuto);
router.patch('/:id/estado', autoCtrl.changeEstado);
router.delete('/:id',autoCtrl.deleteAuto)

//exportamos el modulo de rutas
module.exports = router;