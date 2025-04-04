// PuControl.js - สำหรับควบคุมการแสดงผลและจัดการใบขอซื้อในหน้า dashboard

document.addEventListener('DOMContentLoaded', function() {
    // ตรวจสอบว่าผู้ใช้มีสิทธิ์เข้าถึงหรือไม่
    const roleId = localStorage.getItem('role_id') || sessionStorage.getItem('role_id');
    
    // โหลดข้อมูลใบขอซื้อตามบทบาทของผู้ใช้
    loadPurchaseRequisitions(roleId);
    
    // เพิ่ม event listeners สำหรับการกรอง
    setupFilterListeners();
    
    // เพิ่ม event listeners สำหรับการค้นหา
    setupSearchListener();
});

// ฟังก์ชันสำหรับโหลดข้อมูลใบขอซื้อ
async function loadPurchaseRequisitions(roleId) {
    try {
        // ดึงข้อมูลใบขอซื้อจาก API
        const requisitions = await fetchPurchaseRequisitions();
        
        // กรองใบขอซื้อตามบทบาทของผู้ใช้
        let filteredRequisitions = requisitions;
        
        if (roleId == 3) { // Procurement
            // แสดงใบขอซื้อทั้งหมด
        } else if (roleId == 2) { // Manager
            // แสดงใบขอซื้อที่รออนุมัติและที่ผ่านการอนุมัติแล้วเท่านั้น
            filteredRequisitions = requisitions.filter(pr => 
                pr.status === 'pending' || 
                pr.status === 'approved' || 
                pr.status === 'rejected'
            );
        } else if (roleId == 1) { // Admin
            // แสดงใบขอซื้อทั้งหมด
        } else {
            // สำหรับบทบาทอื่นๆ แสดงเฉพาะใบขอซื้อที่ตนเองสร้าง
            const userId = localStorage.getItem('user_id') || sessionStorage.getItem('user_id');
            filteredRequisitions = requisitions.filter(pr => pr.requested_by == userId);
        }
        
        // แสดงใบขอซื้อในหน้า dashboard
        displayPurchaseRequisitions(filteredRequisitions, 'pr-list-container');
        
        // อัปเดตจำนวนใบขอซื้อตามสถานะ
        updateStatusCounts(requisitions);
        
    } catch (error) {
        console.error('Error loading purchase requisitions:', error);
        showAlert('ไม่สามารถโหลดข้อมูลใบขอซื้อได้', 'error');
    }
}

// ฟังก์ชันสำหรับดึงข้อมูลใบขอซื้อจาก API
async function fetchPurchaseRequisitions() {
    try {
        const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
        
        const response = await fetch('/api/purchase-requisitions', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('ไม่สามารถดึงข้อมูลใบขอซื้อได้');
        }
        
        const requisitions = await response.json();
        return requisitions;
    } catch (error) {
        console.error('Error fetching purchase requisitions:', error);
        
        // ในกรณีที่มีปัญหาในการเชื่อมต่อ ใช้ข้อมูลจำลอง
        return getMockPurchaseRequisitions();
    }
}

