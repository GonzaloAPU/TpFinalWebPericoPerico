const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database'); // Asegúrate de que la ruta apunte a tu archivo
//const Reserva = require('./reserva.model');

// Modelo del perfil de pasajero.
// Se vincula con Usuario mediante idUsuario para reutilizar los datos comunes.
const Pasajero = sequelize.define(
    'Pasajero',
    {
      idPasajero: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      idUsuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        // FK hacia usuarios. Cada pasajero pertenece a un usuario.
        references: {
          model: 'usuarios',
          key: 'idUsuario',
        },
      },
      calificacion: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0,
      },
      cantidadReservas: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      estadoPasajero: {
        type: DataTypes.ENUM('ACTIVO', 'SUSPENDIDO', 'BLOQUEADO', 'ELIMINADO'),
        allowNull: false,
        defaultValue: 'ACTIVO',
      },
    },
    {
      tableName: 'pasajeros',
      timestamps: true,
    }
  );

module.exports = Pasajero;
