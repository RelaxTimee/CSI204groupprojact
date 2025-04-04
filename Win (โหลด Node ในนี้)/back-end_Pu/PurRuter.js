if (rejectedCountElement) rejectedCountElement.textContent = rejectedCount;

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

// ฟังก์ชันสำหรับเพิ่ม event listeners ให้กับแถวรายการในใบสั่งซื้อ
function addPOItemEventListeners(row) {
   const quantityInput = row.querySelector('.item-quantity');
   const priceInput = row.querySelector('.item-price');
   const totalInput = row.querySelector('.item-total');
   const removeBtn = row.querySelector('.remove-item-btn');
   
   // คำนวณราคารวม
   function calculateTotal() {
       const quantity = parseFloat(quantityInput.value) || 0;
       const price = parseFloat(priceInput.value) || 0;
       const total = quantity * price;
       totalInput.value = total.toFixed(2);
       
       // คำนวณยอดรวมทั้งหมด
       calculatePOGrandTotal();
   }
   
   // เพิ่ม event listeners
   quantityInput.addEventListener('input', calculateTotal);
   priceInput.addEventListener('input', calculateTotal);
   
   // ลบรายการ
   removeBtn.addEventListener('click', function() {
       row.remove();
       calculatePOGrandTotal();
   });
}

// ฟังก์ชันสำหรับคำนวณยอดรวมทั้งหมดในใบสั่งซื้อ
function calculatePOGrandTotal() {
   const totalInputs = document.querySelectorAll('.item-total');
   let grandTotal = 0;
   
   totalInputs.forEach(input => {
       grandTotal += parseFloat(input.value) || 0;
   });
   
   document.getElementById('grand-total').textContent = grandTotal.toLocaleString('th-TH', {
       minimumFractionDigits: 2,
       maximumFractionDigits: 2
   });
}

// ฟังก์ชันสำหรับสร้างเลขที่ใบสั่งซื้อใหม่
function generateNewPurchaseOrderId() {
   const today = new Date();
   const year = today.getFullYear();
   const randomNum = Math.floor(1000 + Math.random() * 9000);
   const poNumber = `PO-${year}-${randomNum}`;
   
   document.getElementById('po-number').value = poNumber;
}

// ฟังก์ชันสำหรับโหลดข้อมูลสำหรับหน้า dashboard ฝ่ายจัดซื้อ
function loadProcurementDashboardData() {
   // โหลดข้อมูลใบขอซื้อที่รอดำเนินการ
   loadPendingRequisitions();
   
   // โหลดข้อมูลใบสั่งซื้อที่รอดำเนินการ
   loadPendingPurchaseOrders();
   
   // โหลดข้อมูลสรุปสำหรับแสดงใน dashboard
   loadProcurementSummary();
}
// ฟังก์ชันสำหรับแสดงใบขอซื้อที่รอดำเนินการ
function displayPendingRequisitions(requisitions) {
   const container = document.getElementById('pending-requisitions');
   if (!container) return;
   
   container.innerHTML = '';
   
   if (requisitions.length === 0) {
       container.innerHTML = '<div class="empty-state">ไม่มีใบขอซื้อที่รอดำเนินการ</div>';
       return;
   }
   
   requisitions.forEach(req => {
       const item = document.createElement('div');
       item.className = 'procurement-item';
       item.innerHTML = `
           <div class="procurement-item-info">
               <p><strong>${req.id}</strong> - ${req.title}</p>
               <small>โดย ${req.requested_by} | วันที่ ${formatDate(req.date)}</small>
           </div>
           <div class="procurement-item-status">
               <span class="status-badge status-pending">รออนุมัติ</span>
           </div>
       `;
       container.appendChild(item);
       
       // เพิ่ม event listener เพื่อดูรายละเอียด
       item.addEventListener('click', function() {
           window.location.href = `purchase-requisition-details.html?id=${req.id}`;
       });
   });
}

