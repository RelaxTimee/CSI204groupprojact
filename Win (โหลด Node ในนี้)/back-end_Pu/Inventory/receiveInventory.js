// ===== ระบบรับสินค้าเข้าคลัง =====

document.addEventListener("DOMContentLoaded", function() {
    // ตรวจสอบสิทธิ์ผู้ใช้
    const roleId = localStorage.getItem("role_id") || sessionStorage.getItem("role_id");
    if (roleId != 3 && roleId != 1) {
      alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
      redirectBasedOnRole(roleId);
      return;
    }
    
    // กำหนดวันที่ปัจจุบัน
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0]; // รูปแบบ YYYY-MM-DD
  
    if (document.getElementById("receive-date")) {
      document.getElementById("receive-date").value = formattedDate;
    }
  
    // สร้างเลขที่ใบรับสินค้า
    const receiveNumber = "RCV-" + today.getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
  
    if (document.getElementById("receive-number")) {
      document.getElementById("receive-number").value = receiveNumber;
    }
  
    // เพิ่ม event listeners สำหรับปุ่มต่างๆ ในแท็บรับสินค้า
    const addReceiveItemBtn = document.getElementById("add-receive-item-btn");
    if (addReceiveItemBtn) {
      addReceiveItemBtn.addEventListener("click", addReceiveItemRow);
    }
  
    const saveReceiveBtn = document.getElementById("save-receive-btn");
    if (saveReceiveBtn) {
      saveReceiveBtn.addEventListener("click", saveReceiveItems);
    }
  
    const cancelReceiveBtn = document.getElementById("cancel-receive-btn");
    if (cancelReceiveBtn) {
      cancelReceiveBtn.addEventListener("click", resetReceiveForm);
    }
    
    // ตรวจสอบว่าอยู่ที่แท็บรับสินค้าหรือไม่
    const receiveTab = document.querySelector(".inventory-tab[data-tab='receive']");
    if (receiveTab && receiveTab.classList.contains("active")) {
      // เพิ่มแถวรายการสินค้าเริ่มต้น
      const receiveItemsBody = document.getElementById("receive-items-body");
      if (receiveItemsBody && receiveItemsBody.children.length === 0) {
        addReceiveItemRow();
      }
    }
  });
  
  // ฟังก์ชันเพิ่มแถวรายการสินค้าในการรับสินค้า
  function addReceiveItemRow() {
    const itemsBody = document.getElementById("receive-items-body");
    if (!itemsBody) return;
  
    const newRow = document.createElement("tr");
    newRow.className = "receive-item-row";
  
    newRow.innerHTML = `
      <td>
        <input type="text" class="form-control receive-item-name" placeholder="ชื่อสินค้า">
      </td>
      <td><input type="number" class="form-control receive-item-quantity" value="1" min="1"></td>
      <td><input type="text" class="form-control receive-item-unit" placeholder="หน่วย"></td>
      <td><input type="number" class="form-control receive-item-price" value="0" min="0" step="0.01"></td>
      <td><input type="text" class="form-control receive-item-total" value="0" readonly></td>
      <td>
        <button type="button" class="action-btn delete remove-receive-item-btn">
          <i class="fas fa-times"></i>
        </button>
      </td>
    `;
  
    itemsBody.appendChild(newRow);
  
    // เพิ่ม event listeners
    addReceiveItemEventListeners(newRow);
  }
  
  // ฟังก์ชันเพิ่ม event listeners สำหรับแถวรายการสินค้าที่รับเข้า
  function addReceiveItemEventListeners(row) {
    const quantityInput = row.querySelector(".receive-item-quantity");
    const priceInput = row.querySelector(".receive-item-price");
    const totalInput = row.querySelector(".receive-item-total");
    const removeBtn = row.querySelector(".remove-receive-item-btn");
  
    // คำนวณราคารวม
    function calculateTotal() {
      const quantity = parseFloat(quantityInput.value) || 0;
      const price = parseFloat(priceInput.value) || 0;
      const total = quantity * price;
      totalInput.value = total.toFixed(2);
    }
  
    // เพิ่ม event listeners
    quantityInput.addEventListener("input", calculateTotal);
    priceInput.addEventListener("input", calculateTotal);
  
    // ลบรายการ
    removeBtn.addEventListener("click", function () {
      row.remove();
    });
    
    // คำนวณครั้งแรกเมื่อสร้างแถว
    calculateTotal();
  }
  
  // ฟังก์ชันบันทึกการรับสินค้า
