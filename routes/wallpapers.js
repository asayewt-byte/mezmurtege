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
const { uploadImage, handleMulterError } = require('../config/cloudinary');

// Public routes
router.route('/')
  .get(getAllWallpapers)
  .post(
    protect,
    authorize('admin', 'super_admin'),
    (req, res, next) => {
      // Log incoming request for debugging
      console.log('POST /api/wallpapers - Request received');
      console.log('Headers:', JSON.stringify(req.headers, null, 2));
      next();
    },
    uploadImage.single('image'),
    (err, req, res, next) => {
      // Handle multer errors
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'File too large. Maximum size is 10MB.'
          });
        }
        // For other multer errors, log but continue (file might be optional)
        console.warn('Multer error (non-fatal):', err.message);
        return next();
      }
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({
          success: false,
          error: 'File upload error: ' + err.message
        });
      }
      next();
    },
    createWallpaper
  );

router.route('/:id/stats').put(updateStats);

router.route('/:id')
  .get(getWallpaper)
  .put(
    protect,
    authorize('admin', 'super_admin'),
    uploadImage.single('image'),
    handleMulterError,
    updateWallpaper
  )
  .delete(protect, authorize('admin', 'super_admin'), deleteWallpaper);

module.exports = router;

