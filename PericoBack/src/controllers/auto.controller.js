const Auto = require('./../../src/models/auto.model'); 
const autoCtrl = {};

// Obtener todos los autos
autoCtrl.getAutos = async (req, res) =>{
    try{
        const autos = await Auto.findAll()
        res.json(autos)
    }catch (error) {
        res.status(500).json({ status: '0', msg: 'Error al obtener los autos.' })
    }
}


// Obtener auto con sus choferes
autoCtrl.getAuto = async (req, res) => {
    try {
       const auto = await Auto.findByPk(req.params.id,{
            include:'choferes' // Trae automáticamente los choferes y los datos del turno
       })
        if (!auto) {
            return res.status(404).json({ status: '0', msg: 'Auto no encontrado.' });
        }
        res.json(auto);
    } catch (error) {
        return res.status(500).json({ status: '0', msg: 'Error al buscar el auto.' });
    }
};


// Regristrar un nuevo auto
autoCtrl.createAuto = async (req, res) =>{
    try{
        const auto = await Auto.create(req.body)
        res.json({ status: '1', msg: 'Auto guardado.', auto });
    }catch (error) {
        res.status(400).json({ status: '0', msg: 'Error procesando operacion.', error: error.message });
    }
}


// Editar datos del auto
/*autoCtrl.editAuto = async (req,res) =>{
    try{
        await Auto.update(req.body, {
            where: { idAuto: req.body.id }
        });
        res.json({ status: '1', msg: 'Auto updated' });
    }  catch (error) {
    res.status(400).json({ status: '0', msg: 'Error procesando la operacion' });
    }
}*/

autoCtrl.editAuto = async (req, res) => {
  try {
    const [actualizados] = await Auto.update(req.body, {
      where: {
        idAuto: req.params.id
      }
    });

    if (actualizados === 0) {
      return res.status(404).json({
        status: '0',
        msg: 'Auto no encontrado.'
      });
    }

    return res.status(200).json({
      status: '1',
      msg: 'Auto actualizado.'
    });
  } catch (error) {
    return res.status(400).json({
      status: '0',
      msg: 'Error procesando la operación.',
      error: error.message
    });
  }
};


// Cambiar estado del auto
autoCtrl.changeEstado = async (req, res) => {
    try {
        const idAuto  = req.params.id;
        const estado  = req.body.estado;

        // Validacion
        const estadosValidos = ['DISPONIBLE', 'EN_VIAJE', 'EN_TALLER', 'INACTIVO'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ status: '0', msg: 'Estado de auto no válido.' });
        }

        const auto = await Auto.findByPk(idAuto);
        if (!auto) {
            return res.status(404).json({ status: '0', msg: 'Auto no encontrado.' });
        }

        auto.estado = estado;
        await auto.save(); // Guarda solo el cambio de estado

        return res.status(200).json({ status: '1', msg: 'Estado del auto actualizado.', auto });
    } catch (error) {
        return res.status(500).json({ status: '0', msg: 'Error al actualizar el estado.' });
    }
};


// Eliminar un auto
autoCtrl.deleteAuto = async (req, res) => {
    try {
        await Auto.destroy({
            where: { idAuto: req.params.id }
        });
        res.json({ status: '1', msg: 'Auto removed' });
    } catch (error) {
        res.status(400).json({ status: '0', msg: 'Error procesando la operacion' });
    }
};


module.exports = autoCtrl;