// ในฟังก์ชัน saveReceiveItems ปรับเป็น:
async function saveReceiveItems() {
    try {
        // ตรวจสอบความถูกต้องของฟอร์ม
        if (!validateReceiveForm()) {
            return;
        }

        // เก็บข้อมูลจากฟอร์ม
        const receiptData = {
            receipt_date: document.getElementById("receive-date").value,
            supplier_name: document.getElementById("supplier-name").value,
            po_reference: document.getElementById("po-reference").value,
            notes: document.getElementById("receive-notes").value,
            status: "pending",
            items: [],
        };

        // เก็บข้อมูลรายการสินค้า
        const itemRows = document.querySelectorAll(".receive-item-row");
        itemRows.forEach((row) => {
            const itemName = row.querySelector(".receive-item-name").value;
            if (!itemName) return;

            const quantity = parseInt(row.querySelector(".receive-item-quantity").value);
            const unit = row.querySelector(".receive-item-unit").value;
            const unitPrice = parseFloat(row.querySelector(".receive-item-price").value);

            receiptData.items.push({
                item_name: itemName,
                unit: unit,
                quantity: quantity,
                unit_price: unitPrice,
            });
        });

        // ส่งข้อมูลไปยังเซิร์ฟเวอร์
        const token = localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
        const response = await fetch("/api/inventory/receipts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(receiptData)
        });

        if (!response.ok) {
            throw new Error("ไม่สามารถบันทึกข้อมูลได้");
        }

        const result = await response.json();
        showAlert(`บันทึกการรับสินค้าเลขที่ ${result.receiptId} เรียบร้อยแล้ว`);
        resetReceiveForm();

    } catch (error) {
        console.error("Error saving receipt:", error);
        showAlert(`เกิดข้อผิดพลาด: ${error.message}`, "error");
    }
}
  
  // ฟังก์ชันตรวจสอบความถูกต้องของฟอร์มรับสินค้า
  function validateReceiveForm() {
    // ตรวจสอบวันที่
    const receiveDate = document.getElementById("receive-date").value;
    if (!receiveDate) {
      showAlert("กรุณาระบุวันที่รับสินค้า", "error");
      document.getElementById("receive-date").focus();
      return false;
    }
  
    // ตรวจสอบชื่อผู้ส่งสินค้า
    const supplierName = document.getElementById("supplier-name").value;
    if (!supplierName) {
      showAlert("กรุณาระบุชื่อผู้ส่งสินค้า", "error");
      document.getElementById("supplier-name").focus();
      return false;
    }
  
    // ตรวจสอบรายการสินค้า
    const itemRows = document.querySelectorAll(".receive-item-row");
    let hasItems = false;
  
    itemRows.forEach((row) => {
      const itemName = row.querySelector(".receive-item-name").value;
      if (itemName) {
        hasItems = true;
  
        const unit = row.querySelector(".receive-item-unit").value;
        if (!unit) {
          showAlert("กรุณาระบุหน่วยของสินค้า", "error");
          row.querySelector(".receive-item-unit").focus();
          hasItems = false;
          return;
        }
  
        const quantity = parseInt(row.querySelector(".receive-item-quantity").value);
        const price = parseFloat(row.querySelector(".receive-item-price").value);
  
        if (quantity <= 0) {
          showAlert("จำนวนสินค้าต้องมากกว่า 0", "error");
          row.querySelector(".receive-item-quantity").focus();
          hasItems = false;
          return;
        }
  
        if (price < 0) {
          showAlert("ราคาสินค้าต้องไม่น้อยกว่า 0", "error");
          row.querySelector(".receive-item-price").focus();
          hasItems = false;
          return;
        }
      }
    });
  
    if (!hasItems) {
      showAlert("กรุณาเลือกอย่างน้อย 1 รายการสินค้า", "error");
      return false;
    }
  
    return true;
  }
  
  // ฟังก์ชันรีเซ็ตฟอร์มรับสินค้า
  function resetReceiveForm() {
    // กำหนดวันที่ปัจจุบัน
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0]; // รูปแบบ YYYY-MM-DD
  
    const receiveDateInput = document.getElementById("receive-date");
    if (receiveDateInput) {
      receiveDateInput.value = formattedDate;
    }
  
    // สร้างเลขที่ใบรับสินค้าใหม่
    const newReceiveNumber = "RCV-" + today.getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
  
    const receiveNumberInput = document.getElementById("receive-number");
    if (receiveNumberInput) {
      receiveNumberInput.value = newReceiveNumber;
    }
  
    // ล้างข้อมูลผู้ส่งสินค้าและหมายเหตุ
    const supplierNameInput = document.getElementById("supplier-name");
    if (supplierNameInput) {
      supplierNameInput.value = "";
    }
  
    const poReferenceInput = document.getElementById("po-reference");
    if (poReferenceInput) {
      poReferenceInput.value = "";
    }
  
    const receiveNotesInput = document.getElementById("receive-notes");
    if (receiveNotesInput) {
      receiveNotesInput.value = "";
    }
  
    // ล้างรายการสินค้า
    const itemsBody = document.getElementById("receive-items-body");
    if (itemsBody) {
      itemsBody.innerHTML = "";
  
      // เพิ่มแถวรายการสินค้าเริ่มต้น 1 รายการ
      addReceiveItemRow();
    }
  }
  
  // ฟังก์ชันแสดงรายการรับสินค้าที่รอการอนุมัติ (สำหรับหน้าอนุมัติ)
  async function fetchPendingReceipts() {
    try {
      showLoading();
  
      const token = localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
      if (!token) {
        throw new Error("ไม่พบข้อมูลการล็อกอิน กรุณาล็อกอินใหม่");
      }
  
      const response = await fetch("/api/inventory/receipts?status=pending", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error("ไม่สามารถดึงข้อมูลรายการรับสินค้าได้");
      }
  
      const receipts = await response.json();
      displayPendingReceipts(receipts);
  
      hideLoading();
      return receipts;
    } catch (error) {
      console.error("Error fetching pending receipts:", error);
      showAlert("เกิดข้อผิดพลาดในการดึงข้อมูลรายการรับสินค้า: " + error.message, "error");
      hideLoading();
    }
  }
  
  // ฟังก์ชันแสดงรายการรับสินค้าที่รอการอนุมัติ
  function displayPendingReceipts(receipts) {
    const receiptsList = document.getElementById("pending-receipts-list");
    if (!receiptsList) return;
  
    receiptsList.innerHTML = "";
  
    if (receipts.length === 0) {
      receiptsList.innerHTML = '<tr><td colspan="6" class="text-center">ไม่มีรายการรับสินค้าที่รอการอนุมัติ</td></tr>';
      return;
    }
  
    receipts.forEach((receipt) => {
      const row = document.createElement("tr");
      
      // แปลงวันที่ให้อยู่ในรูปแบบ dd/mm/yyyy
      const receiptDate = new Date(receipt.receipt_date);
      const formattedDate = receiptDate.toLocaleDateString('th-TH');
      
      // แปลงวันที่สร้างให้อยู่ในรูปแบบ dd/mm/yyyy HH:MM
      const createdAt = new Date(receipt.created_at);
      const formattedCreatedAt = `${createdAt.toLocaleDateString('th-TH')} ${createdAt.toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}`;
      
      row.innerHTML = `
        <td>${receipt.id}</td>
        <td>${formattedDate}</td>
        <td>${receipt.supplier_name || "-"}</td>
        <td>${receipt.po_reference || "-"}</td>
        <td>${formattedCreatedAt}</td>
        <td>
          <button class="btn btn-sm btn-primary view-receipt-btn" data-id="${receipt.id}">
            <i class="fas fa-eye"></i> ดูรายละเอียด
          </button>
        </td>
      `;
  
      receiptsList.appendChild(row);
      
      // เพิ่ม event listener สำหรับปุ่มดูรายละเอียด
      row.querySelector(".view-receipt-btn").addEventListener("click", function() {
        const receiptId = this.dataset.id;
        viewReceiptDetails(receiptId);
      });
    });
  }
  
  // ฟังก์ชันดูรายละเอียดใบรับสินค้า
  async function viewReceiptDetails(receiptId) {
    try {
      showLoading();
  
      const token = localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
      
      const response = await fetch(`/api/inventory/receipts/${receiptId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error("ไม่สามารถดึงข้อมูลรายละเอียดใบรับสินค้าได้");
      }
  
      const receiptDetails = await response.json();
      
      // แสดง modal รายละเอียดใบรับสินค้า
      displayReceiptDetailsModal(receiptDetails);
  
      hideLoading();
    } catch (error) {
      console.error("Error fetching receipt details:", error);
      showAlert("เกิดข้อผิดพลาดในการดึงข้อมูลรายละเอียดใบรับสินค้า: " + error.message, "error");
      hideLoading();
    }
  }
  
  // ฟังก์ชันแสดง modal รายละเอียดใบรับสินค้า
  function displayReceiptDetailsModal(receipt) {
    // ตรวจสอบว่ามี modal อยู่แล้วหรือไม่
    let receiptModal = document.getElementById("receipt-details-modal");
    
    if (!receiptModal) {
      // สร้าง modal ถ้ายังไม่มี
      receiptModal = document.createElement("div");
      receiptModal.id = "receipt-details-modal";
      receiptModal.className = "modal";
      
      // สร้างโครงสร้าง HTML ของ modal
      receiptModal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>รายละเอียดใบรับสินค้า</h3>
            <span class="close">&times;</span>
          </div>
          <div class="modal-body">
            <div class="receipt-info">
              <div class="info-row">
                <div class="info-item">
                  <label>เลขที่ใบรับสินค้า:</label>
                  <span id="modal-receipt-id"></span>
                </div>
                <div class="info-item">
                  <label>วันที่:</label>
                  <span id="modal-receipt-date"></span>
                </div>
              </div>
              <div class="info-row">
                <div class="info-item">
                  <label>ผู้ส่งสินค้า:</label>
                  <span id="modal-supplier-name"></span>
                </div>
                <div class="info-item">
                  <label>อ้างอิงใบสั่งซื้อ:</label>
                  <span id="modal-po-reference"></span>
                </div>
              </div>
              <div class="info-row">
                <div class="info-item">
                  <label>หมายเหตุ:</label>
                  <span id="modal-notes"></span>
                </div>
              </div>
            </div>
            <div class="receipt-items">
              <h4>รายการสินค้า</h4>
              <div class="table-container">
                <table class="inventory-table">
                  <thead>
                    <tr>
                      <th>ชื่อสินค้า</th>
                      <th>จำนวน</th>
                      <th>หน่วย</th>
                      <th>ราคาต่อหน่วย</th>
                      <th>รวม</th>
                    </tr>
                  </thead>
                  <tbody id="modal-items-body">
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="4" style="text-align: right; font-weight: bold;">ยอดรวม:</td>
                      <td id="modal-total-amount" style="font-weight: bold;"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="close-receipt-modal-btn">ปิด</button>
            <button type="button" class="btn btn-danger" id="reject-receipt-btn">ปฏิเสธ</button>
            <button type="button" class="btn btn-success" id="approve-receipt-btn">อนุมัติ</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(receiptModal);
      
      // เพิ่ม event listeners
      document.querySelector("#receipt-details-modal .close").addEventListener("click", function() {
        receiptModal.style.display = "none";
      });
      
      document.getElementById("close-receipt-modal-btn").addEventListener("click", function() {
        receiptModal.style.display = "none";
      });
      
      document.getElementById("approve-receipt-btn").addEventListener("click", function() {
        approveReceipt(receipt.id, "approved");
      });
      
      document.getElementById("reject-receipt-btn").addEventListener("click", function() {
        approveReceipt(receipt.id, "rejected");
      });
    }
    
    // แปลงวันที่ให้อยู่ในรูปแบบ dd/mm/yyyy
    const receiptDate = new Date(receipt.receipt_date);
    const formattedDate = receiptDate.toLocaleDateString('th-TH');
    
    // เติมข้อมูลลงใน modal
    document.getElementById("modal-receipt-id").textContent = receipt.id;
    document.getElementById("modal-receipt-date").textContent = formattedDate;
    document.getElementById("modal-supplier-name").textContent = receipt.supplier_name || "-";
    document.getElementById("modal-po-reference").textContent = receipt.po_reference || "-";
    document.getElementById("modal-notes").textContent = receipt.notes || "-";
    
    // เติมข้อมูลรายการสินค้า
    const itemsBody = document.getElementById("modal-items-body");
    itemsBody.innerHTML = "";
    
    let totalAmount = 0;
    
    receipt.items.forEach((item) => {
      const amount = item.quantity * item.unit_price;
      totalAmount += amount;
      
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.item_name}</td>
        <td>${item.quantity}</td>
        <td>${item.unit}</td>
        <td>${formatCurrency(item.unit_price)}</td>
        <td>${formatCurrency(amount)}</td>
      `;
      
      itemsBody.appendChild(row);
    });
    
    document.getElementById("modal-total-amount").textContent = formatCurrency(totalAmount);
    
    // แสดง modal
    receiptModal.style.display = "block";
  }
  
  // ฟังก์ชันอนุมัติหรือปฏิเสธใบรับสินค้า
  async function approveReceipt(receiptId, status) {
    try {
      if (status !== "approved" && status !== "rejected") {
        throw new Error("สถานะไม่ถูกต้อง");
      }
      
      // ถ้าเป็นการปฏิเสธ ขอเหตุผล
      let notes = null;
      if (status === "rejected") {
        notes = prompt("กรุณาระบุเหตุผลในการปฏิเสธ:");
        if (notes === null) {
          // ผู้ใช้กด cancel
          return;
        }
      }
      
      const token = localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
      
      showLoading();
      
      const response = await fetch(`/api/inventory/receipts/${receiptId}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: status,
          notes: notes
        }),
      });
      
      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.message || "เกิดข้อผิดพลาดในการอนุมัติ/ปฏิเสธใบรับสินค้า");
      }
      
      const responseData = await response.json();
      
      // ซ่อน modal
      document.getElementById("receipt-details-modal").style.display = "none";
      
      // แสดงข้อความแจ้งเตือน
      if (status === "approved") {
        showAlert(`อนุมัติใบรับสินค้าเลขที่ ${receiptId} เรียบร้อยแล้ว`);
      } else {
        showAlert(`ปฏิเสธใบรับสินค้าเลขที่ ${receiptId} เรียบร้อยแล้ว`);
      }
      
      // โหลดรายการใบรับสินค้าใหม่
      fetchPendingReceipts();
      
      // โหลดข้อมูลสินค้าใหม่ (ในกรณีที่อนุมัติ)
      if (status === "approved") {
        fetchInventoryItems();
      }
      
      hideLoading();
    } catch (error) {
      console.error("Error approving/rejecting receipt:", error);
      showAlert("เกิดข้อผิดพลาด: " + error.message, "error");
      hideLoading();
    }
  }
  
  // ฟังก์ชันจัดรูปแบบเงิน
  function formatCurrency(amount) {
    return amount.toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }