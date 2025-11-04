const Wallpaper = require('../models/Wallpaper');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get all wallpapers
// @route   GET /api/wallpapers
// @access  Public
exports.getAllWallpapers = async (req, res, next) => {
  try {
    const { category, featured, page = 1, limit = 20 } = req.query;

    let query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    const wallpapers = await Wallpaper.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Wallpaper.countDocuments(query);

    res.status(200).json({
      success: true,
      count: wallpapers.length,
      total,
      pages: Math.ceil(total / limit),
      data: wallpapers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single wallpaper
// @route   GET /api/wallpapers/:id
// @access  Public
exports.getWallpaper = async (req, res, next) => {
  try {
    const wallpaper = await Wallpaper.findById(req.params.id);

    if (!wallpaper) {
      return res.status(404).json({
        success: false,
        error: 'Wallpaper not found'
      });
    }

    // Increment views
    wallpaper.views += 1;
    await wallpaper.save();

    res.status(200).json({
      success: true,
      data: wallpaper
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new wallpaper
// @route   POST /api/wallpapers
// @access  Private/Admin
exports.createWallpaper = async (req, res, next) => {
  try {
    const wallpaperData = req.body;

    // Handle file upload
    if (req.file) {
      wallpaperData.imageUrl = req.file.path;
      wallpaperData.thumbnailUrl = req.file.path;
      wallpaperData.cloudinaryId = req.file.filename;
    }

    const wallpaper = await Wallpaper.create(wallpaperData);

    res.status(201).json({
      success: true,
      data: wallpaper
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update wallpaper
// @route   PUT /api/wallpapers/:id
// @access  Private/Admin
exports.updateWallpaper = async (req, res, next) => {
  try {
    let wallpaper = await Wallpaper.findById(req.params.id);

    if (!wallpaper) {
      return res.status(404).json({
        success: false,
        error: 'Wallpaper not found'
      });
    }

    const updateData = { ...req.body, updatedAt: Date.now() };

    // Handle new file upload
    if (req.file) {
      // Delete old image from Cloudinary
      if (wallpaper.cloudinaryId) {
        await cloudinary.uploader.destroy(wallpaper.cloudinaryId);
      }
      updateData.imageUrl = req.file.path;
      updateData.thumbnailUrl = req.file.path;
      updateData.cloudinaryId = req.file.filename;
    }

    wallpaper = await Wallpaper.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: wallpaper
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete wallpaper
// @route   DELETE /api/wallpapers/:id
// @access  Private/Admin
exports.deleteWallpaper = async (req, res, next) => {
  try {
    const wallpaper = await Wallpaper.findById(req.params.id);

    if (!wallpaper) {
      return res.status(404).json({
        success: false,
        error: 'Wallpaper not found'
      });
    }

    // Delete from Cloudinary
    if (wallpaper.cloudinaryId) {
      await cloudinary.uploader.destroy(wallpaper.cloudinaryId);
    }

    await wallpaper.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update wallpaper stats
// @route   PUT /api/wallpapers/:id/stats
// @access  Public
exports.updateStats = async (req, res, next) => {
  try {
    const { action } = req.body; // action: 'download', 'set', 'share'

    const updateField = {};
    if (action === 'download') updateField.downloads = 1;
    else if (action === 'set') updateField.sets = 1;
    else if (action === 'share') updateField.shares = 1;

    const wallpaper = await Wallpaper.findByIdAndUpdate(
      req.params.id,
      { $inc: updateField },
      { new: true }
    );

    if (!wallpaper) {
      return res.status(404).json({
        success: false,
        error: 'Wallpaper not found'
      });
    }

    res.status(200).json({
      success: true,
      data: wallpaper
    });
  } catch (error) {
    next(error);
  }
};

