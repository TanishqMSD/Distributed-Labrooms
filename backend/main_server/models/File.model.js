import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true,
    enum: ['image', 'document', 'pdf', 'text', 'archive','code', 'other']
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  uploader: {
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Room'
  },
  publicId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
fileSchema.index({ room: 1, createdAt: -1 });

const File = mongoose.model('File', fileSchema);
export default File;
