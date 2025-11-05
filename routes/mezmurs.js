const express = require('express');
const router = express.Router();
const {
  getAllMezmurs,
  getMezmur,
  createMezmur,
  updateMezmur,
  deleteMezmur,
  updateStats
} = require('../controllers/mezmurController');
const { protect, authorize } = require('../middleware/auth');
const { uploadImage, uploadAudio, uploadMezmur } = require('../config/cloudinary');

// Public routes
router.route('/').get(getAllMezmurs);
router.route('/:id/stats').put(updateStats);

// Protected routes (Admin only) - must be before /:id route
router.route('/')
  .post(
    protect,
    authorize('admin', 'super_admin'),
    uploadMezmur.fields([
      { name: 'image', maxCount: 1 },
      { name: 'audio', maxCount: 1 }
    ]),
    createMezmur
  );

// Single mezmur routes (must be after / route)
router.route('/:id')
  .get(getMezmur)
  .put(
    protect,
    authorize('admin', 'super_admin'),
    uploadMezmur.fields([
      { name: 'image', maxCount: 1 },
      { name: 'audio', maxCount: 1 }
    ]),
    updateMezmur
  )
  .delete(protect, authorize('admin', 'super_admin'), deleteMezmur);

module.exports = router;

