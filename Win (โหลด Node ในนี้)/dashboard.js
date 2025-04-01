// ===== ระบบแดชบอร์ดหลัก =====
document.addEventListener('DOMContentLoaded', function() {
    // ตรวจสอบและแสดงข้อมูลผู้ใช้งาน
    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay) {
        const username = localStorage.getItem('username') || sessionStorage.getItem('username');
        usernameDisplay.textContent = username || 'ผู้ใช้งาน';
    }

    // ฟังก์ชันสำหรับดึงข้อมูลการแจ้งเตือน
    async function fetchNotifications() {
        try {
            const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
            if (!token) return [];

            // ในการใช้งานจริงจะส่ง API ไปที่เซิร์ฟเวอร์
            const response = await fetch('http://localhost:3000/notifications', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('ไม่สามารถดึงข้อมูลการแจ้งเตือนได้');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching notifications:', error);
            // ข้อมูลตัวอย่าง
            return [
                {
                    id: 1,
                    type: 'requisition',
                    title: 'มีใบขอซื้อรออนุมัติ',
                    message: 'มีใบขอซื้อใหม่รออนุมัติ 3 รายการ',
                    created_at: '2024-03-28T08:30:00Z'
                },
                {
                    id: 2,
                    type: 'order',
                    title: 'มีใบสั่งซื้อรอดำเนินการ',
                    message: 'มีใบสั่งซื้อที่รอการจัดส่ง 2 รายการ',
                    created_at: '2024-03-28T09:15:00Z'
                },
                {
                    id: 3,
                    type: 'budget',
                    title: 'งบประมาณคงเหลือ',
                    message: 'งบประมาณประจำเดือนเหลือ 45% กรุณาตรวจสอบ',
                    created_at: '2024-03-27T16:45:00Z'
                }
            ];
        }
    }

    // ฟังก์ชันสำหรับดึงข้อมูลกิจกรรมล่าสุด
    async function fetchRecentActivities() {
        try {
            const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
            if (!token) return [];

            // ในการใช้งานจริงจะส่ง API ไปที่เซิร์ฟเวอร์
            const response = await fetch('http://localhost:3000/activities', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('ไม่สามารถดึงข้อมูลกิจกรรมล่าสุดได้');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching activities:', error);
            // ข้อมูลตัวอย่าง
            return [
                {
                    id: 1,
                    type: 'login',
                    title: 'เข้าสู่ระบบ',
                    user: 'admin@example.com',
                    time: '1 ชั่วโมงที่แล้ว',
                    icon: 'fa-sign-in-alt'
                },
                {
                    id: 2,
                    type: 'requisition',
                    title: 'สร้างใบขอซื้อใหม่',
                    user: 'procurement@example.com',
                    time: '2 ชั่วโมงที่แล้ว',
                    icon: 'fa-file-alt'
                },
                {
                    id: 3,
                    type: 'order',
                    title: 'สร้างใบสั่งซื้อใหม่',
                    user: 'procurement@example.com',
                    time: '3 ชั่วโมงที่แล้ว',
                    icon: 'fa-shopping-cart'
                },
                {
                    id: 4,
                    type: 'approval',
                    title: 'อนุมัติใบขอซื้อ PR-2024-0055',
                    user: 'manager@example.com',
                    time: '4 ชั่วโมงที่แล้ว',
                    icon: 'fa-check-circle'
                },
                {
                    id: 5,
                    type: 'payment',
                    title: 'ทำการชำระเงิน PO-2024-0041',
                    user: 'finance@example.com',
                    time: '5 ชั่วโมงที่แล้ว',
                    icon: 'fa-money-bill-wave'
                }
            ];
        }
    }

    // ฟังก์ชันสำหรับดึงข้อมูลสรุปสำหรับ Admin Dashboard
    async function fetchAdminStats() {
        try {
            const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
            if (!token) return null;

            // ในการใช้งานจริงจะส่ง API ไปที่เซิร์ฟเวอร์
            const response = await fetch('http://localhost:3000/admin/stats', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('ไม่สามารถดึงข้อมูลสถิติได้');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching admin stats:', error);
            // ข้อมูลตัวอย่าง
            return {
                totalUsers: 26,
                totalRequests: 48,
                totalPayments: 35,
                totalIssues: 5
            };
        }
    }

    // แสดงกิจกรรมล่าสุด (สำหรับ Admin Dashboard)
    const activityList = document.getElementById('activity-list');
    if (activityList) {
        fetchRecentActivities().then(activities => {
            activityList.innerHTML = '';
            activities.forEach(activity => {
                const item = document.createElement('div');
                item.className = 'activity-item';
                item.innerHTML = `
                    <div class="activity-icon">
                        <i class="fas ${activity.icon}"></i>
                    </div>
                    <div class="activity-info">
                        <p><strong>${activity.title}</strong></p>
                        <small>โดย ${activity.user} - ${activity.time}</small>
                    </div>
                `;
                activityList.appendChild(item);
            });
        });
    }

    // แสดงสถิติสำหรับ Admin Dashboard
    const totalUsers = document.getElementById('total-users');
    const totalRequests = document.getElementById('total-requests');
    const totalPayments = document.getElementById('total-payments');
    const totalIssues = document.getElementById('total-issues');

    if (totalUsers && totalRequests && totalPayments && totalIssues) {
        fetchAdminStats().then(stats => {
            if (stats) {
                totalUsers.textContent = stats.totalUsers;
                totalRequests.textContent = stats.totalRequests;
                totalPayments.textContent = stats.totalPayments;
                totalIssues.textContent = stats.totalIssues;
            }
        });
    }

    // ฟังก์ชันแสดงการแจ้งเตือน (สามารถใช้ร่วมกับไลบรารี toast หรือทำเอง)
    function showNotification(message, type = 'info') {
        // ในที่นี้ทำแบบง่ายๆ ด้วย alert
        alert(`${type.toUpperCase()}: ${message}`);
        
        // หากมีการใช้ไลบรารี toast สามารถใช้แบบนี้
        // const toast = document.createElement('div');
        // toast.className = `toast toast-${type}`;
        // toast.innerHTML = `
        //     <div class="toast-header">
        //         <i class="fas fa-bell"></i>
        //         <strong>แจ้งเตือน</strong>
        //         <button class="toast-close">&times;</button>
        //     </div>
        //     <div class="toast-body">${message}</div>
        // `;
        // document.body.appendChild(toast);
        // setTimeout(() => {
        //     toast.classList.add('show');
        // }, 100);
        // setTimeout(() => {
        //     toast.classList.remove('show');
        //     setTimeout(() => {
        //         toast.remove();
        //     }, 300);
        // }, 3000);
    }

    // ฟังก์ชันสำหรับการค้นหา
    const searchBar = document.querySelector('.search-bar input');
    if (searchBar) {
        searchBar.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim();
                if (searchTerm) {
                    showNotification(`กำลังค้นหา: ${searchTerm}`, 'info');
                    // ในการใช้งานจริงจะส่ง API ไปที่เซิร์ฟเวอร์เพื่อค้นหา
                }
            }
        });
    }

    // ฟังก์ชันสำหรับไฮไลท์เมนูที่กำลังใช้งาน
    function highlightActiveMenu() {
        const currentPage = window.location.pathname.split('/').pop();
        const menuItems = document.querySelectorAll('nav ul li');
        
        menuItems.forEach(item => {
            const link = item.querySelector('a');
            if (link && link.getAttribute('href') === currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // เรียกใช้ฟังก์ชันไฮไลท์เมนู
    highlightActiveMenu();

    // สำหรับการ export ฟังก์ชันไปใช้ในไฟล์อื่น
    window.dashboardFunctions = {
        fetchNotifications,
        fetchRecentActivities,
        showNotification
    };

    console.log('ระบบแดชบอร์ดพร้อมใช้งาน');
});