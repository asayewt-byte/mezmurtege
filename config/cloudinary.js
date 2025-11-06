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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept the file (or no file)
    cb(null, true);
  }
});

const uploadAudio = multer({ 
  storage: audioStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Accept the file (or no file)
    cb(null, true);
  }
});

// Middleware to handle multer errors gracefully
// This should be used AFTER multer middleware in routes
const handleMulterError = (err, req, res, next) => {
  // Only handle if there's an error
  if (!err) return next();
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB for images, 50MB for audio.'
      });
    }
    // For other multer errors, log but allow request to continue (file might be optional)
    console.warn('Multer error (non-fatal):', err.message);
    // Clear the error and continue
    return next();
  }
  // For non-multer errors, pass to next error handler
  next(err);
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadAudio,
  handleMulterError
};