// ฟังก์ชันสำหรับดึงข้อมูลรายละเอียดใบขอซื้อตาม ID
async function fetchPurchaseRequisitionDetails(prId) {
    try {
        const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
        
        const response = await fetch(`/api/purchase-requisitions/${prId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('ไม่สามารถดึงข้อมูลรายละเอียดใบขอซื้อได้');
        }
        
        const requisition = await response.json();
        return requisition;
    } catch (error) {
        console.error('Error fetching purchase requisition details:', error);
        
        // ในกรณีที่มีปัญหาในการเชื่อมต่อ ใช้ข้อมูลจำลอง
        return getMockPurchaseRequisitionDetails(prId);
    }
}

// ฟังก์ชันสำหรับอัปเดตสถานะของใบขอซื้อ
async function updatePurchaseRequisitionStatus(prId, status, comments) {
    try {
        const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
        
        const response = await fetch(`/api/purchase-requisitions/${prId}/approve`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status,
                comments
            })
        });
        
        if (!response.ok) {
            throw new Error('ไม่สามารถอัปเดตสถานะใบขอซื้อได้');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating purchase requisition status:', error);
        throw error;
    }
}

// ฟังก์ชันสำหรับแสดงรายการใบขอซื้อในหน้า dashboard
function displayPurchaseRequisitions(requisitions, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (requisitions.length === 0) {
        container.innerHTML = '<div class="empty-state">ไม่มีใบขอซื้อที่ต้องการแสดง</div>';
        return;
    }
    
    requisitions.forEach(pr => {
        const statusClass = getStatusClass(pr.status);
        const statusText = getStatusText(pr.status);
        
        const prElement = document.createElement('div');
        prElement.className = 'pr-item';
        prElement.dataset.id = pr.id;
        
        prElement.innerHTML = `
            <div class="pr-item-header">
                <h3>${pr.id}</h3>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="pr-item-body">
                <p class="pr-title">${pr.title}</p>
                <p class="pr-info">
                    <span><i class="fas fa-calendar"></i> ${formatDate(pr.date)}</span>
                    <span><i class="fas fa-user"></i> ${pr.requested_by}</span>
                    <span><i class="fas fa-building"></i> ${pr.department}</span>
                </p>
                <p class="pr-amount">
                    <i class="fas fa-money-bill-wave"></i> ${formatCurrency(pr.total_amount)} บาท
                </p>
            </div>
            <div class="pr-item-actions">
                <button class="btn btn-sm btn-primary view-pr-btn" data-id="${pr.id}">
                    <i class="fas fa-eye"></i> ดูรายละเอียด
                </button>
                ${getActionButtonsHtml(pr)}
            </div>
        `;
        
        container.appendChild(prElement);
    });
    
    // เพิ่ม event listeners สำหรับปุ่มดูรายละเอียด
    addDetailButtonListeners();
    
    // เพิ่ม event listeners สำหรับปุ่มการดำเนินการ
    addActionButtonListeners();
}

// ฟังก์ชันสำหรับแสดงรายละเอียดใบขอซื้อเมื่อคลิกปุ่มดูรายละเอียด
function showPurchaseRequisitionDetails(prId) {
    try {
        // เปิด modal แสดงข้อมูลกำลังโหลด
        openModal('pr-details-modal');
        
        // ดึงข้อมูลรายละเอียดใบขอซื้อ
        fetchPurchaseRequisitionDetails(prId)
            .then(pr => {
                // แสดงข้อมูลในรายละเอียดใบขอซื้อ
                displayPurchaseRequisitionDetails(pr);
            })
            .catch(error => {
                console.error('Error fetching PR details:', error);
                showAlert('ไม่สามารถดึงข้อมูลรายละเอียดใบขอซื้อได้', 'error');
                closeModal('pr-details-modal');
            });
    } catch (error) {
        console.error('Error showing PR details:', error);
        showAlert('เกิดข้อผิดพลาดในการแสดงรายละเอียดใบขอซื้อ', 'error');
    }
}

// ฟังก์ชันสำหรับแสดงรายละเอียดใบขอซื้อใน modal
function displayPurchaseRequisitionDetails(pr) {
    const modal = document.getElementById('pr-details-modal');
    if (!modal) return;
    
    // แสดงข้อมูลหลักของใบขอซื้อ
    modal.querySelector('.modal-title').textContent = `รายละเอียดใบขอซื้อ ${pr.id}`;
    
    const detailsContainer = modal.querySelector('.pr-details-container');
    detailsContainer.innerHTML = `
        <div class="pr-details-header">
            <div class="pr-details-info">
                <h3>${pr.title}</h3>
                <p>${pr.description || '-'}</p>
            </div>
            <div class="pr-details-status">
                <span class="status-badge ${getStatusClass(pr.status)}">${getStatusText(pr.status)}</span>
            </div>
        </div>
        
        <div class="pr-details-meta">
            <div class="meta-item">
                <span class="meta-label">เลขที่:</span>
                <span class="meta-value">${pr.id}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">วันที่:</span>
                <span class="meta-value">${formatDate(pr.date)}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">ผู้ขอซื้อ:</span>
                <span class="meta-value">${pr.requested_by}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">แผนก:</span>
                <span class="meta-value">${pr.department}</span>
            </div>
        </div>
        
        <h4>รายการสินค้า</h4>
        <div class="pr-items-table-container">
            <table class="pr-items-table">
                <thead>
                    <tr>
                        <th>ลำดับ</th>
                        <th>รายการ</th>
                        <th>จำนวน</th>
                        <th>หน่วย</th>
                        <th>ราคาต่อหน่วย</th>
                        <th>รวม</th>
                    </tr>
                </thead>
                <tbody>
                    ${renderItemRows(pr.items)}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="5" class="text-right">รวมทั้งสิ้น:</td>
                        <td class="text-right">${formatCurrency(pr.total_amount)} บาท</td>
                    </tr>
                </tfoot>
            </table>
        </div>
        
        ${renderApprovalSection(pr)}
    `;
    
    // เพิ่ม event listeners สำหรับฟอร์มการอนุมัติ
    addApprovalFormListeners(pr.id);
}

// ฟังก์ชันสำหรับ render แถวของรายการสินค้า
function renderItemRows(items) {
    if (!items || items.length === 0) {
        return '<tr><td colspan="6" class="text-center">ไม่พบรายการสินค้า</td></tr>';
    }
    
    return items.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${item.item_name}</td>
            <td class="text-right">${item.quantity}</td>
            <td>${item.unit}</td>
            <td class="text-right">${formatCurrency(item.unit_price)}</td>
            <td class="text-right">${formatCurrency(item.amount)}</td>
        </tr>
    `).join('');
}

// ฟังก์ชันสำหรับ render ส่วนการอนุมัติ
function renderApprovalSection(pr) {
    const roleId = localStorage.getItem('role_id') || sessionStorage.getItem('role_id');
    
    // ส่วนประวัติการอนุมัติ
    let approvalHistoryHtml = '';
    if (pr.approvals && pr.approvals.length > 0) {
        approvalHistoryHtml = `
            <h4>ประวัติการอนุมัติ</h4>
            <div class="approval-history">
                ${pr.approvals.map(approval => `
                    <div class="approval-item ${approval.status}">
                        <div class="approval-info">
                            <p><strong>${approval.status === 'approved' ? 'อนุมัติ' : 'ไม่อนุมัติ'}</strong> โดย ${approval.approved_by}</p>
                            <p>วันที่: ${formatDate(approval.approved_at)}</p>
                        </div>
                        <div class="approval-comment">
                            <p>${approval.comments || '-'}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // ส่วนฟอร์มการอนุมัติ (แสดงเฉพาะสำหรับ Manager และ Admin)
    let approvalFormHtml = '';
    if ((roleId == 2 || roleId == 1) && pr.status === 'pending') {
        approvalFormHtml = `
            <h4>อนุมัติใบขอซื้อ</h4>
            <div class="approval-form">
                <div class="form-group">
                    <label for="approval-comment">ความเห็น:</label>
                    <textarea id="approval-comment" class="form-control" rows="3"></textarea>
                </div>
                <div class="form-actions">
                    <button class="btn btn-danger reject-btn" data-id="${pr.id}">ไม่อนุมัติ</button>
                    <button class="btn btn-success approve-btn" data-id="${pr.id}">อนุมัติ</button>
                </div>
            </div>
        `;
    }
    
    return approvalHistoryHtml + approvalFormHtml;
}

// ฟังก์ชันเพิ่ม event listeners สำหรับฟอร์มการอนุมัติ
function addApprovalFormListeners(prId) {
    const approveBtn = document.querySelector('.approve-btn');
    const rejectBtn = document.querySelector('.reject-btn');
    
    if (approveBtn) {
        approveBtn.addEventListener('click', function() {
            const comments = document.getElementById('approval-comment').value;
            handleApproval(prId, 'approved', comments);
        });
    }
    
    if (rejectBtn) {
        rejectBtn.addEventListener('click', function() {
            const comments = document.getElementById('approval-comment').value;
            handleApproval(prId, 'rejected', comments);
        });
    }
}

// ฟังก์ชันสำหรับจัดการการอนุมัติ
async function handleApproval(prId, status, comments) {
    try {
        // แสดง loading
        showLoading();
        
        // เรียก API เพื่ออัปเดตสถานะ
        const result = await updatePurchaseRequisitionStatus(prId, status, comments);
        
        // ซ่อน loading
        hideLoading();
        
        // แสดงข้อความแจ้งเตือน
        const message = status === 'approved' ? 'อนุมัติใบขอซื้อเรียบร้อยแล้ว' : 'ปฏิเสธใบขอซื้อเรียบร้อยแล้ว';
        showAlert(message, 'success');
        
        // ปิด modal
        closeModal('pr-details-modal');
        
        // โหลดข้อมูลใบขอซื้อใหม่
        const roleId = localStorage.getItem('role_id') || sessionStorage.getItem('role_id');
        loadPurchaseRequisitions(roleId);
    } catch (error) {
        // ซ่อน loading
        hideLoading();
        
        console.error('Error updating purchase requisition status:', error);
        showAlert('ไม่สามารถอัปเดตสถานะใบขอซื้อได้', 'error');
    }
}

// ฟังก์ชันช่วยเหลือต่างๆ
function getStatusClass(status) {
    switch (status) {
        case 'draft': return 'status-draft';
        case 'pending': return 'status-pending';
        case 'approved': return 'status-approved';
        case 'rejected': return 'status-rejected';
        default: return '';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'draft': return 'แบบร่าง';
        case 'pending': return 'รออนุมัติ';
        case 'approved': return 'อนุมัติแล้ว';
        case 'rejected': return 'ไม่อนุมัติ';
        default: return status;
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatCurrency(amount) {
    return amount.toLocaleString('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function getActionButtonsHtml(pr) {
    const roleId = localStorage.getItem('role_id') || sessionStorage.getItem('role_id');
    
    if (pr.status === 'draft' && (roleId == 3 || roleId == 1)) {
        return `
            <button class="btn btn-sm btn-warning edit-pr-btn" data-id="${pr.id}">
                <i class="fas fa-edit"></i> แก้ไข
            </button>
            <button class="btn btn-sm btn-success submit-pr-btn" data-id="${pr.id}">
                <i class="fas fa-paper-plane"></i> ส่งอนุมัติ
            </button>
        `;
    } else if (pr.status === 'pending' && (roleId == 2 || roleId == 1)) {
        return `
            <button class="btn btn-sm btn-success approve-pr-btn" data-id="${pr.id}">
                <i class="fas fa-check"></i> อนุมัติ
            </button>
            <button class="btn btn-sm btn-danger reject-pr-btn" data-id="${pr.id}">
                <i class="fas fa-times"></i> ไม่อนุมัติ
            </button>
        `;
    } else if (pr.status === 'approved' && (roleId == 3 || roleId == 1)) {
        return `
            <button class="btn btn-sm btn-primary create-po-btn" data-id="${pr.id}">
                <i class="fas fa-file-invoice"></i> สร้างใบสั่งซื้อ
            </button>
        `;
    }
    
    return '';
}

// ฟังก์ชันสำหรับเพิ่ม event listeners ให้กับปุ่มต่างๆ
function addDetailButtonListeners() {
    document.querySelectorAll('.view-pr-btn').forEach(button => {
        button.addEventListener('click', function() {
            const prId = this.dataset.id;
            showPurchaseRequisitionDetails(prId);
        });
    });
}

function addActionButtonListeners() {
    // ปุ่มแก้ไขใบขอซื้อ
    document.querySelectorAll('.edit-pr-btn').forEach(button => {
        button.addEventListener('click', function() {
            const prId = this.dataset.id;
            window.location.href = `purchase-requisition.html?id=${prId}`;
        });
    });
    
    // ปุ่มส่งอนุมัติ
    document.querySelectorAll('.submit-pr-btn').forEach(button => {
        button.addEventListener('click', function() {
            const prId = this.dataset.id;
            submitPurchaseRequisition(prId);
        });
    });
    
    // ปุ่มอนุมัติด่วน
    document.querySelectorAll('.approve-pr-btn').forEach(button => {
        button.addEventListener('click', function() {
            const prId = this.dataset.id;
            showApprovalForm(prId, 'approve');
        });
    });
    
    // ปุ่มไม่อนุมัติด่วน
    document.querySelectorAll('.reject-pr-btn').forEach(button => {
        button.addEventListener('click', function() {
            const prId = this.dataset.id;
            showApprovalForm(prId, 'reject');
        });
    });
    
    // ปุ่มสร้างใบสั่งซื้อ
    document.querySelectorAll('.create-po-btn').forEach(button => {
        button.addEventListener('click', function() {
            const prId = this.dataset.id;
            window.location.href = `purchase-order.html?pr_id=${prId}`;
        });
    });
}

// ฟังก์ชันสำหรับส่งใบขอซื้อไปอนุมัติ
async function submitPurchaseRequisition(prId) {
    try {
        if (!confirm('ต้องการส่งใบขอซื้อนี้เพื่อขออนุมัติหรือไม่?')) {
            return;
        }
        
        // แสดง loading
        showLoading();
        
        const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
        
        const response = await fetch(`/api/purchase-requisitions/${prId}/submit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        // ซ่อน loading
        hideLoading();
        
        if (!response.ok) {
            throw new Error('ไม่สามารถส่งใบขอซื้อเพื่อขออนุมัติได้');
        }
        
        const result = await response.json();
        
        showAlert('ส่งใบขอซื้อเพื่อขออนุมัติเรียบร้อยแล้ว', 'success');
        
        // โหลดข้อมูลใบขอซื้อใหม่
        const roleId = localStorage.getItem('role_id') || sessionStorage.getItem('role_id');
        loadPurchaseRequisitions(roleId);
    } catch (error) {
        // ซ่อน loading
        hideLoading();
        
        console.error('Error submitting purchase requisition:', error);
        showAlert('ไม่สามารถส่งใบขอซื้อเพื่อขออนุมัติได้', 'error');
    }
}

// ฟังก์ชันสำหรับแสดงฟอร์มการอนุมัติ
function showApprovalForm(prId, action) {
    // เปิด modal แสดงฟอร์มการอนุมัติ
    const modal = document.getElementById('approval-modal');
    if (!modal) return;
    
    const title = action === 'approve' ? 'อนุมัติใบขอซื้อ' : 'ไม่อนุมัติใบขอซื้อ';
    const btnText = action === 'approve' ? 'อนุมัติ' : 'ไม่อนุมัติ';
    const btnClass = action === 'approve' ? 'btn-success' : 'btn-danger';
    
    modal.querySelector('.modal-title').textContent = title;
    
    const formContainer = modal.querySelector('.modal-body');
    formContainer.innerHTML = `
        <div class="form-group">
            <label for="quick-approval-comment">ความเห็น:</label>
            <textarea id="quick-approval-comment" class="form-control" rows="3"></textarea>
        </div>
    `;
    
    const footerContainer = modal.querySelector('.modal-footer');
    footerContainer.innerHTML = `
        <button type="button" class="btn btn-secondary close-modal-btn">ยกเลิก</button>
        <button type="button" class="btn ${btnClass} confirm-approval-btn" data-id="${prId}" data-action="${action}">${btnText}</button>
    `;
    
    // เพิ่ม event listeners
    modal.querySelector('.close-modal-btn').addEventListener('click', function() {
        closeModal('approval-modal');
    });
    
    modal.querySelector('.confirm-approval-btn').addEventListener('click', function() {
        const comments = document.getElementById('quick-approval-comment').value;
        const status = action === 'approve' ? 'approved' : 'rejected';
        
        handleApproval(prId, status, comments);
        closeModal('approval-modal');
    });
    
    openModal('approval-modal');
}

// ฟังก์ชันสำหรับเปิด/ปิด modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.style.display = 'block';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.style.display = 'none';
}

// ฟังก์ชันสำหรับแสดง/ซ่อน loading
function showLoading() {
    const loadingElement = document.querySelector('.loading-overlay');
    if (loadingElement) {
        loadingElement.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingElement = document.querySelector('.loading-overlay');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// ฟังก์ชันสำหรับแสดงข้อความแจ้งเตือน
function showAlert(message, type = 'success') {
    const alertElement = document.getElementById('alert-popup');
    if (!alertElement) return;
    
    alertElement.textContent = message;
    alertElement.className = 'alert-popup';
    
    if (type === 'error') {
        alertElement.classList.add('error');
    }
    
    alertElement.classList.add('show');
    
    setTimeout(() => {
        alertElement.classList.remove('show');
    }, 3000);
}

// ฟังก์ชันสำหรับอัปเดตจำนวนใบขอซื้อตามสถานะ
function updateStatusCounts(requisitions) {
    const draftCount = requisitions.filter(pr => pr.status === 'draft').length;
    const pendingCount = requisitions.filter(pr => pr.status === 'pending').length;
    const approvedCount = requisitions.filter(pr => pr.status === 'approved').length;
    const rejectedCount = requisitions.filter(pr => pr.status === 'rejected').length;
    
    const draftCountElement = document.getElementById('draft-count');
    const pendingCountElement = document.getElementById('pending-count');
    const approvedCountElement = document.getElementById('approved-count');
    const rejectedCountElement = document.getElementById('rejected-count');
    
    if (draftCountElement) draftCountElement.textContent = draftCount;
    if (pendingCountElement) pendingCountElement.textContent = pendingCount;
    if (approvedCountElement) approvedCountElement.textContent = approvedCount;
    if (rejectedCountElement) rejectedCountElement.textContent = rejectedCount;
}

// ฟังก์ชันสำหรับตั้งค่า event listeners สำหรับการกรอง
function setupFilterListeners() {
   const filterButtons = document.querySelectorAll('.filter-btn');
   
   filterButtons.forEach(button => {
       button.addEventListener('click', function() {
           // ลบ class active จากทุกปุ่ม
           filterButtons.forEach(btn => {
               btn.classList.remove('active');
           });
           
           // เพิ่ม class active ให้กับปุ่มที่คลิก
           this.classList.add('active');
           
           // กรองใบขอซื้อตามสถานะ
           const status = this.dataset.status;
           filterPurchaseRequisitionsByStatus(status);
       });
   });
}

// ฟังก์ชันสำหรับกรองใบขอซื้อตามสถานะ
function filterPurchaseRequisitionsByStatus(status) {
   // ดึงข้อมูลใบขอซื้อจาก API
   fetchPurchaseRequisitions().then(requisitions => {
       let filteredRequisitions = requisitions;
       
       // กรองตามสถานะ
       if (status !== 'all') {
           filteredRequisitions = requisitions.filter(pr => pr.status === status);
       }
       
       // แสดงใบขอซื้อที่ผ่านการกรอง
       displayPurchaseRequisitions(filteredRequisitions, 'pr-list-container');
   });
}

// ฟังก์ชันสำหรับตั้งค่า event listeners สำหรับการค้นหา
function setupSearchListener() {
   const searchInput = document.getElementById('search-input');
   if (!searchInput) return;
   
   searchInput.addEventListener('input', function() {
       const searchTerm = this.value.trim().toLowerCase();
       
       // ดึงข้อมูลใบขอซื้อจาก API
       fetchPurchaseRequisitions().then(requisitions => {
           let filteredRequisitions = requisitions;
           
           // กรองตามคำค้นหา
           if (searchTerm) {
               filteredRequisitions = requisitions.filter(pr => 
                   pr.id.toLowerCase().includes(searchTerm) ||
                   pr.title.toLowerCase().includes(searchTerm) ||
                   pr.department.toLowerCase().includes(searchTerm)
               );
           }
           
           // แสดงใบขอซื้อที่ผ่านการกรอง
           displayPurchaseRequisitions(filteredRequisitions, 'pr-list-container');
       });
   });
}

// ฟังก์ชันสำหรับเตรียมข้อมูลจำลอง (mock data) สำหรับการทดสอบ
function getMockPurchaseRequisitions() {
   return [
       {
           id: 'PR-2024-0001',
           title: 'อุปกรณ์สำนักงาน',
           description: 'อุปกรณ์สำนักงานประจำเดือน',
           date: '2024-03-15',
           requested_by: 'procurement@example.com',
           department: 'procurement',
           status: 'approved',
           total_amount: 12500.00,
           created_at: '2024-03-15T08:30:00Z'
       },
       {
           id: 'PR-2024-0002',
           title: 'วัสดุสิ้นเปลือง',
           description: 'วัสดุสิ้นเปลืองสำหรับแผนกการเงิน',
           date: '2024-03-18',
           requested_by: 'finance@example.com',
           department: 'finance',
           status: 'pending',
           total_amount: 8750.00,
           created_at: '2024-03-18T10:15:00Z'
       },
       {
           id: 'PR-2024-0003',
           title: 'อุปกรณ์คอมพิวเตอร์',
           description: 'คอมพิวเตอร์สำหรับฝ่ายไอที',
           date: '2024-03-20',
           requested_by: 'it@example.com',
           department: 'it',
           status: 'draft',
           total_amount: 45800.00,
           created_at: '2024-03-20T09:45:00Z'
       },
       {
           id: 'PR-2024-0004',
           title: 'เฟอร์นิเจอร์สำนักงาน',
           description: 'โต๊ะและเก้าอี้สำหรับห้องประชุม',
           date: '2024-03-22',
           requested_by: 'admin@example.com',
           department: 'admin',
           status: 'rejected',
           total_amount: 28900.00,
           created_at: '2024-03-22T14:20:00Z'
       },
       {
           id: 'PR-2024-0005',
           title: 'อุปกรณ์ตกแต่ง',
           description: 'อุปกรณ์ตกแต่งสำนักงาน',
           date: '2024-03-25',
           requested_by: 'admin@example.com',
           department: 'admin',
           status: 'pending',
           total_amount: 15600.00,
           created_at: '2024-03-25T11:10:00Z'
       }
   ];
}

// ฟังก์ชันสำหรับเตรียมข้อมูลรายละเอียดใบขอซื้อจำลอง
function getMockPurchaseRequisitionDetails(prId) {
   const mockRequisitions = getMockPurchaseRequisitions();
   const requisition = mockRequisitions.find(pr => pr.id === prId);
   
   if (!requisition) {
       throw new Error('ไม่พบใบขอซื้อที่ต้องการ');
   }
   
   // เพิ่มรายการสินค้า
   let items = [];
   
   if (requisition.id === 'PR-2024-0001') {
       items = [
           {
               item_name: 'กระดาษ A4',
               quantity: 10,
               unit: 'รีม',
               unit_price: 120,
               amount: 1200
           },
           {
               item_name: 'ปากกาลูกลื่น',
               quantity: 50,
               unit: 'แพ็ค',
               unit_price: 150,
               amount: 7500
           },
           {
               item_name: 'แฟ้มเอกสาร',
               quantity: 20,
               unit: 'แพ็ค',
               unit_price: 190,
               amount: 3800
           }
       ];
   } else if (requisition.id === 'PR-2024-0002') {
       items = [
           {
               item_name: 'ลวดเย็บกระดาษ',
               quantity: 30,
               unit: 'กล่อง',
               unit_price: 25,
               amount: 750
           },
           {
               item_name: 'คลิปหนีบกระดาษ',
               quantity: 20,
               unit: 'กล่อง',
               unit_price: 40,
               amount: 800
           },
           {
               item_name: 'กระดาษโน้ต',
               quantity: 30,
               unit: 'แพ็ค',
               unit_price: 40,
               amount: 1200
           },
           {
               item_name: 'หมึกเครื่องพิมพ์',
               quantity: 5,
               unit: 'ตลับ',
               unit_price: 1200,
               amount: 6000
           }
       ];
   } else if (requisition.id === 'PR-2024-0003') {
       items = [
           {
               item_name: 'คอมพิวเตอร์โน้ตบุ๊ค',
               quantity: 2,
               unit: 'เครื่อง',
               unit_price: 22900,
               amount: 45800
           }
       ];
   } else if (requisition.id === 'PR-2024-0004') {
       items = [
           {
               item_name: 'โต๊ะประชุม',
               quantity: 1,
               unit: 'ชุด',
               unit_price: 15000,
               amount: 15000
           },
           {
               item_name: 'เก้าอี้สำนักงาน',
               quantity: 10,
               unit: 'ตัว',
               unit_price: 1390,
               amount: 13900
           }
       ];
   } else if (requisition.id === 'PR-2024-0005') {
       items = [
           {
               item_name: 'ต้นไม้ประดิษฐ์',
               quantity: 4,
               unit: 'ต้น',
               unit_price: 1200,
               amount: 4800
           },
           {
               item_name: 'ภาพติดผนัง',
               quantity: 5,
               unit: 'ชิ้น',
               unit_price: 1500,
               amount: 7500
           },
           {
               item_name: 'พรมปูพื้น',
               quantity: 2,
               unit: 'ผืน',
               unit_price: 1650,
               amount: 3300
           }
       ];
   }
   
   // เพิ่มประวัติการอนุมัติ
   let approvals = [];
   
   if (requisition.status === 'approved') {
       approvals = [
           {
               approved_by: 'manager@example.com',
               status: 'approved',
               comments: 'อนุมัติตามความเหมาะสม',
               approved_at: '2024-03-16T10:30:00Z'
           }
       ];
   } else if (requisition.status === 'rejected') {
       approvals = [
           {
               approved_by: 'manager@example.com',
               status: 'rejected',
               comments: 'งบประมาณไม่เพียงพอในขณะนี้ กรุณาเลื่อนไปไตรมาสถัดไป',
               approved_at: '2024-03-23T09:15:00Z'
           }
       ];
   }
   
   return {
       ...requisition,
       items,
       approvals
   };
}


