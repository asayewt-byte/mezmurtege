const mongoose = require('mongoose');

const mezmurSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  artist: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['All', 'Kidase', 'Holiday', 'Sunday', 'Saints', 'Fasting'],
    default: 'All'
  },
  imageUrl: {
    type: String,
    required: true
  },
  audioUrl: {
    type: String,
    required: true
  },
  duration: {
    type: String, // Format: "3:45"
    default: "0:00"
  },
  lyrics: {
    type: String,
    default: ""
  },
  description: {
    type: String,
    default: ""
  },
  cloudinaryImageId: String,
  cloudinaryAudioId: String,
  plays: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  },
  favorites: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
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

// Index for search and filtering
mezmurSchema.index({ title: 'text', artist: 'text' });
mezmurSchema.index({ category: 1 });
mezmurSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Mezmur', mezmurSchema);