// โหลดข้อมูลใบสั่งซื้อที่รอดำเนินการ
async function loadPendingPurchaseOrders() {
   try {
       const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
       
       const response = await fetch('/api/purchase-orders?status=pending', {
           method: 'GET',
           headers: {
               'Authorization': `Bearer ${token}`
           }
       });
       
       if (!response.ok) {
           throw new Error('ไม่สามารถดึงข้อมูลใบสั่งซื้อที่รอดำเนินการได้');
       }
       
       const orders = await response.json();
       displayPendingPurchaseOrders(orders);
   } catch (error) {
       console.error('Error loading pending purchase orders:', error);
       
       // ในกรณีที่มีปัญหาในการเชื่อมต่อ ใช้ข้อมูลจำลอง
       const mockOrders = [
           {
               id: 'PO-2024-0001',
               title: 'อุปกรณ์สำนักงาน',
               date: '2024-03-17',
               status: 'pending',
               total_amount: 12500.00,
               vendor: 'บริษัท ABC จำกัด'
           },
           {
               id: 'PO-2024-0002',
               title: 'วัสดุสิ้นเปลือง',
               date: '2024-03-20',
               status: 'pending',
               total_amount: 8750.00,
               vendor: 'บริษัท XYZ จำกัด'
           }
       ];
       
       displayPendingPurchaseOrders(mockOrders);
   }
}

// ฟังก์ชันสำหรับแสดงใบสั่งซื้อที่รอดำเนินการ
function displayPendingPurchaseOrders(orders) {
   const container = document.getElementById('pending-orders');
   if (!container) return;
   
   container.innerHTML = '';
   
   if (orders.length === 0) {
       container.innerHTML = '<div class="empty-state">ไม่มีใบสั่งซื้อที่รอดำเนินการ</div>';
       return;
   }
   
   orders.forEach(order => {
       const item = document.createElement('div');
       item.className = 'procurement-item';
       item.innerHTML = `
           <div class="procurement-item-info">
               <p><strong>${order.id}</strong> - ${order.title}</p>
               <small>ผู้ขาย: ${order.vendor} | วันที่ ${formatDate(order.date)}</small>
           </div>
           <div class="procurement-item-status">
               <span class="status-badge status-pending">รอดำเนินการ</span>
           </div>
       `;
       container.appendChild(item);
       
       // เพิ่ม event listener เพื่อดูรายละเอียด
       item.addEventListener('click', function() {
           window.location.href = `purchase-order-details.html?id=${order.id}`;
       });
   });
}

// ฟังก์ชันสำหรับโหลดข้อมูลสรุปสำหรับ dashboard
function loadProcurementSummary() {
   // ในกรณีที่มีการเรียก API จริง จะต้องเพิ่มโค้ดตรงนี้
   
   // ในที่นี้ใช้ข้อมูลจำลอง
   const summary = {
       totalRequisitions: 25,
       pendingRequisitions: 5,
       totalPurchaseOrders: 18,
       pendingPurchaseOrders: 3,
       totalVendors: 12,
       lowStockItems: 8
   };
   
   // แสดงข้อมูลสรุป
   displayProcurementSummary(summary);
}

// ฟังก์ชันสำหรับแสดงข้อมูลสรุปใน dashboard
function displayProcurementSummary(summary) {
   const summaryElements = {
       totalRequisitions: document.getElementById('total-requisitions'),
       pendingRequisitions: document.getElementById('pending-requisitions-count'),
       totalPurchaseOrders: document.getElementById('total-purchase-orders'),
       pendingPurchaseOrders: document.getElementById('pending-purchase-orders-count'),
       totalVendors: document.getElementById('total-vendors'),
       lowStockItems: document.getElementById('low-stock-items')
   };
   
   // แสดงข้อมูลในแต่ละ element
   for (const [key, element] of Object.entries(summaryElements)) {
       if (element && summary[key] !== undefined) {
           element.textContent = summary[key];
       }
   }
}

// ฟังก์ชันสำหรับโหลดข้อมูลผู้ขาย
function loadVendorData() {
   // เรียกใช้ฟังก์ชันจาก VenMa.js
   if (typeof window.vendorFunctions !== 'undefined' && window.vendorFunctions.loadVendors) {
       window.vendorFunctions.loadVendors();
   } else {
       console.error('Vendor functions not available');
   }
}

// ฟังก์ชันสำหรับโหลดข้อมูลสินค้าคงคลัง
function loadInventoryData() {
   // เรียกใช้ฟังก์ชันจาก inventory.js
   if (typeof window.inventoryFunctions !== 'undefined' && window.inventoryFunctions.loadInventoryItems) {
       window.inventoryFunctions.loadInventoryItems();
   } else {
       console.error('Inventory functions not available');
   }
}

// ฟังก์ชันช่วยเหลือ
function formatDate(dateString) {
   const date = new Date(dateString);
   return date.toLocaleDateString('th-TH', {
       year: 'numeric',
       month: 'long',
       day: 'numeric'
   });
}