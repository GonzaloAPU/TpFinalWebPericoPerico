const sequelize = require('../../config/database');

// Modelos base y perfiles de usuario.
const Usuario = require('./usuario.model');
const Pasajero = require('./pasajero.model');
const Chofer = require('./chofer.model');
const Admin = require('./admin.model');

// Modelos operativos del sistema.
const Auto = require('./auto.model');
const TurnoChofer = require('./turnoChofer.js');
const Viaje = require('./viaje.model');
const Reserva = require('./reserva.model');

// ---------------------------------------------------------------------------
// Usuario y perfiles
// ---------------------------------------------------------------------------
// Usuario funciona como una "superclase" conceptual.
// Aca se guardan los datos comunes: nombre, apellido, email, password,
// telefono, activo y rol.
//
// Pasajero, Chofer y Admin guardan solo los datos propios de cada perfil.
// Cada perfil se relaciona con un Usuario mediante idUsuario.

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

Usuario.hasOne(Admin, {
  foreignKey: 'idUsuario',
  as: 'perfilAdmin',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Admin.belongsTo(Usuario, {
  foreignKey: 'idUsuario',
  as: 'usuario',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

// ---------------------------------------------------------------------------
// Choferes, autos y turnos
// ---------------------------------------------------------------------------
// Chofer y Auto tienen una relacion muchos a muchos.
// TurnoChofer es la tabla intermedia que registra que chofer usa que auto
// y en que horario.

Chofer.belongsToMany(Auto, {
  through: TurnoChofer,
  foreignKey: 'idChofer',
  otherKey: 'idAuto',
  as: 'autos',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Auto.belongsToMany(Chofer, {
  through: TurnoChofer,
  foreignKey: 'idAuto',
  otherKey: 'idChofer',
  as: 'choferes',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

// ---------------------------------------------------------------------------
// Viajes
// ---------------------------------------------------------------------------
// Un viaje es realizado por un chofer y utiliza un auto.
// Se usa RESTRICT para evitar borrar choferes/autos que ya tienen viajes.

Chofer.hasMany(Viaje, {
  foreignKey: 'idChofer',
  as: 'viajes',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

Viaje.belongsTo(Chofer, {
  foreignKey: 'idChofer',
  as: 'chofer',
});

Auto.hasMany(Viaje, {
  foreignKey: 'idAuto',
  as: 'viajes',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

Viaje.belongsTo(Auto, {
  foreignKey: 'idAuto',
  as: 'auto',
});

// ---------------------------------------------------------------------------
// Reservas
// ---------------------------------------------------------------------------
// Un pasajero puede tener muchas reservas.
// Un viaje puede tener muchas reservas.
// Cada reserva pertenece a un pasajero y a un viaje.

Pasajero.hasMany(Reserva, {
  foreignKey: 'idPasajero',
  as: 'reservas',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Reserva.belongsTo(Pasajero, {
  foreignKey: 'idPasajero',
  as: 'pasajero',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Viaje.hasMany(Reserva, {
  foreignKey: 'idViaje',
  as: 'reservas',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Reserva.belongsTo(Viaje, {
  foreignKey: 'idViaje',
  as: 'viaje',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

module.exports = {
  sequelize,
  Usuario,
  Pasajero,
  Chofer,
  Admin,
  Auto,
  TurnoChofer,
  Viaje,
  Reserva,
};
