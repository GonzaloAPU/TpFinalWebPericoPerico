const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

// Modelo Reserva
const Reserva = sequelize.define(
  'Reserva',
  {
    idReserva: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    idPasajero: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'pasajeros',
        key: 'idPasajero',
      },
    },

    idViaje: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'viajes',
        key: 'id',
      },
    },

    cantidadAsientos: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    importeTotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    estadoReserva: {
      type: DataTypes.ENUM(
        'PENDIENTE',
        'CONFIRMADA',
        'CANCELADA',
        'UTILIZADA',
        'NO_PRESENTADO'
      ),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    },

    estadoPago: {
      type: DataTypes.ENUM(
        'PENDIENTE',
        'PAGADO',
        'REEMBOLSADO'
      ),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    },
  },
  {
    tableName: 'reservas',
    timestamps: true,
  }
);

module.exports = Reserva;