import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, 
    sender: { type: String, required: true }, 
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['message', 'system'], default: 'message' }
  },
  { _id: false }
);

// Member schema for room participants
const memberSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, 
    name: { type: String, required: true }, 
    isOnline: { type: Boolean, default: true },
    joinedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      minlength: 5,
      maxlength: 6
    },
    name: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 50
    },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { 
      type: Date, 
      required: true, 
      index: { expireAfterSeconds: 0 } 
    },
    password: { 
      type: String, 
      default: null 
    },
    data: { 
      type: mongoose.Schema.Types.Mixed, 
      default: {} 
    },
    members: { 
      type: [memberSchema], 
      default: [] 
    },
    messages: [messageSchema],
    files: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File'
    }]
  },
  { 
    versionKey: false,
    timestamps: true
  }
);

// Indexes for better query performance
roomSchema.index({ code: 1 });
roomSchema.index({ 'members.id': 1 });
roomSchema.index({ expiresAt: 1 });

const Room = mongoose.model('Room', roomSchema)
export default Room
