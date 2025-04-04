// ===== ระบบจัดการคลังสินค้า =====

document.addEventListener("DOMContentLoaded", function() {
  // ตรวจสอบสิทธิ์ผู้ใช้
  const roleId = localStorage.getItem("role_id") || sessionStorage.getItem("role_id");
  if (roleId != 3 && roleId != 1) {
    alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
    redirectBasedOnRole(roleId);
    return;
  }
  
  // แสดงชื่อผู้ใช้
  const username = localStorage.getItem("username") || sessionStorage.getItem("username");
  if (username) {
    document.getElementById("username-display").textContent = username;
  }

  // กำหนดวันที่ปัจจุบันสำหรับฟอร์ม
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];
  
  if (document.getElementById("issue-date")) {
    document.getElementById("issue-date").value = formattedDate;
  }

  // สร้างเลขที่ใบเบิกสินค้า
  const issueNumber = "ISS-" + today.getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
  if (document.getElementById("issue-number")) {
    document.getElementById("issue-number").value = issueNumber;
  }

  // โหลดข้อมูลสินค้าคงคลัง
  fetchInventoryItems();
  
  // จัดการแท็บต่างๆ
  const inventoryTabs = document.querySelectorAll(".inventory-tab");
  inventoryTabs.forEach((tab) => {
    tab.addEventListener("click", function() {
      // ลบ class active จากทุกแท็บ
      inventoryTabs.forEach((t) => t.classList.remove("active"));
      
      // เพิ่ม class active ให้แท็บที่คลิก
      this.classList.add("active");
      
      // ซ่อนทุก tab-content
      document.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active");
      });
      
      // แสดง tab-content ที่ตรงกับแท็บที่คลิก
      const tabId = this.dataset.tab;
      const tabContent = document.getElementById(`${tabId}-tab`);
      
      if (tabContent) {
        tabContent.classList.add("active");
        
        // เพิ่มแถวรายการสินค้าเริ่มต้นถ้าเป็นแท็บเบิกสินค้า
        if (tabId === "issue") {
          const issueItemsBody = document.getElementById("issue-items-body");
          if (issueItemsBody && issueItemsBody.children.length === 0) {
            addIssueItemRow();
          }
        }
      }
    });
  });

  // เพิ่ม event listeners สำหรับปุ่มต่างๆ
  document.addEventListener("click", function(event) {
    const target = event.target;
    
    // เพิ่มรายการสินค้าสำหรับการเบิกสินค้า
    if (target.closest("#add-issue-item-btn")) {
      addIssueItemRow();
    }
    
    // บันทึกการเบิกสินค้า
    if (target.closest("#save-issue-btn")) {
      saveIssueItems();
    }
    
    // ยกเลิกการเบิกสินค้า
    if (target.closest("#cancel-issue-btn")) {
      resetIssueForm();
    }
  });

  // เพิ่ม event listener สำหรับปุ่มบันทึกการเบิกสินค้า (ในกรณีที่ onclick ไม่ทำงาน)
  const saveIssueBtn = document.getElementById("save-issue-btn");
  if (saveIssueBtn) {
    saveIssueBtn.addEventListener("click", saveIssueItems);
  }

  // ตรวจสอบว่าอยู่ที่แท็บเบิกสินค้าหรือไม่
  const issueTab = document.querySelector(".inventory-tab[data-tab='issue']");
  if (issueTab && issueTab.classList.contains("active")) {
    // เพิ่มแถวรายการสินค้าเริ่มต้น
    const issueItemsBody = document.getElementById("issue-items-body");
    if (issueItemsBody && issueItemsBody.children.length === 0) {
      addIssueItemRow();
    }
  }
});

// ตัวแปรสำหรับการจัดการข้อมูล
let currentItems = [];
let currentPage = 1;
const itemsPerPage = 10;
let selectedItemId = null;
let isEditing = false;

// ประกาศตัวแปรสำหรับเก็บข้อมูลหมวดหมู่สินค้า
let itemCategories = [
  "วัสดุสำนักงาน",
  "เครื่องเขียน",
  "อุปกรณ์คอมพิวเตอร์",
  "อุปกรณ์อิเล็กทรอนิกส์",
  "เฟอร์นิเจอร์",
  "อื่นๆ"
];

// สร้าง element สำหรับแสดงสถานะการโหลด
createLoadingElement();

