const express = require('express');
const router = express.Router();
const {
  getOverview,
  getStatsByDateRange,
  getTodayStats,
  updateDailyStats
} = require('../controllers/statisticsController');
const { protect, authorize } = require('../middleware/auth');

// All statistics routes are protected (Admin only)
router.use(protect);
router.use(authorize('admin', 'super_admin'));

router.route('/overview').get(getOverview);
router.route('/range').get(getStatsByDateRange);
router.route('/today').get(getTodayStats);
router.route('/update').post(updateDailyStats);

module.exports = router;

