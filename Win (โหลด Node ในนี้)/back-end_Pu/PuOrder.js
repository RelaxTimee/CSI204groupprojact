document.addEventListener("DOMContentLoaded", function () {
  // ตรวจสอบสิทธิ์
  const roleId =
    localStorage.getItem("role_id") || sessionStorage.getItem("role_id");
  if (roleId != 3) {
    alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
    redirectBasedOnRole(roleId);
    return;
  }

  // แสดงชื่อผู้ใช้
  const username =
    localStorage.getItem("username") || sessionStorage.getItem("username");
  if (username) {
    document.getElementById("username-display").textContent = username;
  }

  // กำหนดวันที่ปัจจุบัน
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];
  document.getElementById("po-date").value = formattedDate;

  // กำหนดวันที่ต้องการสินค้า (7 วันจากวันนี้)
  const deliveryDate = new Date();
  deliveryDate.setDate(today.getDate() + 7);
  document.getElementById("delivery-date").value = deliveryDate
    .toISOString()
    .split("T")[0];

  // สร้างเลขที่ใบสั่งซื้อ
  generatePONumber();

  // โหลดใบขอซื้อที่อนุมัติแล้ว
  loadApprovedRequisitions();

  // เพิ่ม event listeners สำหรับปุ่มต่างๆ
  setupEventListeners();

  // ฟังก์ชันสร้างเลขที่ใบสั่งซื้อ
  function generatePONumber() {
    const today = new Date();
    const poNumber =
      "PO-" +
      today.getFullYear() +
      "-" +
      Math.floor(1000 + Math.random() * 9000);
    document.getElementById("po-number").value = poNumber;
  }

  // ฟังก์ชันโหลดใบขอซื้อที่อนุมัติแล้ว
  async function loadApprovedRequisitions() {
    try {
      console.log("เริ่มโหลดใบขอซื้อที่อนุมัติแล้ว");
      const token =
        localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");

      // ใช้ URL เต็มรูปแบบ
      const apiUrl =
        window.location.origin + "/api/purchase-requisitions?status=approved";
      console.log("API URL:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(
          "API response not OK:",
          response.status,
          response.statusText
        );
        throw new Error("ไม่สามารถดึงข้อมูลใบขอซื้อได้");
      }

      const requisitions = await response.json();
      console.log("ได้รับข้อมูลใบขอซื้อ:", requisitions);
      displayRequisitions(requisitions);
    } catch (error) {
      console.error("Error loading approved requisitions:", error);

      // แสดงข้อความแจ้งเตือน
      showAlert("ไม่สามารถโหลดใบขอซื้อได้ กำลังใช้ข้อมูลจำลอง", "error");

      // ใช้ข้อมูลจำลองในกรณีที่เกิดข้อผิดพลาด
      const mockRequisitions = [
        {
          id: "PR-2024-0056",
          title: "อุปกรณ์สำนักงาน",
          department: "procurement",
          date: "2024-03-15",
          requested_by: "procurement@example.com",
          total_amount: 12500.0,
        },
        {
          id: "PR-2024-0057",
          title: "อุปกรณ์คอมพิวเตอร์",
          department: "it",
          date: "2024-03-20",
          requested_by: "it@example.com",
          total_amount: 45800.0,
        },
        {
          id: "PR-2024-0058",
          title: "เฟอร์นิเจอร์สำนักงาน",
          department: "admin",
          date: "2024-03-22",
          requested_by: "admin@example.com",
          total_amount: 28900.0,
        },
      ];

      displayRequisitions(mockRequisitions);
    }
  }

  // แสดงรายการใบขอซื้อ
