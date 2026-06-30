const express = require('express');
const cors = require('cors');
const sequelize = require('./src/models/relaciones').sequelize;

var app = express();


app.use(cors({origin : 'http://localhost:4200'}));
app.use(express.json());

app.set('port',process.env.PORT || 3000);
app.use('/api/pasajeros', require('./src/routes/pasajero.routes'));
app.use('/api/choferes', require('./src/routes/chofer.routes'));
app.use('/api/autos', require('./src/routes/auto.routes'));
app.use('/api/turnos', require('./src/routes/turnoChofer.routes'));

sequelize.sync({ force: false })
  .then(() => {
    console.log('Tablas de PostgreSQL sincronizadas correctamente.');
    app.listen(app.get('port'), () => {
      console.log(`Servidor escuchando en el puerto ${app.get('port')}`);
    });
  })
  .catch((error) => {
    console.error('Error al sincronizar las tablas de PostgreSQL:', error);
  });