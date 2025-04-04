document.addEventListener("DOMContentLoaded", function () {
  // ตรวจสอบว่าผู้ใช้มี role_id = 3 (Procurement)
  const roleId =
    localStorage.getItem("role_id") || sessionStorage.getItem("role_id");
  if (roleId != 3) {
    // ถ้าเข้าถึงหน้านี้ด้วย role ที่ไม่ใช่ Procurement ให้แสดงข้อความเตือน
    alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
    // และ redirect ไปยังหน้าที่เหมาะสมตาม role
    redirectBasedOnRole(roleId);
    return;
  }

  // กำหนดวันที่ปัจจุบัน
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0]; // รูปแบบ YYYY-MM-DD
  document.getElementById("pr-date").value = formattedDate;

  // สร้างเลขที่ใบขอซื้อ
  const prNumber =
    "PR-" + today.getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
  document.getElementById("pr-number").value = prNumber;

  // เพิ่มรายการสินค้า
  document
    .getElementById("add-item-btn")
    .addEventListener("click", function () {
      const itemsBody = document.getElementById("items-body");
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
            <td><input type="text" class="form-control item-total" value="0" readonly></td>
            <td>
                <button type="button" class="remove-item-btn">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        `;

      itemsBody.appendChild(newRow);

      // เพิ่ม event listeners สำหรับแถวใหม่
      addItemEventListeners(newRow);
    });

  // เพิ่ม event listeners สำหรับแถวแรก
  const firstRow = document.querySelector(".item-row");
  addItemEventListeners(firstRow);

  // ฟังก์ชันเพิ่ม event listeners สำหรับแถวรายการสินค้า
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
      totalInput.value = total.toFixed(2);

      // คำนวณยอดรวมทั้งหมด
      calculateGrandTotal();
    }

    // เพิ่ม event listeners
    quantityInput.addEventListener("input", calculateTotal);
    priceInput.addEventListener("input", calculateTotal);

    // ลบรายการ
    removeBtn.addEventListener("click", function () {
      if (document.querySelectorAll(".item-row").length > 1) {
        row.remove();
        calculateGrandTotal();
      } else {
        showAlert("ไม่สามารถลบรายการสุดท้ายได้", "error");
      }
    });
  }

  // คำนวณยอดรวมทั้งหมด
  function calculateGrandTotal() {
    const totalInputs = document.querySelectorAll(".item-total");
    let grandTotal = 0;

    totalInputs.forEach((input) => {
      grandTotal += parseFloat(input.value) || 0;
    });

    document.getElementById("grand-total").textContent = grandTotal.toFixed(2);

    // ตรวจสอบงบประมาณ
    checkBudget(grandTotal);
  }

  // ตรวจสอบงบประมาณ
  function checkBudget(amount) {
    const budgetRemaining =
      parseFloat(
        document
          .getElementById("remaining-budget")
          .textContent.replace(/,/g, "")
      ) || 0;
    const budgetStatus = document.getElementById("budget-status");

    if (amount > budgetRemaining) {
      budgetStatus.textContent = "ไม่เพียงพอ";
      budgetStatus.className = "budget-status danger";
    } else if (amount > budgetRemaining * 0.8) {
      budgetStatus.textContent = "ใกล้หมด";
      budgetStatus.className = "budget-status warning";
    } else {
      budgetStatus.textContent = "เพียงพอ";
      budgetStatus.className = "budget-status";
    }
  }

  // แสดงการแจ้งเตือน
  function showAlert(message, type = "") {
    const alertPopup = document.getElementById("alert-popup");
    alertPopup.textContent = message;
    alertPopup.className = "alert-popup" + (type ? " " + type : "");
    alertPopup.classList.add("show");

    setTimeout(() => {
      alertPopup.classList.remove("show");
    }, 3000);
  }

  // บันทึกใบขอซื้อ
  document.getElementById("save-btn").addEventListener("click", function () {
    // ตรวจสอบข้อมูล
    if (!validateForm()) {
      return;
    }

    // เก็บข้อมูลใบขอซื้อ
    const prData = collectFormData();

    // จำลองการบันทึกข้อมูล
    savePurchaseRequisition(prData, "pending");
  });

  // ส่งใบขอซื้อเพื่ออนุมัติ
  document.getElementById("submit-btn").addEventListener("click", function () {
    // ตรวจสอบข้อมูล
    if (!validateForm()) {
      return;
    }

    // เก็บข้อมูลใบขอซื้อ
    const prData = collectFormData();

    // ตรวจสอบงบประมาณก่อนส่งอนุมัติ
    const grandTotal =
      parseFloat(document.getElementById("grand-total").textContent) || 0;
    const budgetRemaining =
      parseFloat(
        document
          .getElementById("remaining-budget")
          .textContent.replace(/,/g, "")
      ) || 0;

    if (grandTotal > budgetRemaining) {
      if (
        !confirm("ยอดรวมเกินงบประมาณที่มีอยู่ ยืนยันที่จะส่งอนุมัติหรือไม่?")
      ) {
        return;
      }
    }

    // จำลองการบันทึกและส่งอนุมัติ
    savePurchaseRequisition(prData, "pending");
  });

  // ยกเลิกการทำรายการ
  document.getElementById("cancel-btn").addEventListener("click", function () {
    if (confirm("ยืนยันการยกเลิกการทำรายการ?")) {
      window.location.href = "procurement-dashboard.html";
    }
  });

  // ตรวจสอบความถูกต้องของข้อมูล
  function validateForm() {
    const title = document.getElementById("pr-title").value.trim();
    const itemRows = document.querySelectorAll(".item-row");
    let isValid = true;

    // ตรวจสอบหัวข้อ
    if (!title) {
      showAlert("กรุณาระบุหัวข้อ/วัตถุประสงค์", "error");
      document.getElementById("pr-title").focus();
      return false;
    }

    // ตรวจสอบรายการสินค้า
    let hasItems = false;

    itemRows.forEach((row) => {
      const nameInput = row.querySelector(".item-name");
      const quantityInput = row.querySelector(".item-quantity");
      const priceInput = row.querySelector(".item-price");

      const name = nameInput.value.trim();
      const quantity = parseFloat(quantityInput.value) || 0;
      const price = parseFloat(priceInput.value) || 0;

      if (name || quantity > 0 || price > 0) {
        hasItems = true;

        // ตรวจสอบความถูกต้องของแต่ละรายการ
        if (!name) {
          isValid = false;
          nameInput.style.borderColor = "#e74a3b";
        } else {
          nameInput.style.borderColor = "#d1d3e2";
        }

        if (quantity <= 0) {
          isValid = false;
          quantityInput.style.borderColor = "#e74a3b";
        } else {
          quantityInput.style.borderColor = "#d1d3e2";
        }

        if (price <= 0) {
          isValid = false;
          priceInput.style.borderColor = "#e74a3b";
        } else {
          priceInput.style.borderColor = "#d1d3e2";
        }
      }
    });

    if (!hasItems) {
      showAlert("กรุณาเพิ่มอย่างน้อย 1 รายการ", "error");
      return false;
    }

    if (!isValid) {
      showAlert("กรุณาตรวจสอบข้อมูลในรายการสินค้า", "error");
      return false;
    }

    return true;
  }

  // เก็บข้อมูลจากฟอร์ม
  function collectFormData() {
    // ดึงค่าจากฟอร์มโดยตรงและเก็บในตัวแปร
    const paymentTerms = document.getElementById("payment-terms").value;
    const deliveryDate = document.getElementById("delivery-date").value;
    const deliveryLocation = document.getElementById("delivery-location").value;
    
    console.log("ข้อมูลเงื่อนไขการชำระเงิน:", paymentTerms);
    console.log("ข้อมูลวันที่ต้องการสินค้า:", deliveryDate);
    console.log("ข้อมูลสถานที่จัดส่ง:", deliveryLocation);
    
    // ตรวจสอบและ log ข้อมูลก่อนส่ง
    const prData = {
        id: document.getElementById("pr-number").value,
        title: document.getElementById("pr-title").value.trim(),
        description: document.getElementById("pr-description").value.trim(),
        date: document.getElementById("pr-date").value,
        department: document.getElementById("department").value,
        vendor_id: document.getElementById("vendor-id").value || 'V001',
        status: "pending",
        
        // กำหนดค่าเงื่อนไขการชำระเงิน วันที่ต้องการสินค้า และสถานที่จัดส่ง
        payment_terms: paymentTerms,
        delivery_date: deliveryDate,
        delivery_location: deliveryLocation,
        
        items: [],
        totalAmount: parseFloat(document.getElementById("grand-total").textContent) || 0,
    };

    const itemRows = document.querySelectorAll(".item-row");
    itemRows.forEach((row) => {
        const name = row.querySelector(".item-name").value.trim();
        const quantity = parseFloat(row.querySelector(".item-quantity").value) || 0;
        const unit = row.querySelector(".item-unit").value;
        const unitPrice = parseFloat(row.querySelector(".item-price").value) || 0;
        const total = parseFloat(row.querySelector(".item-total").value) || 0;

        if (name && quantity > 0) {
            prData.items.push({
                name,
                quantity,
                unit,
                unitPrice,
                total
            });
        }
    });

    console.log('Collected form data:', prData);
    return prData;
}
  // จำลองการบันทึกข้อมูลใบขอซื้อ
  async function savePurchaseRequisition(prData, status) {
    try {
      // เตรียมข้อมูลสำหรับส่งไปยัง API
      const requestData = {
        ...prData,
        status: status,
      };

      // ในระบบจริงจะส่งข้อมูลไปยัง API
      console.log("บันทึกใบขอซื้อ:", requestData);

      // จำลองการส่งข้อมูลไปยัง API
      if (
        window.procurementFunctions &&
        window.procurementFunctions.createNewRequisition
      ) {
        const result = await window.procurementFunctions.createNewRequisition(
          requestData
        );
        console.log("ผลลัพธ์:", result);

        showAlert(
          "บันทึกใบขอซื้อสำเร็จ" +
            (status === "pending" ? " และส่งไปอนุมัติเรียบร้อยแล้ว" : "")
        );

        // รอสักครู่ก่อนที่จะ redirect
        // setTimeout(() => {
        //   window.location.href = "procurement-dashboard.html";
        // }, 2000);
      } else {
        // กรณีไม่สามารถเรียกใช้ฟังก์ชันได้ ให้ใช้ตัวอย่างการจำลอง
        setTimeout(() => {
          showAlert(
            "บันทึกใบขอซื้อสำเร็จ" +
              (status === "pending" ? " และส่งไปอนุมัติเรียบร้อยแล้ว" : "")
          );

          // รอสักครู่ก่อนที่จะ redirect
          // setTimeout(() => {
          //   window.location.href = "procurement-dashboard.html";
          // }, 2000);
        }, 1000);
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการบันทึกใบขอซื้อ:", error);
      showAlert("เกิดข้อผิดพลาดในการบันทึกใบขอซื้อ", "error");
    }
  }
});

document.addEventListener("DOMContentLoaded", function () {
  // ตรวจสอบสิทธิ์
  const roleId =
    localStorage.getItem("role_id") || sessionStorage.getItem("role_id");
  if (roleId != 3 && roleId != 1) {
    alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
    redirectBasedOnRole(roleId);
    return;
  }

  // กำหนดวันที่ปัจจุบัน
  const today = new Date();
    const deliveryDate = new Date();
    deliveryDate.setDate(today.getDate() + 7);
    document.getElementById("delivery-date").value = deliveryDate.toISOString().split("T")[0];
   
  // เพิ่มรายการสินค้า

  document.getElementById('add-item-btn').addEventListener('click', function() {
    addItemRow();
});

  // เพิ่ม event listeners สำหรับแถวแรก
  const firstRow = document.querySelector(".item-row");
  if (firstRow) {
    addItemEventListeners(firstRow);
  }

  // บันทึกใบขอซื้อ (แบบร่าง)
  document.getElementById("save-btn").addEventListener("click", function () {
    if (!validateForm()) {
      return;
    }

    const prData = collectFormData();
    prData.status = "pending";

    savePurchaseRequisition(prData);
  });

  // ส่งอนุมัติใบขอซื้อ
  document.getElementById("submit-btn").addEventListener("click", function () {
    if (!validateForm()) {
      return;
    }

    const prData = collectFormData();
    prData.status = "pending";

    savePurchaseRequisition(prData);
  });

  // ยกเลิกการทำรายการ
  document.getElementById("cancel-btn").addEventListener("click", function () {
    if (confirm("ยืนยันการยกเลิกการทำรายการ?")) {
      window.location.href = "procurement-dashboard.html";
    }
  });

  // ฟังก์ชันเพิ่มแถวรายการสินค้า
  // ฟังก์ชันเพิ่มแถวรายการสินค้า
  function addItemRow() {
    const itemsBody = document.getElementById("items-body");
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
        <td><input type="text" class="form-control item-total" value="0" readonly></td>
        <td>
            <button type="button" class="remove-item-btn">
                <i class="fas fa-times"></i>
            </button>
        </td>
    `;

    itemsBody.appendChild(newRow);

    // เพิ่ม event listeners สำหรับแถวใหม่
    addItemEventListeners(newRow);
  }

  // ฟังก์ชันเพิ่ม event listeners สำหรับแถวรายการสินค้า
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
      totalInput.value = total.toFixed(2);

      // คำนวณยอดรวมทั้งหมด
      calculateGrandTotal();
    }

    // เพิ่ม event listeners
    quantityInput.addEventListener("input", calculateTotal);
    priceInput.addEventListener("input", calculateTotal);

    // ลบรายการ
    removeBtn.addEventListener("click", function () {
      if (document.querySelectorAll(".item-row").length > 1) {
        row.remove();
        calculateGrandTotal();
      } else {
        showAlert("ไม่สามารถลบรายการสุดท้ายได้", "error");
      }
    });
  }

  // คำนวณยอดรวมทั้งหมด
  function calculateGrandTotal() {
    const totalInputs = document.querySelectorAll(".item-total");
    let grandTotal = 0;

    totalInputs.forEach((input) => {
      grandTotal += parseFloat(input.value) || 0;
    });

    document.getElementById("grand-total").textContent = grandTotal.toFixed(2);

    // ตรวจสอบงบประมาณ
    checkBudget(grandTotal);
  }

  // ตรวจสอบงบประมาณ
  function checkBudget(amount) {
    // ในระบบจริงอาจต้องเรียก API เพื่อตรวจสอบงบประมาณ
    const budgetRemaining =
      parseFloat(
        document
          .getElementById("remaining-budget")
          .textContent.replace(/,/g, "")
      ) || 0;
    const budgetStatus = document.getElementById("budget-status");

    if (amount > budgetRemaining) {
      budgetStatus.textContent = "ไม่เพียงพอ";
      budgetStatus.className = "budget-status danger";
    } else if (amount > budgetRemaining * 0.8) {
      budgetStatus.textContent = "ใกล้หมด";
      budgetStatus.className = "budget-status warning";
    } else {
      budgetStatus.textContent = "เพียงพอ";
      budgetStatus.className = "budget-status";
    }
  }

  // ตรวจสอบความถูกต้องของฟอร์ม
  function validateForm() {
    const title = document.getElementById("pr-title").value.trim();
    const itemRows = document.querySelectorAll(".item-row");
    let isValid = true;

    // ตรวจสอบหัวข้อ
    if (!title) {
      showAlert("กรุณาระบุหัวข้อ/วัตถุประสงค์", "error");
      document.getElementById("pr-title").focus();
      return false;
    }

    // ตรวจสอบรายการสินค้า
    let hasItems = false;

    itemRows.forEach((row) => {
      const nameInput = row.querySelector(".item-name");
      const quantityInput = row.querySelector(".item-quantity");
      const priceInput = row.querySelector(".item-price");

      const name = nameInput.value.trim();
      const quantity = parseFloat(quantityInput.value) || 0;
      const price = parseFloat(priceInput.value) || 0;

      if (name || quantity > 0 || price > 0) {
        hasItems = true;

        // ตรวจสอบความถูกต้องของแต่ละรายการ
        if (!name) {
          isValid = false;
          nameInput.style.borderColor = "#e74a3b";
        } else {
          nameInput.style.borderColor = "#d1d3e2";
        }

        if (quantity <= 0) {
          isValid = false;
          quantityInput.style.borderColor = "#e74a3b";
        } else {
          quantityInput.style.borderColor = "#d1d3e2";
        }

        if (price <= 0) {
          isValid = false;
          priceInput.style.borderColor = "#e74a3b";
        } else {
          priceInput.style.borderColor = "#d1d3e2";
        }
      }
    });

    if (!hasItems) {
      showAlert("กรุณาเพิ่มอย่างน้อย 1 รายการ", "error");
      return false;
    }

    if (!isValid) {
      showAlert("กรุณาตรวจสอบข้อมูลในรายการสินค้า", "error");
      return false;
    }

    return true;
  }

  // เก็บข้อมูลจากฟอร์ม
  function collectFormData() {
    // ตรวจสอบและ log ข้อมูลก่อนส่ง
    const prData = {
        prNumber: document.getElementById("pr-number").value,
        date: document.getElementById("pr-date").value,
        department: document.getElementById("department").value,
        title: document.getElementById("pr-title").value.trim(),
        description: document.getElementById("pr-description").value.trim(),
        vendor_id: document.getElementById("vendor-id").value || 'V001',
        
        items: [],
        totalAmount: parseFloat(document.getElementById("grand-total").textContent) || 0,
    };

    const itemRows = document.querySelectorAll(".item-row");
    itemRows.forEach((row) => {
        const name = row.querySelector(".item-name").value.trim();
        const quantity = parseFloat(row.querySelector(".item-quantity").value) || 0;
        const unit = row.querySelector(".item-unit").value;
        const unitPrice = parseFloat(row.querySelector(".item-price").value) || 0;
        const total = parseFloat(row.querySelector(".item-total").value) || 0;

        if (name && quantity > 0) {
            prData.items.push({
                name,
                quantity,
                unit,
                unitPrice,
                total
            });
        }
    });

    console.log('Collected form data:', prData);
    return prData;
}
  // บันทึกใบขอซื้อ
