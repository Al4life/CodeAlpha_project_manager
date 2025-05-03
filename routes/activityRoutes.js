const express = require('express');
const authController = require('../controllers/authController');
const activityController = require('../controllers/activityController');

const router = express.Router();

router.use(authController.protect);

router.route('/')
  .get(activityController.getAllActivities);

module.exports = router;