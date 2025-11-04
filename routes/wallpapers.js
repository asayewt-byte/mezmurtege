const express = require('express');
const router = express.Router();
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

// Public routes
router.route('/').get(getAllWallpapers);
router.route('/:id').get(getWallpaper);
router.route('/:id/stats').put(updateStats);

// Protected routes (Admin only)
router.route('/')
  .post(
    protect,
    authorize('admin', 'super_admin'),
    uploadImage.single('image'),
    createWallpaper
  );

router.route('/:id')
  .put(
    protect,
    authorize('admin', 'super_admin'),
    uploadImage.single('image'),
    updateWallpaper
  )
  .delete(protect, authorize('admin', 'super_admin'), deleteWallpaper);

module.exports = router;

