const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database'); // Asegúrate de que la ruta apunte a tu archivo



const Chofer = sequelize.define(
  'Chofer',
  {
      idChofer: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      idUsuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'usuarios',
          key: 'idUsuario',
        },
      },
      licenciaConducir: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      estadoChofer: {
        type: DataTypes.ENUM(
          'DISPONIBLE',
          'EN_VIAJE',
          'DESCANSO',
          'SUSPENDIDO',
          'INACTIVO'
        ),
        allowNull: false,
        defaultValue: 'DISPONIBLE',
      },
      fechaHabilitacion: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      calificacion: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0,
      },
    },
    {
      tableName: 'choferes',
      timestamps: true,
    }
  );

module.exports = Chofer;

