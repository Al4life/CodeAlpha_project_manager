const Project = require('../models/Project');
const Task = require('../models/Task');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');


exports.getAllProjects = catchAsync(async (req, res, next) => {
  const projects = await Project.find({
      members: req.user.id
  }).populate('members', 'username avatar')
    .populate('createdBy', 'username avatar');

  // Add task counts to each project
  const projectsWithCounts = await Promise.all(projects.map(async project => {
      const tasks = await Task.find({ project: project._id });
      return {
          ...project.toObject(),
          totalTasks: tasks.length,
          completedTasks: tasks.filter(t => t.status === 'completed').length
      };
  }));

  res.status(200).json({
      status: 'success',
      results: projectsWithCounts.length,
      data: {
          projects: projectsWithCounts
      }
  });
});

// Create a new project
exports.createProject = async (req, res) => {
  try {
    const { title, description } = req.body;
    
    const project = await Project.create({
      title,
      description,
      createdBy: req.user.id,
      members: [req.user.id]
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        project
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get all projects for a user
exports.getUserProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { createdBy: req.user.id },
        { members: req.user.id }
      ]
    }).populate('createdBy members', 'username avatar');
    
    res.status(200).json({
      status: 'success',
      results: projects.length,
      data: {
        projects
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Get a single project
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy members', 'username avatar')
      .populate('tasks.assignedTo', 'username avatar')
      .populate('tasks.comments.user', 'username avatar');
    
    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Project not found'
      });
    }
    
    // Check if user has access to the project
    if (!project.members.some(member => member._id.equals(req.user.id))) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to view this project'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        project
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Add a task to a project
exports.addTask = async (req, res) => {
  try {
    const { title, description, assignedTo } = req.body;
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Project not found'
      });
    }
    
    // Check if user has permission to add tasks
    if (!project.members.some(member => member.equals(req.user.id))) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to add tasks to this project'
      });
    }
    
    project.tasks.push({
      title,
      description,
      assignedTo: assignedTo || null
    });
    
    await project.save();
    
    res.status(201).json({
      status: 'success',
      data: {
        task: project.tasks[project.tasks.length - 1]
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Add a comment to a task
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const { projectId, taskId } = req.params;
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Project not found'
      });
    }
    
    // Check if user has access to the project
    if (!project.members.some(member => member.equals(req.user.id))) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to comment on this task'
      });
    }
    
    const task = project.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({
        status: 'fail',
        message: 'Task not found'
      });
    }
    
    task.comments.push({
      user: req.user.id,
      text
    });
    
    await project.save();
    
    res.status(201).json({
      status: 'success',
      data: {
        comment: task.comments[task.comments.length - 1]
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};