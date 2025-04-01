document.addEventListener('DOMContentLoaded', function() {
    // ===== DOM Elements =====
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const usernameError = document.getElementById('usernameError');
    const passwordError = document.getElementById('passwordError');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const successMessage = document.getElementById('successMessage');
    const loginButton = document.getElementById('loginButton');
    const togglePassword = document.getElementById('togglePassword');
    
    // ===== Toggle Password Visibility =====
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
    
    // ===== Form Validation =====
    function validateForm() {
        let isValid = true;
        
        // Clear previous errors
        usernameError.style.display = 'none';
        passwordError.style.display = 'none';
        
        // Username validation
        if (usernameInput.value.trim() === '') {
            showError(usernameError, 'กรุณากรอกชื่อผู้ใช้หรืออีเมล');
            isValid = false;
        } else if (!isValidEmail(usernameInput.value) && usernameInput.value.includes('@')) {
            showError(usernameError, 'รูปแบบอีเมลไม่ถูกต้อง');
            isValid = false;
        }
        
        // Password validation
        if (passwordInput.value === '') {
            showError(passwordError, 'กรุณากรอกรหัสผ่าน');
            isValid = false;
        } else if (passwordInput.value.length < 6) {
            showError(passwordError, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
            isValid = false;
        }
        
        return isValid;
    }
    
    function showError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
        element.style.animation = 'none';
        setTimeout(() => {
            element.style.animation = 'shake 0.5s';
        }, 10);
    }
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Add animation for shake effect
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);
    
    // ===== Form Submission Handler =====
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        // Show loading indicator
        loadingIndicator.style.display = 'block';
        loginButton.disabled = true;
        loginButton.innerHTML = '<div class="loading-spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>';
        
        // Collect form data
        const userData = {
            username: usernameInput.value.trim(),
            password: passwordInput.value,
            rememberMe: document.getElementById('rememberMe').checked
        };
        
        try {
            // Send login request to backend
            const response = await fetch('/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: userData.username,
                    password: userData.password
                })
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'การเข้าสู่ระบบล้มเหลว');
            }
            
            // Store token based on remember me choice
            if (userData.rememberMe) {
                localStorage.setItem('jwtToken', result.token);
                localStorage.setItem('username', result.username);
                localStorage.setItem('role_id', result.role_id);
            } else {
                sessionStorage.setItem('jwtToken', result.token);
                sessionStorage.setItem('username', result.username);
                sessionStorage.setItem('role_id', result.role_id);
            }
            
            // Show success message
            loadingIndicator.style.display = 'none';
            successMessage.style.display = 'block';
            loginForm.style.display = 'none';
            
            // Redirect based on role
            setTimeout(() => {
                redirectBasedOnRole(result.role_id);
            }, 2000);
            
        } catch (error) {
            console.error('Login error:', error);
            loadingIndicator.style.display = 'none';
            loginButton.disabled = false;
            loginButton.innerHTML = '<span>เข้าสู่ระบบ</span><i class="fas fa-arrow-right"></i>';
            showError(passwordError, error.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
            
            // Shake the form on error
            loginForm.style.animation = 'none';
            setTimeout(() => {
                loginForm.style.animation = 'shake 0.5s';
            }, 10);
        }
    });
    
    // Function to redirect based on user role
    function redirectBasedOnRole(roleId) {
        let redirectPage = '';
        
        switch(Number(roleId)) {
            case 1: // ADMIN
                redirectPage = 'admin-dashboard.html';
                break;
            case 2: // MANAGER
                redirectPage = 'manager-dashboard.html';
                break;
            case 3: // PROCUREMENT
                redirectPage = 'procurement-dashboard.html';
                break;
            case 4: // FINANCE
                redirectPage = 'finance-dashboard.html';
                break;
            case 5: // IT
                redirectPage = 'it-dashboard.html';
                break;
            default:
                redirectPage = 'dashboard.html';
        }
        
        window.location.href = redirectPage;
    }
    
    // ===== Demo Credentials Helper =====
    document.addEventListener('keydown', function(event) {
        if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
            event.preventDefault();
            usernameInput.value = 'admin@example.com';
            passwordInput.value = 'admin123';
            
            usernameInput.style.backgroundColor = '#fff8e6';
            passwordInput.style.backgroundColor = '#fff8e6';
            
            setTimeout(() => {
                usernameInput.style.backgroundColor = '';
                passwordInput.style.backgroundColor = '';
            }, 500);
        }
    });
    
    // ===== Social Login Buttons =====
    const socialButtons = document.querySelectorAll('.btn-social');
    socialButtons.forEach(button => {
        button.addEventListener('click', function() {
            alert('การเข้าสู่ระบบด้วยโซเชียลมีเดียจะถูกใช้งานในการพัฒนาจริง');
        });
    });
    
    // Focus on username field when page loads
    setTimeout(() => {
        usernameInput.focus();
    }, 500);
});