import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';

import roomRoutes from './routes/rooms.js';
import fileRoutes from './routes/files.js';
import authRoutes from './routes/auth.js';

dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();

// ----------------- Middleware -----------------
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

const allowedOrigins = [
  'https://labrooms.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ----------------- MongoDB -----------------
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ----------------- Cloudinary -----------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ----------------- Routes -----------------
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/rooms', roomRoutes);

// Optional: redirect legacy /rooms to /api/v1/rooms
app.use('/rooms', (req, res) => {
  res.redirect(301, `/api/v1/rooms${req.url}`);
});

app.get('/api/health', (req, res) => res.status(200).send('OK'));

// ----------------- Error Handler -----------------
import errorHandler from './middleware/error.js';
app.use(errorHandler);

// ----------------- Socket.IO -----------------
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
});

const canvasStates = {};

io.on('connection', (socket) => {
  console.log('🟢 Client connected:', socket.id);

  socket.on('join-room', ({ roomCode, user }) => {
    socket.join(roomCode);
    console.log(`👤 ${user.name} joined room: ${roomCode}`);
  });

  socket.on('send-message', async ({ roomCode, message }) => {
    if (!message.id) message.id = new mongoose.Types.ObjectId().toString();
    if (!message.timestamp) message.timestamp = new Date();
    if (!message.type) message.type = 'message';

    try {
      await Room.updateOne({ code: roomCode }, { $push: { messages: message } });
      io.to(roomCode).emit('receive-message', message);
    } catch (err) {
      console.error('❌ Error saving message:', err);
    }
  });

  const roomId = socket.handshake.query.roomId;
  if (roomId) {
    socket.join(roomId);

    if (canvasStates[roomId]) socket.emit('canvasState', canvasStates[roomId]);

    socket.on('drawing', data => socket.to(roomId).emit('drawing', data));
    socket.on('clearCanvas', () => {
      socket.to(roomId).emit('canvasCleared');
      canvasStates[roomId] = null;
    });
    socket.on('saveCanvasState', canvasState => { canvasStates[roomId] = canvasState; });
  }

  socket.on('disconnect', () => console.log('🔴 Client disconnected:', socket.id));
});

// ----------------- Start Server -----------------
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
