const { sequelize, Reserva, Viaje } = require('../models/relaciones');

const reservaCtrl = {};

const estadosReservaValidos = [
  'PENDIENTE',
  'CONFIRMADA',
  'CANCELADA',
  'UTILIZADA',
  'NO_PRESENTADO',
];

const cancelarReservaConTransaccion = async (idReserva, transaction) => {
  const reserva = await Reserva.findByPk(idReserva, {
    include: ['viaje'],
    transaction,
    lock: true,
  });

  if (!reserva) {
    return { error: { status: 404, body: { mensaje: 'Reserva no encontrada' } } };
  }

  if (reserva.estadoReserva === 'CANCELADA') {
    return { error: { status: 400, body: { mensaje: 'La reserva ya se encuentra cancelada' } } };
  }

  const viaje = await Viaje.findByPk(reserva.idViaje, {
    transaction,
    lock: true,
  });

  if (!viaje) {
    return { error: { status: 404, body: { mensaje: 'Viaje de la reserva no encontrado' } } };
  }

  // Al cancelar se devuelven al viaje los asientos que tenia tomada la reserva.
  reserva.estadoReserva = 'CANCELADA';
  viaje.asientosDisponibles += reserva.cantidadAsientos;

  await reserva.save({ transaction });
  await viaje.save({ transaction });

  return { reserva, viaje };
};

reservaCtrl.registrarReserva = async (req, res) => {
  try {
    const reserva = await Reserva.create(req.body);

    res.status(201).json({
      mensaje: 'Reserva creada correctamente',
      reserva
    });
  } catch (error) {
    res.status(400).json({
      mensaje: 'Error al crear reserva',
      error: error.message
    });
  }
};

reservaCtrl.obtenerReservas = async (req, res) => {
  try {
    const reservas = await Reserva.findAll({
  include: [
    {
      association: 'pasajero',
      include: ['usuario']
    },
    {
      association: 'viaje',
      include: ['chofer', 'auto']
    }
  ]
});

    res.status(200).json(reservas);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener reservas',
      error: error.message
    });
  }
};

reservaCtrl.cambiarEstadoReserva = async (req, res) => {
  const estado = req.body.estado || req.body.estadoReserva;

  if (!estadosReservaValidos.includes(estado)) {
    return res.status(400).json({
      mensaje: 'Estado de reserva no valido',
      estadosValidos: estadosReservaValidos,
    });
  }

  const transaction = await sequelize.transaction();

  try {
    if (estado === 'CANCELADA') {
      const resultado = await cancelarReservaConTransaccion(req.params.idReserva, transaction);

      if (resultado.error) {
        await transaction.rollback();
        return res.status(resultado.error.status).json(resultado.error.body);
      }

      await transaction.commit();
      return res.status(200).json({
        mensaje: 'Reserva cancelada correctamente y asientos devueltos al viaje',
        reserva: resultado.reserva,
        viaje: resultado.viaje,
      });
    }

    const reserva = await Reserva.findByPk(req.params.idReserva, { transaction });
    if (!reserva) {
      await transaction.rollback();
      return res.status(404).json({
        mensaje: 'Reserva no encontrada',
      });
    }

    reserva.estadoReserva = estado;
    await reserva.save({ transaction });
    await transaction.commit();

    return res.status(200).json({
      mensaje: 'Estado de reserva actualizado correctamente',
      reserva,
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      mensaje: 'Error al cambiar el estado de la reserva',
      error: error.message,
    });
  }
};

reservaCtrl.cancelarReserva = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const resultado = await cancelarReservaConTransaccion(req.params.idReserva, transaction);

    if (resultado.error) {
      await transaction.rollback();
      return res.status(resultado.error.status).json(resultado.error.body);
    }

    await transaction.commit();

    return res.status(200).json({
      mensaje: 'Reserva cancelada correctamente y asientos devueltos al viaje',
      reserva: resultado.reserva,
      viaje: resultado.viaje,
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      mensaje: 'Error al cancelar la reserva',
      error: error.message,
    });
  }
};

module.exports = reservaCtrl;
