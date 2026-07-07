const { Op } = require('sequelize');
const Viaje = require('./../../src/models/viaje.model'); 
const Auto = require('./../../src/models/auto.model'); 
const Chofer = require('./../../src/models/chofer.model'); 
const Reserva = require('./../../src/models/reserva.model');
const Usuario = require('./../../src/models/usuario.model');

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

// Buscar viajes abiertos por origen y destino, mostrando solo los que tienen asientos.
/*viajeCtrl.getViajesDisponibles = async (req, res) => {
    try {
        const { origen, destino } = req.query;

        if (!origen || !destino) {
            return res.status(400).json({ status: '0', msg: 'Debe enviar origen y destino.' });
        }

        const viajes = await Viaje.findAll({
            where: {
                origen,
                destino,
                estadoViaje: 'ABIERTO',
                asientosDisponibles: {
                    [Op.gt]: 0
                }
            },
            include: ['chofer', 'auto', 'reservas', 'usuario'],
            order: [['fechaSalida', 'ASC'], ['horaSalida', 'ASC']]
        });

        return res.status(200).json(viajes);
    } catch (error) {
        return res.status(500).json({ status: '0', msg: 'Error al buscar viajes disponibles.' });
    }
};*/

viajeCtrl.getViajesDisponibles = async (req, res) => {
    try {
        const { origen, destino } = req.query;

        if (!origen || !destino) {
            return res.status(400).json({
                status: '0',
                msg: 'Debe enviar origen y destino.'
            });
        }

        const viajes = await Viaje.findAll({
            where: {
                origen,
                destino,
                estadoViaje: 'ABIERTO',
                asientosDisponibles: {
                    [Op.gt]: 0
                }
            },
            include: [
                {
                    association: 'chofer',
                    include: [
                        {
                            association: 'usuario',
                            attributes: {
                                exclude: ['passwordHash']
                            }
                        }
                    ]
                },
                {
                    association: 'auto'
                },
                {
                    association: 'reservas'
                }
            ],
            order: [
                ['fechaSalida', 'ASC'],
                ['horaSalida', 'ASC']
            ]
        });

        return res.status(200).json(viajes);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            status: '0',
            msg: 'Error al buscar viajes disponibles.',
            error: error.message
        });
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
        const [actualizados] = await Viaje.update(req.body, {
            where: { idViaje: req.params.id } 
        });
        if (actualizados === 0) {
            return res.status(404).json({ status: '0', msg: 'Viaje no encontrado.' });
        }
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

        req.io.emit(`viaje_actualizado_${viaje.idViaje}`, {
         idViaje: viaje.idViaje,
         estadoViaje: viaje.estadoViaje
        });

        return res.status(200).json({ status: '1', msg: 'Estado del viaje actualizado.', viaje });
    } catch (error) {
        return res.status(500).json({ status: '0', msg: 'Error al actualizar el estado.' });
    }
};

// Actualizar asientos disponibles del viaje
viajeCtrl.actualizarAsientosDisponibles = async (req, res) => {
    try {
        const idViaje = req.params.id;
        const { asientosDisponibles } = req.body;

        if (asientosDisponibles === undefined || asientosDisponibles === null) {
            return res.status(400).json({ status: '0', msg: 'Debe enviar asientosDisponibles.' });
        }

        const nuevosAsientos = Number(asientosDisponibles);
        if (!Number.isInteger(nuevosAsientos) || nuevosAsientos < 0) {
            return res.status(400).json({ status: '0', msg: 'Los asientos disponibles deben ser un numero entero mayor o igual a 0.' });
        }

        const viaje = await Viaje.findByPk(idViaje, {
            include: ['auto']
        });

        if (!viaje) {
            return res.status(404).json({ status: '0', msg: 'Viaje no encontrado.' });
        }

        if (viaje.auto && nuevosAsientos > viaje.auto.capacidadAsientos) {
            return res.status(400).json({ status: '0', msg: 'Los asientos disponibles no pueden superar la capacidad del auto.' });
        }

        viaje.asientosDisponibles = nuevosAsientos;
        await viaje.save();

        req.io.emit(`asientos_actualizados_viaje_${viaje.idViaje}`, {
          idViaje: viaje.idViaje,
         asientosDisponibles: viaje.asientosDisponibles
        });

        const viajeActualizado = await Viaje.findByPk(idViaje, {
            include: ['chofer', 'auto', 'reservas']
        });

        return res.status(200).json({
            status: '1',
            msg: 'Asientos disponibles actualizados.',
            viaje: viajeActualizado
        });
    } catch (error) {
        return res.status(500).json({ status: '0', msg: 'Error al actualizar los asientos disponibles.' });
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
