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
router.route('/')
  .get(getAllWallpapers)
  .post(
    protect,
    authorize('admin', 'super_admin'),
    uploadImage.single('image'),
    createWallpaper
  );

router.route('/:id/stats').put(updateStats);

router.route('/:id')
  .get(getWallpaper)
  .put(
    protect,
    authorize('admin', 'super_admin'),
    uploadImage.single('image'),
    updateWallpaper
  )
  .delete(protect, authorize('admin', 'super_admin'), deleteWallpaper);

module.exports = router;

