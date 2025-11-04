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
    const mezmurData = req.body;
    const { cloudinary } = require('../config/cloudinary');

    // Handle file uploads if present
    if (req.files && cloudinary) {
      // Upload image to Cloudinary
      if (req.files.image && req.files.image[0]) {
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
      }

      // Upload audio to Cloudinary
      if (req.files.audio && req.files.audio[0]) {
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
      }
    }

    // imageUrl and audioUrl can be provided directly in the request body
    // If not uploaded via files, they should be provided as URLs

    const mezmur = await Mezmur.create(mezmurData);

    res.status(201).json({
      success: true,
      data: mezmur
    });
  } catch (error) {
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
    if (mezmur.cloudinaryImageId) {
      await cloudinary.uploader.destroy(mezmur.cloudinaryImageId);
    }
    if (mezmur.cloudinaryAudioId) {
      await cloudinary.uploader.destroy(mezmur.cloudinaryAudioId, { resource_type: 'video' });
    }

    await mezmur.remove();

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

