// ฟังก์ชันแปลงวันที่เป็นรูปแบบ dd/mm/yyyy
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// ฟังก์ชันเรียกชื่อคลาสตามสถานะ
function getStatusClass(status) {
    switch(status) {
        case 'รอชำระ':
            return 'pending';
        case 'ชำระแล้ว':
            return 'approved';
        case 'ยกเลิก':
            return 'cancelled';
        default:
            return '';
    }
}

// ข้อมูลใบแจ้งหนี้ตัวอย่าง
let invoices = [
    {
        id: "INV-2024-0001",
        description: "เครื่องคอมพิวเตอร์และอุปกรณ์",
        vendor: "บริษัท คอมเทค จำกัด",
        issueDate: "2024-03-10",
        dueDate: "2024-04-09",
        amount: 120000,
        status: "ชำระแล้ว",
        items: [
            { name: "คอมพิวเตอร์ตั้งโต๊ะ", quantity: 3, unitPrice: 25000, total: 75000 },
            { name: "จอมอนิเตอร์", quantity: 5, unitPrice: 5000, total: 25000 },
            { name: "คีย์บอร์ดและเมาส์", quantity: 5, unitPrice: 2000, total: 10000 },
            { name: "อุปกรณ์เน็ตเวิร์ค", quantity: 1, unitPrice: 10000, total: 10000 }
        ]
    },
    {
        id: "INV-2024-0002",
        description: "อุปกรณ์สำนักงาน",
        vendor: "บริษัท ออฟฟิศแมท จำกัด",
        issueDate: "2024-03-15",
        dueDate: "2024-04-14",
        amount: 35000,
        status: "รอชำระ",
        items: [
            { name: "โต๊ะทำงาน", quantity: 2, unitPrice: 8000, total: 16000 },
            { name: "เก้าอี้สำนักงาน", quantity: 5, unitPrice: 3000, total: 15000 },
            { name: "ตู้เอกสาร", quantity: 1, unitPrice: 4000, total: 4000 }
        ]
    }
];

// ฟังก์ชันสำหรับแสดงรายการชำระเงิน
function displayPayments() {
    renderPaymentTable();
    updateSummary();
}

// ฟังก์ชันเปิด modal สร้างรายการชำระเงินใหม่
function openAddPaymentModal() {
    // รีเซ็ตฟอร์ม
    document.getElementById('payment-form').reset();
    document.getElementById('payment-id').value = '';
    document.getElementById('payment-modal-title').textContent = 'สร้างรายการชำระเงินใหม่';
    
    // กำหนดวันที่ปัจจุบัน
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('payment-date').value = today;
    
    // เติมข้อมูลใบแจ้งหนี้
    populateInvoiceNumbers();
    
    // แสดง modal
    const modal = document.getElementById('payment-modal');
    modal.style.display = 'flex';
}

// ฟังก์ชันเติมข้อมูลใบแจ้งหนี้
function populateInvoiceNumbers() {
    const invoiceSelect = document.getElementById('invoice-number');
    invoiceSelect.innerHTML = '<option value="">เลือกใบแจ้งหนี้</option>';
    
    // ตรวจสอบใบแจ้งหนี้ที่ยังไม่ได้ชำระ
    const unpaidInvoices = invoices.filter(inv => inv.status !== 'ชำระแล้ว');
    
    unpaidInvoices.forEach(invoice => {
        const option = document.createElement('option');
        option.value = invoice.id;
        option.textContent = `${invoice.id} - ${invoice.description} (${invoice.amount} บาท)`;
        invoiceSelect.appendChild(option);
    });
}

// ฟังก์ชันปิด modal
function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    modal.style.display = 'none';
}

// ฟังก์ชันปิด modal รายละเอียด
function closeDetailModal() {
    const modal = document.getElementById('payment-detail-modal');
    modal.style.display = 'none';
}

// ฟังก์ชันแก้ไขจากหน้ารายละเอียด
function editPaymentFromDetail() {
    const paymentId = document.getElementById('detail-payment-id').textContent;
    closeDetailModal();
    openEditModal(paymentId);
}

