const express = require('express');
const authController = require('../controllers/authController');
const teamController = require('../controllers/teamController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

router.route('/')
  .get(teamController.getAllTeamMembers);

router.route('/invite')
  .post(teamController.inviteTeamMember);

module.exports = router;