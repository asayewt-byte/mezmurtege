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
const { uploadImage, uploadAudio, uploadAny, cloudinary } = require('../config/cloudinary');

// Public routes
router.route('/')
  .get(getAllMezmurs)
  .post(
    protect,
    authorize('admin', 'super_admin'),
    uploadAny.fields([
      { name: 'image', maxCount: 1 },
      { name: 'audio', maxCount: 1 }
    ]),
    async (req, res, next) => {
      // Upload files to Cloudinary if present
      try {
        if (req.files) {
          // Handle image upload
          if (req.files.image && req.files.image[0]) {
            const imageFile = req.files.image[0];
            const uploadResult = await new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                {
                  folder: 'tselot_tunes/images',
                  allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
                  transformation: [{ width: 1080, quality: 'auto' }]
                },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              );
              uploadStream.end(imageFile.buffer);
            });
            req.files.image[0].path = uploadResult.secure_url;
            req.files.image[0].filename = uploadResult.public_id;
          }
          
          // Handle audio upload
          if (req.files.audio && req.files.audio[0]) {
            const audioFile = req.files.audio[0];
            const uploadResult = await new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                {
                  folder: 'tselot_tunes/audio',
                  allowed_formats: ['mp3', 'wav', 'm4a'],
                  resource_type: 'video' // Cloudinary handles audio as video
                },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              );
              uploadStream.end(audioFile.buffer);
            });
            req.files.audio[0].path = uploadResult.secure_url;
            req.files.audio[0].filename = uploadResult.public_id;
          }
        }
        next();
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(400).json({
          success: false,
          error: 'File upload failed: ' + uploadError.message
        });
      }
    },
    (err, req, res, next) => {
      // Handle multer errors
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
        // File type validation error
        if (err.message && (err.message.includes('Invalid file type') || err.message.includes('Image file format') || err.message.includes('Audio file format'))) {
          return res.status(400).json({
            success: false,
            error: err.message
          });
        }
        console.error('Upload error:', err);
        return res.status(400).json({
          success: false,
          error: 'File upload error: ' + (err.message || 'Unknown error')
        });
      }
      next();
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

