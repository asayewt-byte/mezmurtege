const mongoose = require('mongoose');

const wallpaperSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Icons', 'Saints', 'Churches', 'Nature', 'Cross', 'Holy Trinity'],
    default: 'Icons'
  },
  imageUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    required: true
  },
  resolution: {
    width: Number,
    height: Number
  },
  cloudinaryId: String,
  downloads: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  sets: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
wallpaperSchema.index({ category: 1 });
wallpaperSchema.index({ isFeatured: 1 });
wallpaperSchema.index({ createdAt: -1 });
wallpaperSchema.index({ downloads: -1 });

module.exports = mongoose.model('Wallpaper', wallpaperSchema);

