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
const { uploadImage, uploadAudio, handleMulterError } = require('../config/cloudinary');

// Public routes
router.route('/')
  .get(getAllMezmurs)
  .post(
    protect,
    authorize('admin', 'super_admin'),
    uploadImage.fields([
      { name: 'image', maxCount: 1 },
      { name: 'audio', maxCount: 1 }
    ]),
    handleMulterError,
    createMezmur
  );

router.route('/:id/stats').put(updateStats);

router.route('/:id')
  .get(getMezmur)
  .put(
    protect,
    authorize('admin', 'super_admin'),
    uploadImage.fields([
      { name: 'image', maxCount: 1 },
      { name: 'audio', maxCount: 1 }
    ]),
    handleMulterError,
    updateMezmur
  )
  .delete(protect, authorize('admin', 'super_admin'), deleteMezmur);

module.exports = router;