function displayRequisitions(requisitions) {
    const prList = document.getElementById("pr-list");
    if (!prList) {
        console.error("ไม่พบอีลิเมนต์ 'pr-list'");
        return;
    }
  
    prList.innerHTML = "";
  
    if (requisitions.length === 0) {
        prList.innerHTML = '<div class="pr-item">ไม่พบใบขอซื้อที่อนุมัติแล้ว</div>';
        return;
    }
  
    requisitions.forEach((pr) => {
        // ตรวจสอบให้แน่ใจว่าแสดงเฉพาะใบขอซื้อที่ approved แล้ว
        if (pr.status !== "approved") return;
  
        const prItem = document.createElement("div");
        prItem.className = "pr-item";
        prItem.dataset.id = pr.id;
        prItem.dataset.vendor = JSON.stringify({
            id: pr.vendor_id || '',
            name: pr.vendor_name || '',
            contact_name: pr.vendor_contact || '',
            phone: pr.vendor_phone || ''
        });
        prItem.innerHTML = `
            <strong>${pr.id}</strong> - ${pr.title}<br>
            <small>แผนก: ${pr.department} | วันที่: ${formatDate(
            pr.date
        )} | ยอดรวม: ${formatCurrency(pr.total_amount)} บาท
                            <button class="action-btn delete" data-id="${pr.id}" style="float: right; margin: 10px;">
                        <i class="fas fa-trash-alt"></i>
                    </button></small>

`;
  
        prItem.addEventListener("click", async function () {
            // ลบ class selected จากทุกรายการ
            document.querySelectorAll(".pr-item").forEach((item) => {
                item.classList.remove("selected");
            });
  
            // เพิ่ม class selected ให้รายการที่เลือก
            this.classList.add("selected");
  
            // ดึงรายการสินค้า
            const prId = this.dataset.id;
            console.log("เลือกใบขอซื้อ:", prId);
            await loadRequisitionItems(prId);
  
            // เติมข้อมูลใบขอซื้อลงในฟอร์ม
            document.getElementById("pr-reference").value = pr.id;
            document.getElementById("po-title").value = pr.title;
  
            // กรอกข้อมูลผู้ขาย
            const vendorData = JSON.parse(this.dataset.vendor);
            document.getElementById("vendor-id").value = vendorData.id;
            document.getElementById("vendor-search").value = vendorData.name;
            document.getElementById("vendor-contact").value = vendorData.contact_name;
            document.getElementById("vendor-phone").value = vendorData.phone;
        });
  
        prList.appendChild(prItem);
    });
}

