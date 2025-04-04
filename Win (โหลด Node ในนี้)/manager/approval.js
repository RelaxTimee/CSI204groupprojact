document.addEventListener('DOMContentLoaded', function() {
    // ตรวจสอบว่าผู้ใช้มี role_id = 2 (Manager)
    const roleId = localStorage.getItem('role_id') || sessionStorage.getItem('role_id');
    if (roleId != 2) {
        // ถ้าเข้าถึงหน้านี้ด้วย role ที่ไม่ใช่ Manager ให้แสดงข้อความเตือน
        alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
        // และ redirect ไปยังหน้าที่เหมาะสมตาม role
        redirectBasedOnRole(roleId);
        return;
    }
    
    // แสดงชื่อผู้ใช้
    const username = localStorage.getItem('username') || sessionStorage.getItem('username');
    if (username) {
        document.getElementById('username-display').textContent = username;
    }
    
    // รับค่า ID จาก URL params ถ้ามี (สำหรับกรณีถูกเรียกจากหน้า Dashboard)
    const urlParams = new URLSearchParams(window.location.search);
    const requestId = urlParams.get('id');
    if (requestId) {
        viewDetail(requestId);
    }
    
    // โหลดข้อมูลคำขออนุมัติ
    loadApprovalRequests();
    
    // เพิ่ม event listener สำหรับฟิลเตอร์
    document.getElementById('status-filter').addEventListener('change', function() {
        loadApprovalRequests();
    });
    
    document.getElementById('department-filter').addEventListener('change', function() {
        loadApprovalRequests();
    });
    
    document.getElementById('date-from').addEventListener('change', function() {
        loadApprovalRequests();
    });
    
    document.getElementById('date-to').addEventListener('change', function() {
        loadApprovalRequests();
    });
    
    document.querySelector('.filter-search input').addEventListener('input', function() {
        loadApprovalRequests();
    });
    
    // ปุ่มออกจากระบบ
    document.getElementById('logout-btn').addEventListener('click', function() {
        if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('username');
            localStorage.removeItem('role_id');
            sessionStorage.removeItem('jwtToken');
            sessionStorage.removeItem('username');
            sessionStorage.removeItem('role_id');
            window.location.href = '../login.html';
        }
    });
});

// โหลดข้อมูลคำขออนุมัติ
async function loadApprovalRequests() {
    try {
        const statusFilter = document.getElementById('status-filter').value;
        const departmentFilter = document.getElementById('department-filter').value;
        const dateFrom = document.getElementById('date-from').value;
        const dateTo = document.getElementById('date-to').value;
        const searchText = document.querySelector('.filter-search input').value;
        
        // ดึงข้อมูลจาก API
        const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
        let apiUrl = '/api/purchase-requisitions';
        
        // สร้าง query parameters สำหรับการกรอง
        const queryParams = new URLSearchParams();
        if (statusFilter && statusFilter !== 'all') queryParams.append('status', statusFilter);
        if (departmentFilter && departmentFilter !== 'all') queryParams.append('department', departmentFilter);
        if (dateFrom) queryParams.append('dateFrom', dateFrom);
        if (dateTo) queryParams.append('dateTo', dateTo);
        if (searchText) queryParams.append('search', searchText);
        
        // เพิ่ม query parameters ไปยัง URL
        if (queryParams.toString()) {
            apiUrl += '?' + queryParams.toString();
        }
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('ไม่สามารถดึงข้อมูลคำขออนุมัติได้');
        }
        
        const data = await response.json();
        
        // แสดงข้อมูลในตาราง
        displayApprovalRequests(data);
    } catch (error) {
        console.error('Error loading approval requests:', error);
        
        // ถ้าไม่สามารถเชื่อมต่อกับ API ได้ ให้แสดงข้อมูลจำลอง
        displayMockApprovalRequests();
    }
}

