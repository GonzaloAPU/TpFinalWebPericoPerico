const { Reserva } = require('../models/relaciones');

const reservaCtrl = {};

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

module.exports = reservaCtrl;
