const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage for images (wallpapers, thumbnails)
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tselot_tunes/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1080, quality: 'auto' }]
  }
});

// Storage for audio files
const audioStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tselot_tunes/audio',
    allowed_formats: ['mp3', 'wav', 'm4a'],
    resource_type: 'video' // Cloudinary handles audio as video type
  }
});

// Multer upload instances
const uploadImage = multer({ 
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const uploadAudio = multer({ 
  storage: audioStorage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Combined storage for mezmurs (handles both image and audio)
// Use a function-based storage that routes to appropriate storage based on field name
const mezmurImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tselot_tunes/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1080, quality: 'auto' }]
  }
});

const mezmurAudioStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tselot_tunes/audio',
    allowed_formats: ['mp3', 'wav', 'm4a'],
    resource_type: 'video' // Cloudinary handles audio as video type
  }
});

// Custom storage that routes based on field name
const mezmurStorage = {
  _handleFile: function (req, file, cb) {
    const storage = file.fieldname === 'audio' ? mezmurAudioStorage : mezmurImageStorage;
    storage._handleFile(req, file, cb);
  },
  _removeFile: function (req, file, cb) {
    const storage = file.fieldname === 'audio' ? mezmurAudioStorage : mezmurImageStorage;
    if (storage._removeFile) {
      storage._removeFile(req, file, cb);
    } else {
      cb(null);
    }
  }
};

const uploadMezmur = multer({
  storage: mezmurStorage,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB limit (for audio)
    files: 2 // Max 2 files (image + audio)
  }
});

module.exports = {
  cloudinary,
  uploadImage,
  uploadAudio,
  uploadMezmur
};

