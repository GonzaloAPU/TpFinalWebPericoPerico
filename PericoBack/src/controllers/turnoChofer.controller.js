const TurnoChofer = require('../models/turnoChofer'); 
const Auto = require('../models/auto.model');
const Chofer = require('../models/chofer.model');
const turnoCtrl = {};

// Registrar nuevo turno
turnoCtrl.createTurno = async (req, res) => {
    try {
        // req.body debe recibir: idAuto, idChofer, fecha, horaInicio, horaFin
        const nuevoTurno = await TurnoChofer.create(req.body);

        res.json({ status: '1', msg: 'Turno guardado.' });
    }catch (error) {
        res.status(400).json({ status: '0', msg: 'Error procesando operacion.' });
    }
};


// Obtener todos los turnos
turnoCtrl.getTurnos = async (req,res) =>{
    try{
        const turnos = await TurnoChofer.findAll()
        res.json(turnos)
    }catch (error) {
        res.status(500).json({ status: '0', msg: 'Error al obtener los turnos.' })
    }
}


// Editar datos del turno
turnoCtrl.editTurno = async (req,res) =>{
    try {
        const id = req.params.id; 

        const turno = await TurnoChofer.findByPk(id);
        if (!turno) {
            return res.status(404).json({ status: '0', msg: 'El turno que intentas editar no existe.' });
        }

        await Auto.update(req.body, {
            where: { id: req.body.id }
        });

        res.json({ status: '1', msg: 'Auto updated' });
    } catch (error) {
    res.status(400).json({ status: '0', msg: 'Error procesando la operacion' });
    }
}


// Eliminar turno
turnoCtrl.deleteTurno = async (req,res) =>{
    try {
        await TurnoChofer.destroy({
            where: { id: req.params.id }
        });
        res.json({ status: '1', msg: 'Turno removed' });

    } catch (error) {
        res.status(400).json({ status: '0', msg: 'Error procesando la operacion' });
    }
}


module.exports = turnoCtrl;