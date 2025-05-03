const User = require('../models/User');
const Project = require('../models/Project');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllTeamMembers = catchAsync(async (req, res, next) => {
  // Get all users who share at least one project with the current user
  const projects = await Project.find({
    members: req.user.id
  }).select('members');

  const memberIds = [...new Set(
    projects.flatMap(project => project.members.map(member => member.toString()))
  )].filter(id => id !== req.user.id.toString());

  const teamMembers = await User.find({
    _id: { $in: memberIds }
  }).select('username email avatar role');

  const membersWithCounts = await Promise.all(teamMembers.map(async member => {
    const projectsCount = await Project.countDocuments({ members: member._id });
    const tasksCount = await Task.countDocuments({ assignedTo: member._id });
    
    return {
        ...member.toObject(),
        projectsCount,
        tasksCount
    };
}));

  res.status(200).json({
    status: 'success',
    results: teamMembers.length,
    data: {
      teamMembers
    }
  });
});

exports.inviteTeamMember = catchAsync(async (req, res, next) => {
  const { email, projectId } = req.body;

  // Check if project exists and user is a member
  const project = await Project.findOne({
    _id: projectId,
    members: req.user.id});
      if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }

  if (!project.members.includes(req.user.id)) {
    return next(new AppError('You do not have permission to invite members to this project', 403));
  }

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('No user found with that email', 404));
  }

  // Check if user is already a member
  if (project.members.includes(user._id)) {
    return next(new AppError('User is already a member of this project', 400));
  }

  // Add user to project
  project.members.push(user._id);
  await project.save();

  // In a real app, you would send an email notification here

  res.status(200).json({
    status: 'success',
    message: 'User invited to project successfully',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    }
  });
});