// ฟังก์ชันแก้ไขการชำระเงิน
function openEditModal(paymentId) {
    const payment = payments.find(pay => pay.id === paymentId);
    
    if (!payment) return;
    
    // กำหนดค่าในฟอร์ม
    document.getElementById('payment-modal-title').textContent = 'แก้ไขรายการชำระเงิน';
    document.getElementById('payment-id').value = payment.id;
    
    // เติมข้อมูลใบแจ้งหนี้
    populateInvoiceNumbers();
    
    // กำหนดค่าฟอร์ม
    document.getElementById('invoice-number').value = payment.invoiceNumber;
    document.getElementById('payment-date').value = payment.paymentDate;
    document.getElementById('amount').value = payment.amount;
    document.getElementById('payment-method').value = payment.paymentMethod;
    document.getElementById('payee').value = payment.payee;
    document.getElementById('notes').value = payment.notes;
    
    // แสดง modal
    const modal = document.getElementById('payment-modal');
    modal.style.display = 'flex';
}

// ส่วนที่เหลือของโค้ดจากเอกสารเดิม (จากไฟล์ paste.txt)
// ... (คงเหลือโค้ดเดิมทั้งหมด)
// ข้อมูลการชำระเงินตัวอย่าง
let payments = [
    {
        id: "PAY-2024-0001",
        invoiceNumber: "INV-2024-0001",
        paymentDate: "2024-03-15",
        amount: 120000,
        paymentMethod: "โอนเงิน",
        payee: "บริษัท คอมเทค จำกัด",
        notes: "ชำระค่าเครื่องคอมพิวเตอร์และอุปกรณ์",
        status: "ชำระแล้ว"
    },
    {
        id: "PAY-2024-0002",
        invoiceNumber: "INV-2024-0002",
        paymentDate: "2024-03-20",
        amount: 35000,
        paymentMethod: "เช็ค",
        payee: "บริษัท ออฟฟิศแมท จำกัด",
        notes: "ชำระค่าอุปกรณ์สำนักงาน",
        status: "รอชำระ"
    },
    {
        id: "PAY-2024-0003",
        invoiceNumber: "INV-2024-0003",
        paymentDate: "2024-02-25",
        amount: 150000,
        paymentMethod: "บัตรเครดิต",
        payee: "บริษัท ดิจิทัลโซลูชัน จำกัด",
        notes: "ชำระค่าซอฟต์แวร์ระบบบัญชี",
        status: "ยกเลิก"
    }
];

// รอให้หน้าเว็บโหลดเสร็จก่อนทำงาน
document.addEventListener('DOMContentLoaded', function() {
    // แสดงข้อมูลสรุป
    updateSummary();

    // แสดงตารางการชำระเงิน
    renderPaymentTable();

    // เพิ่ม event listeners
    setupEventListeners();
});

// ฟังก์ชันอัพเดทข้อมูลสรุป
function updateSummary() {
    const pendingPayments = payments.filter(payment => payment.status === "รอชำระ");
    const paidPayments = payments.filter(payment => payment.status === "ชำระแล้ว");
    const cancelledPayments = payments.filter(payment => payment.status === "ยกเลิก");
    const totalPaid = paidPayments.reduce((sum, payment) => sum + payment.amount, 0);

    document.getElementById('pending-count').textContent = pendingPayments.length;
    document.getElementById('paid-count').textContent = paidPayments.length;
    document.getElementById('cancelled-count').textContent = cancelledPayments.length;
    document.getElementById('total-paid').textContent = '฿' + totalPaid.toLocaleString();
}

// ฟังก์ชันแสดงตารางการชำระเงิน
function renderPaymentTable(filteredPayments = null) {
    const tableBody = document.getElementById('payment-table-body');
    tableBody.innerHTML = '';

    const displayPayments = filteredPayments || payments;

    displayPayments.forEach(payment => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payment.id}</td>
            <td>${payment.invoiceNumber}</td>
            <td>${payment.payee}</td>
            <td>${formatDate(payment.paymentDate)}</td>
            <td>฿${payment.amount.toLocaleString()}</td>
            <td>${payment.paymentMethod}</td>
            <td><span class="status-badge status-${getStatusClass(payment.status)}">${payment.status}</span></td>
            <td>
                <div class="payment-action-btns">
                    <button class="payment-action-btn view-payment-btn" data-id="${payment.id}" title="ดูรายละเอียด"><i class="fas fa-eye"></i></button>
                    <button class="payment-action-btn edit-payment-btn" data-id="${payment.id}" title="แก้ไข"><i class="fas fa-edit"></i></button>
                    <button class="payment-action-btn delete-payment-btn" data-id="${payment.id}" title="ลบ"><i class="fas fa-trash-alt"></i></button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // เพิ่ม event listeners สำหรับปุ่มในตาราง
    addTableButtonsEventListeners();
}

