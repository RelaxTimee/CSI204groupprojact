// ตรวจสอบสถานะการล็อกอินและ redirect ถ้ายังไม่ล็อกอิน
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logout-btn');
    const usernameDisplay = document.getElementById('username-display');
    
    // ตรวจสอบ token และ redirect ถ้าไม่มี
    checkAuth();
    
    // แสดงชื่อผู้ใช้
    const username = localStorage.getItem('username') || sessionStorage.getItem('username');
    if (username && usernameDisplay) {
        usernameDisplay.textContent = username;
    }
    
    // จัดการการล็อกเอาท์
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
            const username = localStorage.getItem('username') || sessionStorage.getItem('username');
            const roleId = localStorage.getItem('role_id') || sessionStorage.getItem('role_id');

            // บันทึก log การออกจากระบบ - it's best
            if (username && roleId) {
                try {
                    // Try the direct logging endpoint
                    await fetch('/direct-log', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            role_id: roleId,
                            username: username,
                            action: 'ออกจากระบบ'
                        })
                    });
                    console.log('Logout action logged successfully via direct endpoint');
                } catch (error) {
                    console.error('Error logging logout action via direct endpoint:', error);

                    // Fallback to the utility function if available
                    if (window.logUserAction) {
                        window.logUserAction('ออกจากระบบ', username, roleId);
                    }
                }
            }

            // ลบข้อมูลการเข้าสู่ระบบ
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('username');
            localStorage.removeItem('role_id');
            sessionStorage.removeItem('jwtToken');
            sessionStorage.removeItem('username');
            sessionStorage.removeItem('role_id');
            window.location.href = 'login.html';
        });
    }
});

// ฟังก์ชันตรวจสอบการล็อกอิน
// แก้ไขในไฟล์ auth.js ในส่วนของ checkAuth()
async function checkAuth() {
    const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
    const currentPage = window.location.pathname.split('/').pop();
    
    // ถ้าไม่มี token และไม่อยู่หน้า login ให้ redirect ไปหน้า login
    if (!token && currentPage !== 'login.html') {
      window.location.href = 'login.html';
      return;
    }
    
    // ถ้ามี token และอยู่หน้า login ให้ redirect ไป dashboard ตาม role
    if (token && currentPage === 'login.html') {
      const roleId = localStorage.getItem('role_id') || sessionStorage.getItem('role_id');
      const username = localStorage.getItem('username') || sessionStorage.getItem('username');
      
      // บันทึก log การเข้าสู่ระบบ
      try {
        await fetch('/api/logs', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            role_id: roleId,
            username: username,
            action: 'เข้าสู่ระบบ'
          })
        });
      } catch (error) {
        console.error('Error logging login action:', error);
      }
      
      redirectBasedOnRole(roleId);
      return;
    }
    // ตรวจสอบ token กับเซิร์ฟเวอร์
    if (token) {
        try {
            const response = await fetch('/users/verify', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Invalid token');
            }
            
            const result = await response.json();
            console.log('User verified:', result);
            
        } catch (error) {
            console.error('Authentication error:', error);
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('username');
            localStorage.removeItem('role_id');
            sessionStorage.removeItem('jwtToken');
            sessionStorage.removeItem('username');
            sessionStorage.removeItem('role_id');
            window.location.href = 'login.html';
        }
    }
}

// ฟังก์ชัน redirect ตาม role
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

// Best's implementation: Function to check if user has admin or manager role
function hasAdminAccess() {
    const roleId = localStorage.getItem('role_id') || sessionStorage.getItem('role_id');
    return roleId === '1' || roleId === '2'; // Admin or Manager
}


// ฟังก์ชันสำหรับส่ง request พร้อม token
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
    
    if (!token) {
        throw new Error('No authentication token found');
    }
    
    // ตรวจสอบว่า URL เริ่มด้วย http หรือ https หรือไม่
    // ถ้าไม่ใช่และไม่ได้เริ่มด้วย / ให้เพิ่ม / นำหน้า
    if (!url.startsWith('http') && !url.startsWith('https') && !url.startsWith('/')) {
        url = '/' + url;
    }
    
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        ...options
    };
    
    // รวม headers ที่มีอยู่เดิมกับ headers ที่ต้องการเพิ่ม
    if (options.headers) {
        defaultOptions.headers = {
            ...defaultOptions.headers,
            ...options.headers
        };
    }
    
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
        let errorMessage;
        try {
            const error = await response.json();
            errorMessage = error.message || 'Request failed';
        } catch (e) {
            errorMessage = `Request failed with status ${response.status}`;
        }
        throw new Error(errorMessage);
    }
    
    return response.json();
}