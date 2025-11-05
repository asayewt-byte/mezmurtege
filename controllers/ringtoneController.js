const Ringtone = require('../models/Ringtone');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get all ringtones
// @route   GET /api/ringtones
// @access  Public
exports.getAllRingtones = async (req, res, next) => {
  try {
    const { category, featured, page = 1, limit = 20 } = req.query;

    let query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    const ringtones = await Ringtone.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Ringtone.countDocuments(query);

    res.status(200).json({
      success: true,
      count: ringtones.length,
      total,
      pages: Math.ceil(total / limit),
      data: ringtones
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single ringtone
// @route   GET /api/ringtones/:id
// @access  Public
exports.getRingtone = async (req, res, next) => {
  try {
    const ringtone = await Ringtone.findById(req.params.id);

    if (!ringtone) {
      return res.status(404).json({
        success: false,
        error: 'Ringtone not found'
      });
    }

    res.status(200).json({
      success: true,
      data: ringtone
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new ringtone
// @route   POST /api/ringtones
// @access  Private/Admin
exports.createRingtone = async (req, res, next) => {
  try {
    const ringtoneData = req.body;

    // Handle file uploads
    if (req.files) {
      if (req.files.thumbnail) {
        ringtoneData.thumbnailUrl = req.files.thumbnail[0].path;
        ringtoneData.cloudinaryThumbnailId = req.files.thumbnail[0].filename;
      }
      if (req.files.audio) {
        ringtoneData.audioUrl = req.files.audio[0].path;
        ringtoneData.cloudinaryAudioId = req.files.audio[0].filename;
      }
    }

    const ringtone = await Ringtone.create(ringtoneData);

    res.status(201).json({
      success: true,
      data: ringtone
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update ringtone
// @route   PUT /api/ringtones/:id
// @access  Private/Admin
exports.updateRingtone = async (req, res, next) => {
  try {
    let ringtone = await Ringtone.findById(req.params.id);

    if (!ringtone) {
      return res.status(404).json({
        success: false,
        error: 'Ringtone not found'
      });
    }

    const updateData = { ...req.body, updatedAt: Date.now() };

    // Handle new file uploads
    if (req.files) {
      if (req.files.thumbnail) {
        // Delete old thumbnail
        if (ringtone.cloudinaryThumbnailId) {
          await cloudinary.uploader.destroy(ringtone.cloudinaryThumbnailId);
        }
        updateData.thumbnailUrl = req.files.thumbnail[0].path;
        updateData.cloudinaryThumbnailId = req.files.thumbnail[0].filename;
      }
      if (req.files.audio) {
        // Delete old audio
        if (ringtone.cloudinaryAudioId) {
          await cloudinary.uploader.destroy(ringtone.cloudinaryAudioId, { resource_type: 'video' });
        }
        updateData.audioUrl = req.files.audio[0].path;
        updateData.cloudinaryAudioId = req.files.audio[0].filename;
      }
    }

    ringtone = await Ringtone.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: ringtone
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete ringtone
// @route   DELETE /api/ringtones/:id
// @access  Private/Admin
exports.deleteRingtone = async (req, res, next) => {
  try {
    const ringtone = await Ringtone.findById(req.params.id);

    if (!ringtone) {
      return res.status(404).json({
        success: false,
        error: 'Ringtone not found'
      });
    }

    // Delete files from Cloudinary
    if (ringtone.cloudinaryThumbnailId && cloudinary) {
      await cloudinary.uploader.destroy(ringtone.cloudinaryThumbnailId);
    }
    if (ringtone.cloudinaryAudioId && cloudinary) {
      await cloudinary.uploader.destroy(ringtone.cloudinaryAudioId, { resource_type: 'video' });
    }

    await Ringtone.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update ringtone stats
// @route   PUT /api/ringtones/:id/stats
// @access  Public
exports.updateStats = async (req, res, next) => {
  try {
    const { action } = req.body; // action: 'play', 'download', 'set', 'share'

    const updateField = {};
    if (action === 'play') updateField.plays = 1;
    else if (action === 'download') updateField.downloads = 1;
    else if (action === 'set') updateField.sets = 1;
    else if (action === 'share') updateField.shares = 1;

    const ringtone = await Ringtone.findByIdAndUpdate(
      req.params.id,
      { $inc: updateField },
      { new: true }
    );

    if (!ringtone) {
      return res.status(404).json({
        success: false,
        error: 'Ringtone not found'
      });
    }

    res.status(200).json({
      success: true,
      data: ringtone
    });
  } catch (error) {
    next(error);
  }
};

