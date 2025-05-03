const Activity = require('../models/Activity');
const catchAsync = require('../utils/catchAsync');

exports.getAllActivities = catchAsync(async (req, res) => {
  const activities = await Activity.find()
    .populate('user', 'username avatar')
    .sort('-createdAt')
    .limit(20);

  res.status(200).json({
    status: 'success',
    results: activities.length,
    data: {
      activities
    }
  });
});