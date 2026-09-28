const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const setupSignaling = require('./socket/signaling');
const setupChat = require('./socket/chat');
const setupWhiteboard = require('./socket/whiteboard');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static directory for uploaded files
const uploadDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'memory-fallback'
  });
});

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket] New connection: ${socket.id}`);

  setupSignaling(io, socket);
  setupChat(io, socket);
  setupWhiteboard(io, socket);

  socket.on('error', (err) => {
    console.error(`[Socket Error] ${socket.id}:`, err);
  });
});

// Connect to MongoDB with friendly fallback
const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/meetspace';
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(' MongoDB connected successfully');
  } catch (err) {
    console.warn(' MongoDB connection not available. Running in memory-fallback mode for authentication and rooms.');
    console.warn(' (To persist users in MongoDB, ensure mongod is running at ' + mongoURI + ')');
  }
};

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(` MeetSpace Server running on port ${PORT}`);
    console.log(` Socket.IO signaling active at ws://localhost:${PORT}`);
  });
});
