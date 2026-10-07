const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = require('./app');
const { initSocket } = require('./services/socketService');

const server = http.createServer(app);

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
  }
});

initSocket(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🩸 Campus-BloodConnect Server & WebSockets running on port ${PORT}`);
});

module.exports = { app, server };
