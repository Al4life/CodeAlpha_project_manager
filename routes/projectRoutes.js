const express = require('express');
const authController = require('../controllers/authController');
const projectController = require('../controllers/projectController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

router.route('/')
.get(projectController.getAllProjects)
  .post(projectController.createProject)
  .get(projectController.getUserProjects);



module.exports = router;