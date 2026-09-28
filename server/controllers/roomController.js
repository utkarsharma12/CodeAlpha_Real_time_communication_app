const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const Room = require('../models/Room');
const File = require('../models/File');

// Memory store fallback
const memoryRooms = new Map();
const memoryFiles = new Map();

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Create or initialize a new meeting room
// @route   POST /api/rooms
// @access  Public / Optional Auth
const createRoom = async (req, res) => {
  try {
    const { title, customId } = req.body;
    const roomId = customId ? customId.trim().toLowerCase() : uuidv4().substring(0, 10);
    const roomTitle = title ? title.trim() : `Meeting-${roomId}`;

    const hostId = req.user ? req.user._id || req.user.id : null;
    const hostName = req.user ? req.user.name : 'Host';

    if (isDbConnected()) {
      let room = await Room.findOne({ roomId });
      if (!room) {
        room = await Room.create({
          roomId,
          title: roomTitle,
          host: hostId && mongoose.isValidObjectId(hostId) ? hostId : undefined,
          hostName
        });
      }
      return res.status(201).json({
        success: true,
        room: {
          roomId: room.roomId,
          title: room.title,
          hostName: room.hostName,
          createdAt: room.createdAt
        }
      });
    } else {
      let room = memoryRooms.get(roomId);
      if (!room) {
        room = {
          roomId,
          title: roomTitle,
          hostName,
          createdAt: new Date()
        };
        memoryRooms.set(roomId, room);
      }
      return res.status(201).json({
        success: true,
        room
      });
    }
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create room',
      error: error.message
    });
  }
};

// @desc    Get room details
// @route   GET /api/rooms/:roomId
// @access  Public
const getRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    if (isDbConnected()) {
      let room = await Room.findOne({ roomId: roomId.toLowerCase() });
      if (!room) {
        // Auto-provision room on fly for instant join
        room = await Room.create({
          roomId: roomId.toLowerCase(),
          title: `Room ${roomId}`
        });
      }
      return res.json({
        success: true,
        room: {
          roomId: room.roomId,
          title: room.title,
          isLocked: room.isLocked,
          createdAt: room.createdAt
        }
      });
    } else {
      let room = memoryRooms.get(roomId.toLowerCase());
      if (!room) {
        room = {
          roomId: roomId.toLowerCase(),
          title: `Room ${roomId}`,
          isLocked: false,
          createdAt: new Date()
        };
        memoryRooms.set(roomId.toLowerCase(), room);
      }
      return res.json({
        success: true,
        room
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching room',
      error: error.message
    });
  }
};

// @desc    Upload a file shared in the room
// @route   POST /api/rooms/:roomId/files
// @access  Public / Auth
const uploadFile = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { senderName, senderId } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fileData = {
      id: uuidv4(),
      roomId: roomId.toLowerCase(),
      senderId: senderId || (req.user ? (req.user._id || req.user.id) : 'anon'),
      senderName: senderName || (req.user ? req.user.name : 'Participant'),
      originalName: req.file.originalname,
      filename: req.file.filename,
      fileUrl,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date()
    };

    if (isDbConnected()) {
      const saved = await File.create(fileData);
      fileData.id = saved._id.toString();
    }

    // Also store in memory
    const roomFiles = memoryFiles.get(roomId.toLowerCase()) || [];
    roomFiles.push(fileData);
    memoryFiles.set(roomId.toLowerCase(), roomFiles);

    return res.status(201).json({
      success: true,
      file: fileData
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: error.message
    });
  }
};

// @desc    Get files uploaded in a room
// @route   GET /api/rooms/:roomId/files
// @access  Public
const getRoomFiles = async (req, res) => {
  try {
    const { roomId } = req.params;

    if (isDbConnected()) {
      const files = await File.find({ roomId: roomId.toLowerCase() }).sort({ createdAt: -1 });
      return res.json({
        success: true,
        files: files.map((f) => ({
          id: f._id.toString(),
          originalName: f.originalName,
          filename: f.filename,
          fileUrl: f.fileUrl,
          fileSize: f.fileSize,
          mimeType: f.mimeType,
          senderName: f.senderName,
          uploadedAt: f.createdAt
        }))
      });
    } else {
      const files = memoryFiles.get(roomId.toLowerCase()) || [];
      return res.json({
        success: true,
        files
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve room files',
      error: error.message
    });
  }
};

module.exports = {
  createRoom,
  getRoom,
  uploadFile,
  getRoomFiles
};
