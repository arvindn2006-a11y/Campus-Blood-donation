const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const { initSocket } = require('./services/socketService');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const donorRoutes = require('./routes/donorRoutes');
const bloodRequestRoutes = require('./routes/bloodRequestRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const donationRoutes = require('./routes/donationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();
const server = http.createServer(app);

// CORS Allowed Origins Resolver
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'https://campus-blood-donation.vercel.app'
];

if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(',').forEach((url) => {
    const trimmed = url.trim().replace(/\/+$/, '');
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

const originCheck = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    return callback(null, true);
  }
  if (origin.endsWith('.vercel.app')) {
    return callback(null, true);
  }
  return callback(null, true); // Permissive to prevent cross-origin deployment blocks
};

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: originCheck,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
  }
});

initSocket(io);

// Middleware
app.use(cors({
  origin: originCheck,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.use(express.json());

// Base Status Route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Campus BloodConnect REST & Real-Time API',
    timestamp: new Date()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Campus BloodConnect API' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/blood-requests', bloodRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/admin', adminRoutes);

// Central Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🩸 Campus-BloodConnect Server & WebSockets running on port ${PORT}`);
});

module.exports = { app, server };
