const express = require('express');
const router = express.Router();
const {
  getAllRingtones,
  getRingtone,
  createRingtone,
  updateRingtone,
  deleteRingtone,
  updateStats
} = require('../controllers/ringtoneController');
const { protect, authorize } = require('../middleware/auth');
const { uploadImage, uploadAudio } = require('../config/cloudinary');

// Public routes
router.route('/')
  .get(getAllRingtones)
  .post(
    protect,
    authorize('admin', 'super_admin'),
    uploadImage.fields([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'audio', maxCount: 1 }
    ]),
    createRingtone
  );

router.route('/:id/stats').put(updateStats);

router.route('/:id')
  .get(getRingtone)
  .put(
    protect,
    authorize('admin', 'super_admin'),
    uploadImage.fields([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'audio', maxCount: 1 }
    ]),
    updateRingtone
  )
  .delete(protect, authorize('admin', 'super_admin'), deleteRingtone);

module.exports = router;

