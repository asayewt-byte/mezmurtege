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
const { uploadImage, uploadAudio } = require('../config/cloudinary');

// Public routes
router.route('/').get(getAllMezmurs);
router.route('/:id').get(getMezmur);
router.route('/:id/stats').put(updateStats);

// Protected routes (Admin only)
router.route('/')
  .post(
    protect,
    authorize('admin', 'super_admin'),
    uploadImage.fields([
      { name: 'image', maxCount: 1 },
      { name: 'audio', maxCount: 1 }
    ]),
    createMezmur
  );

router.route('/:id')
  .put(
    protect,
    authorize('admin', 'super_admin'),
    uploadImage.fields([
      { name: 'image', maxCount: 1 },
      { name: 'audio', maxCount: 1 }
    ]),
    updateMezmur
  )
  .delete(protect, authorize('admin', 'super_admin'), deleteMezmur);

module.exports = router;

