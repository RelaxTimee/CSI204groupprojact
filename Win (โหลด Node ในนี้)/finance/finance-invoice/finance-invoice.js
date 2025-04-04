

// ฟังก์ชันแปลงวันที่เป็นรูปแบบ dd/mm/yyyy
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// ฟังก์ชันแปลงสถานะจากฐานข้อมูลเป็นสถานะที่เข้าใจง่าย
function mapStatus(status) {
    const statusMap = {
        'pending': 'รอชำระ',
        'approved': 'อนุมัติแล้ว',
        'completed': 'ชำระแล้ว',
        'rejected': 'ปฏิเสธ',
        'overdue': 'เลยกำหนด'
    };
    return statusMap[status] || status;
}

// ฟังก์ชันเรียกชื่อคลาสตามสถานะ
function getStatusClass(status) {
    const dbStatus = status.toLowerCase();
    switch(dbStatus) {
        case 'pending':
        case 'รอชำระ':
            return 'pending';
        case 'approved':
        case 'อนุมัติแล้ว':
            return 'approved';
        case 'completed':
        case 'ชำระแล้ว':
            return 'completed';
        case 'overdue':
        case 'เลยกำหนด':
            return 'overdue';
        case 'rejected':
        case 'ปฏิเสธ':
            return 'rejected';
        default:
            return '';
    }
}