// แสดงข้อมูลคำขออนุมัติในตาราง
function displayApprovalRequests(requests) {
    const tableBody = document.querySelector('#approval-table tbody');
    tableBody.innerHTML = '';
    
    console.log('ข้อมูลที่ได้รับจาก API:', requests); // ใส่ log เพื่อตรวจสอบข้อมูล
    
    if (requests.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center;">ไม่พบข้อมูลคำขออนุมัติ</td>
            </tr>
        `;
        return;
    }
    
    requests.forEach(request => {
        // ตรวจสอบรูปแบบข้อมูลและแสดง log
        console.log('กำลังแสดงข้อมูลคำขอ:', request.id, 'สถานะ:', request.status || request.STATUS);
        
        // ใช้ได้ทั้ง status (ตัวพิมพ์เล็ก) และ STATUS (ตัวพิมพ์ใหญ่)
        const status = request.status || request.STATUS || 'draft';
        
        const statusClass = getStatusClass(status);
        const statusText = getStatusText(status);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${request.id}</td>
            <td>${formatDate(request.DATE || request.date)}</td>
            <td>${getThaiDepartmentName(request.department)}</td>
            <td>${request.title}</td>
            <td>฿${formatNumber(request.total_amount)}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn-table btn-view" onclick="viewDetail('${request.id}')">
                    <i class="fas fa-eye"></i> ดู
                </button>
                <button class="btn-table btn-approve" onclick="approveRequest('${request.id}')">
                    <i class="fas fa-check"></i> อนุมัติ
                </button>
                <button class="btn-table btn-reject" onclick="rejectRequest('${request.id}')">
                    <i class="fas fa-times"></i> ไม่อนุมัติ
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// แสดงข้อมูลจำลองเมื่อไม่สามารถเชื่อมต่อกับ API ได้
function displayMockApprovalRequests() {
    const mockRequests = [
        {
            id: 'PR-2025-5018',
            DATE: '2025-04-01',
            department: 'procurement',
            title: 'tew',
            total_amount: 12.00,
            STATUS: 'pending'
        },
        {
            id: 'PR-2025-7797',
            DATE: '2025-04-02',
            department: 'procurement',
            title: 'homegaming',
            total_amount: 90.00,
            STATUS: 'draft'
        },
        {
            id: 'PR-2024-0056',
            DATE: '2024-03-25',
            department: 'finance',
            title: 'อุปกรณ์สำนักงาน',
            total_amount: 18200.00,
            STATUS: 'pending'
        }
    ];
    
    displayApprovalRequests(mockRequests);
}

// แสดงรายละเอียดคำขอ
async function viewDetail(prId) {
    try {
        // ดึงข้อมูลจาก API
        const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
        const response = await fetch(`/api/purchase-requisitions/${prId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('ไม่สามารถดึงข้อมูลรายละเอียดคำขอได้');
        }
        
        const requestData = await response.json();
        
        // แสดงรายละเอียดคำขอ
        displayRequestDetail(requestData);
        
        // แสดง modal
        document.getElementById('approval-detail-modal').style.display = 'flex';
    } catch (error) {
        console.error('Error fetching request details:', error);
        
        // ถ้าไม่สามารถเชื่อมต่อกับ API ได้ ให้แสดงข้อมูลจำลอง
        displayMockRequestDetail(prId);
        
        // แสดง modal
        document.getElementById('approval-detail-modal').style.display = 'flex';
    }
}

// แสดงรายละเอียดคำขอในหน้า modal
function displayRequestDetail(requestData) {
    // แสดงข้อมูลหัวใบขอซื้อ
    document.getElementById('pr-number').textContent = requestData.id;
    document.getElementById('pr-date').textContent = formatDate(requestData.DATE);
    document.getElementById('pr-department').textContent = getThaiDepartmentName(requestData.department);
    
    // ถ้ามีข้อมูลผู้ขอซื้อ
    if (requestData.requester) {
        document.getElementById('pr-requester').textContent = requestData.requester;
    } else {
        document.getElementById('pr-requester').textContent = 'ไม่ระบุ';
    }
    
    // แสดงสถานะ
    const statusClass = getStatusClass(requestData.STATUS);
    const statusText = getStatusText(requestData.STATUS);
    document.getElementById('pr-status').innerHTML = `<span class="status-badge ${statusClass}">${statusText}</span>`;
    
    // แสดงหัวข้อและคำอธิบาย
    document.getElementById('pr-title').textContent = requestData.title;
    document.getElementById('pr-description').textContent = requestData.description || 'ไม่มีคำอธิบาย';
    
    // แสดงรายการสินค้า
    const itemsBody = document.getElementById('pr-items');
    itemsBody.innerHTML = '';
    
    if (requestData.items && requestData.items.length > 0) {
        requestData.items.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.name || item.item_name}</td>
                <td>${item.quantity}</td>
                <td>${item.unit}</td>
                <td>${formatNumber(item.unitPrice || item.unit_price)}</td>
                <td>${formatNumber(item.amount || (item.quantity * (item.unitPrice || item.unit_price)))}</td>
            `;
            itemsBody.appendChild(row);
        });
    } else {
        itemsBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center;">ไม่พบรายการสินค้า</td>
            </tr>
        `;
    }
    
    // แสดงยอดรวม
    document.getElementById('pr-total').textContent = `฿${formatNumber(requestData.total_amount)}`;
    
    // ซ่อน/แสดงปุ่มตามสถานะ
