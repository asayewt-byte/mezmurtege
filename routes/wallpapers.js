const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getAllWallpapers,
  getWallpaper,
  createWallpaper,
  updateWallpaper,
  deleteWallpaper,
  updateStats
} = require('../controllers/wallpaperController');
const { protect, authorize } = require('../middleware/auth');
const { uploadImage } = require('../config/cloudinary');

// Test route to verify router is working
router.use((req, res, next) => {
  console.log('Wallpapers router - Request:', req.method, req.path);
  next();
});

// Simple test route to verify router is registered
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Wallpapers router is working!' });
});

// Public routes
router.route('/')
  .get(getAllWallpapers)
  .post(
    protect,
    authorize('admin', 'super_admin'),
    (req, res, next) => {
      // Log incoming request for debugging
      console.log('POST /api/wallpapers - Request received');
      console.log('Method:', req.method);
      console.log('Path:', req.path);
      console.log('Original URL:', req.originalUrl);
      next();
    },
    (req, res, next) => {
      // Multer middleware with error handling
      uploadImage.single('image')(req, res, (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(400).json({
                success: false,
                error: 'File too large. Maximum size is 10MB.'
              });
            }
            // For other multer errors, log but continue (file might be optional)
            console.warn('Multer error (non-fatal):', err.message);
            // Continue without file
            return next();
          }
          // File type validation error
          if (err.message && (err.message.includes('Invalid file type') || err.message.includes('Image file format'))) {
            return res.status(400).json({
              success: false,
              error: err.message || 'Invalid file type. Please upload an image file (jpg, jpeg, png, webp).'
            });
          }
          console.error('Upload error:', err);
          return res.status(400).json({
            success: false,
            error: 'File upload error: ' + (err.message || 'Unknown error')
          });
        }
        next();
      });
    },
    createWallpaper
  );

router.route('/:id/stats').put(updateStats);

router.route('/:id')
  .get(getWallpaper)
  .put(
    protect,
    authorize('admin', 'super_admin'),
    (req, res, next) => {
      uploadImage.single('image')(req, res, (err) => {
        if (err && err instanceof multer.MulterError && err.code !== 'LIMIT_FILE_SIZE') {
          console.warn('Multer error (non-fatal):', err.message);
          return next();
        }
        if (err) return next(err);
        next();
      });
    },
    updateWallpaper
  )
  .delete(protect, authorize('admin', 'super_admin'), deleteWallpaper);

module.exports = router;

