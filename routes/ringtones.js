const express = require('express');
const router = express.Router();
const multer = require('multer');
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
    (req, res, next) => {
      uploadImage.fields([
        { name: 'thumbnail', maxCount: 1 },
        { name: 'audio', maxCount: 1 }
      ])(req, res, (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(400).json({
                success: false,
                error: 'File too large. Maximum size is 10MB for images, 50MB for audio.'
              });
            }
            console.warn('Multer error (non-fatal):', err.message);
            return next();
          }
          console.error('Upload error:', err);
          return res.status(400).json({
            success: false,
            error: 'File upload error: ' + err.message
          });
        }
        next();
      });
    },
    createRingtone
  );

router.route('/:id/stats').put(updateStats);

router.route('/:id')
  .get(getRingtone)
  .put(
    protect,
    authorize('admin', 'super_admin'),
    (req, res, next) => {
      uploadImage.fields([
        { name: 'thumbnail', maxCount: 1 },
        { name: 'audio', maxCount: 1 }
      ])(req, res, (err) => {
        if (err && err instanceof multer.MulterError && err.code !== 'LIMIT_FILE_SIZE') {
          console.warn('Multer error (non-fatal):', err.message);
          return next();
        }
        if (err) return next(err);
        next();
      });
    },
    updateRingtone
  )
  .delete(protect, authorize('admin', 'super_admin'), deleteRingtone);

module.exports = router;