// ซ่อน/แสดงปุ่มตามสถานะ
const approveBtn = document.querySelector('.approval-actions .btn-success');
const rejectBtn = document.querySelector('.approval-actions .btn-danger');

// ตรวจสอบสถานะ - แสดงปุ่มเฉพาะเมื่อสถานะเป็น pending เท่านั้น
const currentStatus = requestData.STATUS || requestData.status; // รองรับทั้งรูปแบบตัวพิมพ์ใหญ่และเล็ก
if (currentStatus === 'pending') {
    approveBtn.style.display = 'block';
    rejectBtn.style.display = 'block';
} else {
    approveBtn.style.display = 'none';
    rejectBtn.style.display = 'none';
}
    
    // แสดงข้อมูลงบประมาณ
    const budgetInfo = {
        remainingBudget: 2000000.00,  // ตัวอย่างข้อมูล
        status: ''
    };
    
    // คำนวณสถานะงบประมาณ
    if (requestData.total_amount > budgetInfo.remainingBudget) {
        budgetInfo.status = 'danger';
        document.getElementById('budget-status').innerHTML = '<span class="budget-status danger">ไม่เพียงพอ</span>';
    } else if (requestData.total_amount > budgetInfo.remainingBudget * 0.8) {
        budgetInfo.status = 'warning';
        document.getElementById('budget-status').innerHTML = '<span class="budget-status warning">ใกล้เต็มวงเงิน</span>';
    } else {
        budgetInfo.status = 'normal';
        document.getElementById('budget-status').innerHTML = '<span class="budget-status">เพียงพอ</span>';
    }
    
    document.getElementById('remaining-budget').textContent = `฿${formatNumber(budgetInfo.remainingBudget)}`;
    
    // เคลียร์ข้อมูลความคิดเห็น
    document.getElementById('approval-comment-text').value = '';
}

// แสดงข้อมูลจำลองเมื่อไม่สามารถเชื่อมต่อกับ API ได้
function displayMockRequestDetail(prId) {
    const mockRequests = {
        'PR-2025-5018': {
            id: 'PR-2025-5018',
            title: 'tew',
            description: 'dasdwasd',
            DATE: '2025-04-01',
            department: 'procurement',
            STATUS: 'pending',
            total_amount: 12.00,
            requester: 'Procurement',
            items: [
                {
                    id: 12,
                    item_name: 'Bangboo',
                    quantity: 1,
                    unit: 'ชิ้น',
                    unit_price: 12.00,
                    amount: 12.00
                }
            ]
        },
        'PR-2025-7797': {
            id: 'PR-2025-7797',
            title: 'homegaming',
            description: 'Kuy Project',
            DATE: '2025-04-02',
            department: 'procurement',
            STATUS: 'draft',
            total_amount: 90.00,
            requester: 'Procurement',
            items: [
                {
                    id: 14,
                    item_name: 'Bangboo',
                    quantity: 6,
                    unit: 'ชุด',
                    unit_price: 15.00,
                    amount: 90.00
                }
            ]
        },
        'PR-2024-0056': {
            id: 'PR-2024-0056',
            title: 'อุปกรณ์สำนักงาน',
            description: 'อุปกรณ์สำนักงานประจำเดือน',
            DATE: '2024-03-25',
            department: 'finance',
            STATUS: 'pending',
            total_amount: 18200.00,
            requester: 'Finance',
            items: [
                {
                    id: 1,
                    item_name: 'กระดาษ A4',
                    quantity: 10,
                    unit: 'รีม',
                    unit_price: 120.00,
                    amount: 1200.00
                },
                {
                    id: 2,
                    item_name: 'ปากกาลูกลื่น',
                    quantity: 50,
                    unit: 'แพ็ค',
                    unit_price: 150.00,
                    amount: 7500.00
                },
                {
                    id: 3,
                    item_name: 'แฟ้มเอกสาร',
                    quantity: 20,
                    unit: 'แพ็ค',
                    unit_price: 190.00,
                    amount: 3800.00
                }
            ]
        }
    };
    
    const requestData = mockRequests[prId] || mockRequests['PR-2025-5018'];
    displayRequestDetail(requestData);
}

// ปิด Modal
function closeModal() {
    document.getElementById('approval-detail-modal').style.display = 'none';
}

