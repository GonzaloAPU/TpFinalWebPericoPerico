const { DataTypes } = require('sequelize');
const sequelize = require('./../../config/database'); 

// Importamos todos los modelos con los que se relaciona Viaje
const Chofer = require('./chofer.model'); 
const Auto = require('./auto.model');     
const Reserva = require('./reserva.model'); 

const Viaje = sequelize.define('Viaje', {
    origen: {type: DataTypes.STRING, allowNull: false},
    destino: {type: DataTypes.STRING, allowNull: false},
    fechaSalida: {type: DataTypes.DATEONLY, allowNull: false}, // Guarda solo YYYY-MM-DD
    horaSalida: { type: DataTypes.TIME, allowNull: false}, // Guarda HH:MM:SS
    tarifaPorAsiento: {type: DataTypes.DECIMAL(10, 2),allowNull: false},
    asientosDisponibles: {type: DataTypes.INTEGER, allowNull:false},
    estadoViaje: {
        type: DataTypes.ENUM('ABIERTO', 'COMPLETO', 'EN_CURSO', 'FINALIZADO','CANCELADO'), 
        allowNull: false,
        defaultValue: 'ABIERTO' //estado por defecto 
    },
    
}, {
    tableName: 'viajes', // Nombre de la tabla en minúsculas y plural
    timestamps: true, // Crea automáticamente los campos createdAt y updatedAt
});

// Muchos viajes son realizados por 1 Chofer (La FK idChofer se crea en Viajes)
Viaje.belongsTo(Chofer, { as: 'chofer', foreignKey: 'idChofer' });

// Muchos viajes usan 1 Auto (La FK idAuto se crea en Viajes)
Viaje.belongsTo(Auto, { as: 'auto', foreignKey: 'idAuto' });

// Un viaje tiene muchas Reservas (La FK idViaje se creará en la tabla de Reservas)
Viaje.hasMany(Reserva, { as: 'reservas', foreignKey: 'idViaje' });

module.exports = Viaje;