// ฟังก์ชันดึงข้อมูลใบสั่งซื้อจากฐานข้อมูล
const fetchPurchaseOrders = async (filters = {}) => {
    try {
        const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
        if (!token) {
            window.location.href = '/login.html';
            return [];
        }

        // สร้าง query parameters จาก filters
        const queryParams = new URLSearchParams();
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.vendor_id) queryParams.append('vendor_id', filters.vendor_id);
        if (filters.start_date) queryParams.append('start_date', filters.start_date);
        if (filters.end_date) queryParams.append('end_date', filters.end_date);

        const response = await fetch(`http://localhost:3000/api/purchase-orders?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 401) {
            alert('เซสชันหมดอายุ กรุณาล็อกอินใหม่');
            window.location.href = '/login.html';
            return [];
        }
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching purchase orders:', error);
        throw error;
    }
};

// ฟังก์ชันแสดงตารางใบแจ้งหนี้
async function renderInvoiceTable(filters = {}) {
    const tableBody = document.getElementById('invoice-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="8" class="loading-text">กำลังโหลดข้อมูล...</td></tr>';
    
    try {
        const purchaseOrders = await fetchPurchaseOrders(filters);
        
        if (purchaseOrders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="no-data">ไม่พบข้อมูลใบแจ้งหนี้</td></tr>';
            return;
        }

        tableBody.innerHTML = '';
        
        purchaseOrders.forEach(po => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${po.po_number || po.id}</td>
                <td>${po.title || '-'}</td>
                <td>${po.vendor_name || po.vendor_id || '-'}</td>
                <td>${formatDate(po.date)}</td>
                <td>${formatDate(po.delivery_date)}</td>
                <td>฿${(po.total_amount || 0).toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td><span class="status-badge status-${getStatusClass(po.status)}">${mapStatus(po.status)}</span></td>
                <td>
                    <div class="invoice-action-btns">
                        <button class="invoice-action-btn view-invoice-btn" data-id="${po.id}" title="ดูใบแจ้งหนี้">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="invoice-action-btn pay-invoice-btn" data-id="${po.id}" 
                            title="ชำระเงิน" ${po.status === 'completed' || po.status === 'approved' ? 'disabled' : ''}>
                            <i class="fas fa-credit-card"></i>
                        </button>
                        <button class="invoice-action-btn delete-invoice-btn" data-id="${po.id}" title="ลบใบแจ้งหนี้">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });

        addTableButtonsEventListeners();
    } catch (error) {
        console.error('Error rendering invoice table:', error);
        tableBody.innerHTML = '<tr><td colspan="8" class="error-text">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';
    }
}

// ฟังก์ชันอัพเดทข้อมูลสรุป
async function updateSummary(filters = {}) {
    try {
        const purchaseOrders = await fetchPurchaseOrders(filters);
        
        const pendingInvoices = purchaseOrders.filter(po => po.status === 'pending').length;
        const paidInvoices = purchaseOrders.filter(po => 
            po.status === 'completed' || po.status === 'approved'
        ).length;
        
        const today = new Date();
        const overdueInvoices = purchaseOrders.filter(po => {
            const dueDate = po.delivery_date ? new Date(po.delivery_date) : null;
            return po.status === 'pending' && dueDate && dueDate < today;
        }).length;
        
        const totalAmount = purchaseOrders.reduce((sum, po) => sum + (parseFloat(po.total_amount) || 0), 0);

        // อัปเดต DOM
        const pendingCount = document.getElementById('pending-count');
        const paidCount = document.getElementById('paid-count');
        const overdueCount = document.getElementById('overdue-count');
        const totalAmountElement = document.getElementById('total-amount');

        if (pendingCount) pendingCount.textContent = pendingInvoices;
        if (paidCount) paidCount.textContent = paidInvoices;
        if (overdueCount) overdueCount.textContent = overdueInvoices;
        if (totalAmountElement) {
            totalAmountElement.textContent = '฿' + totalAmount.toLocaleString('th-TH');
        }
    } catch (error) {
        console.error('Error updating summary:', error);
    }
}

// ฟังก์ชันกรองข้อมูล
async function filterInvoices() {
    const filters = {
        status: document.getElementById('status-filter')?.value || '',
        vendor_id: document.getElementById('vendor-filter')?.value || '',
        start_date: document.getElementById('start-date')?.value || '',
        end_date: document.getElementById('end-date')?.value || ''
    };
    
    await renderInvoiceTable(filters);
    await updateSummary(filters);
}

// ฟังก์ชันรีเซ็ตตัวกรอง
async function resetFilters() {
    const startDate = document.getElementById('start-date');
    const endDate = document.getElementById('end-date');
    const statusFilter = document.getElementById('status-filter');
    const vendorFilter = document.getElementById('vendor-filter');

    if (startDate) startDate.value = '';
    if (endDate) endDate.value = '';
    if (statusFilter) statusFilter.value = '';
    if (vendorFilter) vendorFilter.value = '';
    
    await renderInvoiceTable();
    await updateSummary();
}

// ฟังก์ชันแสดงรายละเอียดใบแจ้งหนี้
async function viewInvoiceDetail(invoiceId) {
    try {
        const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        // ดึงข้อมูลใบแจ้งหนี้
        const response = await fetch(`http://localhost:3000/api/purchase-orders/${invoiceId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 401) {
            alert('เซสชันหมดอายุ กรุณาล็อกอินใหม่');
            window.location.href = '/login.html';
            return;
        }
        
        if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลใบแจ้งหนี้ได้');
        
        const invoice = await response.json();
        
        // ดึงรายการสินค้า
        const itemsResponse = await fetch(`http://localhost:3000/api/purchase-orders/${invoiceId}/items`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const items = itemsResponse.ok ? await itemsResponse.json() : [];
        
        // อัปเดตข้อมูลใน Modal
        const detailInvoiceId = document.getElementById('detail-invoice-id');
        const detailDescription = document.getElementById('detail-description');
        const detailVendor = document.getElementById('detail-vendor');
        const detailIssueDate = document.getElementById('detail-issue-date');
        const detailDueDate = document.getElementById('detail-due-date');
        const detailStatus = document.getElementById('detail-status');
        const detailItems = document.getElementById('detail-items');
        const detailTotal = document.getElementById('detail-total');
        const payBtn = document.getElementById('pay-invoice-btn');
        const editBtn = document.getElementById('edit-invoice-btn');
        const deleteBtn = document.getElementById('delete-invoice-btn');
        const modal = document.getElementById('invoice-detail-modal');

        if (detailInvoiceId) detailInvoiceId.textContent = invoice.po_number || invoice.id;
        if (detailDescription) detailDescription.textContent = invoice.title || '-';
        if (detailVendor) detailVendor.textContent = invoice.vendor_name || invoice.vendor_id || '-';
        if (detailIssueDate) detailIssueDate.textContent = formatDate(invoice.date);
        if (detailDueDate) detailDueDate.textContent = formatDate(invoice.delivery_date);
        if (detailStatus) {
            detailStatus.textContent = mapStatus(invoice.status);
            detailStatus.className = `status-${getStatusClass(invoice.status)}`;
        }
        
        if (detailItems) {
            detailItems.innerHTML = '';
            items.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.item_name || '-'}</td>
                    <td>${item.quantity || 0}</td>
                    <td>฿${(item.unit_price || 0).toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td>฿${(item.amount || 0).toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                `;
                detailItems.appendChild(row);
            });
        }
        
        if (detailTotal) {
            detailTotal.textContent = `฿${(invoice.total_amount || 0).toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        }
        
        if (payBtn) {
            payBtn.style.display = (invoice.status === 'completed' || invoice.status === 'approved') ? 'none' : 'inline-block';
            payBtn.setAttribute('data-id', invoice.id);
        }
        
        if (editBtn) {
            editBtn.setAttribute('data-id', invoice.id);
        }
        
        if (deleteBtn) {
            deleteBtn.setAttribute('data-id', invoice.id);
        }
        
        if (modal) modal.style.display = 'flex';
        
    } catch (error) {
        console.error('Error viewing invoice details:', error);
        alert('เกิดข้อผิดพลาดในการดึงข้อมูลรายละเอียด: ' + error.message);
    }
}

// ฟังก์ชันปิด Modal
function closeDetailModal() {
    const modal = document.getElementById('invoice-detail-modal');
    if (modal) modal.style.display = 'none';
}

// ฟังก์ชันชำระเงิน
async function payInvoice() {
    const payBtn = document.getElementById('pay-invoice-btn');
    if (!payBtn) return;

    const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    const invoiceId = payBtn.getAttribute('data-id');
    const userId = localStorage.getItem('user_id') || sessionStorage.getItem('user_id');
    
    if (!invoiceId || !userId) {
        alert('ไม่พบข้อมูลที่จำเป็นสำหรับการชำระเงิน');
        return;
    }

    if (confirm(`คุณต้องการชำระเงินใบแจ้งหนี้ ${invoiceId} ใช่หรือไม่?`)) {
        try {
            const response = await fetch(`http://localhost:3000/api/purchase-orders/${invoiceId}/pay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    paid_by: userId,
                    paid_at: new Date().toISOString()
                })
            });

            if (response.status === 401) {
                alert('เซสชันหมดอายุ กรุณาล็อกอินใหม่');
                window.location.href = '/login.html';
                return;
            }

            if (!response.ok) throw new Error('ไม่สามารถอัปเดตสถานะการชำระเงินได้');

            await renderInvoiceTable();
            await updateSummary();
            closeDetailModal();
            alert(`ชำระใบแจ้งหนี้ ${invoiceId} เรียบร้อยแล้ว`);
        } catch (error) {
            console.error('Error paying invoice:', error);
            alert('เกิดข้อผิดพลาดในการชำระเงิน: ' + error.message);
        }
    }
}

// ฟังก์ชันลบใบแจ้งหนี้
async function deleteInvoice(invoiceId) {
    if (!confirm(`คุณต้องการลบใบแจ้งหนี้ ${invoiceId} ใช่หรือไม่?`)) return;

    try {
        const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch(`http://localhost:3000/api/purchase-orders/${invoiceId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            alert('เซสชันหมดอายุ กรุณาล็อกอินใหม่');
            window.location.href = '/login.html';
            return;
        }

        if (!response.ok) throw new Error('ไม่สามารถลบใบแจ้งหนี้ได้');

        await renderInvoiceTable();
        await updateSummary();
        closeDetailModal();
        alert(`ลบใบแจ้งหนี้ ${invoiceId} เรียบร้อยแล้ว`);
    } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('เกิดข้อผิดพลาดในการลบใบแจ้งหนี้: ' + error.message);
    }
}

// ฟังก์ชันเปิด Modal สร้างใบแจ้งหนี้ใหม่
function openAddInvoiceModal() {
    const modal = document.getElementById('edit-invoice-modal');
    const modalTitle = document.getElementById('edit-modal-title');
    const editForm = document.getElementById('edit-invoice-form');
    
    if (modalTitle) modalTitle.textContent = 'สร้างใบแจ้งหนี้ใหม่';
    if (editForm) editForm.reset();
    if (modal) modal.style.display = 'block';
}

// ฟังก์ชันปิด Modal แก้ไข
function closeEditModal() {
    const modal = document.getElementById('edit-invoice-modal');
    if (modal) modal.style.display = 'none';
}

// ฟังก์ชันบันทึกใบแจ้งหนี้
// แก้ฟังก์ชัน saveInvoice ให้สมบูรณ์
async function saveInvoice(event) {
    event.preventDefault();
    
    const invoiceId = document.getElementById('edit-invoice-id').value;
    const items = Array.from(document.querySelectorAll('#edit-items-container .edit-invoice-item')).map(item => {
        const inputs = item.querySelectorAll('input');
        return {
            name: inputs[0]?.value || '',
            quantity: parseFloat(inputs[1]?.value) || 0,
            unit_price: parseFloat(inputs[2]?.value) || 0
        };
    });

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    const payload = {
        description: document.getElementById('edit-description').value,
        vendor: document.getElementById('edit-vendor').value,
        issueDate: document.getElementById('edit-issue-date').value,
        dueDate: document.getElementById('edit-due-date').value,
        status: document.getElementById('edit-status').value,
        total_amount: totalAmount,
        items: items
    };

    try {
        const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
        const method = invoiceId ? 'PUT' : 'POST';
        const url = `http://localhost:3000/api/purchase-orders/${invoiceId || ''}`;

        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(await response.text());
        
        await renderInvoiceTable();
        closeEditModal();
        alert(invoiceId ? 'แก้ไขใบแจ้งหนี้สำเร็จ' : 'สร้างใบแจ้งหนี้สำเร็จ');
    } catch (error) {
        console.error('Error saving invoice:', error);
        alert('เกิดข้อผิดพลาด: ' + error.message);
    }
}
// แก้ไขฟังก์ชัน calculateTotal
function calculateTotal() {
    const items = document.querySelectorAll('#edit-items-container .edit-invoice-item');
    let total = 0;

    items.forEach(item => {
        const inputs = item.querySelectorAll('input');
        const quantity = parseFloat(inputs[1]?.value) || 0; // input จำนวน
        const unitPrice = parseFloat(inputs[2]?.value) || 0; // input ราคาต่อหน่วย
        const amount = quantity * unitPrice;
        
        // อัปเดตแสดงผลรวมรายการ (ถ้ามี element แสดงผลรวม)
        const amountSpan = item.querySelector('.item-amount');
        if (amountSpan) {
            amountSpan.textContent = `฿${amount.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        }
        
        total += amount;
    });

    // อัปเดตยอดรวมทั้งหมด
    const totalElement = document.getElementById('edit-total-amount');
    if (totalElement) {
        totalElement.textContent = `฿${total.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
}
// ฟังก์ชันเพิ่มรายการสินค้า
function addNewItem() {
    const container = document.getElementById('edit-items-container');
    if (!container) return;

    const itemDiv = document.createElement('div');
    itemDiv.className = 'edit-invoice-item';
    itemDiv.innerHTML = `
        <input type="text" placeholder="ชื่อรายการ" required>
        <input type="number" placeholder="จำนวน" min="1" value="1" required>
        <input type="number" placeholder="ราคาต่อหน่วย" min="0" step="0.01" value="0" required>
        <span class="item-amount">฿0.00</span>
        <button type="button" class="remove-item-btn"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(itemDiv);

    // เพิ่ม Event Listeners สำหรับคำนวณยอดรวมอัตโนมัติ
    const inputs = itemDiv.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', calculateTotal);
    });

    // เพิ่ม Event Listener สำหรับปุ่มลบ
    itemDiv.querySelector('.remove-item-btn').addEventListener('click', function() {
        itemDiv.remove();
        calculateTotal();
    });

    calculateTotal();
}

// ฟังก์ชันเพิ่ม Event Listeners สำหรับปุ่มในตาราง
function addTableButtonsEventListeners() {
    // ปุ่มดูรายละเอียด
    document.querySelectorAll('.view-invoice-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const invoiceId = this.getAttribute('data-id');
            viewInvoiceDetail(invoiceId);
        });
    });
    
    // ปุ่มแก้ไข
    document.querySelectorAll('.edit-invoice-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const invoiceId = this.getAttribute('data-id');
            openEditModal(invoiceId);
        });
    });
    
    // ปุ่มลบ
    document.querySelectorAll('.delete-invoice-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const invoiceId = this.getAttribute('data-id');
            deleteInvoice(invoiceId);
        });
    });
}
// เพิ่มฟังก์ชันนี้ก่อน setupEventListeners
function openEditModal(invoiceId) {
    const modal = document.getElementById('edit-invoice-modal');
    const modalTitle = document.getElementById('edit-modal-title');
    const editForm = document.getElementById('edit-invoice-form');
    const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
    
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    if (modalTitle) modalTitle.textContent = invoiceId ? 'แก้ไขใบแจ้งหนี้' : 'สร้างใบแจ้งหนี้ใหม่';
    
    if (modal) {
        if (invoiceId) {
            // โหลดข้อมูลใบแจ้งหนี้ตาม invoiceId
            fetch(`http://localhost:3000/api/purchase-orders/${invoiceId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
                .then(response => {
                    if (response.status === 401) {
                        alert('เซสชันหมดอายุ กรุณาล็อกอินใหม่');
                        window.location.href = '/login.html';
                        return;
                    }
                    return response.json();
                })
                .then(invoice => {
                    // เติมข้อมูลลงในฟอร์มแก้ไข
                    document.getElementById('edit-invoice-id').value = invoice.id;
                    document.getElementById('edit-description').value = invoice.title || '';
                    document.getElementById('edit-vendor').value = invoice.vendor_id || '';
                    document.getElementById('edit-issue-date').value = invoice.date.split('T')[0];
                    document.getElementById('edit-due-date').value = invoice.delivery_date ? invoice.delivery_date.split('T')[0] : '';
                    document.getElementById('edit-status').value = invoice.status;
                    
                    // โหลดรายการสินค้า
                    const itemsContainer = document.getElementById('edit-items-container');
                    itemsContainer.innerHTML = '';
                    
                    fetch(`http://localhost:3000/api/purchase-orders/${invoiceId}/items`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    })
                        .then(response => {
                            if (response.status === 401) {
                                alert('เซสชันหมดอายุ กรุณาล็อกอินใหม่');
                                window.location.href = '/login.html';
                                return;
                            }
                            return response.json();
                        })
                        .then(items => {
                            itemsContainer.innerHTML = '';
                            items.forEach(item => {
                                const itemDiv = document.createElement('div');
                                itemDiv.className = 'edit-invoice-item';
                                itemDiv.innerHTML = `
                                    <div class="edit-invoice-item-row">
                                        <input type="text" value="${item.item_name || ''}" placeholder="ชื่อรายการ" required>
                                        <input type="number" value="${item.quantity || 0}" placeholder="จำนวน" min="1" required>
                                        <input type="number" value="${item.unit_price || 0}" placeholder="ราคาต่อหน่วย" min="0" step="0.01" required>
                                        <button type="button" class="remove-item-btn"><i class="fas fa-times"></i></button>
                                    </div>
                                `;
                                itemsContainer.appendChild(itemDiv);
                            });
                        })
                        .catch(error => {
                            console.error('Error loading items:', error);
                            alert('เกิดข้อผิดพลาดในการโหลดรายการสินค้า');
                        });
                    
                    modal.style.display = 'block';
                })
                .catch(error => {
                    console.error('Error loading invoice data:', error);
                    alert('เกิดข้อผิดพลาดในการโหลดข้อมูลใบแจ้งหนี้');
                });
        } else {
            // กรณีสร้างใหม่
            document.getElementById('edit-invoice-id').value = '';
            document.getElementById('edit-description').value = '';
            document.getElementById('edit-vendor').value = '';
            document.getElementById('edit-issue-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('edit-due-date').value = '';
            document.getElementById('edit-status').value = 'pending';
            
            const itemsContainer = document.getElementById('edit-items-container');
            itemsContainer.innerHTML = '';
            
            modal.style.display = 'block';
        }
    }
}


// หรือแก้ไขใน setupEventListeners ให้ใช้ฟังก์ชันที่มีอยู่แล้ว
document.getElementById('edit-invoice-btn')?.addEventListener('click', function() {
    const invoiceId = this.getAttribute('data-id');
    openEditModal(invoiceId); // ใช้ openEditModal ที่มีอยู่แทน
});
function openEditModalFromDetail() {
    const editBtn = document.getElementById('edit-invoice-btn');
    if (editBtn) {
        const invoiceId = editBtn.getAttribute('data-id');
        openEditModal(invoiceId);
    }
}
function deleteInvoiceFromDetail() {
    const deleteBtn = document.getElementById('delete-invoice-btn');
    if (deleteBtn) {
        const invoiceId = deleteBtn.getAttribute('data-id');
        deleteInvoice(invoiceId);
    }
}


// ฟังก์ชันตั้งค่า Event Listeners หลัก
// ฟังก์ชันตั้งค่า Event Listeners หลัก
function setupEventListeners() {
    // ปุ่มกรองข้อมูล
    const filterBtn = document.getElementById('filter-btn');
    if (filterBtn) filterBtn.addEventListener('click', filterInvoices);
    
    // ปุ่มรีเซ็ตตัวกรอง
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);
    
    // ปุ่มสร้างใบแจ้งหนี้ใหม่
    const addBtn = document.getElementById('add-invoice-btn');
    if (addBtn) addBtn.addEventListener('click', openAddInvoiceModal);
    
    // ปุ่มปิด Modal รายละเอียด
    const closeDetailModalBtn = document.getElementById('close-detail-modal');
    const closeDetailBtn = document.getElementById('close-detail-btn');
    if (closeDetailModalBtn) closeDetailModalBtn.addEventListener('click', closeDetailModal);
    if (closeDetailBtn) closeDetailBtn.addEventListener('click', closeDetailModal);
    
    // ปุ่มใน Modal รายละเอียด
    const payInvoiceBtn = document.getElementById('pay-invoice-btn');
    const deleteInvoiceBtn = document.getElementById('delete-invoice-btn');
    
    // แก้ไขบรรทัดนี้ - ใช้วิธีที่ 2
    document.getElementById('edit-invoice-btn')?.addEventListener('click', openEditModalFromDetail);
    
    if (payInvoiceBtn) payInvoiceBtn.addEventListener('click', payInvoice);
    if (deleteInvoiceBtn) deleteInvoiceBtn.addEventListener('click', deleteInvoiceFromDetail);
    
    // ปุ่มปิด Modal แก้ไข
    const closeEditModalBtn = document.getElementById('close-edit-modal');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', closeEditModal);
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);
    
    // ฟอร์มแก้ไขใบแจ้งหนี้
    const editForm = document.getElementById('edit-invoice-form');
    if (editForm) editForm.addEventListener('submit', saveInvoice);
    
    // ปุ่มเพิ่มรายการสินค้า
    const addItemBtn = document.getElementById('add-item-btn');
    if (addItemBtn) addItemBtn.addEventListener('click', addNewItem);
}

// รอให้หน้าเว็บโหลดเสร็จก่อนทำงาน
document.addEventListener('DOMContentLoaded', async function() {
    // ตรวจสอบการเข้าสู่ระบบ
    const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // ตรวจสอบสิทธิ์การเข้าถึง
    const roleId = localStorage.getItem('role_id') || sessionStorage.getItem('role_id');
    if (roleId != 4) {
        alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
        window.location.href = '/dashboard.html';
        return;
    }

    // แสดงชื่อผู้ใช้
    const username = localStorage.getItem('username') || sessionStorage.getItem('username');
    const usernameDisplay = document.getElementById('username-display');
    if (username && usernameDisplay) usernameDisplay.textContent = username;

    // โหลดข้อมูลและตั้งค่า Event Listeners
    try {
        await updateSummary();
        await renderInvoiceTable();
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing page:', error);
    }
});

