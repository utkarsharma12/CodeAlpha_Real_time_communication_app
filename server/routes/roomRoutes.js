const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const {
  createRoom,
  getRoom,
  uploadFile,
  getRoomFiles
} = require('../controllers/roomController');
const { optionalProtect } = require('../middleware/authMiddleware');

// Setup multer storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitized}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

router.post('/', optionalProtect, createRoom);
router.get('/:roomId', getRoom);
router.post('/:roomId/files', optionalProtect, upload.single('file'), uploadFile);
router.get('/:roomId/files', getRoomFiles);

module.exports = router;
