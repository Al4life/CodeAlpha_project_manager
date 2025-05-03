document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    if (localStorage.getItem('token') && window.location.pathname.includes('login.html')) {
        window.location.href = 'dashboard/index.html';
        return;
    }

    // Form validation for login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.querySelector('input[name="remember"]').checked;
            
            // Simple validation
            if (!email || !password) {
                showAlert('Please fill in all fields', 'error');
                return;
            }
            
            try {
                // Show loading state
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
                
                // Send login request to backend
                const response = await fetch('http://localhost:5000/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Login failed');
                }
                
                // Store token and user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                
                // Set longer expiration if "Remember me" is checked
                if (rememberMe) {
                    const now = new Date();
                    const expiration = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
                    localStorage.setItem('tokenExpiration', expiration);
                }
                
                // Redirect to dashboard
                window.location.href = 'dashboard/index.html';
                
            } catch (err) {
                showAlert(err.message || 'Login failed. Please try again.', 'error');
                console.error('Login error:', err);
            } finally {
                // Reset button state
                if (loginForm) {
                    const submitBtn = loginForm.querySelector('button[type="submit"]');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            }
        });
    }
    
    // Form validation for registration
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Validation
            if (!username || !email || !password || !confirmPassword) {
                showAlert('Please fill in all fields', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                showAlert('Passwords do not match', 'error');
                return;
            }
            
            if (password.length < 6) {
                showAlert('Password must be at least 6 characters', 'error');
                return;
            }
            
            if (!validateEmail(email)) {
                showAlert('Please enter a valid email address', 'error');
                return;
            }
            
            try {
                // Show loading state
                const submitBtn = registerForm.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
                
                // Send registration request to backend
                const response = await fetch('http://localhost:5000/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, email, password })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Registration failed');
                }
                
                // Show success message
                showAlert('Registration successful! Redirecting to login...', 'success');
                
                // Redirect to login page after short delay
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
                
            } catch (err) {
                showAlert(err.message || 'Registration failed. Please try again.', 'error');
                console.error('Registration error:', err);
            } finally {
                // Reset button state
                if (registerForm) {
                    const submitBtn = registerForm.querySelector('button[type="submit"]');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            }
        });
    }
    
    // Input focus effects
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.querySelector('.input-highlight').style.width = '100%';
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.querySelector('.input-highlight').style.width = '0';
            }
        });
    });
    
    // Check token expiration on page load
    checkTokenExpiration();
});

// Helper function to show alert messages
function showAlert(message, type) {
    // Remove any existing alerts
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Add to DOM
    const authContainer = document.querySelector('.auth-container') || document.body;
    authContainer.insertBefore(alertDiv, authContainer.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Helper function to validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Check if token is expired
function checkTokenExpiration() {
    const expiration = localStorage.getItem('tokenExpiration');
    if (expiration) {
        const now = new Date();
        if (now > new Date(expiration)) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('tokenExpiration');
        }
    }
}

// Add CSS for alerts if not already present
if (!document.querySelector('style[data-alert-styles]')) {
    const style = document.createElement('style');
    style.setAttribute('data-alert-styles', 'true');
    style.textContent = `
        .alert {
            padding: 1rem;
            margin-bottom: 1.5rem;
            border-radius: 8px;
            font-size: 0.9rem;
            animation: fadeIn 0.3s ease;
        }
        .alert-error {
            background-color: rgba(244, 67, 54, 0.2);
            border-left: 4px solid #f44336;
            color: #ffebee;
        }
        .alert-success {
            background-color: rgba(76, 175, 80, 0.2);
            border-left: 4px solid #4caf50;
            color: #e8f5e9;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
}