// ฟังก์ชันเพิ่ม event listeners สำหรับปุ่มในตาราง
function addTableButtonsEventListeners() {
    // ปุ่มดูรายละเอียด
    document.querySelectorAll('.view-payment-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const paymentId = this.getAttribute('data-id');
            viewPaymentDetail(paymentId);
        });
    });

    // ปุ่มแก้ไข
    document.querySelectorAll('.edit-payment-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const paymentId = this.getAttribute('data-id');
            openEditModal(paymentId);
        });
    });

    // ปุ่มลบ
    document.querySelectorAll('.delete-payment-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const paymentId = this.getAttribute('data-id');
            deletePayment(paymentId);
        });
    });
}

// ฟังก์ชันสำหรับเพิ่ม event listeners หลัก
function setupEventListeners() {
    // ปุ่มกรองข้อมูล
    document.getElementById('filter-btn').addEventListener('click', filterPayments);
    
    // ปุ่มรีเซ็ตตัวกรอง
    document.getElementById('reset-btn').addEventListener('click', resetFilters);
    
    // ปุ่มสร้างรายการชำระเงินใหม่
    document.getElementById('add-payment-btn').addEventListener('click', openAddPaymentModal);
    
    // ปุ่มปิด modal
    document.getElementById('close-payment-modal').addEventListener('click', closePaymentModal);
    document.getElementById('cancel-payment-btn').addEventListener('click', closePaymentModal);
    
    // ฟอร์มบันทึกรายการชำระเงิน
    document.getElementById('payment-form').addEventListener('submit', savePayment);
    
    // ปุ่มในโมดอลรายละเอียด
    document.getElementById('close-detail-modal').addEventListener('click', closeDetailModal);
    document.getElementById('close-detail-btn').addEventListener('click', closeDetailModal);
    document.getElementById('edit-payment-btn').addEventListener('click', editPaymentFromDetail);
}

// ฟังก์ชันกรองข้อมูล
function filterPayments() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const status = document.getElementById('status-filter').value;
    const paymentMethod = document.getElementById('payment-method-filter').value;
    
    let filtered = [...payments];
    
    if (startDate) {
        filtered = filtered.filter(payment => payment.paymentDate >= startDate);
    }
    
    if (endDate) {
        filtered = filtered.filter(payment => payment.paymentDate <= endDate);
    }
    
    if (status) {
        filtered = filtered.filter(payment => payment.status === status);
    }
    
    if (paymentMethod) {
        filtered = filtered.filter(payment => payment.paymentMethod === paymentMethod);
    }
    
    renderPaymentTable(filtered);
}

// ฟังก์ชันรีเซ็ตตัวกรอง
function resetFilters() {
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    document.getElementById('status-filter').value = '';
    document.getElementById('payment-method-filter').value = '';
    
    renderPaymentTable();
}

