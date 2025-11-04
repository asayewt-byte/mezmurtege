const mongoose = require('mongoose');

const appStatisticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  totalUsers: {
    type: Number,
    default: 0
  },
  activeUsers: {
    type: Number,
    default: 0
  },
  newUsers: {
    type: Number,
    default: 0
  },
  mezmurs: {
    totalPlays: { type: Number, default: 0 },
    totalDownloads: { type: Number, default: 0 },
    totalFavorites: { type: Number, default: 0 },
    totalShares: { type: Number, default: 0 }
  },
  wallpapers: {
    totalViews: { type: Number, default: 0 },
    totalDownloads: { type: Number, default: 0 },
    totalSets: { type: Number, default: 0 },
    totalShares: { type: Number, default: 0 }
  },
  ringtones: {
    totalPlays: { type: Number, default: 0 },
    totalDownloads: { type: Number, default: 0 },
    totalSets: { type: Number, default: 0 },
    totalShares: { type: Number, default: 0 }
  },
  topMezmurs: [{
    mezmurId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mezmur' },
    plays: Number
  }],
  topWallpapers: [{
    wallpaperId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallpaper' },
    downloads: Number
  }],
  topRingtones: [{
    ringtoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ringtone' },
    downloads: Number
  }],
  deviceStats: {
    android: { type: Number, default: 0 },
    ios: { type: Number, default: 0 },
    web: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster date queries
appStatisticsSchema.index({ date: -1 });

module.exports = mongoose.model('AppStatistics', appStatisticsSchema);

