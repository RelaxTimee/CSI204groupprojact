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
    
    // ===== Input Focus Effects =====
    const allInputs = document.querySelectorAll('input');
    
    allInputs.forEach(input => {
        // Add active class on focus
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('input-active');
        });
        
        // Remove active class on blur
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('input-active');
        });
    });
    
    // ===== Toggle Password Visibility =====
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Toggle eye icon
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
    
    // Show error message with animation
    function showError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
        element.style.animation = 'none';
        setTimeout(() => {
            element.style.animation = 'shake 0.5s';
        }, 10);
    }
    
    // Email validation helper
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
    
    // ===== Submit to Backend =====
    async function submitToBackend(userData) {
        console.log('ข้อมูลที่จะส่งไป backend:', userData);
        
        try {
            // Simulated API call
            // In a real application, replace this with actual API call:
            /*
            const response = await fetch('https://your-api-endpoint.com/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            return data;
            */
            
            // Simulate network delay
            return new Promise(resolve => {
                setTimeout(() => {
                    // Check for demo credentials (for demo purposes only)
                    if (userData.username === 'demo@example.com' && userData.password === 'password123') {
                        resolve({ 
                            success: true, 
                            message: 'เข้าสู่ระบบสำเร็จ',
                            user: {
                                name: 'คุณ Demo',
                                role: 'premium',
                                lastLogin: new Date().toISOString()
                            }
                        });
                    } else {
                        resolve({ 
                            success: false, 
                            message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' 
                        });
                    }
                }, 1500);
            });
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ:', error);
            return { 
                success: false, 
                message: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์' 
            };
        }
    }
    
    // ===== Form Submission Handler =====
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // Validate form inputs
        if (!validateForm()) {
            return;
        }
        
        // Show loading indicator
        loadingIndicator.style.display = 'block';
        loginButton.disabled = true;
        
        // Add loading state to button
        loginButton.innerHTML = '<div class="loading-spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>';
        
        // Collect form data
        const userData = {
            username: usernameInput.value.trim(),
            password: passwordInput.value,
            rememberMe: document.getElementById('rememberMe').checked
        };
        
        // Send data to backend
        const result = await submitToBackend(userData);
        
        // Hide loading indicator
        loadingIndicator.style.display = 'none';
        
        // Process login result
        if (result.success) {
            // Show success message with animation
            successMessage.style.display = 'block';
            loginForm.style.display = 'none';
            
            // Store user data (in a real app, you'd likely use JWT or cookies)
            if (userData.rememberMe) {
                localStorage.setItem('userLoggedIn', 'true');
                localStorage.setItem('username', userData.username);
                // Don't store password in localStorage for security reasons
            } else {
                sessionStorage.setItem('userLoggedIn', 'true');
                sessionStorage.setItem('username', userData.username);
            }
            
            // Redirect after login (in a real application)
            setTimeout(() => {
                // window.location.href = 'dashboard.html';
                alert('เข้าสู่ระบบสำเร็จ! ในการทำงานจริง จะเปลี่ยนไปยังหน้าหลัก');
            }, 2000);
        } else {
            // Show error message
            showError(passwordError, result.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
            
            // Reset button
            loginButton.disabled = false;
            loginButton.innerHTML = '<span>เข้าสู่ระบบ</span><i class="fas fa-arrow-right"></i>';
            
            // Shake the form on error
            loginForm.style.animation = 'none';
            setTimeout(() => {
                loginForm.style.animation = 'shake 0.5s';
            }, 10);
        }
    });
    
    // ===== Demo Credentials Helper =====
    // Add a small helper to autofill demo credentials
    document.addEventListener('keydown', function(event) {
        // Press Ctrl+D (or Cmd+D) to fill demo credentials
        if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
            event.preventDefault();
            usernameInput.value = 'demo@example.com';
            passwordInput.value = 'password123';
            
            // Flash the inputs to indicate they've been filled
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
            // Here you would normally implement OAuth login
            alert('การเข้าสู่ระบบด้วยโซเชียลมีเดียจะถูกใช้งานในการพัฒนาจริง');
        });
    });
    
    // ===== Initial Focus =====
    // Focus on username field when page loads
    setTimeout(() => {
        usernameInput.focus();
    }, 500);
});