// แก้ไขฟังก์ชัน savePurchaseRequisition เพื่อให้มั่นใจว่ามีการส่งข้อมูลไปยัง API อย่างถูกต้อง

async function savePurchaseRequisition(prData) {
  try {
    console.log('ข้อมูลที่จะส่งไปบันทึก:', prData);

    const token = localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");

    // เพิ่มการแสดงข้อมูลทดสอบก่อนส่ง API
    console.log('ข้อมูลที่จะส่ง API:');
    console.log('- Payment Terms:', prData.payment_terms);
    console.log('- Delivery Date:', prData.delivery_date);
    console.log('- Delivery Location:', prData.delivery_location);

    // สร้าง data object ให้ตรงกับ API
    const apiData = {
      prNumber: prData.prNumber,
      title: prData.title,
      description: prData.description,
      date: prData.date,
      department: prData.department,
      vendor_id: prData.vendor_id,
      status: prData.status,
      
      // ต้องแน่ใจว่าส่งข้อมูลเหล่านี้ไปด้วย
      payment_terms: prData.payment_terms,
      delivery_date: prData.delivery_date,
      delivery_location: prData.delivery_location,
      
      items: prData.items,
      totalAmount: prData.totalAmount
    };

    const response = await fetch("/api/purchase-requisitions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiData),
    });

    console.log('Response status:', response.status);
    // บันทึก response text เพื่อดู error ถ้ามี
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    // แปลงกลับเป็น JSON หากเป็นไปได้
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing response:', e);
      result = { message: responseText };
    }

    if (!response.ok) {
      throw new Error(result.message || "ไม่สามารถบันทึกใบขอซื้อได้");
    }

    console.log('บันทึกใบขอซื้อสำเร็จ:', result);

    showAlert(
      `บันทึกใบขอซื้อ ${result.data ? result.data.id : apiData.prNumber} สำเร็จ` +
      (prData.status === "pending" ? " และส่งไปอนุมัติเรียบร้อยแล้ว" : "")
    );

    // รอสักครู่ก่อนที่จะ redirect
    setTimeout(() => {
      window.location.href = "procurement-dashboard.html";
    }, 2000);
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการบันทึกใบขอซื้อ:", error);
    showAlert("เกิดข้อผิดพลาดในการบันทึกใบขอซื้อ: " + error.message, "error");
  }
}
  // แสดงการแจ้งเตือน
  function showAlert(message, type = "") {
    const alertPopup = document.getElementById("alert-popup");
    alertPopup.textContent = message;
    alertPopup.className = "alert-popup" + (type ? " " + type : "");
    alertPopup.classList.add("show");

    setTimeout(() => {
      alertPopup.classList.remove("show");
    }, 3000);
  }
});

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
      const token = localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
      const apiUrl = window.location.origin + `/api/vendors?search=${encodeURIComponent(keyword)}`;

      const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
          },
      });

      if (!response.ok) {
          throw new Error("ไม่สามารถค้นหาผู้ขายได้");
      }

      const vendors = await response.json();
      displayVendorSearchResults(vendors);
  } catch (error) {
      console.error("Error searching vendors:", error);

      // ข้อมูลจำลอง
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
          }
      ];

      const filteredVendors = mockVendors.filter(
          (vendor) =>
              vendor.name.toLowerCase().includes(keyword.toLowerCase()) ||
              vendor.contact_name.toLowerCase().includes(keyword.toLowerCase())
      );

      displayVendorSearchResults(filteredVendors);
  }
}

