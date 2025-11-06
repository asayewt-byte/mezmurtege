const express = require('express');
const router = express.Router();
const multer = require('multer');
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
router.route('/')
  .get(getAllMezmurs)
  .post(
    protect,
    authorize('admin', 'super_admin'),
    (req, res, next) => {
      // Multer middleware with error handling
      uploadImage.fields([
        { name: 'image', maxCount: 1 },
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
            return next(); // Continue without file
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
    createMezmur
  );

router.route('/:id/stats').put(updateStats);

router.route('/:id')
  .get(getMezmur)
  .put(
    protect,
    authorize('admin', 'super_admin'),
    (req, res, next) => {
      uploadImage.fields([
        { name: 'image', maxCount: 1 },
        { name: 'audio', maxCount: 1 }
      ])(req, res, (err) => {
        if (err && err instanceof multer.MulterError && err.code !== 'LIMIT_FILE_SIZE') {
          console.warn('Multer error (non-fatal):', err.message);
          return next(); // Continue without file
        }
        if (err) return next(err);
        next();
      });
    },
    updateMezmur
  )
  .delete(protect, authorize('admin', 'super_admin'), deleteMezmur);

module.exports = router;

