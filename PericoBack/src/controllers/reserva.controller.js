const { Reserva } = require('../models/relaciones');

const registrarReserva = async (req, res) => {
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

const obtenerReservas = async (req, res) => {
  try {
    const reservas = await Reserva.findAll();

    res.status(200).json(reservas);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener reservas',
      error: error.message
    });
  }
};

module.exports = {
  registrarReserva,
  obtenerReservas
};