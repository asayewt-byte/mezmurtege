const AppStatistics = require('../models/AppStatistics');
const Mezmur = require('../models/Mezmur');
const Wallpaper = require('../models/Wallpaper');
const Ringtone = require('../models/Ringtone');

// @desc    Get overall statistics
// @route   GET /api/statistics/overview
// @access  Private/Admin
exports.getOverview = async (req, res, next) => {
  try {
    // Get totals
    const totalMezmurs = await Mezmur.countDocuments({ isActive: true });
    const totalWallpapers = await Wallpaper.countDocuments({ isActive: true });
    const totalRingtones = await Ringtone.countDocuments({ isActive: true });

    // Get aggregated stats
    const mezmurStats = await Mezmur.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalPlays: { $sum: '$plays' },
          totalDownloads: { $sum: '$downloads' },
          totalFavorites: { $sum: '$favorites' },
          totalShares: { $sum: '$shares' }
        }
      }
    ]);

    const wallpaperStats = await Wallpaper.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          totalDownloads: { $sum: '$downloads' },
          totalSets: { $sum: '$sets' },
          totalShares: { $sum: '$shares' }
        }
      }
    ]);

    const ringtoneStats = await Ringtone.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalPlays: { $sum: '$plays' },
          totalDownloads: { $sum: '$downloads' },
          totalSets: { $sum: '$sets' },
          totalShares: { $sum: '$shares' }
        }
      }
    ]);

    // Get top items
    const topMezmurs = await Mezmur.find({ isActive: true })
      .sort({ plays: -1 })
      .limit(10)
      .select('title artist plays downloads');

    const topWallpapers = await Wallpaper.find({ isActive: true })
      .sort({ downloads: -1 })
      .limit(10)
      .select('title category downloads views');

    const topRingtones = await Ringtone.find({ isActive: true })
      .sort({ downloads: -1 })
      .limit(10)
      .select('title artist downloads plays');

    res.status(200).json({
      success: true,
      data: {
        counts: {
          mezmurs: totalMezmurs,
          wallpapers: totalWallpapers,
          ringtones: totalRingtones
        },
        mezmurs: mezmurStats[0] || {},
        wallpapers: wallpaperStats[0] || {},
        ringtones: ringtoneStats[0] || {},
        topMezmurs,
        topWallpapers,
        topRingtones
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get statistics by date range
// @route   GET /api/statistics/range
// @access  Private/Admin
exports.getStatsByDateRange = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const statistics = await AppStatistics.find(query)
      .sort({ date: -1 })
      .populate('topMezmurs.mezmurId', 'title artist')
      .populate('topWallpapers.wallpaperId', 'title category')
      .populate('topRingtones.ringtoneId', 'title artist');

    res.status(200).json({
      success: true,
      count: statistics.length,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get today's statistics
// @route   GET /api/statistics/today
// @access  Private/Admin
exports.getTodayStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayStats = await AppStatistics.findOne({ date: today });

    if (!todayStats) {
      // Create today's stats if they don't exist
      todayStats = await AppStatistics.create({ date: today });
    }

    res.status(200).json({
      success: true,
      data: todayStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update daily statistics
// @route   POST /api/statistics/update
// @access  Private/Admin
exports.updateDailyStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get aggregated data for today
    const mezmurStats = await Mezmur.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalPlays: { $sum: '$plays' },
          totalDownloads: { $sum: '$downloads' },
          totalFavorites: { $sum: '$favorites' },
          totalShares: { $sum: '$shares' }
        }
      }
    ]);

    const wallpaperStats = await Wallpaper.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          totalDownloads: { $sum: '$downloads' },
          totalSets: { $sum: '$sets' },
          totalShares: { $sum: '$shares' }
        }
      }
    ]);

    const ringtoneStats = await Ringtone.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalPlays: { $sum: '$plays' },
          totalDownloads: { $sum: '$downloads' },
          totalSets: { $sum: '$sets' },
          totalShares: { $sum: '$shares' }
        }
      }
    ]);

    // Get top items
    const topMezmurs = await Mezmur.find({ isActive: true })
      .sort({ plays: -1 })
      .limit(5)
      .select('_id plays');

    const topWallpapers = await Wallpaper.find({ isActive: true })
      .sort({ downloads: -1 })
      .limit(5)
      .select('_id downloads');

    const topRingtones = await Ringtone.find({ isActive: true })
      .sort({ downloads: -1 })
      .limit(5)
      .select('_id downloads');

    const statsUpdate = {
      date: today,
      mezmurs: mezmurStats[0] || {},
      wallpapers: wallpaperStats[0] || {},
      ringtones: ringtoneStats[0] || {},
      topMezmurs: topMezmurs.map(m => ({ mezmurId: m._id, plays: m.plays })),
      topWallpapers: topWallpapers.map(w => ({ wallpaperId: w._id, downloads: w.downloads })),
      topRingtones: topRingtones.map(r => ({ ringtoneId: r._id, downloads: r.downloads }))
    };

    const statistics = await AppStatistics.findOneAndUpdate(
      { date: today },
      statsUpdate,
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
};