async function fetchPurchaseRequisitions() {
  try {
      const token = localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
      
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

  // โหลดรายการสินค้าจากใบขอซื้อ
// แก้ไขฟังก์ชัน loadRequisitionItems 
async function loadRequisitionItems(prId) {
  try {
      console.log("เริ่มโหลดรายการสินค้าสำหรับใบขอซื้อ:", prId);
      const token = localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");

      // โหลดรายการสินค้า
      const itemsApiUrl = window.location.origin + `/api/purchase-requisitions/${prId}/items`;
      const itemsResponse = await fetch(itemsApiUrl, {
          method: "GET",
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
          }
      });

      if (!itemsResponse.ok) {
          const errorText = await itemsResponse.text();
          console.error("Items API response error:", errorText);
          throw new Error("ไม่สามารถดึงรายการสินค้าได้");
      }

      const items = await itemsResponse.json();
      console.log("ได้รับข้อมูลรายการสินค้า:", items);
      populateItemsTable(items);

      // พยายามโหลดข้อมูลผู้ขาย
      try {
          const vendorApiUrl = window.location.origin + `/api/purchase-requisitions/${prId}/vendor`;
          const vendorResponse = await fetch(vendorApiUrl, {
              method: "GET",
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              }
          });

          let vendorData;
          if (vendorResponse.ok) {
              vendorData = await vendorResponse.json();
              console.log("ได้รับข้อมูลผู้ขาย:", vendorData);
          } else {
              console.warn('ไม่พบข้อมูลผู้ขาย');
              vendorData = {
                  id: "V001", 
                  name: "บริษัท คอมเทค จำกัด",
                  contact_name: "ผู้ติดต่อทั่วไป",
                  phone: "02-xxx-xxxx"
              };
          }

          // กรอกข้อมูลผู้ขาย
          document.getElementById("vendor-id").value = vendorData.id || '';
          document.getElementById("vendor-search").value = vendorData.name || '';
          document.getElementById("vendor-contact").value = vendorData.contact_name || '';
          document.getElementById("vendor-phone").value = vendorData.phone || '';

      } catch (vendorError) {
          console.error("Error loading vendor:", vendorError);
      }

  } catch (error) {
      console.error("Error loading requisition items:", error);
  }
}
  // เติมข้อมูลสินค้าลงในตาราง
  function populateItemsTable(items) {
    const itemsBody = document.getElementById("items-body");
    if (!itemsBody) {
      console.error("ไม่พบอีลิเมนต์ 'items-body'");
      return;
    }

    itemsBody.innerHTML = "";

    if (items.length === 0) {
      const emptyRow = document.createElement("tr");
      emptyRow.innerHTML =
        '<td colspan="6" class="text-center">ไม่พบรายการสินค้า</td>';
      itemsBody.appendChild(emptyRow);
      return;
    }

    items.forEach((item) => {
      const row = document.createElement("tr");
      row.className = "item-row";
      row.innerHTML = `
                <td><input type="text" class="form-control item-name" value="${
                  item.name
                }" readonly></td>
                <td><input type="number" class="form-control item-quantity" value="${
                  item.quantity
                }" min="1"></td>
                <td>
                    <select class="form-control item-unit">
                        <option value="ชิ้น" ${
                          item.unit === "ชิ้น" ? "selected" : ""
                        }>ชิ้น</option>
                        <option value="อัน" ${
                          item.unit === "อัน" ? "selected" : ""
                        }>อัน</option>
                        <option value="ชุด" ${
                          item.unit === "ชุด" ? "selected" : ""
                        }>ชุด</option>
                        <option value="กล่อง" ${
                          item.unit === "กล่อง" ? "selected" : ""
                        }>กล่อง</option>
                        <option value="รีม" ${
                          item.unit === "รีม" ? "selected" : ""
                        }>รีม</option>
                        <option value="แพ็ค" ${
                          item.unit === "แพ็ค" ? "selected" : ""
                        }>แพ็ค</option>
                    </select>
                </td>
                <td><input type="number" class="form-control item-price" value="${
                  item.unit_price
                }" min="0"></td>
                <td><input type="text" class="form-control item-total" value="${formatCurrency(
                  item.amount
                )}" readonly></td>
                <td>
                    <button type="button" class="remove-item-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            `;

      // เพิ่ม event listeners สำหรับการคำนวณ
      addItemEventListeners(row);
      itemsBody.appendChild(row);
    });

    // คำนวณยอดรวมใหม่
    calculateGrandTotal();
  }

  // เพิ่ม event listeners สำหรับปุ่มต่างๆ
  function setupEventListeners() {
    // เพิ่มรายการสินค้าใหม่
    const addItemBtn = document.getElementById("add-item-btn");
    if (addItemBtn) {
      addItemBtn.addEventListener("click", function () {
        addNewItemRow();
      });
    }

    // บันทึกใบสั่งซื้อ
    const saveBtn = document.getElementById("save-btn");
    if (saveBtn) {
      saveBtn.addEventListener("click", async function () {
        if (!validateForm()) {
          return;
        }

        const poData = collectFormData();
        poData.status = "pending";

        savePurchaseOrder(poData, false);
      });
    }

    // ส่งใบสั่งซื้อ
    const submitBtn = document.getElementById("submit-btn");
    if (submitBtn) {
      submitBtn.addEventListener("click", async function () {
        if (!validateForm()) {
          return;
        }
    
        const poData = collectFormData();
        poData.status = "pending"; // เปลี่ยนสถานะเป็น pending
    
        // เพิ่ม confirm dialog 
        const confirmed = confirm("ยืนยันการส่งใบสั่งซื้อ?");
        if (confirmed) {
          await savePurchaseOrder(poData, true); // true คือส่งใบสั่งซื้อ
        }
      });
    }

    // ยกเลิก
    const cancelBtn = document.getElementById("cancel-btn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", function () {
        if (confirm("ยืนยันการยกเลิกการทำรายการ?")) {
          window.location.href = "procurement-dashboard.html";
        }
      });
    }

    // ค้นหาผู้ขาย
    const vendorSearchInput = document.getElementById("vendor-search");
    const vendorResults = document.getElementById("vendor-results");

    if (vendorSearchInput && vendorResults) {
      vendorSearchInput.addEventListener("input", function () {
        searchVendors(this.value.trim());
      });

      // ซ่อนผลการค้นหาเมื่อคลิกที่อื่น
      document.addEventListener("click", function (event) {
        if (
          !vendorSearchInput.contains(event.target) &&
          !vendorResults.contains(event.target)
        ) {
          vendorResults.classList.remove("show");
        }
      });
    }

    // Logout
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("username");
        localStorage.removeItem("role_id");
        localStorage.removeItem("user_id");
        sessionStorage.removeItem("jwtToken");
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("role_id");
        sessionStorage.removeItem("user_id");
        window.location.href = "login.html";
      });
    }
  }

  // ฟังก์ชันเพิ่มแถวรายการสินค้าใหม่
  function addNewItemRow() {
    const itemsBody = document.getElementById("items-body");
    if (!itemsBody) {
      console.error("ไม่พบอีลิเมนต์ 'items-body'");
      return;
    }

    const newRow = document.createElement("tr");
    newRow.className = "item-row";
    newRow.innerHTML = `
            <td><input type="text" class="form-control item-name" placeholder="ชื่อสินค้า"></td>
            <td><input type="number" class="form-control item-quantity" value="1" min="1"></td>
            <td>
                <select class="form-control item-unit">
                    <option value="ชิ้น">ชิ้น</option>
                    <option value="อัน">อัน</option>
                    <option value="ชุด">ชุด</option>
                    <option value="กล่อง">กล่อง</option>
                    <option value="รีม">รีม</option>
                    <option value="แพ็ค">แพ็ค</option>
                </select>
            </td>
            <td><input type="number" class="form-control item-price" value="0" min="0"></td>
            <td><input type="text" class="form-control item-total" value="0.00" readonly></td>
            <td>
                <button type="button" class="remove-item-btn">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        `;

    // เพิ่ม event listeners สำหรับแถวใหม่
    addItemEventListeners(newRow);
    itemsBody.appendChild(newRow);
  }

  // เพิ่ม event listeners สำหรับแถวรายการสินค้า
  function addItemEventListeners(row) {
    const quantityInput = row.querySelector(".item-quantity");
    const priceInput = row.querySelector(".item-price");
    const totalInput = row.querySelector(".item-total");
    const removeBtn = row.querySelector(".remove-item-btn");

    // คำนวณราคารวม
    function calculateTotal() {
      const quantity = parseFloat(quantityInput.value) || 0;
      const price = parseFloat(priceInput.value) || 0;
      const total = quantity * price;
      totalInput.value = formatCurrency(total);

      // คำนวณยอดรวมทั้งหมด
      calculateGrandTotal();
    }

    // เพิ่ม event listeners
    if (quantityInput) {
      quantityInput.addEventListener("input", calculateTotal);
    }

    if (priceInput) {
      priceInput.addEventListener("input", calculateTotal);
    }

    // ลบรายการ
    if (removeBtn) {
      removeBtn.addEventListener("click", function () {
        row.remove();
        calculateGrandTotal();
      });
    }
  }

  // คำนวณยอดรวมทั้งหมด
  function calculateGrandTotal() {
    const totalInputs = document.querySelectorAll(".item-total");
    let grandTotal = 0;

    totalInputs.forEach((input) => {
      const value = parseFloat(input.value.replace(/,/g, "")) || 0;
      grandTotal += value;
    });

    const grandTotalElement = document.getElementById("grand-total");
    if (grandTotalElement) {
      grandTotalElement.textContent = formatCurrency(grandTotal);
    } else {
      console.error("ไม่พบอีลิเมนต์ 'grand-total'");
    }
  }

  // ค้นหาผู้ขาย
  async function searchVendors(keyword) {
    const vendorResults = document.getElementById("vendor-results");
    if (!vendorResults) {
      console.error("ไม่พบอีลิเมนต์ 'vendor-results'");
      return;
    }

    if (keyword.length < 2) {
      vendorResults.classList.remove("show");
      return;
    }

    try {
      console.log("ค้นหาผู้ขายด้วยคำค้นหา:", keyword);
      const token =
        localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");

      // ใช้ URL เต็มรูปแบบ
      const apiUrl =
        window.location.origin +
        `/api/vendors?search=${encodeURIComponent(keyword)}`;
      console.log("API URL:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(
          "API response not OK:",
          response.status,
          response.statusText
        );
        throw new Error("ไม่สามารถค้นหาผู้ขายได้");
      }

      const vendors = await response.json();
      console.log("ได้รับข้อมูลผู้ขาย:", vendors);

      displayVendorSearchResults(vendors);
    } catch (error) {
      console.error("Error searching vendors:", error);

      // ใช้ข้อมูลจำลองในกรณีที่เกิดข้อผิดพลาด
      const mockVendors = [
        {
          id: "V001",
          name: "บริษัท คอมเทค จำกัด",
          contact_name: "คุณสมศักดิ์ เทคโน",
          phone: "02-123-4567",
        },
        {
          id: "V002",
          name: "บริษัท ไอทีซัพพลาย จำกัด",
          contact_name: "คุณวิภา สุขใจ",
          phone: "02-234-5678",
        },
        {
          id: "V003",
          name: "บริษัท ซอฟต์แวร์ลิงค์ จำกัด",
          contact_name: "คุณนิพนธ์ โปรแกรม",
          phone: "02-345-6789",
        },
      ];

      const filteredVendors = mockVendors.filter(
        (vendor) =>
          vendor.name.toLowerCase().includes(keyword.toLowerCase()) ||
          vendor.contact_name.toLowerCase().includes(keyword.toLowerCase())
      );

      displayVendorSearchResults(filteredVendors);
    }
  }

  // แสดงผลการค้นหาผู้ขาย
  function displayVendorSearchResults(vendors) {
    const vendorResults = document.getElementById("vendor-results");
    if (!vendorResults) {
      console.error("ไม่พบอีลิเมนต์ 'vendor-results'");
      return;
    }

    if (vendors.length === 0) {
      vendorResults.innerHTML = '<div class="vendor-item">ไม่พบผู้ขาย</div>';
    } else {
      vendorResults.innerHTML = "";
      vendors.forEach((vendor) => {
        const vendorItem = document.createElement("div");
        vendorItem.className = "vendor-item";
        vendorItem.innerHTML = `
                    <strong>${vendor.name}</strong><br>
                    <small>ผู้ติดต่อ: ${vendor.contact_name} | โทร: ${vendor.phone}</small>
                `;

        vendorItem.addEventListener("click", function () {
          document.getElementById("vendor-id").value = vendor.id;
          document.getElementById("vendor-search").value = vendor.name;
          document.getElementById("vendor-contact").value = vendor.contact_name;
          document.getElementById("vendor-phone").value = vendor.phone;
          vendorResults.classList.remove("show");
        });

        vendorResults.appendChild(vendorItem);
      });
    }

    vendorResults.classList.add("show");
  }

  // บันทึกใบสั่งซื้อ
  async function savePurchaseOrder(poData, isSubmit) {
    try {
      const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
      const response = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(poData)
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'ไม่สามารถบันทึกใบสั่งซื้อได้');
      }
  
      showAlert(data.message, 'success');
      if (isSubmit) {
        window.location.href = "procurement-dashboard.html";
      }
    } catch (error) {
      console.error('Error details:', error);
      showAlert(error.message, 'error');
    }
  }
  // เก็บข้อมูลจากฟอร์ม
  function collectFormData() {
    // เก็บข้อมูลหลักของใบสั่งซื้อ
    const poNumber = document.getElementById("po-number").value;
    const poDate = document.getElementById("po-date").value;
    const prReference = document.getElementById("pr-reference").value;

    // เก็บข้อมูลผู้ขาย
    const vendorId = document.getElementById("vendor-id").value;
    const vendorName = document.getElementById("vendor-search").value;
    const vendorContact = document.getElementById("vendor-contact").value;
    const vendorPhone = document.getElementById("vendor-phone").value;

    // เก็บข้อมูลอื่นๆ
    const title = document.getElementById("po-title").value;
    const paymentTerms = document.getElementById("payment-terms").value;
    const deliveryDate = document.getElementById("delivery-date").value;
    const deliveryLocation = document.getElementById("delivery-location").value;
    const notes = document.getElementById("po-notes").value;

    // เก็บข้อมูลผู้ใช้งาน
    const userId =
      localStorage.getItem("user_id") || sessionStorage.getItem("user_id");

    // คำนวณยอดรวม
    const grandTotal =
      parseFloat(
        document.getElementById("grand-total").textContent.replace(/,/g, "")
      ) || 0;

    // ดึงข้อมูลรายการสินค้า
    const items = [];
    const itemRows = document.querySelectorAll(".item-row");

    itemRows.forEach((row) => {
      const nameInput = row.querySelector(".item-name");
      const quantityInput = row.querySelector(".item-quantity");
      const unitSelect = row.querySelector(".item-unit");
      const priceInput = row.querySelector(".item-price");
      const totalInput = row.querySelector(".item-total");

      if (
        nameInput &&
        quantityInput &&
        unitSelect &&
        priceInput &&
        totalInput
      ) {
        const name = nameInput.value.trim();
        const quantity = parseFloat(quantityInput.value) || 0;
        const unit = unitSelect.value;
        const unitPrice = parseFloat(priceInput.value) || 0;
        const amount = parseFloat(totalInput.value.replace(/,/g, "")) || 0;

        // เพิ่มรายการที่มีข้อมูลครบถ้วนเท่านั้น
        if (name && quantity > 0 && unitPrice > 0) {
          items.push({
            name,
            quantity,
            unit,
            unit_price: unitPrice,
            amount,
          });
        }
      }
    });

    // แสดงข้อมูลใน console เพื่อตรวจสอบ
    console.log("เก็บข้อมูลจากฟอร์ม:");
    console.log("- เลขที่ใบสั่งซื้อ:", poNumber);
    console.log("- วันที่:", poDate);
    console.log("- อ้างอิงใบขอซื้อ:", prReference);
    console.log("- ผู้ขาย:", vendorName, "(ID:", vendorId, ")");
    console.log("- รายการสินค้า:", items.length, "รายการ");
    console.log("- ยอดรวม:", grandTotal);

    // สร้าง object ข้อมูลเพื่อส่งไปยังเซิร์ฟเวอร์
    return {
      po_number: poNumber,
      date: poDate,
      pr_reference: prReference,
      vendor_id: vendorId,
      vendor_name: vendorName,
      vendor_contact: vendorContact,
      vendor_phone: vendorPhone,
      title: title,
      payment_terms: paymentTerms,
      delivery_date: deliveryDate,
      delivery_location: deliveryLocation,
      notes: notes,
      items: items,
      total_amount: grandTotal,
    };
  }

  // ตรวจสอบความถูกต้องของฟอร์ม
  function validateForm() {
    // ตรวจสอบว่าเลือกใบขอซื้อหรือไม่
    const prReference = document.getElementById("pr-reference").value;
    if (!prReference) {
      showAlert("กรุณาเลือกใบขอซื้อ", "error");
      return false;
    }

    // ตรวจสอบว่าเลือกผู้ขายหรือไม่
    const vendorId = document.getElementById("vendor-id").value;
    if (!vendorId) {
      showAlert("กรุณาเลือกผู้ขาย", "error");
      document.getElementById("vendor-search").focus();
      return false;
    }

    // ตรวจสอบว่ามีรายการสินค้าหรือไม่
    const itemRows = document.querySelectorAll(".item-row");
    if (itemRows.length === 0) {
      showAlert("กรุณาเพิ่มอย่างน้อย 1 รายการสินค้า", "error");
      return false;
    }

    // ตรวจสอบความครบถ้วนของข้อมูลในแต่ละรายการ
    let isValid = true;
    itemRows.forEach((row, index) => {
      const itemName = row.querySelector(".item-name").value;
      const itemQuantity = row.querySelector(".item-quantity").value;
      const itemPrice = row.querySelector(".item-price").value;

      if (!itemName || !itemQuantity || !itemPrice) {
        showAlert(
          `กรุณากรอกข้อมูลรายการสินค้าที่ ${index + 1} ให้ครบถ้วน`,
          "error"
        );
        isValid = false;
      }
    });

    return isValid;
  }

  // เก็บข้อมูลจากฟอร์ม

  // ฟังก์ชันจัดรูปแบบวันที่
  function formatDate(dateString) {
    if (!dateString) return "";

    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("th-TH", options);
  }

  // ฟังก์ชันจัดรูปแบบเงิน
  function formatCurrency(amount) {
    return new Intl.NumberFormat("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  // ฟังก์ชันแสดงการแจ้งเตือน
  function showAlert(message, type = "success") {
    const alertPopup = document.getElementById("alert-popup");
    if (!alertPopup) {
      console.error("ไม่พบอีลิเมนต์ 'alert-popup'");
      alert(message); // ใช้ alert ของเบราว์เซอร์แทนในกรณีที่ไม่พบ alertPopup
      return;
    }

    alertPopup.textContent = message;
    alertPopup.className = "alert-popup";

    if (type === "error") {
      alertPopup.classList.add("error");
    }

    alertPopup.classList.add("show");

    setTimeout(() => {
      alertPopup.classList.remove("show");
    }, 3000);
  }

  // ฟังก์ชันแสดง/ซ่อน loading
  function showLoading() {
    let loadingOverlay = document.querySelector(".loading-overlay");

    if (!loadingOverlay) {
      loadingOverlay = document.createElement("div");
      loadingOverlay.className = "loading-overlay";
      loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
      document.body.appendChild(loadingOverlay);
    }

    loadingOverlay.style.display = "flex";
  }

  function hideLoading() {
    const loadingOverlay = document.querySelector(".loading-overlay");
    if (loadingOverlay) {
      loadingOverlay.style.display = "none";
    }
  }
});


