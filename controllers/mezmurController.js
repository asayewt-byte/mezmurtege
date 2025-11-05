const Mezmur = require('../models/Mezmur');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get all mezmurs
// @route   GET /api/mezmurs
// @access  Public
exports.getAllMezmurs = async (req, res, next) => {
  try {
    // Ensure database is connected
    const mongoose = require('mongoose');
    const connectDatabase = require('../config/database');
    
    if (mongoose.connection.readyState !== 1) {
      // Try to connect
      try {
        await connectDatabase();
      } catch (dbError) {
        return res.status(503).json({
          success: false,
          error: 'Database connection failed. Please check MONGODB_URI environment variable.',
          data: []
        });
      }
    }

    const { category, search, page = 1, limit = 20 } = req.query;

    let query = { isActive: true };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const mezmurs = await Mezmur.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Mezmur.countDocuments(query);

    res.status(200).json({
      success: true,
      count: mezmurs.length,
      total,
      pages: Math.ceil(total / limit),
      data: mezmurs
    });
  } catch (error) {
    console.error('Error in getAllMezmurs:', error);
    next(error);
  }
};

// @desc    Get single mezmur
// @route   GET /api/mezmurs/:id
// @access  Public
exports.getMezmur = async (req, res, next) => {
  try {
    const mezmur = await Mezmur.findById(req.params.id);

    if (!mezmur) {
      return res.status(404).json({
        success: false,
        error: 'Mezmur not found'
      });
    }

    res.status(200).json({
      success: true,
      data: mezmur
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new mezmur
// @route   POST /api/mezmurs
// @access  Private/Admin
exports.createMezmur = async (req, res, next) => {
  try {
    const { cloudinary } = require('../config/cloudinary');
    
    // Debug: Log what we receive
    console.log('=== CREATE MEZMUR REQUEST ===');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Files:', req.files ? JSON.stringify(Object.keys(req.files), null, 2) : 'No files');
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        console.log(`  ${key}:`, req.files[key] ? req.files[key].length + ' file(s)' : 'none');
      });
    }
    
    // Extract form data (works for both JSON and FormData)
    const mezmurData = {
      title: req.body.title,
      artist: req.body.artist,
      category: req.body.category || 'All',
      duration: req.body.duration || '0:00',
      description: req.body.description || '',
      lyrics: req.body.lyrics || ''
    };

    // Handle file uploads if present (priority: files > URLs)
    // Upload image to Cloudinary if file is provided
    if (req.files && req.files.image && req.files.image[0]) {
      if (cloudinary) {
        // Cloudinary is configured, upload the file
        const imageResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'tselot_tunes/images', resource_type: 'image' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.files.image[0].buffer);
        });
        mezmurData.imageUrl = imageResult.secure_url;
        mezmurData.cloudinaryImageId = imageResult.public_id;
      } else {
        // Cloudinary not configured, but file was uploaded
        // Check if URL was also provided as fallback
        if (req.body.imageUrl && req.body.imageUrl.trim()) {
          mezmurData.imageUrl = req.body.imageUrl.trim();
        } else {
          return res.status(400).json({
            success: false,
            error: 'File uploads require Cloudinary configuration. Please either configure Cloudinary in Render environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) or provide image URLs instead of uploading files.',
            debug: {
              hasImageFile: true,
              cloudinaryConfigured: false,
              bodyImageUrl: req.body.imageUrl || '(empty)'
            }
          });
        }
      }
    } else if (req.body.imageUrl && req.body.imageUrl.trim()) {
      // No file uploaded, use provided URL
      mezmurData.imageUrl = req.body.imageUrl.trim();
    }

    // Upload audio to Cloudinary if file is provided
    if (req.files && req.files.audio && req.files.audio[0]) {
      if (cloudinary) {
        // Cloudinary is configured, upload the file
        const audioResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'tselot_tunes/audio', resource_type: 'video' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.files.audio[0].buffer);
        });
        mezmurData.audioUrl = audioResult.secure_url;
        mezmurData.cloudinaryAudioId = audioResult.public_id;
      } else {
        // Cloudinary not configured, but file was uploaded
        // Check if URL was also provided as fallback
        if (req.body.audioUrl && req.body.audioUrl.trim()) {
          mezmurData.audioUrl = req.body.audioUrl.trim();
        } else {
          return res.status(400).json({
            success: false,
            error: 'File uploads require Cloudinary configuration. Please either configure Cloudinary in Render environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) or provide audio URLs instead of uploading files.',
            debug: {
              hasAudioFile: true,
              cloudinaryConfigured: false,
              bodyAudioUrl: req.body.audioUrl || '(empty)'
            }
          });
        }
      }
    } else if (req.body.audioUrl && req.body.audioUrl.trim()) {
      // No file uploaded, use provided URL
      mezmurData.audioUrl = req.body.audioUrl.trim();
    }

    // Validate required fields
    if (!mezmurData.title || !mezmurData.artist) {
      return res.status(400).json({
        success: false,
        error: 'Title and artist are required'
      });
    }

    console.log('Image URL from body:', req.body.imageUrl);
    console.log('Audio URL from body:', req.body.audioUrl);
    console.log('Final mezmurData.imageUrl:', mezmurData.imageUrl);
    console.log('Final mezmurData.audioUrl:', mezmurData.audioUrl);

    if (!mezmurData.imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Image URL or file is required',
        debug: {
          hasFiles: !!req.files,
          hasImageFile: !!(req.files && req.files.image && req.files.image[0]),
          bodyImageUrl: req.body.imageUrl,
          cloudinaryConfigured: !!cloudinary
        }
      });
    }

    if (!mezmurData.audioUrl) {
      return res.status(400).json({
        success: false,
        error: 'Audio URL or file is required',
        debug: {
          hasFiles: !!req.files,
          hasAudioFile: !!(req.files && req.files.audio && req.files.audio[0]),
          bodyAudioUrl: req.body.audioUrl,
          cloudinaryConfigured: !!cloudinary
        }
      });
    }

    const mezmur = await Mezmur.create(mezmurData);

    res.status(201).json({
      success: true,
      data: mezmur
    });
  } catch (error) {
    console.error('Error creating mezmur:', error);
    console.error('Request body:', req.body);
    console.error('Request files:', req.files);
    next(error);
  }
};

