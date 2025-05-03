const express = require('express');
const authController = require('../controllers/authController');
const taskController = require('../controllers/taskController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

router.route('/')
  .get(taskController.getAllTasks)
  .post(taskController.createTask);



module.exports = router;