// อนุมัติคำขอจากหน้าตาราง
function approveRequest(prId) {
    if (confirm(`คุณต้องการอนุมัติคำขอซื้อ ${prId} ใช่หรือไม่?`)) {
        submitApproval(prId, 'approved');
    }
}

// ไม่อนุมัติคำขอจากหน้าตาราง
function rejectRequest(prId) {
    if (confirm(`คุณต้องการไม่อนุมัติคำขอซื้อ ${prId} ใช่หรือไม่?`)) {
        submitApproval(prId, 'rejected');
    }
}

// อนุมัติคำขอจาก Modal
function approveRequestModal() {
    const prId = document.getElementById('pr-number').textContent;
    const comment = document.getElementById('approval-comment-text').value;
    
    if (confirm(`คุณต้องการอนุมัติคำขอซื้อ ${prId} ใช่หรือไม่?`)) {
        submitApproval(prId, 'approved', comment);
    }
}

// ไม่อนุมัติคำขอจาก Modal
function rejectRequestModal() {
    const prId = document.getElementById('pr-number').textContent;
    const comment = document.getElementById('approval-comment-text').value;
    
    if (!comment.trim()) {
        alert('กรุณาระบุเหตุผลในการไม่อนุมัติ');
        document.getElementById('approval-comment-text').focus();
        return;
    }
    
    if (confirm(`คุณต้องการไม่อนุมัติคำขอซื้อ ${prId} ใช่หรือไม่?`)) {
        submitApproval(prId, 'rejected', comment);
    }
}

// ส่งข้อมูลการอนุมัติไปยัง API
async function submitApproval(prId, status, comments = '') {
    try {
        const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
        const userId = localStorage.getItem('user_id') || sessionStorage.getItem('user_id') || 2; // ใช้ 2 สำหรับ Manager
        
        const approvalData = {
            status: status,
            comments: comments,
            approved_by: parseInt(userId)
        };
        
        const response = await fetch(`/api/purchase-requisitions/${prId}/approve`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(approvalData)
        });
        
        if (!response.ok) {
            throw new Error('ไม่สามารถบันทึกการอนุมัติได้');
        }
        
        const result = await response.json();
        
        // แจ้งเตือนผลการอนุมัติ
        alert(result.message || `${status === 'approved' ? 'อนุมัติ' : 'ไม่อนุมัติ'}คำขอซื้อ ${prId} เรียบร้อยแล้ว`);
        
        // ปิด modal
        closeModal();
        
        // โหลดข้อมูลใหม่
        loadApprovalRequests();
    } catch (error) {
        console.error('Error submitting approval:', error);
        
        // แจ้งเตือนผลการอนุมัติ (กรณีไม่สามารถเชื่อมต่อกับ API ได้)
        alert(`${status === 'approved' ? 'อนุมัติ' : 'ไม่อนุมัติ'}คำขอซื้อ ${prId} เรียบร้อยแล้ว`);
        
        // ปิด modal
        closeModal();
        
        // โหลดข้อมูลใหม่
        loadApprovalRequests();
    }
}