// ฟังก์ชันแสดงรายละเอียดการชำระเงิน
function viewPaymentDetail(paymentId) {
    const payment = payments.find(pay => pay.id === paymentId);
    const invoice = invoices.find(inv => inv.id === payment.invoiceNumber);
    
    if (!payment) return;
    
    // แสดงข้อมูลการชำระเงินใน modal
    document.getElementById('detail-payment-id').textContent = payment.id;
    document.getElementById('detail-payment-date').textContent = formatDate(payment.paymentDate);
    document.getElementById('detail-status').textContent = payment.status;
    document.getElementById('detail-payment-method').textContent = payment.paymentMethod;
    document.getElementById('detail-payee').textContent = payment.payee;
    document.getElementById('detail-invoice-number').textContent = payment.invoiceNumber;
    document.getElementById('detail-description').textContent = payment.notes;
    
    // แสดงรายการสินค้า
    const itemsContainer = document.getElementById('detail-items');
    itemsContainer.innerHTML = '';
    
    if (invoice && invoice.items) {
        invoice.items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>฿${item.total.toLocaleString()}</td>
            `;
            itemsContainer.appendChild(row);
        });
    }
    
    // แสดงยอดรวม
    document.getElementById('detail-total-amount').textContent = `฿${payment.amount.toLocaleString()}`;
    
    // แสดง modal
    const modal = document.getElementById('payment-detail-modal');
    modal.style.display = 'flex';
}

// เพิ่มฟังก์ชันสำหรับสร้าง ID ใหม่
function generateNewPaymentId() {
    // หา ID ล่าสุด
    const latestId = payments.length > 0 ? payments[0].id : null;
    
    if (latestId) {
        // แยกส่วนของ ID (เช่น "PAY-2024-0015")
        const parts = latestId.split('-');
        const lastNumber = parseInt(parts[2]);
        
        // สร้าง ID ใหม่
        return `PAY-2024-${(lastNumber + 1).toString().padStart(4, '0')}`;
    } else {
        return 'PAY-2024-0001';
    }
}

// ฟังก์ชันเปิด modal สร้างรายการชำระเงินใหม่
function openAddPaymentModal() {
    // รีเซ็ตฟอร์ม
    document.getElementById('payment-form').reset();
    document.getElementById('payment-id').value = '';
    document.getElementById('payment-modal-title').textContent = 'สร้างรายการชำระเงินใหม่';
    
    // กำหนดวันที่ปัจจุบัน
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('payment-date').value = today;
    
    // เติมข้อมูลใบแจ้งหนี้
    populateInvoiceNumbers();
    
    // แสดง modal
    const modal = document.getElementById('payment-modal');
    modal.style.display = 'flex';
}

// ฟังก์ชันเปิด modal แก้ไข
function openEditModal(paymentId) {
    const payment = payments.find(pay => pay.id === paymentId);
    
    if (!payment) return;
    
    // กำหนดค่าในฟอร์ม
    document.getElementById('payment-modal-title').textContent = 'แก้ไขรายการชำระเงิน';
    document.getElementById('payment-id').value = payment.id;
    
    // เติมข้อมูลใบแจ้งหนี้
    populateInvoiceNumbers();
    
    // กำหนดค่าฟอร์ม
    document.getElementById('invoice-number').value = payment.invoiceNumber;
    document.getElementById('payment-date').value = payment.paymentDate;
    document.getElementById('amount').value = payment.amount;
    document.getElementById('payment-method').value = payment.paymentMethod;
    document.getElementById('payee').value = payment.payee;
    document.getElementById('notes').value = payment.notes;
    
    // แสดง modal
    const modal = document.getElementById('payment-modal');
    modal.style.display = 'flex';
}

// ฟังก์ชันบันทึกรายการชำระเงิน
function savePayment(event) {
    event.preventDefault();
    
    // รับค่าจากฟอร์ม
    const paymentId = document.getElementById('payment-id').value;
    const invoiceNumber = document.getElementById('invoice-number').value;
    const paymentDate = document.getElementById('payment-date').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const paymentMethod = document.getElementById('payment-method').value;
    const payee = document.getElementById('payee').value;
    const notes = document.getElementById('notes').value;
    
    // กำหนดสถานะ
    const status = 'ชำระแล้ว';
    
    // สร้าง ID ใหม่หากเป็นรายการใหม่
    const newPaymentId = paymentId || generateNewPaymentId();
    const newPayment = {
        id: newPaymentId,
        invoiceNumber: invoiceNumber,
        paymentDate: paymentDate,
        amount: amount,
        paymentMethod: paymentMethod,
        payee: payee,
        notes: notes,
        status: status
    };  
    
    if (paymentId) {
        // แก้ไขรายการชำระเงิน
        const index = payments.findIndex(pay => pay.id === paymentId);
        payments[index] = newPayment;
    } else {
        // สร้างรายการชำระเงินใหม่
        payments.unshift(newPayment);
    }
    
    // ปิด modal
    const modal = document.getElementById('payment-modal');
    modal.style.display = 'none';
    
    // รีเซ็ตฟอร์ม
    document.getElementById('payment-form').reset();
    
    // แสดงตารางชำระเงิน
    displayPayments();

    function closePaymentModal() {
        const modal = document.getElementById('payment-modal');
        modal.style.display = 'none';
    }
}