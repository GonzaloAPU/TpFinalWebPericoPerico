const TurnoChofer = require('../models/turnoChofer'); 
const Auto = require('../models/auto.model');
const Chofer = require('../models/chofer.model');
const turnoChoferCtrl = {};

// Registrar nuevo turno
turnoChoferCtrl.createTurno = async (req, res) => {
    try {
        // req.body debe recibir: idAuto, idChofer, fecha, horaInicio, horaFin
        const nuevoTurno = await TurnoChofer.create(req.body);

        res.json({ status: '1', msg: 'Turno guardado.' });
    }catch (error) {
        res.status(400).json({ status: '0', msg: 'Error procesando operacion.' });
    }
};


// Obtener todos los turnos
turnoChoferCtrl.getTurnos = async (req,res) =>{
    try{
        const turnos = await TurnoChofer.findAll()
        res.json(turnos)
    }catch (error) {
        res.status(500).json({ status: '0', msg: 'Error al obtener los turnos.' })
    }
}


// Editar datos del turno 

turnoChoferCtrl.editTurno = async (req, res) => {
  try {
    const [actualizados] = await TurnoChofer.update(req.body, {
      where: {
        idTurnoChofer: req.params.id
      }
    });

    if (actualizados === 0) {
      return res.status(404).json({
        status: '0',
        msg: 'Turno no encontrado.'
      });
    }

    return res.status(200).json({
      status: '1',
      msg: 'Turno actualizado.'
    });
  } catch (error) {
    return res.status(400).json({
      status: '0',
      msg: 'Error procesando la operación.',
      error: error.message
    });
  }
};
// Eliminar turno
/*turnoChoferCtrl.deleteTurno = async (req,res) =>{
    try {
        await TurnoChofer.destroy({
            where: { id: req.params.id }
        });
        res.json({ status: '1', msg: 'Turno removed' });

    } catch (error) {
        res.status(400).json({ status: '0', msg: 'Error procesando la operacion' });
    }
}*/

turnoChoferCtrl.deleteTurno = async (req, res) => {
  try {
    const eliminados = await TurnoChofer.destroy({
      where: {
        idTurnoChofer: req.params.id
      }
    });

    if (eliminados === 0) {
      return res.status(404).json({
        status: '0',
        msg: 'Turno no encontrado.'
      });
    }

    return res.status(200).json({
      status: '1',
      msg: 'Turno eliminado.'
    });
  } catch (error) {
    return res.status(400).json({
      status: '0',
      msg: 'Error procesando la operación.',
      error: error.message
    });
  }
};


module.exports = turnoChoferCtrl;
