const API_BASE_URL = 'http://localhost:5000/api';


const logoutBtn = document.getElementById('logout-btn');
const usernameDisplay = document.getElementById('username-display');
const emailDisplay = document.getElementById('email-display');
const activeProjectsCount = document.getElementById('active-projects-count');
const pendingTasksCount = document.getElementById('pending-tasks-count');
const completedTasksCount = document.getElementById('completed-tasks-count');
const teamMembersCount = document.getElementById('team-members-count');
const recentProjectsList = document.getElementById('recent-projects');
const upcomingTasksList = document.getElementById('upcoming-tasks');
const teamActivityFeed = document.getElementById('team-activity');


const newProjectBtn = document.getElementById('new-project-btn');
const newProjectModal = document.getElementById('new-project-modal');
const closeModalBtns = document.querySelectorAll('.close-modal');
const projectForm = document.getElementById('project-form');

let currentUser = {
    id: 1,
    username: "John Doe",
    email: "john@example.com",
    avatar: "https://ui-avatars.com/api/?name=John+Doe&background=6e48aa&color=fff"
};

let projects = [
    {
        id: 1,
        title: "Website Redesign",
        description: "Complete redesign of company website",
        progress: 65,
        status: "active",
        members: [
            { id: 1, name: "John Doe", avatar: "https://randomuser.me/api/portraits/men/1.jpg" },
            { id: 2, name: "Jane Smith", avatar: "https://randomuser.me/api/portraits/women/1.jpg" }
        ],
        tasks: [
            { id: 1, title: "Design Homepage", status: "completed" },
            { id: 2, title: "Develop Contact Form", status: "in-progress" }
        ]
    },
    {
        id: 2,
        title: "Mobile App Development",
        description: "Build new mobile application for iOS and Android",
        progress: 30,
        status: "active",
        members: [
            { id: 1, name: "John Doe", avatar: "https://randomuser.me/api/portraits/men/1.jpg" },
            { id: 3, name: "Mike Johnson", avatar: "https://randomuser.me/api/portraits/men/2.jpg" }
        ],
        tasks: [
            { id: 3, title: "Create Wireframes", status: "todo" },
            { id: 4, title: "Set Up Backend", status: "todo" }
        ]
    }
];

let tasks = [
    {
        id: 1,
        title: "Design Homepage",
        description: "Create new design for the homepage",
        project: "Website Redesign",
        status: "completed",
        dueDate: "2023-06-15",
        assignedTo: { id: 1, name: "John Doe" }
    },
    {
        id: 2,
        title: "Develop Contact Form",
        description: "Implement contact form with validation",
        project: "Website Redesign",
        status: "in-progress",
        dueDate: "2023-06-20",
        assignedTo: { id: 2, name: "Jane Smith" }
    },
    {
        id: 3,
        title: "Create Wireframes",
        description: "Design wireframes for all app screens",
        project: "Mobile App Development",
        status: "todo",
        dueDate: "2023-06-25",
        assignedTo: { id: 1, name: "John Doe" }
    }
];

let teamMembers = [
    { id: 1, name: "John Doe", role: "Admin", avatar: "https://randomuser.me/api/portraits/men/1.jpg", projects: 5, tasks: 12 },
    { id: 2, name: "Jane Smith", role: "Developer", avatar: "https://randomuser.me/api/portraits/women/1.jpg", projects: 3, tasks: 8 },
    { id: 3, name: "Mike Johnson", role: "Designer", avatar: "https://randomuser.me/api/portraits/men/2.jpg", projects: 2, tasks: 5 }
];

let activities = [
    {
        id: 1,
        user: { id: 2, name: "Jane Smith", avatar: "https://randomuser.me/api/portraits/women/1.jpg" },
        action: "completed the task",
        task: "Design Homepage",
        project: "Website Redesign",
        time: "2 hours ago"
    },
    {
        id: 2,
        user: { id: 3, name: "Mike Johnson", avatar: "https://randomuser.me/api/portraits/men/2.jpg" },
        action: "commented on",
        task: "Create Wireframes",
        project: "Mobile App Development",
        time: "5 hours ago"
    },
    {
        id: 3,
        user: { id: 1, name: "John Doe", avatar: "https://randomuser.me/api/portraits/men/1.jpg" },
        action: "assigned a new task",
        task: "Develop Contact Form",
        project: "Website Redesign",
        time: "1 day ago"
    }
];

