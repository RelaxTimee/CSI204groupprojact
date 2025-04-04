// Guide Night________________________________________
// เพิ่มฟังก์ชันเหล่านี้เข้าไปในไฟล์ inventory.js ที่มีอยู่แล้ว
// ฟังก์ชันบันทึกการรับสินค้า

// ===== ระบบจัดการคลังสินค้า =====

document.addEventListener("DOMContentLoaded", function() {
    // ตรวจสอบว่าผู้ใช้มี role_id = 3 (Procurement) หรือ role_id = 1 (Admin)
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
  
    // =============== Event Listeners ===============
  
    // เพิ่ม event listeners สำหรับช่องค้นหา
    const searchInput = document.getElementById("inventory-search");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        // ค้นหาเมื่อพิมพ์เสร็จ (debounce)
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          searchInventoryItems(this.value);
        }, 500);
      });
    }
  
    // เพิ่ม event listeners สำหรับปุ่มเพิ่มสินค้าใหม่
    const addItemBtn = document.getElementById("add-item-btn");
    if (addItemBtn) {
      addItemBtn.addEventListener("click", function () {
        resetItemForm();
      });
    }
  
    // เพิ่ม event listeners สำหรับปุ่มบันทึกสินค้า
    const saveBtn = document.getElementById("save-btn");
    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        saveInventoryItem();
      });
    }
  
    // เพิ่ม event listeners สำหรับปุ่มยกเลิก
    const cancelBtn = document.getElementById("cancel-btn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", function () {
        if (selectedItemId) {
          // ถ้ามีสินค้าที่เลือกอยู่ ให้แสดงข้อมูลนั้นใหม่
          const item = currentItems.find(i => i.id === selectedItemId);
          if (item) {
            displayItemDetails(item);
          }
        } else {
          // ถ้าไม่มีสินค้าที่เลือก ให้รีเซ็ตฟอร์ม
          resetItemForm();
        }
      });
    }
  
    // เพิ่ม event listeners สำหรับปุ่มปิด modal
    const closeBtn = document.querySelector(".close");
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        document.getElementById("delete-modal").style.display = "none";
      });
    }
  
    // เพิ่ม event listeners สำหรับปุ่มยกเลิกการลบ
    const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
    if (cancelDeleteBtn) {
      cancelDeleteBtn.addEventListener("click", function () {
        document.getElementById("delete-modal").style.display = "none";
      });
    }
  
    // เพิ่ม event listeners สำหรับปุ่มยืนยันการลบ
    const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener("click", function () {
        const itemId = this.dataset.id;
        if (itemId) {
          deleteInventoryItem(itemId);
          document.getElementById("delete-modal").style.display = "none";
        }
      });
    }
  
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
  
    // กำหนดวันที่ปัจจุบัน
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0]; // รูปแบบ YYYY-MM-DD
  
    if (document.getElementById("receive-date")) {
      document.getElementById("receive-date").value = formattedDate;
    }
    if (document.getElementById("issue-date")) {
      document.getElementById("issue-date").value = formattedDate;
    }
  
    // สร้างเลขที่ใบรับสินค้าและใบเบิกสินค้า
    const receiveNumber = "RCV-" + today.getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
    const issueNumber = "ISS-" + today.getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
  
    if (document.getElementById("receive-number")) {
      document.getElementById("receive-number").value = receiveNumber;
    }
    if (document.getElementById("issue-number")) {
      document.getElementById("issue-number").value = issueNumber;
    }
  
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
  
    // ฟังก์ชันดึงข้อมูลหมวดหมู่สินค้า
    async function fetchItemCategories() {
      try {
        const token = localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
        if (!token) {
          throw new Error("ไม่พบข้อมูลการล็อกอิน กรุณาล็อกอินใหม่");
        }
  
        const response = await fetch("/api/inventory/categories", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (!response.ok) {
          throw new Error("ไม่สามารถดึงข้อมูลหมวดหมู่สินค้าได้");
        }
  
        const categories = await response.json();
        
        // อัปเดต dropdown หมวดหมู่สินค้า
        const categorySelect = document.getElementById("item-category");
        if (categorySelect) {
          categorySelect.innerHTML = '<option value="">เลือกหมวดหมู่</option>';
          
          categories.forEach(category => {
            const option = document.createElement("option");
            option.value = category.name;
            option.textContent = category.name;
            categorySelect.appendChild(option);
          });
        }
  
        return categories;
      } catch (error) {
        console.error("Error fetching item categories:", error);
        
        // ใช้ข้อมูลจำลองในกรณีที่เกิดข้อผิดพลาด
        const categorySelect = document.getElementById("item-category");
        if (categorySelect) {
          categorySelect.innerHTML = '<option value="">เลือกหมวดหมู่</option>';
          
          itemCategories.forEach(category => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
          });
        }
        
        return itemCategories;
      }
    }
  
    // ฟังก์ชันดึงข้อมูลสินค้าคงคลังทั้งหมด
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
            Authorization: `Bearer ${token}`,
          },
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
  
    // ฟังก์ชันค้นหาสินค้า
    async function searchInventoryItems(keyword) {
      try {
        showLoading();
  
        const token = localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
        if (!token) {
          throw new Error("ไม่พบข้อมูลการล็อกอิน กรุณาล็อกอินใหม่");
        }
  
        const response = await fetch(`/api/inventory/items?search=${encodeURIComponent(keyword)}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (!response.ok) {
          throw new Error("ไม่สามารถค้นหาสินค้าได้");
        }
  
        const items = await response.json();
        currentItems = items;
        displayInventoryItems();
  
        hideLoading();
        return items;
      } catch (error) {
        console.error("Error searching inventory items:", error);
        showAlert("เกิดข้อผิดพลาดในการค้นหาสินค้า: " + error.message, "error");
  
        // ค้นหาในข้อมูลจำลองในกรณีที่เกิดข้อผิดพลาด
        if (!keyword) {
          // ถ้าไม่มีคำค้นหา ดึงข้อมูลทั้งหมดใหม่
          fetchInventoryItems();
        } else {
          // กรองข้อมูลจากคำค้นหา
          const filteredItems = currentItems.filter(
            (item) =>
              item.name.toLowerCase().includes(keyword.toLowerCase()) ||
              item.id.toLowerCase().includes(keyword.toLowerCase()) ||
              (item.category && item.category.toLowerCase().includes(keyword.toLowerCase()))
          );
          currentItems = filteredItems;
          displayInventoryItems();
        }
  
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
        totalValueElement.textContent = totalValue.toLocaleString("th-TH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) + " บาท";
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
          <td>${item.unit_price.toLocaleString("th-TH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}</td>
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
      // เพิ่มรายการสินค้าในดรอปดาวน์สำหรับการรับสินค้า
      const receiveItemSelects = document.querySelectorAll(".receive-item-select");
      receiveItemSelects.forEach((select) => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">เลือกสินค้า</option>';
  
        currentItems.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.id;
          option.textContent = `${item.name} (${item.id})`;
          option.dataset.unit = item.unit;
          option.dataset.price = item.unit_price;
          select.appendChild(option);
        });
  
        // รักษาค่าที่เลือกไว้
        if (currentValue) {
          select.value = currentValue;
        }
      });
  
      // เพิ่มรายการสินค้าในดรอปดาวน์สำหรับการเบิกสินค้า
      const issueItemSelects = document.querySelectorAll(".issue-item-select");
      issueItemSelects.forEach((select) => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">เลือกสินค้า</option>';
  
        currentItems.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.id;
          option.textContent = `${item.name} (${item.id})`;
          option.dataset.unit = item.unit;
          option.dataset.stock = item.in_stock;
          select.appendChild(option);
        });
  
        // รักษาค่าที่เลือกไว้
        if (currentValue) {
          select.value = currentValue;
        }
      });
    }
  
    // ฟังก์ชันบันทึกข้อมูลสินค้า
    async function saveInventoryItem() {
      try {
        // ตรวจสอบความถูกต้องของฟอร์ม
        if (!validateItemForm()) {
          return;
        }
  
        showLoading();
  
        const token = localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
        if (!token) {
          throw new Error("ไม่พบข้อมูลการล็อกอิน กรุณาล็อกอินใหม่");
        }
  
        // เก็บข้อมูลจากฟอร์ม
        const itemData = {
          name: document.getElementById("item-name").value,
          category: document.getElementById("item-category").value,
          unit: document.getElementById("item-unit").value,
          unit_price: parseFloat(document.getElementById("item-price").value),
          in_stock: parseInt(document.getElementById("item-stock").value),
          min_stock: parseInt(document.getElementById("item-min-stock").value),
          max_stock: parseInt(document.getElementById("item-max-stock").value),
          notes: document.getElementById("item-notes").value
        };
  
        let response;
        let successMessage;
  
        if (isEditing) {
          // แก้ไขสินค้า
          const itemId = document.getElementById("item-id").value;
          response = await fetch(`/api/inventory/items/${itemId}`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(itemData),
          });
          successMessage = "แก้ไขข้อมูลสินค้าเรียบร้อยแล้ว";
        } else {
          // เพิ่มสินค้าใหม่
          response = await fetch("/api/inventory/items", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(itemData),
          });
          successMessage = "เพิ่มสินค้าใหม่เรียบร้อยแล้ว";
        }
  
        if (!response.ok) {
          const responseData = await response.json();
          throw new Error(responseData.message || "ไม่สามารถบันทึกข้อมูลสินค้าได้");
        }
  
        // แสดงข้อความแจ้งเตือน
        showAlert(successMessage);
  
        // รีเซ็ตฟอร์ม
        resetItemForm();
  
        // โหลดข้อมูลสินค้าใหม่
        await fetchInventoryItems();
  
        hideLoading();
      } catch (error) {
        hideLoading();
        console.error("Error saving inventory item:", error);
        showAlert("เกิดข้อผิดพลาด: " + error.message, "error");
      }
    }
  
    // ฟังก์ชันตรวจสอบความถูกต้องของฟอร์มสินค้า
    function validateItemForm() {
      // ตรวจสอบชื่อสินค้า
      const itemName = document.getElementById("item-name").value;
      if (!itemName.trim()) {
        showAlert("กรุณากรอกชื่อสินค้า", "error");
        document.getElementById("item-name").focus();
        return false;
      }
  
      // ตรวจสอบหมวดหมู่
      const category = document.getElementById("item-category").value;
      if (!category) {
        showAlert("กรุณาเลือกหมวดหมู่", "error");
        document.getElementById("item-category").focus();
        return false;
      }
  
      // ตรวจสอบหน่วย
      const unit = document.getElementById("item-unit").value;
      if (!unit.trim()) {
        showAlert("กรุณากรอกหน่วยนับ", "error");
        document.getElementById("item-unit").focus();
        return false;
      }
  
      // ตรวจสอบราคา
      const price = document.getElementById("item-price").value;
      if (price === "" || isNaN(price) || parseFloat(price) < 0) {
        showAlert("กรุณากรอกราคาต่อหน่วยเป็นตัวเลขที่ไม่น้อยกว่า 0", "error");
        document.getElementById("item-price").focus();
        return false;
      }
  
      // ตรวจสอบจำนวนคงเหลือ
      const stock = document.getElementById("item-stock").value;
      if (stock === "" || isNaN(stock) || parseInt(stock) < 0) {
        showAlert("กรุณากรอกจำนวนคงเหลือเป็นตัวเลขที่ไม่น้อยกว่า 0", "error");
        document.getElementById("item-stock").focus();
        return false;
      }
  
      // ตรวจสอบจำนวนต่ำสุด
      const minStock = document.getElementById("item-min-stock").value;
      if (minStock === "" || isNaN(minStock) || parseInt(minStock) < 0) {
        showAlert("กรุณากรอกจำนวนต่ำสุดเป็นตัวเลขที่ไม่น้อยกว่า 0", "error");
        document.getElementById("item-min-stock").focus();
        return false;
      }
  
      // ตรวจสอบจำนวนสูงสุด
      const maxStock = document.getElementById("item-max-stock").value;
      if (maxStock === "" || isNaN(maxStock) || parseInt(maxStock) < parseInt(minStock)) {
        showAlert("กรุณากรอกจำนวนสูงสุดเป็นตัวเลขที่ไม่น้อยกว่าจำนวนต่ำสุด", "error");
        document.getElementById("item-max-stock").focus();
        return false;
      }
  
      return true;
    }
  
    // ฟังก์ชันรีเซ็ตฟอร์มสินค้า
    function resetItemForm() {
      document.getElementById("form-title").textContent = "เพิ่มสินค้าใหม่";
      document.getElementById("item-id").value = "";
      document.getElementById("item-name").value = "";
      document.getElementById("item-category").value = "";
      document.getElementById("item-unit").value = "";
      document.getElementById("item-price").value = "0";
      document.getElementById("item-stock").value = "0";
      document.getElementById("item-min-stock").value = "0";
      document.getElementById("item-max-stock").value = "0";
      document.getElementById("item-notes").value = "";
  
      // เปิดใช้การแก้ไขฟอร์ม
      enableFormEdit();
  
      // รีเซ็ตตัวแปร
      selectedItemId = null;
      isEditing = false;
    }
  
    // ฟังก์ชันลบสินค้า
    async function deleteInventoryItem(itemId) {
      try {
        showLoading();
  
        const token = localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
        if (!token) {
          throw new Error("ไม่พบข้อมูลการล็อกอิน กรุณาล็อกอินใหม่");
        }
  
        const response = await fetch(`/api/inventory/items/${itemId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (!response.ok) {
          const responseData = await response.json();
          throw new Error(responseData.message || "ไม่สามารถลบสินค้าได้");
        }
  
        // แสดงข้อความแจ้งเตือน
        showAlert("ลบสินค้าเรียบร้อยแล้ว");
  
        // โหลดข้อมูลสินค้าใหม่
        await fetchInventoryItems();
  
        // รีเซ็ตฟอร์ม
        resetItemForm();
  
        hideLoading();
      } catch (error) {
        hideLoading();
        console.error("Error deleting inventory item:", error);
        showAlert("เกิดข้อผิดพลาด: " + error.message, "error");
      }
    }
  
    // ============== ฟังก์ชันสำหรับการรับสินค้าเข้าคลัง ==============
  
    // ฟังก์ชันเพิ่มแถวรายการสินค้าในการรับสินค้า
    function addReceiveItemRow() {
      const itemsBody = document.getElementById("receive-items-body");
      if (!itemsBody) return;
  
      const newRow = document.createElement("tr");
      newRow.className = "receive-item-row";
  
      newRow.innerHTML = `
        <td>
          <select class="form-control receive-item-select">
            <option value="">เลือกสินค้า</option>
            <!-- รายการสินค้าจะถูกเพิ่มที่นี่ด้วย JavaScript -->
          </select>
        </td>
        <td><input type="number" class="form-control receive-item-quantity" value="1" min="1"></td>
        <td><input type="text" class="form-control receive-item-unit" readonly></td>
        <td><input type="number" class="form-control receive-item-price" value="0" min="0" step="0.01"></td>
        <td><input type="text" class="form-control receive-item-total" value="0" readonly></td>
        <td>
          <button type="button" class="action-btn delete remove-receive-item-btn">
            <i class="fas fa-times"></i>
          </button>
        </td>
      `;
  
      itemsBody.appendChild(newRow);
  
      // เพิ่มรายการสินค้าในดรอปดาวน์
      const select = newRow.querySelector(".receive-item-select");
      currentItems.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = `${item.name} (${item.id})`;
        option.dataset.unit = item.unit;
        option.dataset.price = item.unit_price;
        select.appendChild(option);
      });
  
      // เพิ่ม event listeners
      addReceiveItemEventListeners(newRow);
    }
  
    // ฟังก์ชันเพิ่ม event listeners สำหรับแถวรายการสินค้าที่รับเข้า
    function addReceiveItemEventListeners(row) {
      const select = row.querySelector(".receive-item-select");
      const quantityInput = row.querySelector(".receive-item-quantity");
      const unitInput = row.querySelector(".receive-item-unit");
      const priceInput = row.querySelector(".receive-item-price");
      const totalInput = row.querySelector(".receive-item-total");
      const removeBtn = row.querySelector(".remove-receive-item-btn");
  
      // เมื่อเลือกสินค้า
      select.addEventListener("change", function () {
        const selectedOption = this.options[this.selectedIndex];
  
        if (selectedOption.value) {
          unitInput.value = selectedOption.dataset.unit;
          priceInput.value = selectedOption.dataset.price;
          calculateTotal();
        } else {
          unitInput.value = "";
          priceInput.value = "0";
          totalInput.value = "0";
        }
      });
  
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
    }
  
    // ฟังก์ชันบันทึกการรับสินค้า
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
          items: [],
        };
  
        // เก็บข้อมูลรายการสินค้า
        const itemRows = document.querySelectorAll(".receive-item-row");
        itemRows.forEach((row) => {
          const select = row.querySelector(".receive-item-select");
          if (!select.value) return; // ข้ามรายการที่ไม่ได้เลือกสินค้า
  
          const itemId = select.value;
          const quantity = parseInt(row.querySelector(".receive-item-quantity").value);
          const unitPrice = parseFloat(row.querySelector(".receive-item-price").value);
  
          receiptData.items.push({
            item_id: itemId,
            quantity: quantity,
            unit_price: unitPrice,
          });
        });
  
        console.log("Sending receipt data:", receiptData);
  
        // แสดง loading
        showLoading();
  
        const token = localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
  
        const response = await fetch("/api/inventory/receipts", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(receiptData),
        });
  
        // ซ่อน loading
        hideLoading();
  
        // Parse response
        const responseData = await response.json();
  
        if (!response.ok) {
          throw new Error(responseData.message || "ไม่สามารถบันทึกการรับสินค้าได้");
        }
  
        // แสดงข้อความแจ้งเตือน
        showAlert(`บันทึกการรับสินค้าเลขที่ ${responseData.receiptId} เรียบร้อยแล้ว`);
  
        // รีเซ็ตฟอร์ม
        resetReceiveForm();
  
        // โหลดข้อมูลสินค้าใหม่
        fetchInventoryItems();
      } catch (error) {
        // ซ่อน loading
        hideLoading();
  
        console.error("Detailed Error:", {
          message: error.message,
          stack: error.stack,
        });
  
        // แสดงข้อความแจ้งเตือน
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
        const select = row.querySelector(".receive-item-select");
        if (select.value) {
          hasItems = true;
  
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
  
    // ============== ฟังก์ชันสำหรับการเบิกสินค้า ==============
  
    // ฟังก์ชันเพิ่มแถวรายการสินค้าสำหรับการเบิกสินค้า
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
  
    
    // ฟังก์ชันบันทึกการเบิกสินค้า (แบบง่าย - ไม่ใช้ API)
  // ฟังก์ชันบันทึกการเบิกสินค้าแบบง่าย
  // ฟังก์ชันบันทึกการเบิกสินค้า
  function saveIssueItems() {
    try {
      // ดึงข้อมูลจากฟอร์ม (ปรับให้เข้ากับ UI ของคุณ)
      const itemElement = document.querySelector('select[aria-label="สินค้า"]') || document.querySelector('select');
      const quantityElement = document.querySelector('input[type="number"]');
      
      console.log("ข้อมูลองค์ประกอบ:", {
        itemElement: itemElement ? "พบ" : "ไม่พบ",
        quantityElement: quantityElement ? "พบ" : "ไม่พบ"
      });
      
      if (!itemElement || !quantityElement) {
        alert("ไม่พบองค์ประกอบสำหรับส่งข้อมูล");
        return;
      }
      
      const itemId = itemElement.value;
      const quantity = quantityElement.value;
      
      console.log("ข้อมูลที่จะส่ง:", { itemId, quantity });
      
      // ส่งข้อมูลไปยัง API
      const token = localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
      
      fetch("/api/inventory/simple-issue", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          items: [{
            item_id: itemId, // ส่ง ID แบบเต็ม เช่น "กระดาษ A4 (ITM001)" - API จะแยกส่วน ID ออกมาเอง
            quantity: parseInt(quantity)
          }]
        })
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.message || "ไม่สามารถเบิกสินค้าได้");
          });
        }
        return response.json();
      })
      .then(data => {
        alert("เบิกสินค้าเรียบร้อยแล้ว");
        location.reload(); // รีโหลดหน้าเพื่ออัปเดตข้อมูล
      })
      .catch(error => {
        console.error("Error:", error);
        alert("เกิดข้อผิดพลาด: " + error.message);
      });
    } catch (error) {
      console.error("Error in function:", error);
      alert("เกิดข้อผิดพลาดในฟังก์ชัน: " + error.message);
    }
  }
  
  
  
  // ฟังก์ชันบันทึกการเบิกสินค้า
  // ฟังก์ชันบันทึกการเบิกสินค้า
  async function saveIssueItems() {
    try {
      // ตรวจสอบความถูกต้องของฟอร์ม
      if (!validateIssueForm()) {
        return;
      }
      
      // แสดง loading
      showLoading();
      
      // เก็บข้อมูลจากฟอร์ม
      const issueData = {
        requester_name: document.getElementById("requester-name").value,
        department: document.getElementById("department").value,
        notes: document.getElementById("issue-notes").value,
        items: []
      };
      
      // เก็บข้อมูลรายการสินค้า
      const itemRows = document.querySelectorAll(".issue-item-row");
      itemRows.forEach(row => {
        const select = row.querySelector(".issue-item-select");
        if (select && select.value) {
          const itemId = select.value;
          const quantity = parseInt(row.querySelector(".issue-item-quantity").value);
          
          issueData.items.push({
            item_id: itemId,
            quantity: quantity
          });
        }
      });
      
      // ส่งข้อมูลไปยัง API
      const token = localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
      
      const response = await fetch("/api/inventory/issue", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(issueData)
      });
      
      // ซ่อน loading
      hideLoading();
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || "ไม่สามารถเบิกสินค้าได้");
      }
      
      // แสดงข้อความแจ้งเตือน
      showAlert(responseData.message || "เบิกสินค้าเรียบร้อยแล้ว");
      
      // พิมพ์ใบเบิกสินค้า (ถ้าต้องการ)
      if (confirm("ต้องการพิมพ์ใบเบิกสินค้าหรือไม่?")) {
        printIssueReceipt(issueData, responseData.issue_id);
      }
      
      // รีเซ็ตฟอร์ม
      resetIssueForm();
      
      // โหลดข้อมูลสินค้าใหม่
      fetchInventoryItems();
      
    } catch (error) {
      // ซ่อน loading
      hideLoading();
      
      console.error("Error saving issue:", error);
      showAlert(`เกิดข้อผิดพลาด: ${error.message}`, "error");
    }
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
  
    // ฟังก์ชันสำหรับการเบิกสินค้า (ปรับปรุงใหม่)
  
  // ฟังก์ชันเพิ่มแถวรายการสินค้าสำหรับการเบิกสินค้า
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
          <!-- รายการสินค้าจะถูกเพิ่มที่นี่ด้วย JavaScript -->
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
  
  // ฟังก์ชันเพิ่ม event listeners สำหรับแถวรายการสินค้าที่เบิก
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
        
        // ปรับค่าจำนวนเป็นค่าคงเหลือทั้งหมด (เบิกทั้งหมดเลย)
        quantityInput.value = stock;
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
    const itemRows = document.querySelectorAll("#issue-items-body tr");
    if (itemRows.length === 0) {
      showAlert("กรุณาเพิ่มรายการสินค้า", "error");
      return false;
    }
    
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
  // ฟังก์ชันบันทึกการเบิกสินค้า
  async function saveIssueItems() {
    try {
      // ตรวจสอบความถูกต้องของฟอร์ม
      if (!validateIssueForm()) {
        return;
      }
      
      // เก็บข้อมูลจากฟอร์ม
      const issueData = {
        issue_date: document.getElementById("issue-date").value,
        department: document.getElementById("department").value,
        requester_name: document.getElementById("requester-name").value,
        notes: document.getElementById("issue-notes").value,
        items: []
      };
      
      // เก็บข้อมูลรายการสินค้า
      const itemRows = document.querySelectorAll("#issue-items-body tr");
      itemRows.forEach(row => {
        const select = row.querySelector(".issue-item-select");
        if (select && select.value) {
          const itemId = select.value;
          const quantity = parseInt(row.querySelector(".issue-item-quantity").value);
          
          issueData.items.push({
            item_id: itemId,
            quantity: quantity
          });
        }
      });
      
      // แสดง loading
      showLoading();
      
      // อัพเดทข้อมูลในฐานข้อมูลโดยตรง
      try {
        // วิธีที่ 1: ใช้ API (แนะนำ)
        const token = localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
        const response = await fetch("/api/inventory/simple-issue", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(issueData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || "ไม่สามารถเบิกสินค้าได้");
        }
        
        // อัพเดทข้อมูลในเครื่องด้วย
        for (const item of issueData.items) {
          const index = currentItems.findIndex(i => i.id === item.item_id);
          if (index !== -1) {
            currentItems[index].in_stock -= item.quantity;
          }
        }
        
        hideLoading();
        showAlert("บันทึกการเบิกสินค้าเรียบร้อยแล้ว");
        
        // รีเซ็ตฟอร์ม
        resetIssueForm();
        
        // อัพเดทการแสดงผล
        updateInventorySummary();
        displayInventoryItems();
        
      } catch (apiError) {
        console.error("API Error:", apiError);
        
        // วิธีที่ 2: ถ้าไม่สามารถใช้ API ได้ ให้อัพเดทแค่ในเครื่อง
        for (const item of issueData.items) {
          const index = currentItems.findIndex(i => i.id === item.item_id);
          if (index !== -1) {
            currentItems[index].in_stock -= item.quantity;
          }
        }
        
        hideLoading();
        showAlert("บันทึกการเบิกสินค้าเรียบร้อยแล้ว (โหมดออฟไลน์)");
        
        // รีเซ็ตฟอร์ม
        resetIssueForm();
        
        // อัพเดทการแสดงผล
        updateInventorySummary();
        displayInventoryItems();
      }
      
    } catch (error) {
      hideLoading();
      console.error("Error:", error);
      showAlert("เกิดข้อผิดพลาด: " + error.message, "error");
    }
  }
  
  // ฟังก์ชันพิมพ์ใบเบิกสินค้า
  function printIssueReceipt(issueData, issueId) {
    // สร้างหน้าต่างใหม่สำหรับการพิมพ์
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showAlert("ไม่สามารถเปิดหน้าต่างสำหรับพิมพ์ได้ กรุณาอนุญาตให้เปิด pop-up", "error");
      return;
    }
    
    // รวบรวมข้อมูลสินค้าที่เบิก
    const itemDetails = issueData.items.map(item => {
      const itemInfo = currentItems.find(i => i.id === item.item_id);
      return {
        id: item.item_id,
        name: itemInfo ? itemInfo.name : 'ไม่พบข้อมูล',
        quantity: item.quantity,
        unit: itemInfo ? itemInfo.unit : '',
        unit_price: itemInfo ? itemInfo.unit_price : 0,
        total: (itemInfo ? itemInfo.unit_price : 0) * item.quantity
      };
    });
    
    // คำนวณยอดรวม
    const totalAmount = itemDetails.reduce((sum, item) => sum + item.total, 0);
    
    // สร้าง HTML สำหรับการพิมพ์
    const today = new Date();
    const formattedDate = today.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ใบเบิกสินค้า ${issueId}</title>
        <style>
          body {
            font-family: 'Prompt', sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 14px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .info-container {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .info-item {
            margin-bottom: 10px;
          }
          .info-item strong {
            display: inline-block;
            width: 100px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          .text-right {
            text-align: right;
          }
          .total-row {
            font-weight: bold;
          }
          .signature {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
          }
          .signature-item {
            width: 45%;
            text-align: center;
          }
          .signature-line {
            border-top: 1px solid #000;
            margin-top: 50px;
            padding-top: 10px;
          }
          @media print {
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align: right; margin-bottom: 20px;">
          <button onclick="window.print()">พิมพ์เอกสาร</button>
        </div>
        
        <div class="header">
          <h1>ใบเบิกสินค้า</h1>
        </div>
        
        <div class="info-container">
          <div>
            <div class="info-item"><strong>เลขที่:</strong> ${issueId}</div>
            <div class="info-item"><strong>วันที่:</strong> ${formattedDate}</div>
            <div class="info-item"><strong>แผนก:</strong> ${getDepartmentName(issueData.department)}</div>
          </div>
          <div>
            <div class="info-item"><strong>ผู้เบิก:</strong> ${issueData.requester_name}</div>
            <div class="info-item"><strong>หมายเหตุ:</strong> ${issueData.notes || '-'}</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 10%;">ลำดับ</th>
              <th style="width: 15%;">รหัสสินค้า</th>
              <th style="width: 40%;">รายการ</th>
              <th style="width: 10%;">จำนวน</th>
              <th style="width: 10%;">หน่วย</th>
              <th style="width: 15%;">ราคาต่อหน่วย</th>
              <th style="width: 15%;">ราคารวม</th>
            </tr>
          </thead>
          <tbody>
            ${itemDetails.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td class="text-right">${item.quantity}</td>
                <td>${item.unit}</td>
                <td class="text-right">${item.unit_price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="text-right">${item.total.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="6" class="text-right">ยอดรวม</td>
              <td class="text-right">${totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tfoot>
        </table>
        
        <div class="signature">
          <div class="signature-item">
            <div class="signature-line">ผู้เบิก</div>
          </div>
          <div class="signature-item">
            <div class="signature-line">ผู้จ่าย</div>
          </div>
        </div>
        
        <script>
          // ฟังก์ชันแปลงรหัสแผนกเป็นชื่อ
          function getDepartmentName(code) {
            const deptMap = {
              'procurement': 'ฝ่ายจัดซื้อ',
              'finance': 'ฝ่ายการเงิน',
              'it': 'ฝ่ายไอที',
              'hr': 'ฝ่ายทรัพยากรบุคคล',
              'marketing': 'ฝ่ายการตลาด'
            };
            return deptMap[code] || code;
          }
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  }
  
  // ฟังก์ชันแปลงรหัสแผนกเป็นชื่อ
  function getDepartmentName(code) {
    const deptMap = {
      'procurement': 'ฝ่ายจัดซื้อ',
      'finance': 'ฝ่ายการเงิน',
      'it': 'ฝ่ายไอที',
      'hr': 'ฝ่ายทรัพยากรบุคคล',
      'marketing': 'ฝ่ายการตลาด'
    };
    return deptMap[code] || code;
  }
  
  // ฟังก์ชันรีเซ็ตฟอร์มเบิกสินค้า
  function resetIssueForm() {
    // กำหนดวันที่ปัจจุบัน
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    const issueDateInput = document.getElementById('issue-date');
    if (issueDateInput) {
      issueDateInput.value = formattedDate;
    }
    
    // สร้างเลขที่ใบเบิกสินค้าใหม่
    const newIssueNumber = "ISS-" + today.getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
    
    const issueNumberInput = document.getElementById('issue-number');
    if (issueNumberInput) {
      issueNumberInput.value = newIssueNumber;
    }
    
    // ล้างข้อมูลผู้เบิกและหมายเหตุ
    const requesterNameInput = document.getElementById('requester-name');
    if (requesterNameInput) {
      requesterNameInput.value = '';
    }
    
    const issueNotesInput = document.getElementById('issue-notes');
    if (issueNotesInput) {
      issueNotesInput.value = '';
    }
    
    // ล้างรายการสินค้า
    const itemsBody = document.getElementById('issue-items-body');
    if (itemsBody) {
      itemsBody.innerHTML = '';
      
      // เพิ่มแถวรายการสินค้าเริ่มต้น 1 รายการ
      addIssueItemRow();
    }
  }
  
  
  // ฟังก์ชันแสดงรายการสินค้าคงคลังสำหรับการเบิก
  function displayItemsForIssue() {
    const itemsBody = document.getElementById("issue-items-body");
    if (!itemsBody) return;
    
    // ล้างรายการเดิม
    itemsBody.innerHTML = "";
    
    // กรองเฉพาะสินค้าที่มีในคลัง
    const availableItems = currentItems.filter(item => item.in_stock > 0);
    
    if (availableItems.length === 0) {
      const emptyRow = document.createElement("tr");
      emptyRow.innerHTML = `
        <td colspan="5" style="text-align: center;">ไม่มีสินค้าในคลัง</td>
      `;
      itemsBody.appendChild(emptyRow);
      return;
    }
    
    // เพิ่มรายการสินค้าแต่ละชิ้น
    availableItems.forEach(item => {
      const row = document.createElement("tr");
      row.className = "issue-item-row";
      
      row.innerHTML = `
        <td>
          <div class="item-info">
            <strong>${item.name}</strong><br>
            <small>${item.id}</small>
          </div>
        </td>
        <td>${item.in_stock}</td>
        <td>
          <input type="number" class="form-control issue-item-quantity" 
                 value="${item.in_stock}" min="1" max="${item.in_stock}" 
                 data-item-id="${item.id}">
        </td>
        <td>${item.unit}</td>
        <td>
          <div class="form-check">
            <input type="checkbox" class="form-check-input issue-item-select" 
                   id="select-${item.id}" data-item-id="${item.id}">
            <label class="form-check-label" for="select-${item.id}">เบิก</label>
          </div>
        </td>
      `;
      
      itemsBody.appendChild(row);
      
      // เพิ่ม event listener สำหรับ checkbox
      const checkbox = row.querySelector(".issue-item-select");
      checkbox.addEventListener("change", updateSelectedItemsCount);
    });
    
    // อัปเดตจำนวนสินค้าที่เลือก
    updateSelectedItemsCount();
  }
  
  // ฟังก์ชันอัปเดตจำนวนสินค้าที่เลือก
  function updateSelectedItemsCount() {
    const selectedCount = document.querySelectorAll(".issue-item-select:checked").length;
    const totalCount = document.querySelectorAll(".issue-item-select").length;
    
    // อัปเดตข้อความแสดงจำนวนที่เลือก
    const countDisplay = document.getElementById("selected-items-count");
    if (countDisplay) {
      countDisplay.textContent = `เลือก ${selectedCount} จาก ${totalCount} รายการ`;
    }
  }
  
  // ฟังก์ชันสลับเลือกสินค้าทั้งหมด
  function toggleSelectAllItems() {
    const selectAllCheckbox = document.getElementById("select-all-items");
    if (!selectAllCheckbox) return;
    
    const isChecked = selectAllCheckbox.checked;
    
    // เลือกหรือยกเลิกทุกรายการ
    document.querySelectorAll(".issue-item-select").forEach(checkbox => {
      checkbox.checked = isChecked;
    });
    
    // อัปเดตจำนวนที่เลือก
    updateSelectedItemsCount();
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
    
    // ตรวจสอบว่าเลือกอย่างน้อย 1 รายการ
    const selectedItems = document.querySelectorAll(".issue-item-select:checked");
    if (selectedItems.length === 0) {
      showAlert("กรุณาเลือกอย่างน้อย 1 รายการ", "error");
      return false;
    }
    
    // ตรวจสอบจำนวนที่เบิกของแต่ละรายการ
    let isValid = true;
    selectedItems.forEach(checkbox => {
      const itemId = checkbox.dataset.itemId;
      const row = checkbox.closest("tr");
      const quantityInput = row.querySelector(".issue-item-quantity");
      const quantity = parseInt(quantityInput.value);
      const maxQuantity = parseInt(quantityInput.max);
      
      if (!quantity || quantity <= 0) {
        showAlert(`กรุณากรอกจำนวนสินค้าให้มากกว่า 0`, "error");
        quantityInput.focus();
        isValid = false;
        return false;
      }
      
      if (quantity > maxQuantity) {
        showAlert(`จำนวนที่เบิกต้องไม่เกินจำนวนคงเหลือ`, "error");
        quantityInput.value = maxQuantity;
        quantityInput.focus();
        isValid = false;
        return false;
      }
    });
    
    return isValid;
  }
  
  // ฟังก์ชันบันทึกการเบิกสินค้า (แบบง่าย - ลดจำนวนในคลังเท่านั้น)
  
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
      
      if (items.length === 0) {
        hideLoading();
        showAlert("กรุณาเลือกสินค้าที่ต้องการเบิก", "error");
        return;
      }
      
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
  
  
  // ฟังก์ชันพิมพ์ใบเบิกสินค้า
  function printIssueReceipt(issueData, issueId) {
    // สร้างหน้าต่างใหม่สำหรับการพิมพ์
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showAlert("ไม่สามารถเปิดหน้าต่างสำหรับพิมพ์ได้ กรุณาอนุญาตให้เปิด pop-up", "error");
      return;
    }
    
    // รวบรวมข้อมูลสินค้าที่เบิก
    const itemDetails = issueData.items.map(item => {
      const itemInfo = currentItems.find(i => i.id === item.item_id);
      return {
        id: item.item_id,
        name: itemInfo ? itemInfo.name : 'ไม่พบข้อมูล',
        quantity: item.quantity,
        unit: itemInfo ? itemInfo.unit : '',
        unit_price: itemInfo ? itemInfo.unit_price : 0,
        total: (itemInfo ? itemInfo.unit_price : 0) * item.quantity
      };
    });
    
    // คำนวณยอดรวม
    const totalAmount = itemDetails.reduce((sum, item) => sum + item.total, 0);
    
    // สร้าง HTML สำหรับการพิมพ์
    const today = new Date();
    const formattedDate = today.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ใบเบิกสินค้า ${issueId}</title>
        <style>
          body {
            font-family: 'Prompt', sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 14px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .info-container {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .info-item {
            margin-bottom: 10px;
          }
          .info-item strong {
            display: inline-block;
            width: 100px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          .text-right {
            text-align: right;
          }
          .total-row {
            font-weight: bold;
          }
          .signature {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
          }
          .signature-item {
            width: 45%;
            text-align: center;
          }
          .signature-line {
            border-top: 1px solid #000;
            margin-top: 50px;
            padding-top: 10px;
          }
          @media print {
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align: right; margin-bottom: 20px;">
          <button onclick="window.print()">พิมพ์เอกสาร</button>
        </div>
        
        <div class="header">
          <h1>ใบเบิกสินค้า</h1>
        </div>
        
        <div class="info-container">
          <div>
            <div class="info-item"><strong>เลขที่:</strong> ${issueId}</div>
            <div class="info-item"><strong>วันที่:</strong> ${formattedDate}</div>
            <div class="info-item"><strong>แผนก:</strong> ${getDepartmentName(issueData.department)}</div>
          </div>
          <div>
            <div class="info-item"><strong>ผู้เบิก:</strong> ${issueData.requester_name}</div>
            <div class="info-item"><strong>หมายเหตุ:</strong> ${issueData.notes || '-'}</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 10%;">ลำดับ</th>
              <th style="width: 15%;">รหัสสินค้า</th>
              <th style="width: 40%;">รายการ</th>
              <th style="width: 10%;">จำนวน</th>
              <th style="width: 10%;">หน่วย</th>
              <th style="width: 15%;">ราคาต่อหน่วย</th>
              <th style="width: 15%;">ราคารวม</th>
            </tr>
          </thead>
          <tbody>
            ${itemDetails.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td class="text-right">${item.quantity}</td>
                <td>${item.unit}</td>
                <td class="text-right">${item.unit_price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="text-right">${item.total.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="6" class="text-right">ยอดรวม</td>
              <td class="text-right">${totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tfoot>
        </table>
        
        <div class="signature">
          <div class="signature-item">
            <div class="signature-line">ผู้เบิก</div>
          </div>
          <div class="signature-item">
            <div class="signature-line">ผู้จ่าย</div>
          </div>
        </div>
        
        <script>
          function getDepartmentName(code) {
            const deptMap = {
              'procurement': 'ฝ่ายจัดซื้อ',
              'finance': 'ฝ่ายการเงิน',
              'it': 'ฝ่ายไอที',
              'hr': 'ฝ่ายทรัพยากรบุคคล',
              'marketing': 'ฝ่ายการตลาด'
            };
            return deptMap[code] || code;
          }
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  }
  
  // ฟังก์ชันแปลงรหัสแผนกเป็นชื่อ
  function getDepartmentName(code) {
    const deptMap = {
      'procurement': 'ฝ่ายจัดซื้อ',
      'finance': 'ฝ่ายการเงิน',
      'it': 'ฝ่ายไอที',
      'hr': 'ฝ่ายทรัพยากรบุคคล',
      'marketing': 'ฝ่ายการตลาด'
    };
    return deptMap[code] || code;
  }
  
  // ฟังก์ชันรีเซ็ตฟอร์มเบิกสินค้า
  function resetIssueForm() {
    // กำหนดวันที่ปัจจุบัน
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    const issueDateInput = document.getElementById('issue-date');
    if (issueDateInput) {
      issueDateInput.value = formattedDate;
    }
    
    // สร้างเลขที่ใบเบิกสินค้าใหม่
    const newIssueNumber = "ISS-" + today.getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
    
    const issueNumberInput = document.getElementById('issue-number');
    if (issueNumberInput) {
      issueNumberInput.value = newIssueNumber;
    }
    
    // ล้างข้อมูลผู้เบิกและหมายเหตุ
    const requesterNameInput = document.getElementById('requester-name');
    if (requesterNameInput) {
      requesterNameInput.value = '';
    }
    
    const issueNotesInput = document.getElementById('issue-notes');
    if (issueNotesInput) {
      issueNotesInput.value = '';
    }
    
    // แสดงรายการสินค้าใหม่
    displayItemsForIssue();
  }
  
  const saveIssueBtn = document.getElementById("save-issue-btn");
  if (saveIssueBtn) {
    saveIssueBtn.addEventListener("click", function() {
      saveIssueItems();
    });
  }
  
  function manualSaveIssue() {
    const itemId = document.querySelector('select').value;
    const quantity = document.querySelector('input[type="number"]').value;
    
    const requestData = {
      items: [{
        item_id: "ITM001", // ลองใช้รหัสแบบตรงๆ
        quantity: parseInt(quantity)
      }]
    };
    
    console.log("ข้อมูลที่จะส่ง:", JSON.stringify(requestData));
    
    fetch('/api/inventory/simple-issue', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + (localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken')),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          console.error("API error response:", data);
          throw new Error(data.message || "ไม่สามารถเบิกสินค้าได้");
        });
      }
      return response.json();
    })
    .then(data => {
      console.log("API success response:", data);
      alert('เบิกสินค้าเรียบร้อยแล้ว');
      location.reload();
    })
    .catch(error => {
      console.error('Error:', error);
      alert('เกิดข้อผิดพลาด: ' + error);
    });
  }
  
  function directUpdateInventory() {
    const itemId = "ITM001"; // รหัสสินค้าที่ต้องการเบิก
    const quantity = 1;       // จำนวนที่ต้องการเบิก
    
    // ส่ง API request โดยตรงไปที่ server
    fetch('/direct-update-inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        item_id: itemId,
        quantity: quantity
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log("API Response:", data);
      alert(data.message || "อัปเดตสินค้าเรียบร้อย");
      location.reload();
    })
    .catch(error => {
      console.error("Error:", error);
      alert("เกิดข้อผิดพลาด: " + error);
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
      
      // เก็บข้อมูลจากฟอร์ม
      const issueData = {
        requester_name: document.getElementById("requester-name").value,
        department: document.getElementById("department").value,
        notes: document.getElementById("issue-notes").value,
        items: []
      };
      
      // เก็บข้อมูลรายการสินค้า
      const itemRows = document.querySelectorAll(".issue-item-row");
      itemRows.forEach(row => {
        const select = row.querySelector(".issue-item-select");
        if (select && select.value) {
          const itemId = select.value;
          const quantity = parseInt(row.querySelector(".issue-item-quantity").value);
          
          issueData.items.push({
            item_id: itemId,
            quantity: quantity
          });
        }
      });
      
      // ส่งข้อมูลไปยัง API
      const token = localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
      
      const response = await fetch("/api/inventory/issue", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(issueData)
      });
      
      // ซ่อน loading
      hideLoading();
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || "ไม่สามารถเบิกสินค้าได้");
      }
      
      // แสดงข้อความแจ้งเตือน
      showAlert(responseData.message || "เบิกสินค้าเรียบร้อยแล้ว");
      
      // พิมพ์ใบเบิกสินค้า (ถ้าต้องการ)
      if (confirm("ต้องการพิมพ์ใบเบิกสินค้าหรือไม่?")) {
        printIssueReceipt(issueData, responseData.issue_id);
      }
      
      // รีเซ็ตฟอร์ม
      resetIssueForm();
      
      // โหลดข้อมูลสินค้าใหม่
      fetchInventoryItems();
      
    } catch (error) {
      // ซ่อน loading
      hideLoading();
      
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