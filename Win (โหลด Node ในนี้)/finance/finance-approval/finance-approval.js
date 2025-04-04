document.addEventListener("DOMContentLoaded", function () {
  // DOM elements
  const approvalModal = document.getElementById("approvalModal");
  const modalClose = document.querySelector(".approval-modal-close");
  const cancelModalBtn = document.querySelector(".cancel-modal-btn");
  const filterBtn = document.querySelector(".filter-btn");
  const filterResetBtn = document.querySelector(".filter-reset");
  const tableBody = document.querySelector(".approval-table tbody");
  const logoutBtn = document.getElementById("logout-btn");

  // Set up common dashboard functionality
  setupDashboard();

  // Load dashboard summary data
  loadDashboardSummary();

  // Load budget requests data
  loadBudgetRequests();

  // Load departments for filter dropdown
  loadDepartments();

  // ตั้งค่า event listeners สำหรับปุ่มกรองและรีเซ็ต
  if (filterBtn) {
    filterBtn.addEventListener("click", function () {
      const filters =
        typeof getActiveFilters === "function" ? getActiveFilters() : {};
      loadBudgetRequests(filters);
    });
  }

  if (filterResetBtn) {
    filterResetBtn.addEventListener("click", function () {
      // รีเซ็ตค่าในฟอร์มฟิลเตอร์
      const startDateInput = document.getElementById("start-date");
      if (startDateInput) startDateInput.value = "";

      const statusFilter = document.getElementById("status-filter");
      if (statusFilter) statusFilter.value = "";

      const departmentFilter = document.getElementById("department-filter");
      if (departmentFilter) departmentFilter.value = "";

      // โหลดข้อมูลใหม่
      loadBudgetRequests();
    });
  }

  function setupDashboard() {
    // Username display
    const usernameDisplay = document.getElementById("username-display");
    if (usernameDisplay) {
      const username =
        localStorage.getItem("username") ||
        sessionStorage.getItem("username") ||
        "Finance";
      usernameDisplay.textContent = username;
    }

    // Logout button functionality
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        if (confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
          localStorage.removeItem("jwtToken");
          localStorage.removeItem("username");
          localStorage.removeItem("role_id");
          sessionStorage.removeItem("jwtToken");
          sessionStorage.removeItem("username");
          sessionStorage.removeItem("role_id");
          window.location.href = "../login.html";
        }
      });
    }
  }

  /**
   * โหลดข้อมูลสรุปแดชบอร์ด
   */
  function loadDashboardSummary() {
    try {
      const token =
        localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");

      // ดึงข้อมูลคำขอรอการอนุมัติ
      fetch("/api/purchase-requisitions?status=pending", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("ไม่สามารถดึงข้อมูลสรุปได้");
          }
          return response.json();
        })
        .then((pendingRequests) => {
          // อัปเดตวิดเจ็ตสรุป
          const pendingCountElement = document.getElementById(
            "pending-requests-count"
          );
          const pendingTotalElement = document.getElementById(
            "pending-requests-total"
          );

          if (pendingCountElement) {
            pendingCountElement.textContent = pendingRequests.length;
          }

          if (pendingTotalElement) {
            const totalAmount = pendingRequests.reduce(
              (sum, request) => sum + (request.total_amount || 0),
              0
            );
            pendingTotalElement.textContent = `฿${totalAmount.toLocaleString()}`;
          }
        })
        .catch((error) => {
          console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลสรุป:", error);
        });
    } catch (error) {
      console.error(
        "เกิดข้อผิดพลาดที่ไม่คาดคิดใน loadDashboardSummary:",
        error
      );
    }
  }

  /**
   * ฟังก์ชันสำหรับดึงค่าฟิลเตอร์ที่ใช้งานอยู่
   *
   * @returns {Object} ออบเจกต์ที่มีค่าฟิลเตอร์
   */
  function getActiveFilters() {
    const filters = {};

    // ดึงค่าจากฟิลเตอร์วันที่
    const startDate = document.getElementById("start-date");
    if (startDate && startDate.value) {
      filters.date = startDate.value;
    }

    // ดึงค่าจากฟิลเตอร์สถานะ
    const statusFilter = document.getElementById("status-filter");
    if (statusFilter && statusFilter.value) {
      filters.status = statusFilter.value;
    }

    // ดึงค่าจากฟิลเตอร์แผนก
    const departmentFilter = document.getElementById("department-filter");
    if (departmentFilter && departmentFilter.value) {
      filters.department = departmentFilter.value;
    }

    return filters;
  }

  /**
   * Loads budget requests data
   *
   * @param {Object} filters - Optional filter parameters
   */
  async function loadBudgetRequests(filters = {}) {
    try {
      const token =
        localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
      const roleId = parseInt(
        localStorage.getItem("role_id") ||
          sessionStorage.getItem("role_id") ||
          "0"
      );

      let apiUrl = "/api/purchase-requisitions";
      const queryParams = new URLSearchParams();

      // สำหรับฝ่ายการเงิน (role_id 4) ดึงเฉพาะคำขอที่รออนุมัติ (pending)
      // สำหรับผู้บริหาร (role_id 1, 2) ดึงเฉพาะคำขอที่ฝ่ายการเงินยืนยันแล้ว (confirmed)
      if (roleId === 4) {
        queryParams.append("status", "pending");
      } else if (roleId === 1 || roleId === 2) {
        queryParams.append("status", "confirmed");
      } else {
        // สำหรับ role อื่นๆ ดึงทั้งหมด
        queryParams.append("status", "all");
      }

      // เพิ่มฟิลเตอร์อื่นๆ
      if (filters.date) {
        queryParams.append("date", filters.date);
      }

      if (filters.department) {
        queryParams.append("department", filters.department);
      }

      apiUrl += "?" + queryParams.toString();

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("ไม่สามารถดึงข้อมูลคำขอได้");
      }

      const data = await response.json();

      const tableBody = document.querySelector(".approval-table tbody");
      tableBody.innerHTML = "";

      if (data.length === 0) {
        const noDataRow = document.createElement("tr");
        noDataRow.innerHTML = `
                    <td colspan="8" style="text-align: center;">
                        ไม่พบข้อมูลที่ตรงกับเงื่อนไข
                    </td>
                `;
        tableBody.appendChild(noDataRow);
        return;
      }

      // สร้างแถวในตารางสำหรับแต่ละคำขอ
      data.forEach((request) => {
        const row = document.createElement("tr");

        // Format dates (YYYY-MM-DD to DD/MM/YYYY)
        const reqDate = new Date(request.date);
        const formattedReqDate = `${String(reqDate.getDate()).padStart(
          2,
          "0"
        )}/${String(reqDate.getMonth() + 1).padStart(
          2,
          "0"
        )}/${reqDate.getFullYear()}`;

        // Format amount with Thai Baht symbol and comma separators
        const formattedAmount = `฿${parseFloat(
          request.total_amount
        ).toLocaleString()}`;

        // สร้างแถบสถานะที่เหมาะสม
        let statusBadgeClass = "status-pending";
        let statusText = "รออนุมัติ";

        if (request.status === "approved") {
          statusBadgeClass = "status-approved";
          statusText = "อนุมัติแล้ว";
        } else if (request.status === "rejected") {
          statusBadgeClass = "status-rejected";
          statusText = "ไม่อนุมัติ";
        } else if (request.status === "confirmed") {
          statusBadgeClass = "status-confirmed";
          statusText = "ยืนยันแล้ว";
        }

        // สร้าง required_date ถ้ามี
        let requiredDateDisplay = "";
        if (request.required_date) {
          const reqRequiredDate = new Date(request.required_date);
          requiredDateDisplay = `${String(reqRequiredDate.getDate()).padStart(
            2,
            "0"
          )}/${String(reqRequiredDate.getMonth() + 1).padStart(
            2,
            "0"
          )}/${reqRequiredDate.getFullYear()}`;
        }

        // สร้างปุ่มที่เหมาะสมตาม role และสถานะ
        let actionButtons = `
        <button class="approval-action-btn view-btn" data-id="${request.id}">
            <i class="fas fa-eye"></i>
        </button>
    `;

        // ถ้าเป็นฝ่ายการเงิน (role_id 4) และสถานะเป็น pending แสดงปุ่ม confirm และ reject
        if (roleId === 4 && request.status === 'pending') {
            actionButtons += `
                <button class="approval-action-btn confirm-btn" data-id="${request.id}" title="ยืนยัน">
                    <i class="fas fa-check-circle"></i>
                </button>
                <button class="approval-action-btn reject-btn" data-id="${request.id}" title="ปฏิเสธ">
                    <i class="fas fa-times-circle"></i>
                </button>
            `;
        } 
        // ถ้าเป็นผู้บริหาร (role_id 1, 2) และสถานะเป็น confirmed แสดงปุ่ม approve และ reject
        else if ((roleId === 1 || roleId === 2) && request.status === 'confirmed') {
            actionButtons += `
                <button class="approval-action-btn approve-btn" data-id="${request.id}" title="อนุมัติ">
                    <i class="fas fa-check"></i>
                </button>
                <button class="approval-action-btn reject-btn" data-id="${request.id}" title="ปฏิเสธ">
                    <i class="fas fa-times"></i>
                </button>
            `;
        }

        // สร้าง HTML สำหรับแถว
        row.innerHTML = `
                    <td>${request.id}</td>
                    <td>${formattedReqDate}</td>
                    <td>${request.department}</td>
                    <td>${request.title}</td>
                    <td>${formattedAmount}</td>
                    <td>${requiredDateDisplay}</td>
                    <td><span class="status-badge ${statusBadgeClass}">${statusText}</span></td>
                    <td>
                        <div class="approval-actions">
                            ${actionButtons}
                        </div>
                    </td>
                `;

        tableBody.appendChild(row);
      });

      // เพิ่ม event listener สำหรับปุ่มต่างๆ
      attachButtonListeners();
    } catch (error) {
      console.error("Error loading budget requests:", error);

      const tableBody = document.querySelector(".approval-table tbody");
      tableBody.innerHTML = "";
      const errorRow = document.createElement("tr");
      errorRow.innerHTML = `
                <td colspan="8" style="text-align: center; color: red;">
                    <i class="fas fa-exclamation-circle"></i> ไม่พบ หรือไม่สามารถเชื่อมต่อกับฐานข้อมูลได้
                </td>
            `;
      tableBody.appendChild(errorRow);
    }
  }

  /**
   * ฟังก์ชันเปิด modal รายละเอียดคำขอ
   *
   * @param {string} requestId - ID ของคำขอที่ต้องการดูรายละเอียด
   */
  async function openRequestDetails(requestId) {
    try {
      const token =
        localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");

      // ดึงข้อมูลรายละเอียดคำขอ
      const response = await fetch(`/api/purchase-requisitions/${requestId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("ไม่สามารถดึงข้อมูลรายละเอียดคำขอได้");
      }

      const request = await response.json();

      // แสดงข้อมูลในโมดัล
      document.getElementById("modal-request-id").textContent = request.id;
      document.getElementById("modal-request-date").textContent = formatDate(
        request.date
      );
      document.getElementById("modal-department").textContent =
        request.department;
      document.getElementById("modal-requester").textContent =
        request.requester_name || "ไม่ระบุ";

      if (request.required_date) {
        document.getElementById("modal-required-date").textContent = formatDate(
          request.required_date
        );
      } else {
        document.getElementById("modal-required-date").textContent = "ไม่ระบุ";
      }

      document.getElementById("modal-reason").textContent =
        request.description || "ไม่ระบุ";

      // แสดงรายการสินค้า
      const itemsContainer = document.getElementById("modal-items");
      itemsContainer.innerHTML = "";

      let totalAmount = 0;

      if (request.items && request.items.length > 0) {
        request.items.forEach((item) => {
          const itemRow = document.createElement("tr");
          const amount = item.quantity * item.unit_price;
          totalAmount += amount;

          itemRow.innerHTML = `
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>${item.unit}</td>
                        <td>฿${item.unit_price.toLocaleString()}</td>
                        <td>฿${amount.toLocaleString()}</td>
                    `;

          itemsContainer.appendChild(itemRow);
        });
      } else {
        const noItemsRow = document.createElement("tr");
        noItemsRow.innerHTML =
          '<td colspan="5" style="text-align: center;">ไม่พบรายการสินค้า</td>';
        itemsContainer.appendChild(noItemsRow);
      }

      document.getElementById(
        "modal-total"
      ).textContent = `฿${totalAmount.toLocaleString()}`;

      // อัปเดตสถานะในแถบความก้าวหน้า
      updateProgressBar(request.status);

      // ผูกปุ่มกับฟังก์ชัน approve/reject
      const approveModalBtn = document.getElementById("approve-modal-btn");
      const rejectModalBtn = document.getElementById("reject-modal-btn");

      if (approveModalBtn) {
        approveModalBtn.onclick = function () {
          const comment = document.getElementById("approval-comment").value;
          confirmRequest(requestId, "approved", comment);
          closeModal();
        };
      }

      if (rejectModalBtn) {
        rejectModalBtn.onclick = function () {
          const comment = document.getElementById("approval-comment").value;
          if (!comment || comment.trim() === "") {
            alert("กรุณาระบุเหตุผลในการไม่อนุมัติ");
            return;
          }
          confirmRequest(requestId, "rejected", comment);
          closeModal();
        };
      }

      // เปิดโมดัล
      approvalModal.style.display = "flex";
    } catch (error) {
      console.error("Error opening request details:", error);
      alert("ไม่สามารถดึงข้อมูลรายละเอียดคำขอได้");
    }
  }

  /**
   * ฟังก์ชันอัปเดตแถบความก้าวหน้าตามสถานะ
   *
   * @param {string} status - สถานะปัจจุบันของคำขอ
   */
  function updateProgressBar(status) {
    const progressFill = document.querySelector(".approval-progress-fill");
    const progressSteps = document.querySelectorAll(".approval-progress-step");

    // รีเซ็ตสถานะทั้งหมด
    progressSteps.forEach((step) =>
      step.classList.remove("active", "completed")
    );

    // ให้ขั้นตอนแรกเสร็จสิ้นเสมอ (ยื่นคำขอ)
    progressSteps[0].classList.add("completed");

    switch (status) {
      case "pending":
        progressFill.style.width = "33%";
        progressSteps[1].classList.add("active");
        break;
      case "approved":
        progressFill.style.width = "66%";
        progressSteps[1].classList.add("completed");
        progressSteps[2].classList.add("active");
        break;
      case "rejected":
        progressFill.style.width = "33%";
        progressSteps[1].classList.add("completed", "rejected");
        break;
      case "completed":
        progressFill.style.width = "100%";
        progressSteps[1].classList.add("completed");
        progressSteps[2].classList.add("completed");
        progressSteps[3].classList.add("completed");
        break;
      default:
        progressFill.style.width = "33%";
        progressSteps[1].classList.add("active");
    }
  }

  /**
   * ฟังก์ชันปิดโมดัล
   */
  function closeModal() {
    if (approvalModal) {
      approvalModal.style.display = "none";
      // เคลียร์ค่าใน textarea
      const commentTextarea = document.getElementById("approval-comment");
      if (commentTextarea) {
        commentTextarea.value = "";
      }
    }
  }

  // เพิ่ม event listener สำหรับปุ่มปิดโมดัล
  if (modalClose) {
    modalClose.addEventListener("click", closeModal);
  }

  if (cancelModalBtn) {
    cancelModalBtn.addEventListener("click", closeModal);
  }

  // เมื่อคลิกนอกโมดัลให้ปิด
  window.addEventListener("click", function (event) {
    if (event.target === approvalModal) {
      closeModal();
    }
  });

  /**
   * ฟังก์ชันสำหรับแปลงรูปแบบวันที่
   *
   * @param {string} dateString - วันที่ในรูปแบบ YYYY-MM-DD
   * @returns {string} วันที่ในรูปแบบ DD/MM/YYYY
   */
  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(
      2,
      "0"
    )}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  }

  /**
   * ยืนยันการอนุมัติหรือปฏิเสธคำขอ
   *
   * @param {string} requestId - ID ของคำขอ
   * @param {string} status - สถานะที่ต้องการเปลี่ยน (approved หรือ rejected)
   * @param {string} comment - ความคิดเห็นประกอบ (ถ้ามี)
   */
  async function confirmRequest(requestId, comment) {
    try {
      // ดึงโทเค็นจาก localStorage หรือ sessionStorage
      const token =
        localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");

      // ตรวจสอบ Token
      if (!token) {
        throw new Error("ไม่พบโทเค็น กรุณาเข้าสู่ระบบใหม่");
      }

      // ตรวจสอบ Token ก่อนส่ง
      const verifyResponse = await fetch("/users/verify", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!verifyResponse.ok) {
        alert("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
        window.location.href = "../login.html";
        return;
      }

      // ขอคำยืนยันจากผู้ใช้
      if (!confirm(`คุณต้องการยืนยันคำขอ ${requestId} ใช่หรือไม่?`)) {
        return; // ยกเลิกถ้าผู้ใช้ไม่ยืนยัน
      }

      // ถ้าไม่มี comment ที่ส่งมาให้ใช้ค่าเริ่มต้น
      if (!comment) {
        comment = "ยืนยันโดยฝ่ายการเงิน";
      }

      // เตรียมข้อมูลสำหรับส่งคำขอ
      const requestData = {
        comments: comment,
      };

      // ส่งคำขอไปยัง endpoint ยืนยัน
      const response = await fetch(
        `/api/purchase-requisitions/${requestId}/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "เกิดข้อผิดพลาดในการยืนยันคำขอ");
      }

      // แสดงข้อความสำเร็จ
      alert("ยืนยันคำขอเรียบร้อยแล้ว รอการอนุมัติจากผู้บริหาร");

      // โหลดข้อมูลใหม่
      loadBudgetRequests();
      loadDashboardSummary();
    } catch (error) {
      console.error("Error confirming request:", error);
      alert(error.message || "เกิดข้อผิดพลาดในการดำเนินการ");
    }
  }

  function attachButtonListeners() {
// ล้าง event listeners เดิมทั้งหมดก่อน
document.querySelectorAll('.approval-action-btn').forEach(button => {
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
});

    // เพิ่ม event listeners ให้กับปุ่มดูรายละเอียด
    document.querySelectorAll('.view-btn').forEach(button => {
        button.addEventListener('click', function() {
            const requestId = this.getAttribute('data-id');
            console.log('View request:', requestId);
            openRequestDetails(requestId);
        });
    });

    // เพิ่ม event listeners ให้กับปุ่มยืนยัน (confirm)
    document.querySelectorAll('.confirm-btn').forEach(button => {
        button.addEventListener('click', function() {
            const requestId = this.getAttribute('data-id');
            console.log('Confirm request:', requestId);
            confirmRequest(requestId);
        });
    });

    // เพิ่ม event listeners ให้กับปุ่มอนุมัติ (approve)
    document.querySelectorAll('.approve-btn').forEach(button => {
        button.addEventListener('click', function() {
            const requestId = this.getAttribute('data-id');
            console.log('Approve request:', requestId);
            approveRequest(requestId);
        });
    });

    // เพิ่ม event listeners ให้กับปุ่มปฏิเสธ (reject)
    document.querySelectorAll('.reject-btn').forEach(button => {
        button.addEventListener('click', function() {
            const requestId = this.getAttribute('data-id');
            console.log('Reject request:', requestId);
            rejectRequest(requestId);
        });
    });
}
  /**
   * โหลดข้อมูลแผนกสำหรับตัวกรอง
   */
  function loadDepartments() {
    const departmentSelect = document.getElementById("department-filter");

    if (!departmentSelect) {
      console.warn("ไม่พบอิลิเมนต์ department-filter");
      return;
    }

    // Mock departments
    const departments = [
      { name: "procurement", display_name: "ฝ่ายจัดซื้อ" },
      { name: "finance", display_name: "ฝ่ายการเงิน" },
      { name: "it", display_name: "ฝ่ายไอที" },
      { name: "hr", display_name: "ฝ่ายทรัพยากรบุคคล" },
      { name: "marketing", display_name: "ฝ่ายการตลาด" },
    ];

    // เพิ่มตัวเลือกแผนกลงในดรอปดาวน์
    departmentSelect.innerHTML = '<option value="">ทั้งหมด</option>';
    departments.forEach((dept) => {
      const option = document.createElement("option");
      option.value = dept.name;
      option.textContent = dept.display_name;
      departmentSelect.appendChild(option);
    });
  }

  async function approveRequest(requestId, comment) {
    try {
      // ดึงโทเค็นจาก localStorage หรือ sessionStorage
      const token =
        localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");

      // ตรวจสอบ Token
      if (!token) {
        throw new Error("ไม่พบโทเค็น กรุณาเข้าสู่ระบบใหม่");
      }

      // ตรวจสอบ Token ก่อนส่ง
      const verifyResponse = await fetch("/users/verify", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!verifyResponse.ok) {
        alert("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
        window.location.href = "../login.html";
        return;
      }

      // ขอคำยืนยันจากผู้ใช้
      if (!confirm(`คุณต้องการอนุมัติคำขอ ${requestId} ใช่หรือไม่?`)) {
        return; // ยกเลิกถ้าผู้ใช้ไม่ยืนยัน
      }

      // ถ้าไม่มี comment ที่ส่งมาให้ใช้ค่าเริ่มต้น
      if (!comment) {
        comment = "อนุมัติโดยผู้บริหาร";
      }

      // เตรียมข้อมูลสำหรับส่งคำขอ
      const requestData = {
        status: "approved",
        comments: comment,
      };

      // ส่งคำขอไปยัง endpoint อนุมัติ
      const response = await fetch(
        `/api/purchase-requisitions/${requestId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "เกิดข้อผิดพลาดในการอนุมัติคำขอ");
      }

      // แสดงข้อความสำเร็จ
      alert("อนุมัติคำขอเรียบร้อยแล้ว");

      // โหลดข้อมูลใหม่
      loadBudgetRequests();
      loadDashboardSummary();
    } catch (error) {
      console.error("Error approving request:", error);
      alert(error.message || "เกิดข้อผิดพลาดในการดำเนินการ");
    }
  }

  // ตรวจสอบให้แน่ใจว่าฟังก์ชัน rejectRequest ทำงานอย่างถูกต้อง
  async function rejectRequest(requestId) {
    try {
        console.log('Starting reject process for request:', requestId);
        
        // ดึงโทเค็นจาก localStorage หรือ sessionStorage
        const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
        const roleId = parseInt(localStorage.getItem('role_id') || sessionStorage.getItem('role_id') || '0');

        // ตรวจสอบ Token
        if (!token) {
            throw new Error('ไม่พบโทเค็น กรุณาเข้าสู่ระบบใหม่');
        }

        // ตรวจสอบ Token ก่อนส่ง
        const verifyResponse = await fetch('/users/verify', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!verifyResponse.ok) {
            alert('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
            window.location.href = '../login.html';
            return;
        }

        // ขอคำยืนยันจากผู้ใช้
        if (!confirm(`คุณต้องการปฏิเสธคำขอ ${requestId} ใช่หรือไม่?`)) {
            return; // ยกเลิกถ้าผู้ใช้ไม่ยืนยัน
        }

        // ขอเหตุผลในการปฏิเสธ
        const comment = prompt('กรุณาระบุเหตุผลในการปฏิเสธ:');
        if (!comment || comment.trim() === '') {
            alert('กรุณาระบุเหตุผลในการปฏิเสธ');
            return;
        }

        // เตรียมข้อมูลสำหรับส่งคำขอ
        const requestData = {
            status: 'rejected',
            comments: comment
        };

        console.log('Sending reject request with data:', requestData);

        // ส่งคำขอไปยัง endpoint ปฏิเสธ
        const response = await fetch(`/api/purchase-requisitions/${requestId}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestData)
        });
        
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'เกิดข้อผิดพลาดในการปฏิเสธคำขอ');
        }
        
        console.log('Request rejected successfully:', data);
        
        // แสดงข้อความสำเร็จ
        alert('ปฏิเสธคำขอเรียบร้อยแล้ว');
        
        // โหลดข้อมูลใหม่
        loadBudgetRequests();
        loadDashboardSummary();

    } catch (error) {
        console.error('Error rejecting request:', error);
        alert(error.message || 'เกิดข้อผิดพลาดในการดำเนินการ');
    }
}

  function addConfirmedStatusStyle() {
    // สร้าง style element ใหม่
    const style = document.createElement("style");
    style.textContent = `
            .status-badge.status-confirmed {
                background-color: #3F51B5; /* สีน้ำเงิน */
                color: #fff;
            }
        `;

    // เพิ่มเข้าไปใน head
    document.head.appendChild(style);
  }

  // เรียกใช้เมื่อโหลดหน้า
  document.addEventListener("DOMContentLoaded", function () {
    // เพิ่ม CSS สำหรับสถานะ confirmed
    addConfirmedStatusStyle();
  });
});
