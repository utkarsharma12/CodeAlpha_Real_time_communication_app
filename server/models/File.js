const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      index: true
    },
    senderId: {
      type: String,
      default: 'anonymous'
    },
    senderName: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      default: 'application/octet-stream'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('File', fileSchema);
