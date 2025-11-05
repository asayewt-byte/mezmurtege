const Mezmur = require('../models/Mezmur');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get all mezmurs
// @route   GET /api/mezmurs
// @access  Public
exports.getAllMezmurs = async (req, res, next) => {
  try {
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
    // Debug: Log what we receive
    console.log('=== CREATE MEZMUR REQUEST ===');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Files:', req.files ? JSON.stringify(Object.keys(req.files), null, 2) : 'No files');
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        console.log(`File ${key}:`, req.files[key] ? req.files[key].map(f => ({
          originalname: f.originalname,
          filename: f.filename,
          path: f.path,
          size: f.size
        })) : 'none');
      });
    }
    
    // Extract form data
    const mezmurData = {
      title: req.body.title ? req.body.title.trim() : '',
      artist: req.body.artist ? req.body.artist.trim() : '',
      category: req.body.category || 'All',
      duration: req.body.duration ? req.body.duration.trim() : '0:00',
      lyrics: req.body.lyrics ? req.body.lyrics.trim() : '',
      description: req.body.description ? req.body.description.trim() : '',
      isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' || req.body.isActive === true : true
    };

    // Validate required fields
    if (!mezmurData.title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    if (!mezmurData.artist) {
      return res.status(400).json({
        success: false,
        error: 'Artist is required'
      });
    }

    // Handle image upload (priority: files > URLs)
    if (req.files && req.files.image && req.files.image[0] && req.files.image[0].path) {
      // File was uploaded to Cloudinary by multer
      mezmurData.imageUrl = req.files.image[0].path;
      mezmurData.cloudinaryImageId = req.files.image[0].filename || req.files.image[0].public_id;
    } else if (req.body.imageUrl && req.body.imageUrl.trim()) {
      // Use provided URL if no file uploaded
      mezmurData.imageUrl = req.body.imageUrl.trim();
    }
    // Note: imageUrl is required in schema but we'll let mongoose validate it

    // Handle audio upload (priority: files > URLs)
    if (req.files && req.files.audio && req.files.audio[0] && req.files.audio[0].path) {
      // File was uploaded to Cloudinary by multer
      mezmurData.audioUrl = req.files.audio[0].path;
      mezmurData.cloudinaryAudioId = req.files.audio[0].filename || req.files.audio[0].public_id;
    } else if (req.body.audioUrl && req.body.audioUrl.trim()) {
      // Use provided URL if no file uploaded
      mezmurData.audioUrl = req.body.audioUrl.trim();
    } else {
      // Audio is required
      return res.status(400).json({
        success: false,
        error: 'Audio URL or file is required',
        debug: {
          hasAudioFile: !!(req.files && req.files.audio && req.files.audio[0]),
          bodyAudioUrl: req.body.audioUrl || '(empty)',
          cloudinaryConfigured: !!cloudinary
        }
      });
    }

    // Validate that we have imageUrl
    if (!mezmurData.imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Image URL or file is required',
        debug: {
          hasImageFile: !!(req.files && req.files.image && req.files.image[0]),
          bodyImageUrl: req.body.imageUrl || '(empty)',
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
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }
    
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

