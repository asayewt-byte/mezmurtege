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
      // Use separate multer instances for image and audio
      const imageUpload = uploadImage.fields([{ name: 'image', maxCount: 1 }]);
      const audioUpload = uploadAudio.fields([{ name: 'audio', maxCount: 1 }]);
      
      // First handle image upload
      imageUpload(req, res, (imageErr) => {
        if (imageErr && !(imageErr instanceof multer.MulterError && imageErr.code === 'LIMIT_FILE_SIZE')) {
          if (imageErr.message && (imageErr.message.includes('Invalid file type') || imageErr.message.includes('Image file format'))) {
            return res.status(400).json({
              success: false,
              error: 'Image file error: ' + imageErr.message
            });
          }
        }
        
        // Then handle audio upload
        audioUpload(req, res, (audioErr) => {
          if (audioErr && !(audioErr instanceof multer.MulterError && audioErr.code === 'LIMIT_FILE_SIZE')) {
            if (audioErr.message && (audioErr.message.includes('Invalid file type') || audioErr.message.includes('Audio file format'))) {
              return res.status(400).json({
                success: false,
                error: 'Audio file error: ' + audioErr.message
              });
            }
          }
          
          // Check for file size errors
          if (imageErr instanceof multer.MulterError && imageErr.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              error: 'Image file too large. Maximum size is 10MB.'
            });
          }
          if (audioErr instanceof multer.MulterError && audioErr.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              error: 'Audio file too large. Maximum size is 50MB.'
            });
          }
          
          // Other non-fatal errors - continue without file
          if (imageErr || audioErr) {
            console.warn('Multer error (non-fatal):', imageErr?.message || audioErr?.message);
            return next();
          }
          
          next();
        });
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

