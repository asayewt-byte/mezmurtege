const multer = require('multer');

// Simple memory storage for now (files will be uploaded directly)
// For production, you can use Cloudinary or S3
const memoryStorage = multer.memoryStorage();

// Multer upload instances
const uploadImage = multer({ 
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  preservePath: true // Preserve original path info
});

const uploadAudio = multer({ 
  storage: memoryStorage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Cloudinary configuration (optional - only if credentials are provided)
let cloudinary = null;
try {
  if (process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET) {
    const cloudinaryLib = require('cloudinary').v2;
    cloudinaryLib.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    cloudinary = cloudinaryLib;
    console.log('✅ Cloudinary configured');
  } else {
    console.warn('⚠️ Cloudinary not configured - file uploads will use memory storage');
  }
} catch (error) {
  console.warn('⚠️ Cloudinary module not available - file uploads will use memory storage');
}

module.exports = {
  cloudinary,
  uploadImage,
  uploadAudio
};

