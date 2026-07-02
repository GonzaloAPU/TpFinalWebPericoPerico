//defino controlador para el manejo de CRUD
const turnoChoferCtrl = require('../controllers/turnoChofer.controller');
//creamos el manejador de rutas
const express = require('express');
const router = express.Router();
//definimos las rutas para la gestion de agente
router.get('/', turnoChoferCtrl.getTurnos);
router.post('/', turnoChoferCtrl.createTurno);
router.put('/',turnoChoferCtrl.editTurno )
router.delete('/:id',turnoChoferCtrl.deleteTurno)

//exportamos el modulo de rutas
module.exports = router;
