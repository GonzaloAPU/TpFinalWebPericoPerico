const sequelize = require('../../config/database');

const Usuario = require('./usuario.model');
const Pasajero = require('./pasajero.model');
const Chofer = require('./chofer.model');

// En este proyecto Usuario funciona como una "superclase" conceptual.
// Pasajero y Chofer comparten los datos comunes del usuario:
// nombre, apellido, email, password, telefono y estado activo.
//
// En JavaScript con Sequelize no estamos usando herencia de clases.
// Lo armamos con relaciones entre tablas:
// - Un Usuario puede tener un perfil de Pasajero.
// - Un Usuario puede tener un perfil de Chofer.
// - Cada Pasajero o Chofer pertenece a un solo Usuario.
//
// Esto evita repetir los mismos campos en pasajeros y choferes.
Usuario.hasOne(Pasajero, {
  foreignKey: 'idUsuario',
  as: 'perfilPasajero',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

// Pasajero guarda solo los datos propios del pasajero.
// El resto de los datos personales se consultan desde Usuario.
Pasajero.belongsTo(Usuario, {
  foreignKey: 'idUsuario',
  as: 'usuario',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

// Relacion entre Usuario y Chofer.
// El alias perfilChofer permite incluir o consultar el perfil de chofer
// desde un usuario.
Usuario.hasOne(Chofer, {
  foreignKey: 'idUsuario',
  as: 'perfilChofer',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

// Chofer guarda solo los datos propios del chofer.
// Los datos comunes siguen estando en la tabla usuarios.
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
