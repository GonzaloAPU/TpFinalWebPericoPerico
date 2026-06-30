const Viaje = require('./../../src/models/viaje.model'); 
const Auto = require('./../../src/models/auto.model'); 
const Chofer = require('./../../src/models/chofer.model'); 

const viajeCtrl = {};

// Obtener TODOS los viajes con todas sus relaciones 
viajeCtrl.getViajes = async (req, res) => {
    try {
        const viajes = await Viaje.findAll({
            include: ['chofer', 'auto', 'reservas'] 
        });
        res.json(viajes);
    } catch (error) {
        res.status(500).json({ status: '0', msg: 'Error al obtener los viajes.' });
    }
};


// Obtener un viaje específico 
viajeCtrl.getViaje = async (req, res) => {
    try {
        const viaje = await Viaje.findByPk(req.params.id, {
            include: ['chofer', 'auto', 'reservas'] 
        });
        if (!viaje) {
            return res.status(404).json({ status: '0', msg: 'Viaje no encontrado.' });
        }
        res.json(viaje);
    } catch (error) {
        return res.status(500).json({ status: '0', msg: 'Error al buscar el viaje.' });
    }
};


// Registrar un nuevo viaje
viajeCtrl.createViaje = async (req, res) => {
    try {
        const { idChofer, idAuto } = req.body;

        // Verificar que existan el chofer y el auto
        const choferExiste = await Chofer.findByPk(idChofer);
        const autoExiste = await Auto.findByPk(idAuto);

        if (!choferExiste || !autoExiste) {
            return res.status(400).json({ status: '0', msg: 'Chofer o Auto no válidos/inexistentes.' });
        }

        // Un auto no puede estar en más de un viaje EN_CURSO al mismo tiempo
        const autoOcupado = await Viaje.findOne({
            where: {
                idAuto: idAuto,
                estadoViaje: 'EN_CURSO'
            }
        });

        if (autoOcupado) {
            return res.status(400).json({ status: '0', msg: 'El auto asignado ya se encuentra en un viaje EN CURSO.' });
        }

        const asientosIniciales = autoExiste.capacidadAsientos; 

        const nuevoViaje = await Viaje.create({
            ...req.body,                           // Pasa automáticamente origen, destino, fechas, tarifas, idChofer, idAuto, etc.
            asientosDisponibles: asientosIniciales, 
            estadoViaje: 'ABIERTO'                 
        });

        res.json({ status: '1', msg: 'Viaje guardado de forma exitosa.' });
    } catch (error) {
        res.status(400).json({ status: '0', msg: 'Error procesando la operación de guardado.' });
    }
};


// Editar datos del viaje
viajeCtrl.editViaje = async (req, res) => {
    try {
        await Viaje.update(req.body, {
            where: { idViaje: req.body.idViaje } 
        });
        res.json({ status: '1', msg: 'Viaje actualizado con éxito.' });
    } catch (error) {
        res.status(400).json({ status: '0', msg: 'Error procesando la operación.' });
    }
};


// Cambiar estado del viaje
viajeCtrl.changeEstado = async (req, res) => {
    try {
        const idViaje = req.params.id;
        const estado = req.body.estado;

        const estadosValidos = ['ABIERTO', 'COMPLETO', 'EN_CURSO', 'FINALIZADO', 'CANCELADO'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ status: '0', msg: 'Estado de viaje no válido.' });
        }

        const viaje = await Viaje.findByPk(idViaje);
        if (!viaje) {
            return res.status(404).json({ status: '0', msg: 'Viaje no encontrado.' });
        }

        viaje.estadoViaje = estado;
        await viaje.save();

        return res.status(200).json({ status: '1', msg: 'Estado del viaje actualizado.', viaje });
    } catch (error) {
        return res.status(500).json({ status: '0', msg: 'Error al actualizar el estado.' });
    }
};


// Eliminar un viaje
viajeCtrl.deleteViaje = async (req, res) => {
    try {
        await Viaje.destroy({
            where: { idViaje: req.params.id }
        });
        res.json({ status: '1', msg: 'Viaje eliminado.' });
    } catch (error) {
        res.status(400).json({ status: '0', msg: 'Error procesando la operación.' });
    }
};

module.exports = viajeCtrl;