// โหลดข้อมูลผู้ขายสำหรับใบขอซื้อ
async function loadVendorForRequisition(prId) {
  try {
      console.log("กำลังดึงข้อมูลผู้ขายสำหรับใบขอซื้อ:", prId);
      const token = localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");

      const apiUrl = window.location.origin + `/api/purchase-requisitions/${prId}/vendor`;
      console.log("API URL:", apiUrl);

      const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
          },
      });

      if (!response.ok) {
          console.error("API response not OK:", response.status, response.statusText);
          throw new Error("ไม่สามารถดึงข้อมูลผู้ขายได้");
      }

      const vendorData = await response.json();
      console.log("ได้รับข้อมูลผู้ขาย:", vendorData);

      // กรอกข้อมูลผู้ขาย
      document.getElementById("vendor-id").value = vendorData.id;
      document.getElementById("vendor-search").value = vendorData.name;
      document.getElementById("vendor-contact").value = vendorData.contact_name;
      document.getElementById("vendor-phone").value = vendorData.phone;

  } catch (error) {
      console.error("Error loading vendor:", error);

      // ข้อมูลจำลองในกรณีที่เกิดข้อผิดพลาด
      const mockVendors = {
          "PR-2024-0056": {
              id: "V001",
              name: "บริษัท คอมเทค จำกัด",
              contact_name: "คุณสมศักดิ์ เทคโน",
              phone: "02-123-4567"
          },
          "PR-2024-0057": {
              id: "V002",
              name: "บริษัท ไอทีซัพพลาย จำกัด",
              contact_name: "คุณวิภา สุขใจ",
              phone: "02-234-5678"
          },
          "PR-2024-0058": {
              id: "V003",
              name: "บริษัท ซอฟต์แวร์ลิงค์ จำกัด",
              contact_name: "คุณนิพนธ์ โปรแกรม",
              phone: "02-345-6789"
          }
      };

      const vendorData = mockVendors[prId] || {
          id: "",
          name: "",
          contact_name: "",
          phone: ""
      };

      document.getElementById("vendor-id").value = vendorData.id;
      document.getElementById("vendor-search").value = vendorData.name;
      document.getElementById("vendor-contact").value = vendorData.contact_name;
      document.getElementById("vendor-phone").value = vendorData.phone;
  }
}

