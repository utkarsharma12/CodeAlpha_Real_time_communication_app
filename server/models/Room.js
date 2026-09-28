const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    title: {
      type: String,
      default: 'MeetSpace Conference',
      trim: true
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    hostName: {
      type: String,
      default: 'Host'
    },
    isLocked: {
      type: Boolean,
      default: false
    },
    maxParticipants: {
      type: Number,
      default: 16
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Room', roomSchema);
