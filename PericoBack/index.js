const express = require('express');
const cors = require('cors');
const sequelize = require('./src/models/relaciones').sequelize;
require('dotenv').config(); 
const http = require('http');
const { Server } = require('socket.io');

var app = express();

const server = http.createServer(app); // crear un servidor http envolviendo a express

// Inicializacion de SOCKET.IO con cors permitido para frontend
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:4200',
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors({origin : 'http://localhost:4200'}));
app.use(express.json());

// Permite que los controladores y webhooks puedan usar req.io.emit()
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.set('port', process.env.PORT || 3000);

app.use('/api/admins', require('./src/routes/admin.routes'));
app.use('/api/pasajeros', require('./src/routes/pasajero.routes'));
app.use('/api/choferes', require('./src/routes/chofer.routes'));
app.use('/api/autos', require('./src/routes/auto.routes'));
app.use('/api/turnos', require('./src/routes/turnoChofer.routes'));
app.use('/api/viajes', require('./src/routes/viaje.routes'));
app.use('/api/reservas', require('./src/routes/reserva.routes'));
app.use('/api/usuarios', require('./src/routes/usuario.routes'));

// Escuchador de conexiones en vivo 
io.on('connection', (socket) => {
  console.log(`[SOCKET] Dispositivo conectado en vivo. ID: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log('[SOCKET] Dispositivo desconectado.');
  });
});

sequelize.sync({ force: false }) // Cambiar a true si quieres reiniciar las tablas en cada inicio
  .then(() => {
    console.log('Tablas de PostgreSQL sincronizadas correctamente.');
    server.listen(app.get('port'), () => {
      console.log(`Servidor híbrido (HTTP + WebSockets) escuchando en el puerto ${app.get('port')}`);
    });
  })
  .catch((error) => {
    console.error('Error al sincronizar las tablas de PostgreSQL:', error);
  });