async function initDashboard() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            window.location.href = '../login.html';
            return;
        }
        
        currentUser = user;
        usernameDisplay.textContent = currentUser.username;
        emailDisplay.textContent = currentUser.email;
        
        await fetchDashboardData();
    } catch (err) {
        console.error('Error initializing dashboard:', err);
        alert('Error loading dashboard data. Please try again.');
    }
}

async function fetchDashboardData() {
    try {
        const token = localStorage.getItem('token');
        
        // Fetch projects, tasks, and team members in parallel
      /*  const [projectsRes, tasksRes, teamRes, activityRes] = await Promise.all([
            fetch(`${API_BASE_URL}/projects`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }),
            fetch(`${API_BASE_URL}/tasks`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }),
            fetch(`${API_BASE_URL}/team`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }),
            fetch(`${API_BASE_URL}/activities`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
        ]);*/
        
        if (!projectsRes.ok) throw new Error('Failed to fetch projects');
        if (!tasksRes.ok) throw new Error('Failed to fetch tasks');
        if (!teamRes.ok) throw new Error('Failed to fetch team');
        // Activity is optional, don't throw error if it fails
        
        const projectsData = await projectsRes.json();
        const tasksData = await tasksRes.json();
        const teamData = await teamRes.json();
        const activityData = activityRes.ok ? await activityRes.json() : { data: { activities: [] } };
        
        // Update global variables
        projects = projectsData.data.projects;
        tasks = tasksData.data.tasks;
        teamMembers = teamData.data.teamMembers;
        activities = activityData.data.activities;
        
        // Update UI
        updateStats();
        loadRecentProjects();
        loadUpcomingTasks();
        loadTeamActivity();
    } catch (err) {
        console.error('Error fetching dashboard data:', err);
        throw err;
    }
}

async function createProject(projectData) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: document.getElementById('project-name').value,
                description: document.getElementById('project-description').value
              })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create project');
        }
        
        return await response.json();
    } catch (err) {
        console.error('Error creating project:', err);
        throw err;
    }
}

async function createTask() {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-description').value,
        project: document.getElementById('task-project').value,
      })
    });

// Update task status
async function updateTaskStatus(taskId, status) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update task');
        }
        
        return await response.json();
    } catch (err) {
        console.error('Error updating task:', err);
        throw err;
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../login.html';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', initDashboard);

logoutBtn.addEventListener('click', logout);

// Update task status when checkbox is clicked
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('task-checkbox') || e.target.closest('.task-checkbox')) {
        const checkbox = e.target.classList.contains('task-checkbox') ? e.target : e.target.closest('.task-checkbox');
        const isChecked = checkbox.classList.contains('checked');
        const taskItem = checkbox.closest('.task-item');
        const taskId = taskItem.dataset.taskId;
        
        try {
            await updateTaskStatus(taskId, isChecked ? 'completed' : 'todo');
            checkbox.classList.toggle('checked');
            updateStats();
        } catch (err) {
            alert(err.message);
            checkbox.classList.toggle('checked'); // Revert visual change
        }
    }
});

// New project form submission
if (projectForm) {
    projectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const projectName = document.getElementById('project-name').value;
        const projectDescription = document.getElementById('project-description').value;
        
        try {
            const response = await createProject({
                title: projectName,
                description: projectDescription
            });
            
            // Add new project to local array and update UI
            projects.push(response.data.project);
            updateStats();
            loadRecentProjects();
            
            // Reset form and close modal
            projectForm.reset();
            closeModal(newProjectModal);
        } catch (err) {
            alert(err.message);
        }
    });
}}