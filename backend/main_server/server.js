import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';

import roomRoutes from './routes/rooms.js';
import fileRoutes from './routes/files.js';
import authRoutes from './routes/auth.js';

const RENDER_URL = "https://labrooms-an7k.onrender.com";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Accept common file types
    const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|md|csv|xls|xlsx|ppt|pptx|zip|rar|7z|tar|gz|js|jsx|ts|tsx|json|css|html|xml|yaml|yml/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('File type not allowed'));
  }
});

// Import controllers
import { 
  getRooms,
  createRoom,
  getRoomByCode, 
  getRoomById, 
  deleteRoom, 
  addMemberToRoom, 
  getMembersOfRoom 
} from './controllers/Room.controller.js';

// Import models
import Room from './models/Room.model.js';

// Import middleware
import { protect } from './middleware/auth.js';
import errorHandler from './middleware/error.js';
// Import config
import connectDB from './config/db.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// File upload middleware
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((error) => console.error('❌ MongoDB connection error:', error));

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/files', fileRoutes);

// Legacy routes (for backward compatibility)
app.get('/rooms', getRooms);
app.get('/rooms/code/:code', getRoomByCode);
app.get('/rooms/:id', getRoomById);
app.delete('/rooms/:id', deleteRoom);
app.post('/rooms', createRoom);
app.post('/rooms/:code/members', addMemberToRoom);
app.get('/rooms/:code/members', getMembersOfRoom);

app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});


// Error handler middleware
app.use(errorHandler);

// Create HTTP server and attach Socket.IO
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

function pingServer() {
  https.get(RENDER_URL, (res) => {
    console.log('Ping successful, status:', res.statusCode);
  }).on('error', (err) => {
    console.error('Ping failed:', err.message);
  });
}


// Store canvas state per room in memory (for production, use a DB)
const canvasStates = {};

// Socket.IO events
io.on('connection', (socket) => {
  console.log('🟢 New client connected:', socket.id);

  // Join room
  socket.on('join-room', ({ roomCode, user }) => {
    socket.join(roomCode);
    console.log(`👤 ${user.name} joined room: ${roomCode}`);
  });

  // Send message
  socket.on('send-message', async ({ roomCode, message }) => {
    try {
      // Ensure message has an id and timestamp
      if (!message.id) message.id = new mongoose.Types.ObjectId().toString();
      if (!message.timestamp) message.timestamp = new Date();
      if (!message.type) message.type = 'message';

      // Save to MongoDB
      await Room.updateOne(
        { code: roomCode },
        { $push: { messages: message } }
      );

      // Broadcast to all clients in the room
      io.to(roomCode).emit('receive-message', message);
    } catch (err) {
      console.error('❌ Error saving message:', err);
    }
  });

  // Join the whiteboard room
  const roomId = socket.handshake.query.roomId;
  if (roomId) {
    socket.join(roomId);

    // Send the current canvas state to the new user
    if (canvasStates[roomId]) {
      socket.emit('canvasState', canvasStates[roomId]);
    }

    // Relay drawing events to everyone else in the room
    socket.on('drawing', (data) => {
      socket.to(roomId).emit('drawing', data);
    });

    // Relay clearCanvas event and clear the stored state
    socket.on('clearCanvas', () => {
      socket.to(roomId).emit('canvasCleared');
      canvasStates[roomId] = null;
    });

    // Save the latest canvas state (as a base64 string)
    socket.on('saveCanvasState', (canvasState) => {
      canvasStates[roomId] = canvasState;
    });
  }

  // Disconnect
  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
