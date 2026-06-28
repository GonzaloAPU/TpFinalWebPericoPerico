const sequelize = require('../../config/database');

const Usuario = require('./usuario.model');
const Pasajero = require('./pasajero.model');
const Chofer = require('./chofer.model');

Usuario.hasOne(Pasajero, {
  foreignKey: 'idUsuario',
  as: 'perfilPasajero',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Pasajero.belongsTo(Usuario, {
  foreignKey: 'idUsuario',
  as: 'usuario',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Usuario.hasOne(Chofer, {
  foreignKey: 'idUsuario',
  as: 'perfilChofer',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Chofer.belongsTo(Usuario, {
  foreignKey: 'idUsuario',
  as: 'usuario',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

module.exports = {
    sequelize,
    Usuario,
    Pasajero,
    Chofer,
};