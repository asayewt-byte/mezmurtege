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
    const { cloudinary } = require('../config/cloudinary');
    
    // Debug: Log what we receive
    console.log('=== CREATE WALLPAPER REQUEST ===');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Files:', req.files ? JSON.stringify(Object.keys(req.files), null, 2) : 'No files');
    if (req.file) {
      console.log('File object:', JSON.stringify({
        originalname: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
        fieldname: req.file.fieldname
      }, null, 2));
    }
    
    // Extract form data
    const wallpaperData = {
      title: req.body.title,
      category: req.body.category || 'Icons',
      tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',').map(t => t.trim())) : [],
      isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' || req.body.isActive === true : true,
      isFeatured: req.body.isFeatured !== undefined ? req.body.isFeatured === 'true' || req.body.isFeatured === true : false
    };

    // Handle file upload if present (priority: files > URLs)
    // With CloudinaryStorage, multer already uploaded the file to Cloudinary
    // The file URL is in req.file.path (secure_url from Cloudinary)
    if (req.file) {
      // File was uploaded - check if CloudinaryStorage provided the URL
      if (req.file.path) {
        // File was successfully uploaded to Cloudinary
        wallpaperData.imageUrl = req.file.path; // This is the Cloudinary secure_url
        wallpaperData.thumbnailUrl = req.file.path;
        wallpaperData.cloudinaryId = req.file.filename || req.file.public_id;
      } else if (!cloudinary) {
        // File uploaded but Cloudinary not configured
        return res.status(400).json({
          success: false,
          error: 'File uploads require Cloudinary configuration. Please configure Cloudinary in Render environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) or provide image URLs instead.',
          debug: {
            hasFile: true,
            cloudinaryConfigured: false,
            bodyImageUrl: req.body.imageUrl || '(empty)'
          }
        });
      } else {
        // File object exists but no path - might be an upload error
        return res.status(400).json({
          success: false,
          error: 'File upload failed. Please try again or use an image URL instead.',
          debug: {
            hasFile: true,
            fileObject: req.file ? 'exists' : 'missing',
            cloudinaryConfigured: !!cloudinary
          }
        });
      }
    } else if (req.body.imageUrl && req.body.imageUrl.trim()) {
      // Use provided URL if no file uploaded
      const imageUrl = req.body.imageUrl.trim();
      wallpaperData.imageUrl = imageUrl;
      wallpaperData.thumbnailUrl = imageUrl;
    } else {
      // No file and no URL provided
      return res.status(400).json({
        success: false,
        error: 'Image URL or file is required',
        debug: {
          hasFile: !!req.file,
          filePath: req.file ? req.file.path : null,
          bodyImageUrl: req.body.imageUrl || '(empty)',
          cloudinaryConfigured: !!cloudinary
        }
      });
    }

    // Validate required fields
    if (!wallpaperData.title || !wallpaperData.title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    if (!wallpaperData.imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Image URL or file is required',
        debug: {
          hasFile: !!req.file,
          bodyImageUrl: req.body.imageUrl,
          cloudinaryConfigured: !!cloudinary
        }
      });
    }

    const wallpaper = await Wallpaper.create(wallpaperData);

    res.status(201).json({
      success: true,
      data: wallpaper
    });
  } catch (error) {
    console.error('Error creating wallpaper:', error);
    console.error('Request body:', req.body);
    console.error('Request file:', req.file);
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
    if (wallpaper.cloudinaryId && cloudinary) {
      await cloudinary.uploader.destroy(wallpaper.cloudinaryId);
    }

    await Wallpaper.findByIdAndDelete(req.params.id);

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

