const mongoose = require('mongoose');

const ringtoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  artist: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['Bells', 'Chants', 'Prayers', 'Qene', 'Traditional'],
    default: 'Chants'
  },
  thumbnailUrl: {
    type: String,
    required: true
  },
  audioUrl: {
    type: String,
    required: true
  },
  duration: {
    type: String, // Format: "0:30"
    required: true
  },
  cloudinaryThumbnailId: String,
  cloudinaryAudioId: String,
  downloads: {
    type: Number,
    default: 0
  },
  plays: {
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
  description: {
    type: String,
    default: ""
  },
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
ringtoneSchema.index({ category: 1 });
ringtoneSchema.index({ isFeatured: 1 });
ringtoneSchema.index({ createdAt: -1 });
ringtoneSchema.index({ downloads: -1 });
ringtoneSchema.index({ title: 'text', artist: 'text' });

module.exports = mongoose.model('Ringtone', ringtoneSchema);

