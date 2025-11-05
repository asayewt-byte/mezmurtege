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
  const cloudinaryLib = require('cloudinary').v2;
  
  // Support both CLOUDINARY_URL (single env var) and individual variables
  if (process.env.CLOUDINARY_URL) {
    // Use CLOUDINARY_URL format: cloudinary://api_key:api_secret@cloud_name
    cloudinaryLib.config();
    cloudinary = cloudinaryLib;
    console.log('✅ Cloudinary configured via CLOUDINARY_URL');
  } else if (process.env.CLOUDINARY_CLOUD_NAME && 
             process.env.CLOUDINARY_API_KEY && 
             process.env.CLOUDINARY_API_SECRET) {
    // Use individual environment variables
    cloudinaryLib.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    cloudinary = cloudinaryLib;
    console.log('✅ Cloudinary configured via individual variables');
  } else {
    console.warn('⚠️ Cloudinary not configured - file uploads will use memory storage');
    console.warn('   Set either CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET');
  }
} catch (error) {
  console.warn('⚠️ Cloudinary module not available - file uploads will use memory storage');
  console.warn('   Error:', error.message);
}

module.exports = {
  cloudinary,
  uploadImage,
  uploadAudio
};