// @desc    Update mezmur
// @route   PUT /api/mezmurs/:id
// @access  Private/Admin
exports.updateMezmur = async (req, res, next) => {
  try {
    let mezmur = await Mezmur.findById(req.params.id);

    if (!mezmur) {
      return res.status(404).json({
        success: false,
        error: 'Mezmur not found'
      });
    }

    const updateData = { ...req.body, updatedAt: Date.now() };

    // Handle new file uploads
    if (req.files) {
      if (req.files.image) {
        // Delete old image from Cloudinary
        if (mezmur.cloudinaryImageId) {
          await cloudinary.uploader.destroy(mezmur.cloudinaryImageId);
        }
        updateData.imageUrl = req.files.image[0].path;
        updateData.cloudinaryImageId = req.files.image[0].filename;
      }
      if (req.files.audio) {
        // Delete old audio from Cloudinary
        if (mezmur.cloudinaryAudioId) {
          await cloudinary.uploader.destroy(mezmur.cloudinaryAudioId, { resource_type: 'video' });
        }
        updateData.audioUrl = req.files.audio[0].path;
        updateData.cloudinaryAudioId = req.files.audio[0].filename;
      }
    }

    mezmur = await Mezmur.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: mezmur
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete mezmur
// @route   DELETE /api/mezmurs/:id
// @access  Private/Admin
exports.deleteMezmur = async (req, res, next) => {
  try {
    const mezmur = await Mezmur.findById(req.params.id);

    if (!mezmur) {
      return res.status(404).json({
        success: false,
        error: 'Mezmur not found'
      });
    }

    // Delete files from Cloudinary
    if (mezmur.cloudinaryImageId && cloudinary) {
      await cloudinary.uploader.destroy(mezmur.cloudinaryImageId);
    }
    if (mezmur.cloudinaryAudioId && cloudinary) {
      await cloudinary.uploader.destroy(mezmur.cloudinaryAudioId, { resource_type: 'video' });
    }

    await Mezmur.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update mezmur stats (play, download, favorite, share)
// @route   PUT /api/mezmurs/:id/stats
// @access  Public
exports.updateStats = async (req, res, next) => {
  try {
    const { action } = req.body; // action: 'play', 'download', 'favorite', 'share'

    const updateField = {};
    if (action === 'play') updateField.plays = 1;
    else if (action === 'download') updateField.downloads = 1;
    else if (action === 'favorite') updateField.favorites = 1;
    else if (action === 'share') updateField.shares = 1;

    const mezmur = await Mezmur.findByIdAndUpdate(
      req.params.id,
      { $inc: updateField },
      { new: true }
    );

    if (!mezmur) {
      return res.status(404).json({
        success: false,
        error: 'Mezmur not found'
      });
    }

    res.status(200).json({
      success: true,
      data: mezmur
    });
  } catch (error) {
    next(error);
  }
};

