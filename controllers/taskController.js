const Task = require('../models/Task');
const Project = require('../models/Project');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllTasks = catchAsync(async (req, res, next) => {
  // Get all projects the user is a member of
  const projects = await Project.find({ members: req.user.id });
  const projectIds = projects.map(p => p._id);

  const tasks = await Task.find({
      project: { $in: projectIds }
  }).populate('project', 'title')
    .populate('assignedTo', 'username avatar')
    .populate('createdBy', 'username avatar');

  res.status(200).json({
      status: 'success',
      results: tasks.length,
      data: {
          tasks
      }
  });
});

exports.getTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id)
    .populate('project assignedTo createdBy', 'title name avatar');

  if (!task) {
    return next(new AppError('No task found with that ID', 404));
  }

  // Check if user has access to the task
  if (!task.assignedTo.equals(req.user.id) && !task.createdBy.equals(req.user.id)) {
    return next(new AppError('You do not have permission to view this task', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      task
    }
  });
});

exports.createTask = catchAsync(async (req, res, next) => {
  const { title, description, project, dueDate } = req.body;

  const projectDoc = await Project.findOne({
    _id: project,
    members: req.user.id
});

  // Check if project exists and user is a member
  if (!projectDoc) {
    return next(new AppError('No project found with that ID', 404));
  }

  if (!projectDoc.members.includes(req.user.id)) {
    return next(new AppError('You do not have permission to add tasks to this project', 403));
  }

  const newTask = await Task.create({
    title,
    description,
    project,
    dueDate,
    createdBy: req.user.id,
    assignedTo: req.body.assignedTo || req.user.id
  });

  res.status(201).json({
    status: 'success',
    data: {
      task: newTask
    }
  });
});

exports.updateTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new AppError('No task found with that ID', 404));
  }

  // Check if user has permission to update the task
  if (!task.assignedTo.equals(req.user.id) && !task.createdBy.equals(req.user.id)) {
    return next(new AppError('You do not have permission to update this task', 403));
  }

  const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      task: updatedTask
    }
  });
});

exports.deleteTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new AppError('No task found with that ID', 404));
  }

  if (!task.createdBy.equals(req.user.id)) {
    return next(new AppError('You do not have permission to delete this task', 403));
  }

  await Task.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});