function displayVendorSearchResults(vendors) {
  const vendorResults = document.getElementById("vendor-results");
  if (!vendorResults) return;

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

document.addEventListener("DOMContentLoaded", function () {
  const vendorSearchInput = document.getElementById("vendor-search");
  const vendorResults = document.getElementById("vendor-results");

  const today = new Date();
  const deliveryDate = new Date();
  deliveryDate.setDate(today.getDate() + 7);
  
  // ตรวจสอบว่ามี element หรือไม่ก่อนกำหนดค่า
  const deliveryDateInput = document.getElementById("delivery-date");
  if (deliveryDateInput) {
      deliveryDateInput.value = deliveryDate.toISOString().split("T")[0];
      console.log("ตั้งค่าวันที่ต้องการสินค้าเริ่มต้นเป็น:", deliveryDateInput.value);
  }


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
});

// 1. เพิ่มการกำหนดค่าเริ่มต้นของวันที่ต้องการสินค้า (โดยใช้วันที่ 7 วันหลังจากวันปัจจุบัน)
// เพิ่มโค้ดนี้ใน document.addEventListener("DOMContentLoaded", function () { ... }) 
// ควรเพิ่มถัดจากบรรทัดที่กำหนดค่า pr-date

// กำหนดวันที่ต้องการสินค้า (7 วันจากวันนี้)
// 2. แก้ไขฟังก์ชัน collectFormData() เพื่อเก็บข้อมูลฟิลด์ใหม่
// แก้ไขฟังก์ชัน collectFormData() โดยเพิ่มฟิลด์ใหม่

function collectFormData() {

  const paymentTerms = document.getElementById("payment-terms").value;
  const deliveryDate = document.getElementById("delivery-date").value;
  const deliveryLocation = document.getElementById("delivery-location").value;
  
  console.log("ค่าที่ดึงจากฟอร์ม:");
  console.log("- Payment Terms:", paymentTerms);
  console.log("- Delivery Date:", deliveryDate);
  console.log("- Delivery Location:", deliveryLocation);

    // ตรวจสอบและ log ข้อมูลก่อนส่ง
    const prData = {
        id: document.getElementById("pr-number").value,
        payment_terms: paymentTerms,
        delivery_date: deliveryDate,
        delivery_location: deliveryLocation,
        prNumber: document.getElementById("pr-number").value,
        date: document.getElementById("pr-date").value,
        department: document.getElementById("department").value,
        title: document.getElementById("pr-title").value.trim(),
        description: document.getElementById("pr-description").value.trim(),
        vendor_id: document.getElementById("vendor-id").value || 'V001',
        
        // เพิ่มฟิลด์ใหม่
        payment_terms: document.getElementById("payment-terms").value,
        delivery_date: document.getElementById("delivery-date").value,
        delivery_location: document.getElementById("delivery-location").value,
        
        items: [],
        totalAmount: parseFloat(document.getElementById("grand-total").textContent) || 0,
    };

    const itemRows = document.querySelectorAll(".item-row");
    itemRows.forEach((row) => {
        const name = row.querySelector(".item-name").value.trim();
        const quantity = parseFloat(row.querySelector(".item-quantity").value) || 0;
        const unit = row.querySelector(".item-unit").value;
        const unitPrice = parseFloat(row.querySelector(".item-price").value) || 0;
        const total = parseFloat(row.querySelector(".item-total").value) || 0;

        if (name && quantity > 0) {
            prData.items.push({
                name,
                quantity,
                unit,
                unitPrice,
                total
            });
        }
    });

    console.log('Collected form data:', prData);
    return prData;
}