// ฟังก์ชันสร้าง element สำหรับแสดงสถานะการโหลด
function createLoadingElement() {
  if (!document.getElementById("loading")) {
    const loadingElement = document.createElement("div");
    loadingElement.id = "loading";
    loadingElement.innerHTML = '<div class="spinner"></div><p>กำลังโหลดข้อมูล...</p>';
    loadingElement.style.display = "none";
    loadingElement.style.position = "fixed";
    loadingElement.style.top = "0";
    loadingElement.style.left = "0";
    loadingElement.style.width = "100%";
    loadingElement.style.height = "100%";
    loadingElement.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    loadingElement.style.zIndex = "9999";
    loadingElement.style.justifyContent = "center";
    loadingElement.style.alignItems = "center";
    loadingElement.style.flexDirection = "column";
    loadingElement.style.color = "white";

    // สร้าง CSS สำหรับ spinner
    const style = document.createElement("style");
    style.textContent = `
      .spinner {
        border: 5px solid #f3f3f3;
        border-top: 5px solid #3498db;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 2s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(loadingElement);
  }
}

// ฟังก์ชันแสดงสถานะการโหลด
function showLoading() {
  const loadingElement = document.getElementById("loading");
  if (loadingElement) {
    loadingElement.style.display = "flex";
  }
}

// ฟังก์ชันซ่อนสถานะการโหลด
function hideLoading() {
  const loadingElement = document.getElementById("loading");
  if (loadingElement) {
    loadingElement.style.display = "none";
  }
}

// ฟังก์ชันแสดงข้อความแจ้งเตือน
function showAlert(message, type = "success") {
  const alertPopup = document.getElementById("alert-popup");
  if (!alertPopup) return;

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

// ฟังก์ชันโหลดข้อมูลสินค้าคงคลัง
async function fetchInventoryItems() {
  try {
    showLoading();

    const token = localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
    if (!token) {
      throw new Error("ไม่พบข้อมูลการล็อกอิน กรุณาล็อกอินใหม่");
    }

    const response = await fetch("/api/inventory/items", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("ไม่สามารถดึงข้อมูลสินค้าคงคลังได้");
    }

    const items = await response.json();
    currentItems = items;
    updateInventorySummary();
    displayInventoryItems();
    populateItemDropdowns();

    hideLoading();
    return items;
  } catch (error) {
    console.error("Error fetching inventory items:", error);
    showAlert("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า: " + error.message, "error");

    // ใช้ข้อมูลจำลองในกรณีที่เกิดข้อผิดพลาด
    currentItems = [
      {
        id: "ITM001",
        name: "กระดาษ A4",
        category: "วัสดุสำนักงาน",
        unit: "รีม",
        unit_price: 120.0,
        in_stock: 45,
        min_stock: 20,
        max_stock: 100,
      },
      {
        id: "ITM002",
        name: "หมึกพิมพ์ HP 680",
        category: "อุปกรณ์คอมพิวเตอร์",
        unit: "กล่อง",
        unit_price: 650.0,
        in_stock: 12,
        min_stock: 10,
        max_stock: 30,
      },
      {
        id: "ITM003",
        name: "แฟ้มเอกสาร",
        category: "วัสดุสำนักงาน",
        unit: "แพ็ค",
        unit_price: 180.0,
        in_stock: 25,
        min_stock: 15,
        max_stock: 50,
      },
      {
        id: "ITM004",
        name: "ปากกาลูกลื่น",
        category: "เครื่องเขียน",
        unit: "กล่อง",
        unit_price: 120.0,
        in_stock: 18,
        min_stock: 20,
        max_stock: 60,
      },
      {
        id: "ITM005",
        name: "แท็บเล็ต Samsung",
        category: "อุปกรณ์อิเล็กทรอนิกส์",
        unit: "เครื่อง",
        unit_price: 12500.0,
        in_stock: 3,
        min_stock: 2,
        max_stock: 5,
      }
    ];
    
    updateInventorySummary();
    displayInventoryItems();
    populateItemDropdowns();

    hideLoading();
    return currentItems;
  }
}

// ฟังก์ชันอัปเดตข้อมูลสรุปสินค้าคงคลัง
function updateInventorySummary() {
  const totalItems = currentItems.length;
  const totalValue = currentItems.reduce(
    (sum, item) => sum + (item.unit_price || 0) * (item.in_stock || 0),
    0
  );
  const lowStockItems = currentItems.filter(
    (item) => (item.in_stock <= item.min_stock) && item.in_stock > 0
  ).length;
  const outOfStockItems = currentItems.filter(
    (item) => item.in_stock === 0
  ).length;

  const totalItemsElement = document.getElementById("total-items");
  if (totalItemsElement) {
    totalItemsElement.textContent = totalItems;
  }

  const totalValueElement = document.getElementById("total-value");
  if (totalValueElement) {
    totalValueElement.textContent = formatCurrency(totalValue) + " บาท";
  }

  const lowStockElement = document.getElementById("low-stock");
  if (lowStockElement) {
    lowStockElement.textContent = lowStockItems;
  }

  const outOfStockElement = document.getElementById("out-of-stock");
  if (outOfStockElement) {
    outOfStockElement.textContent = outOfStockItems;
  }
}

// ฟังก์ชันแสดงรายการสินค้าคงคลัง
function displayInventoryItems() {
  const tableBody = document.getElementById("inventory-table-body");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  // คำนวณจำนวนหน้าทั้งหมด
  const totalPages = Math.ceil(currentItems.length / itemsPerPage);

  // คำนวณ index เริ่มต้นและสิ้นสุดของรายการที่จะแสดงในหน้าปัจจุบัน
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, currentItems.length);

  // แสดงรายการสินค้าในหน้าปัจจุบัน
  for (let i = startIndex; i < endIndex; i++) {
    const item = currentItems[i];
    const row = document.createElement("tr");

    if (item.id === selectedItemId) {
      row.classList.add("selected");
    }

    // กำหนดสถานะสินค้า
    let stockStatus = "";
    let stockStatusClass = "";

    if (item.in_stock === 0) {
      stockStatus = "หมด";
      stockStatusClass = "out";
    } else if (item.in_stock <= item.min_stock) {
      stockStatus = "ใกล้หมด";
      stockStatusClass = "low";
    } else {
      stockStatus = "ปกติ";
      stockStatusClass = "normal";
    }

    row.innerHTML = `
      <td>${item.id}</td>
      <td>${item.name}</td>
      <td>${item.category || ""}</td>
      <td>${item.in_stock}</td>
      <td>${item.unit}</td>
      <td>${formatCurrency(item.unit_price)}</td>
      <td><span class="stock-status ${stockStatusClass}">${stockStatus}</span></td>
      <td>
        <button class="action-btn edit" data-id="${item.id}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn delete" data-id="${item.id}">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    `;

    row.addEventListener("click", function (event) {
      // ไม่ทำงานถ้าคลิกที่ปุ่ม
      if (event.target.closest(".action-btn")) {
        return;
      }

      // ลบ class selected จากทุกแถว
      document.querySelectorAll("#inventory-table-body tr").forEach((tr) => {
        tr.classList.remove("selected");
      });

      // เพิ่ม class selected ให้แถวที่เลือก
      row.classList.add("selected");

      // แสดงข้อมูลสินค้าที่เลือก
      selectedItemId = item.id;
      displayItemDetails(item);
    });

    tableBody.appendChild(row);
  }

  // สร้างปุ่ม pagination
  createPagination(totalPages);

  // เพิ่ม event listeners สำหรับปุ่มแก้ไขและลบ
  addActionButtonListeners();
}

// ฟังก์ชันสร้างปุ่ม pagination
function createPagination(totalPages) {
  const pagination = document.getElementById("pagination");
  if (!pagination) return;

  pagination.innerHTML = "";

  // ไม่แสดง pagination ถ้ามีหน้าเดียว
  if (totalPages <= 1) {
    return;
  }

  // ปุ่มก่อนหน้า
  const prevButton = document.createElement("button");
  prevButton.innerHTML = "&laquo;";
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener("click", function () {
    if (currentPage > 1) {
      currentPage--;
      displayInventoryItems();
    }
  });
  pagination.appendChild(prevButton);

  // ปุ่มหน้า
  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;

    if (i === currentPage) {
      pageButton.classList.add("active");
    }

    pageButton.addEventListener("click", function () {
      currentPage = i;
      displayInventoryItems();
    });

    pagination.appendChild(pageButton);
  }

  // ปุ่มถัดไป
  const nextButton = document.createElement("button");
  nextButton.innerHTML = "&raquo;";
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener("click", function () {
    if (currentPage < totalPages) {
      currentPage++;
      displayInventoryItems();
    }
  });
  pagination.appendChild(nextButton);
}

// ฟังก์ชันเพิ่ม event listeners สำหรับปุ่มแก้ไขและลบ
function addActionButtonListeners() {
  document.querySelectorAll(".action-btn.edit").forEach((button) => {
    button.addEventListener("click", function () {
      const itemId = this.dataset.id;
      const item = currentItems.find((i) => i.id === itemId);

      if (item) {
        selectedItemId = item.id;
        displayItemDetails(item);
        isEditing = true;
        document.getElementById("form-title").textContent = "แก้ไขข้อมูลสินค้า";
        
        // ทำให้ฟอร์มสามารถแก้ไขได้
        enableFormEdit();
      }
    });
  });

  document.querySelectorAll(".action-btn.delete").forEach((button) => {
    button.addEventListener("click", function () {
      const itemId = this.dataset.id;
      const item = currentItems.find((i) => i.id === itemId);

      if (item) {
        // แสดง modal ยืนยันการลบ
        document.getElementById("delete-item-name").textContent = item.name;
        document.getElementById("delete-modal").style.display = "block";

        // เก็บ ID ของสินค้าที่จะลบไว้ใน dataset ของปุ่มยืนยัน
        document.getElementById("confirm-delete-btn").dataset.id = item.id;
      }
    });
  });
}

// ฟังก์ชันเปิดใช้การแก้ไขฟอร์ม
function enableFormEdit() {
  const formInputs = document.querySelectorAll("#inventory-form input, #inventory-form select, #inventory-form textarea");
  formInputs.forEach(input => {
    input.removeAttribute("readonly");
    input.removeAttribute("disabled");
  });
  
  // แสดงปุ่มบันทึกและยกเลิก
  document.getElementById("save-btn").style.display = "inline-block";
  document.getElementById("cancel-btn").style.display = "inline-block";
}

// ฟังก์ชันปิดการแก้ไขฟอร์ม
function disableFormEdit() {
  const formInputs = document.querySelectorAll("#inventory-form input, #inventory-form select, #inventory-form textarea");
  formInputs.forEach(input => {
    if (input.id !== "item-id") {
      input.setAttribute("readonly", true);
    }
  });
  
  // ซ่อนปุ่มบันทึกและยกเลิก
  document.getElementById("save-btn").style.display = "none";
  document.getElementById("cancel-btn").style.display = "none";
}

// ฟังก์ชันแสดงข้อมูลสินค้าที่เลือก
function displayItemDetails(item) {
  const formTitle = document.getElementById("form-title");
  if (formTitle) {
    formTitle.textContent = "ข้อมูลสินค้า";
  }

  // ปิดการแก้ไขฟอร์มเมื่อแสดงข้อมูล
  disableFormEdit();

  const idInput = document.getElementById("item-id");
  if (idInput) {
    idInput.value = item.id;
  }

  const nameInput = document.getElementById("item-name");
  if (nameInput) {
    nameInput.value = item.name;
  }

  const categoryInput = document.getElementById("item-category");
  if (categoryInput) {
    // ตรวจสอบว่ามี option ที่ตรงกับหมวดหมู่ของสินค้าหรือไม่
    let hasMatchingOption = false;
    for (let i = 0; i < categoryInput.options.length; i++) {
      if (categoryInput.options[i].value === item.category) {
        hasMatchingOption = true;
        break;
      }
    }
    
    // ถ้าไม่มี option ที่ตรงกัน ให้เพิ่ม option ใหม่
    if (!hasMatchingOption && item.category) {
      const option = document.createElement("option");
      option.value = item.category;
      option.textContent = item.category;
      categoryInput.appendChild(option);
    }
    
    categoryInput.value = item.category || "";
  }

  const unitInput = document.getElementById("item-unit");
  if (unitInput) {
    unitInput.value = item.unit;
  }

  const priceInput = document.getElementById("item-price");
  if (priceInput) {
    priceInput.value = item.unit_price;
  }

  const stockInput = document.getElementById("item-stock");
  if (stockInput) {
    stockInput.value = item.in_stock;
  }

  const minStockInput = document.getElementById("item-min-stock");
  if (minStockInput) {
    minStockInput.value = item.min_stock;
  }

  const maxStockInput = document.getElementById("item-max-stock");
  if (maxStockInput) {
    maxStockInput.value = item.max_stock;
  }

  const notesInput = document.getElementById("item-notes");
  if (notesInput) {
    notesInput.value = item.notes || "";
  }
}

// ฟังก์ชันเพิ่มรายการสินค้าในดรอปดาวน์
function populateItemDropdowns() {
  // เพิ่มรายการสินค้าในดรอปดาวน์สำหรับการเบิกสินค้า
  const issueItemSelects = document.querySelectorAll(".issue-item-select");
  issueItemSelects.forEach((select) => {
    const currentValue = select.value;
    select.innerHTML = '<option value="">เลือกสินค้า</option>';

    currentItems.forEach((item) => {
      if (item.in_stock > 0) {  // เฉพาะสินค้าที่มีในคลัง
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = `${item.name} (${item.id})`;
        option.dataset.unit = item.unit;
        option.dataset.stock = item.in_stock;
        select.appendChild(option);
      }
    });

    // รักษาค่าที่เลือกไว้
    if (currentValue) {
      select.value = currentValue;
    }
  });
}

// ฟังก์ชันเพิ่มแถวรายการสินค้าสำหรับการเบิกสินค้า
function addIssueItemRow() {
  const itemsBody = document.getElementById("issue-items-body");
  if (!itemsBody) return;
  
  const newRow = document.createElement("tr");
  newRow.className = "issue-item-row";
  
  newRow.innerHTML = `
    <td>
      <select class="form-control issue-item-select">
        <option value="">เลือกสินค้า</option>
      </select>
    </td>
    <td><input type="text" class="form-control issue-item-stock" readonly></td>
    <td><input type="number" class="form-control issue-item-quantity" value="1" min="1"></td>
    <td><input type="text" class="form-control issue-item-unit" readonly></td>
    <td>
      <button type="button" class="action-btn delete remove-issue-item-btn">
        <i class="fas fa-times"></i>
      </button>
    </td>
  `;
  
  itemsBody.appendChild(newRow);
  
  // เพิ่มรายการสินค้าในดรอปดาวน์
  const select = newRow.querySelector(".issue-item-select");
  currentItems.forEach(item => {
    if (item.in_stock > 0) {  // เฉพาะสินค้าที่มีในคลัง
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = `${item.name} (${item.id})`;
      option.dataset.unit = item.unit;
      option.dataset.stock = item.in_stock;
      select.appendChild(option);
    }
  });
  
  // เพิ่ม event listeners
  addIssueItemEventListeners(newRow);
}

// เพิ่ม event listeners สำหรับแถวรายการสินค้าที่เบิก
function addIssueItemEventListeners(row) {
  const select = row.querySelector(".issue-item-select");
  const stockInput = row.querySelector(".issue-item-stock");
  const quantityInput = row.querySelector(".issue-item-quantity");
  const unitInput = row.querySelector(".issue-item-unit");
  const removeBtn = row.querySelector(".remove-issue-item-btn");
  
  // เมื่อเลือกสินค้า
  select.addEventListener("change", function() {
    const selectedOption = this.options[this.selectedIndex];
    
    if (selectedOption.value) {
      const stock = parseInt(selectedOption.dataset.stock);
      stockInput.value = stock;
      unitInput.value = selectedOption.dataset.unit;
      
      // กำหนดค่าสูงสุดของจำนวนที่เบิกได้
      quantityInput.max = stock;
      
      // ถ้าจำนวนที่เบิกมากกว่าจำนวนคงเหลือ ให้ปรับเป็นจำนวนคงเหลือ
      if (parseInt(quantityInput.value) > stock) {
        quantityInput.value = stock;
      }
    } else {
      stockInput.value = "";
      unitInput.value = "";
      quantityInput.max = "";
    }
  });
  
  // ตรวจสอบจำนวนที่เบิก
  quantityInput.addEventListener("input", function() {
    const stock = parseInt(stockInput.value) || 0;
    const quantity = parseInt(this.value) || 0;
    
    if (quantity > stock) {
      this.value = stock;
      showAlert("จำนวนที่เบิกต้องไม่เกินจำนวนคงเหลือ", "error");
    }
  });
  
  // ลบรายการ
  removeBtn.addEventListener("click", function() {
    row.remove();
  });
}

// ฟังก์ชันตรวจสอบความถูกต้องของฟอร์มเบิกสินค้า
function validateIssueForm() {
  // ตรวจสอบชื่อผู้เบิก
  const requesterName = document.getElementById("requester-name").value;
  if (!requesterName) {
    showAlert("กรุณากรอกชื่อผู้เบิก", "error");
    document.getElementById("requester-name").focus();
    return false;
  }
  
  // ตรวจสอบว่ามีรายการสินค้าหรือไม่
  const itemRows = document.querySelectorAll(".issue-item-row");
  if (itemRows.length === 0) {
    showAlert("กรุณาเพิ่มรายการสินค้า", "error");
    return false;
  }
  
  // ตรวจสอบว่าได้เลือกสินค้าหรือไม่
  // ตรวจสอบว่าได้เลือกสินค้าหรือไม่
  let hasSelectedItem = false;
  
  for (const row of itemRows) {
    const select = row.querySelector(".issue-item-select");
    if (select && select.value) {
      hasSelectedItem = true;
      
      // ตรวจสอบจำนวนที่เบิก
      const quantityInput = row.querySelector(".issue-item-quantity");
      const quantity = parseInt(quantityInput.value);
      const stock = parseInt(row.querySelector(".issue-item-stock").value || "0");
      
      if (!quantity || quantity <= 0) {
        showAlert("กรุณากรอกจำนวนที่ต้องการเบิก", "error");
        quantityInput.focus();
        return false;
      }
      
      if (quantity > stock) {
        showAlert("จำนวนที่เบิกต้องไม่เกินจำนวนคงเหลือ", "error");
        quantityInput.focus();
        return false;
      }
    }
  }
  
  if (!hasSelectedItem) {
    showAlert("กรุณาเลือกสินค้าที่ต้องการเบิก", "error");
    return false;
  }
  
  return true;
}

// ฟังก์ชันบันทึกการเบิกสินค้า
async function saveIssueItems() {
  try {
    // ตรวจสอบความถูกต้องของฟอร์ม
    if (!validateIssueForm()) {
      return;
    }
    
    // แสดง loading
    showLoading();
    
    // เก็บข้อมูลรายการสินค้าที่เบิก
    const items = [];
    const itemRows = document.querySelectorAll(".issue-item-row");
    
    itemRows.forEach(row => {
      const select = row.querySelector(".issue-item-select");
      if (select && select.value) {
        const itemId = select.value;
        const quantity = parseInt(row.querySelector(".issue-item-quantity").value);
        
        items.push({
          item_id: itemId,
          quantity: quantity
        });
      }
    });
    
    // ส่งข้อมูลไปยัง API
    const token = localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
    
    const response = await fetch("/api/inventory/simple-issue", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ items })
    });
    
    // ซ่อน loading
    hideLoading();
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "ไม่สามารถเบิกสินค้าได้");
    }
    
    const responseData = await response.json();
    
    // แสดงข้อความแจ้งเตือน
    showAlert("เบิกสินค้าเรียบร้อยแล้ว");
    
    // รีเซ็ตฟอร์ม
    resetIssueForm();
    
    // โหลดข้อมูลสินค้าใหม่
    fetchInventoryItems();
    
  } catch (error) {
    console.error("Error saving issue:", error);
    showAlert(`เกิดข้อผิดพลาด: ${error.message}`, "error");
  }
}




// ฟังก์ชันรีเซ็ตฟอร์มเบิกสินค้า
function resetIssueForm() {
  // กำหนดวันที่ปัจจุบัน
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];
  
  const issueDateInput = document.getElementById("issue-date");
  if (issueDateInput) {
    issueDateInput.value = formattedDate;
  }
  
  // สร้างเลขที่ใบเบิกสินค้าใหม่
  const newIssueNumber = "ISS-" + today.getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
  
  const issueNumberInput = document.getElementById("issue-number");
  if (issueNumberInput) {
    issueNumberInput.value = newIssueNumber;
  }
  
  // ล้างข้อมูลผู้เบิกและหมายเหตุ
  const requesterNameInput = document.getElementById("requester-name");
  if (requesterNameInput) {
    requesterNameInput.value = "";
  }
  
  const issueNotesInput = document.getElementById("issue-notes");
  if (issueNotesInput) {
    issueNotesInput.value = "";
  }
  
  // ล้างรายการสินค้า
  const itemsBody = document.getElementById("issue-items-body");
  if (itemsBody) {
    itemsBody.innerHTML = "";
    
    // เพิ่มแถวรายการสินค้าเริ่มต้น 1 รายการ
    addIssueItemRow();
  }
}

// ฟังก์ชันจัดรูปแบบเงิน
function formatCurrency(amount) {
  return amount.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}


