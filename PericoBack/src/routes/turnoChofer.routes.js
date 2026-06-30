//defino controlador para el manejo de CRUD
const turnoCtrl = require('../controllers/turnoChofer.controller');
//creamos el manejador de rutas
const express = require('express');
const router = express.Router();
//definimos las rutas para la gestion de agente
router.get('/', turnoCtrl.getTurnos);
router.post('/', turnoCtrl.createTurno);
router.put('/',turnoCtrl.editTurno )
router.delete('/:id',turnoCtrl.deleteTurno)

//exportamos el modulo de rutas
module.exports = router;