const { Sequelize } = require('sequelize');
require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env'),
});

const sequelize = new Sequelize(
  process.env.DB_NAME || 'pericoback',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'admin123',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
  }
);

sequelize.authenticate()
  .then(() => {
    console.log('Conexión a la base de datos establecida correctamente.');
  })
  .catch((error) => {
    console.error('Error al autenticar la conexión a la base de datos:', error);
  });

module.exports = sequelize;