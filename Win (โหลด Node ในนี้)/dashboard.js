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

    // ฟังก์ชันสำหรับดึงจำนวนผู้ใช้ทั้งหมด - it's best
    async function fetchUserCount() {
        try {
            const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
            if (!token) return { count: 0 };

            // ส่ง request ไปยัง API endpoint
            const response = await fetch('/api/users/count', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`ไม่สามารถดึงจำนวนผู้ใช้ได้: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching user count:', error);
            // ส่งค่า default กลับไปเพื่อไม่ให้เกิด error ในการแสดงผล
            return { count: 0 };
        }
    }

    // ฟังก์ชันสำหรับดึงข้อมูล logs จากฐานข้อมูล - it's best
    async function fetchLogs() {
        try {
            const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
            if (!token) return { logs: [] };

            // ส่ง request ไปยัง API endpoint
            const response = await fetch('/api/logs', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`ไม่สามารถดึงข้อมูล logs ได้: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching logs:', error);
            // ส่งค่า empty array กลับไปเพื่อไม่ให้เกิด error ในการแสดงผล
            return { logs: [] };
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
    // ดึงข้อมูล logs จากฐานข้อมูล
    fetchLogs().then(data => {
        if (data && data.logs && data.logs.length > 0) {
            activityList.innerHTML = '';

            // สร้าง HTML สำหรับแสดงข้อมูล logs
            data.logs.forEach(log => {
                const item = document.createElement('div');
                item.className = 'activity-item';

                // กำหนด icon ตามประเภทของ action
                let icon = 'fa-history';
                if (log.action.includes('เข้าสู่ระบบ')) {
                    icon = 'fa-sign-in-alt';
                } else if (log.action.includes('ออกจากระบบ')) {
                    icon = 'fa-sign-out-alt';
                }

                // แปลงวันที่ให้อยู่ในรูปแบบภาษาไทย (UTC+7)
                const date = new Date(log.created_at);
                date.setHours(date.getHours() + 7); // แปลงเป็นเวลาไทย

                const options = {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZone: 'Asia/Bangkok'
                };

                const thaiMonths = {
                    'Jan': 'ม.ค.',
                    'Feb': 'ก.พ.',
                    'Mar': 'มี.ค.',
                    'Apr': 'เม.ย.',
                    'May': 'พ.ค.',
                    'Jun': 'มิ.ย.',
                    'Jul': 'ก.ค.',
                    'Aug': 'ส.ค.',
                    'Sep': 'ก.ย.',
                    'Oct': 'ต.ค.',
                    'Nov': 'พ.ย.',
                    'Dec': 'ธ.ค.'
                };

                let formattedDate = date.toLocaleString('th-TH', options);
                formattedDate = formattedDate.replace(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/g, month => thaiMonths[month]);

                const christianYear = date.getFullYear();
                const buddhistYear = christianYear + 543;
                formattedDate = formattedDate.replace(christianYear, buddhistYear);

                item.innerHTML = `
                    <div class="activity-icon">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="activity-info">
                        <p><strong>ID: ${log.id}</strong> - ${log.action}</p>
                        <p>ผู้ใช้: ${log.username} (บทบาท: ${log.role_name || log.role_id})</p>
                        <small>เวลา: ${formattedDate}</small>
                    </div>
                `;
                activityList.appendChild(item);
            });
        } else {
            // ถ้าไม่มีข้อมูล logs ให้แสดงข้อความว่าไม่มีข้อมูล
            activityList.innerHTML = '<div class="no-data">ไม่พบข้อมูลกิจกรรมล่าสุด</div>';
        }
    }).catch(error => {
        console.error('Error fetching logs:', error);
        // ถ้าเกิดข้อผิดพลาดในการดึงข้อมูล logs ให้แสดงข้อความแจ้งเตือน
        activityList.innerHTML = '<div class="error-message">เกิดข้อผิดพลาดในการดึงข้อมูลกิจกรรม</div>';
    });
}

    // แสดงสถิติสำหรับ Admin Dashboard - it's best
    const totalUsers = document.getElementById('total-users');
    const totalRequests = document.getElementById('total-requests');
    const totalPayments = document.getElementById('total-payments');
    const totalIssues = document.getElementById('total-issues');

    // ดึงและแสดงจำนวนผู้ใช้ทั้งหมดจากฐานข้อมูล
    if (totalUsers) {
        fetchUserCount().then(data => {
            if (data && data.count !== undefined) {
                totalUsers.textContent = data.count;
            } else {
                totalUsers.textContent = '0';
            }
        }).catch(error => {
            console.error('Error updating user count:', error);
            totalUsers.textContent = '0';
        });
    }

    // ดึงและแสดงสถิติอื่นๆ
    if (totalRequests && totalPayments && totalIssues) {
        fetchAdminStats().then(stats => {
            if (stats) {
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

    // สำหรับการ export ฟังก์ชันไปใช้ในไฟล์อื่น - it's best
    window.dashboardFunctions = {
        fetchNotifications,
        fetchRecentActivities,
        fetchLogs,
        fetchUserCount,
        showNotification
    };

    console.log('ระบบแดชบอร์ดพร้อมใช้งาน');
});



// ตัวอย่างในไฟล์ dashboard.js
async function fetchRecentLogs() {
    try {
      const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
      if (!token) return [];
  
      const response = await fetch('/api/logs?limit=5', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (!response.ok) {
        throw new Error('ไม่สามารถดึงข้อมูล logs ได้');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
  }
  
  // แสดง logs ล่าสุดในหน้า dashboard
  const logsList = document.getElementById('recent-logs');
  if (logsList) {
    fetchRecentLogs().then(data => {
      logsList.innerHTML = '';
      data.logs.forEach(log => {
        const item = document.createElement('div');
        item.className = 'log-item';
        item.innerHTML = `
          <div class="log-info">
            <p><strong>${log.username}</strong> (${log.role_name})</p>
            <small>${log.action} - ${new Date(log.created_at).toLocaleString()}</small>
          </div>
        `;
        logsList.appendChild(item);
      });
    });
  }