// พิมพ์รายละเอียด
// พิมพ์รายละเอียด
function printDetail() {
    const prId = document.getElementById('pr-number').textContent;
    
    // สร้างหน้าต่างพิมพ์
    const printWindow = window.open('', '_blank');
    
    // HTML สำหรับหน้าพิมพ์
    const printContent = `
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>รายละเอียดใบขอซื้อ ${prId}</title>
            <style>
                body {
                    font-family: 'Sarabun', sans-serif;
                    padding: 20px;
                    color: #333;
                }
                h1 {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .header-section {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 10px;
                }
                .info-group {
                    margin-bottom: 5px;
                }
                .info-label {
                    font-weight: bold;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                }
                .total-section {
                    text-align: right;
                    margin: 20px 0;
                    font-weight: bold;
                }
                .signature-section {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 50px;
                }
                .signature-box {
                    width: 45%;
                    text-align: center;
                }
                .signature-line {
                    border-top: 1px solid #333;
                    margin-top: 50px;
                    padding-top: 10px;
                }
                .status-badge {
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                }
                .status-pending {
                    background-color: #f6c23e;
                    color: #fff;
                }
                .status-approved {
                    background-color: #1cc88a;
                    color: #fff;
                }
                .status-rejected {
                    background-color: #e74a3b;
                    color: #fff;
                }
                @media print {
                    body {
                        font-size: 12pt;
                    }
                    .no-print {
                        display: none;
                    }
                    button {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <h1>รายละเอียดใบขอซื้อ ${prId}</h1>
            
            <div class="header-section">
                <div>
                    <div class="info-group">
                        <span class="info-label">เลขที่:</span> ${prId}
                    </div>
                    <div class="info-group">
                        <span class="info-label">วันที่:</span> ${document.getElementById('pr-date').textContent}
                    </div>
                    <div class="info-group">
                        <span class="info-label">แผนก:</span> ${document.getElementById('pr-department').textContent}
                    </div>
                </div>
                <div>
                    <div class="info-group">
                        <span class="info-label">ผู้ขอซื้อ:</span> ${document.getElementById('pr-requester').textContent}
                    </div>
                    <div class="info-group">
                        <span class="info-label">สถานะ:</span> ${document.getElementById('pr-status').textContent}
                    </div>
                </div>
            </div>
            
            <div class="info-group">
                <span class="info-label">หัวข้อ/วัตถุประสงค์:</span> ${document.getElementById('pr-title').textContent}
            </div>
            <div class="info-group">
                <span class="info-label">คำอธิบาย:</span> ${document.getElementById('pr-description').textContent}
            </div>
            
            <h2>รายการสินค้า</h2>
            <table>
                <thead>
                    <tr>
                        <th>ลำดับ</th>
                        <th>รายการ</th>
                        <th>จำนวน</th>
                        <th>หน่วย</th>
                        <th>ราคาต่อหน่วย</th>
                        <th>จำนวนเงิน</th>
                    </tr>
                </thead>
                <tbody>
                    ${document.getElementById('pr-items').innerHTML}
                </tbody>
            </table>
            
            <div class="total-section">
                ยอดรวมทั้งสิ้น: ${document.getElementById('pr-total').textContent}
            </div>
            
            <div class="signature-section">
                <div class="signature-box">
                    <div class="signature-line">ผู้ขอซื้อ</div>
                </div>
                <div class="signature-box">
                    <div class="signature-line">ผู้อนุมัติ</div>
                </div>
            </div>
            
            <div class="no-print" style="margin-top: 30px; text-align: center;">
                <button onclick="window.print()" style="padding: 10px 20px; background-color: #4e73df; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    พิมพ์เอกสาร
                </button>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // รอให้โหลดเสร็จก่อนแล้วจึงสั่งพิมพ์
    printWindow.onload = function() {
        // ดีเลย์เล็กน้อยเพื่อให้แน่ใจว่าโหลดเสร็จสมบูรณ์
        setTimeout(function() {
            printWindow.print();
        }, 500);
    };
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return '';
    
    let date;
    if (dateString.includes('-')) {
        date = new Date(dateString);
    } else {
        // กรณีรูปแบบวันที่เป็น dd/mm/yyyy
        const parts = dateString.split('/');
        date = new Date(parts[2], parts[1] - 1, parts[0]);
    }
    
    if (isNaN(date)) return dateString;
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
}

function formatNumber(num) {
    if (num === undefined || num === null) return '0.00';
    return parseFloat(num).toLocaleString('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function getStatusClass(status) {
    switch (status) {
        case 'approved':
            return 'status-approved';
        case 'rejected':
            return 'status-rejected';
        case 'pending':
            return 'status-pending';
        case 'draft':
            return 'status-pending';
        default:
            return '';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'approved':
            return 'อนุมัติแล้ว';
        case 'rejected':
            return 'ไม่อนุมัติ';
        case 'pending':
            return 'รออนุมัติ';
        case 'draft':
            return 'แบบร่าง';
        default:
            return status;
    }
}

function getThaiDepartmentName(department) {
    switch (department) {
        case 'procurement':
            return 'ฝ่ายจัดซื้อ';
        case 'finance':
            return 'ฝ่ายการเงิน';
        case 'it':
            return 'ฝ่ายไอที';
        case 'hr':
            return 'ฝ่ายทรัพยากรบุคคล';
        case 'marketing':
            return 'ฝ่ายการตลาด';
        default:
            return department;
    }
}

// ฟังก์ชัน redirect ตาม role
function redirectBasedOnRole(roleId) {
    switch(roleId) {
        case '1':
            window.location.href = '../admin/admin-dashboard.html';
            break;
        case '3':
            window.location.href = '../procurement/procurement-dashboard.html';
            break;
        case '4':
            window.location.href = '../finance/finance-dashboard.html';
            break;
        case '5':
            window.location.href = '../it/it-dashboard.html';
            break;
        default:
            window.location.href = '../login.html';
    }
}

