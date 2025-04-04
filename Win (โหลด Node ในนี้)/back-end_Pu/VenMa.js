// ตัวแปรสำหรับเก็บข้อมูลและสถานะ
let vendors = [];
let currentPage = 1;
let selectedVendorId = null;
let isEditing = false;
const itemsPerPage = 10;

document.addEventListener("DOMContentLoaded", function () {
    // ตรวจสอบว่าผู้ใช้มี role_id = 3 (Procurement)
    const roleId = localStorage.getItem("role_id") || sessionStorage.getItem("role_id");
    if (roleId != 3) {
        alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
        redirectBasedOnRole(roleId);
        return;
    }

    // เพิ่ม event listeners สำหรับปุ่มต่างๆ
    setupEventListeners();
    
    // โหลดข้อมูลผู้ขายเมื่อโหลดหน้า
    fetchVendors();

  // ข้อมูลตัวอย่างผู้ขาย
  const mockVendors = [
    {
      id: "V001",
      name: "บริษัท คอมเทค จำกัด",
      contact: "คุณสมศักดิ์ เทคโน",
      position: "ผู้จัดการฝ่ายขาย",
      phone: "02-123-4567",
      email: "contact@comtech.co.th",
      address: "123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
      taxId: "0123456789012",
      type: "distributor",
      notes: "ผู้จำหน่ายอุปกรณ์คอมพิวเตอร์และอิเล็กทรอนิกส์",
    },
    {
      id: "V002",
      name: "บริษัท ไอทีซัพพลาย จำกัด",
      contact: "คุณวิภา สุขใจ",
      position: "เจ้าของกิจการ",
      phone: "02-234-5678",
      email: "sales@itsupply.co.th",
      address: "456 ถนนพหลโยธิน แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900",
      taxId: "0123456789013",
      type: "retailer",
      notes: "จำหน่ายอุปกรณ์ไอทีและเครื่องใช้สำนักงาน",
    },
    {
      id: "V003",
      name: "บริษัท ซอฟต์แวร์ลิงค์ จำกัด",
      contact: "คุณนิพนธ์ โปรแกรม",
      position: "ผู้จัดการทั่วไป",
      phone: "02-345-6789",
      email: "info@softwarelink.co.th",
      address: "789 ถนนสีลม แขวงสีลม เขตบางรัก กรุงเทพฯ 10500",
      taxId: "0123456789014",
      type: "service",
      notes: "ให้บริการด้านซอฟต์แวร์และลิขสิทธิ์โปรแกรม",
    },
    {
      id: "V004",
      name: "บริษัท ออฟฟิศ ซัพพลาย จำกัด",
      contact: "คุณมานะ รักงาน",
      position: "ผู้จัดการฝ่ายขาย",
      phone: "02-456-7890",
      email: "sales@officesupply.co.th",
      address: "101 ถนนเพชรบุรี แขวงทุ่งพญาไท เขตราชเทวี กรุงเทพฯ 10400",
      taxId: "0123456789015",
      type: "distributor",
      notes: "จำหน่ายเครื่องเขียนและอุปกรณ์สำนักงาน",
    },
    {
      id: "V005",
      name: "บริษัท เฟอร์นิเจอร์โมเดิร์น จำกัด",
      contact: "คุณสมหมาย ตกแต่ง",
      position: "กรรมการผู้จัดการ",
      phone: "02-567-8901",
      email: "info@modernfurniture.co.th",
      address: "222 ถนนรัชดาภิเษก แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310",
      taxId: "0123456789016",
      type: "manufacturer",
      notes: "ผลิตและจำหน่ายเฟอร์นิเจอร์สำนักงาน",
    },
  ];

  // ตัวแปรสำหรับการจัดการข้อมูล
  let vendors = [...mockVendors];
  let currentPage = 1;
  const itemsPerPage = 10;
  let selectedVendorId = null;
  let isEditing = false;

  // ฟังก์ชันดึงข้อมูลผู้ขายทั้งหมด
  // ฟังก์ชันดึงข้อมูลผู้ขายทั้งหมด
  async function fetchVendors() {
    try {
      const token =
        localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");

      const fullUrl = `http://localhost:3000/api/vendors`; // ใส่ full URL

      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "ไม่สามารถดึงข้อมูลผู้ขายได้");
      }

      const vendors = await response.json();
      console.log(vendors);

      // จัดการแสดงผล
      const tableBody = document.getElementById("vendor-table-body");
      tableBody.innerHTML = "";

      vendors.forEach((vendor) => {
        const row = document.createElement("tr");
        row.innerHTML = `
                <td>${vendor.id}</td>
                <td>${vendor.name}</td>
                <td>${vendor.contact_name}</td>
                <td>
                    <button class="action-btn edit" data-id="${vendor.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" data-id="${vendor.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
        tableBody.appendChild(row);
      });
    } catch (error) {
      console.error("Error:", error);
      alert(error.message);
    }
  }

  // ฟังก์ชันโหลดข้อมูลผู้ขายเพื่อแก้ไข
  async function loadVendorForEditing(vendorId) {
    try {
        // เก็บ ID ของผู้ขายที่กำลังแก้ไข
        selectedVendorId = vendorId;

        const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');

        // แสดงข้อความกำลังดำเนินการ
        showAlert('กำลังโหลดข้อมูลผู้ขาย...', 'info');

        console.log(`Loading vendor with ID: ${vendorId}`);

        // ทำการเรียก API เพื่อดึงข้อมูลผู้ขาย
        const response = await fetch(`http://localhost:3000/api/vendors/${vendorId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'ไม่สามารถดึงข้อมูลผู้ขายได้');
        }

        const vendor = await response.json();
        console.log("Vendor data received:", vendor);

        // ล้างฟอร์มก่อนกรอกข้อมูลใหม่
        clearForm();

        // กรอกข้อมูลลงฟอร์ม
        document.getElementById('vendor-id').value = vendor.id || '';
        document.getElementById('vendor-name').value = vendor.name || '';
        document.getElementById('vendor-contact').value = vendor.contact_name || '';
        document.getElementById('vendor-position').value = vendor.contact_position || '';
        document.getElementById('vendor-phone').value = vendor.phone || '';
        document.getElementById('vendor-email').value = vendor.email || '';
        document.getElementById('vendor-address').value = vendor.address || '';
        document.getElementById('vendor-tax-id').value = vendor.tax_id || '';
        document.getElementById('vendor-type').value = vendor.business_type || '';
        document.getElementById('vendor-notes').value = vendor.notes || '';

        // เปลี่ยนโหมดเป็นแก้ไข
        isEditing = true;
        document.getElementById('form-title').textContent = 'แก้ไขข้อมูลผู้ขาย';

        // เลื่อนไปที่ฟอร์ม
        document.querySelector('.vendor-form').scrollIntoView({ behavior: 'smooth' });

        // แสดงข้อความสำเร็จ
        showAlert('โหลดข้อมูลผู้ขายเรียบร้อยแล้ว');

        // เพิ่มคลาส active ให้กับปุ่มแก้ไข
        document.querySelectorAll('.action-btn.edit').forEach(btn => {
            if (btn.dataset.id === vendorId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    } catch (error) {
        console.error('Error loading vendor for editing:', error);
        showAlert('ไม่สามารถโหลดข้อมูลผู้ขายเพื่อแก้ไข: ' + error.message, 'error');
    }
}

  // ฟังก์ชันลบผู้ขาย
  async function deleteVendor(vendorId) {
    try {
        const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');

        // แสดงข้อความกำลังดำเนินการ
        showAlert('กำลังลบข้อมูลผู้ขาย...', 'info');

        console.log(`Deleting vendor with ID: ${vendorId}`);

        const response = await fetch(`http://localhost:3000/api/vendors/${vendorId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // ปิด modal ไม่ว่าจะสำเร็จหรือไม่
        document.getElementById('delete-modal').style.display = 'none';

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'ไม่สามารถลบผู้ขายได้');
        }

        const result = await response.json();
        console.log('Delete vendor result:', result);

        // แสดงข้อความแจ้งเตือน
        showAlert('ลบผู้ขายเรียบร้อยแล้ว');

        // รอสักครู่ก่อนโหลดข้อมูลใหม่เพื่อให้ฐานข้อมูลมีเวลาอัพเดต
        setTimeout(() => {
            // โหลดข้อมูลผู้ขายใหม่
            fetchVendors();

            // ล้างฟอร์ม ถ้าผู้ขายที่ลบเป็นผู้ขายที่กำลังแสดงข้อมูลอยู่
            if (vendorId === selectedVendorId) {
                clearForm();
            }
        }, 500);
    } catch (error) {
        console.error('Error deleting vendor:', error);
        showAlert('ไม่สามารถลบผู้ขายได้: ' + error.message, 'error');
    }
}

});

// ฟังก์ชันเพิ่ม event listeners สำหรับปุ่มในตาราง
function setupVendorActionListeners() {
    // ลบ event listeners เดิมก่อนเพิ่มใหม่เพื่อป้องกันการทำงานซ้ำซ้อน
    document.querySelectorAll('.action-btn.edit').forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
    });

    document.querySelectorAll('.action-btn.delete').forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
    });

    // ปุ่มแก้ไข - เพิ่ม event listeners ใหม่
    document.querySelectorAll('.action-btn.edit').forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();

            const vendorId = this.dataset.id;
            console.log(`Edit button clicked for vendor ID: ${vendorId}`);

            // เรียกฟังก์ชันโหลดข้อมูลผู้ขายเพื่อแก้ไข
            loadVendorForEditing(vendorId);
        });
    });

    // ปุ่มลบ - เพิ่ม event listeners ใหม่
    document.querySelectorAll('.action-btn.delete').forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();

            const vendorId = this.dataset.id;
            console.log(`Delete button clicked for vendor ID: ${vendorId}`);

            // ค้นหาชื่อผู้ขายจากตาราง
            const row = this.closest('tr');
            const vendorName = row.cells[1].textContent;

            selectedVendorId = vendorId;
            document.getElementById('delete-vendor-name').textContent = vendorName;
            document.getElementById('delete-modal').style.display = 'block';

            // เพิ่ม event listener สำหรับปุ่มยืนยันการลบ
            document.getElementById('confirm-delete-btn').onclick = function() {
                deleteVendor(selectedVendorId);
            };
        });
    });

    console.log('Event listeners have been set up for vendor action buttons');
}

  // ฟังก์ชันแสดงรายการผู้ขาย
  function displayVendors(filteredVendors = null) {
    const vendorsToDisplay = filteredVendors || vendors;
    const tableBody = document.getElementById("vendor-table-body");
    tableBody.innerHTML = "";

    // คำนวณจำนวนหน้าทั้งหมด
    const totalPages = Math.ceil(vendorsToDisplay.length / itemsPerPage);

    // คำนวณ index เริ่มต้นและสิ้นสุดของรายการที่จะแสดงในหน้าปัจจุบัน
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(
      startIndex + itemsPerPage,
      vendorsToDisplay.length
    );

    // แสดงรายการผู้ขายในหน้าปัจจุบัน
    for (let i = startIndex; i < endIndex; i++) {
      const vendor = vendorsToDisplay[i];
      const row = document.createElement("tr");

      if (vendor.id === selectedVendorId) {
        row.classList.add("selected");
      }

      row.innerHTML = `
                <td>${vendor.id}</td>
                <td>${vendor.name}</td>
                <td>${vendor.contact}</td>
                <td>
                    <button class="action-btn edit" data-id="${vendor.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" data-id="${vendor.id}">
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
        document.querySelectorAll("#vendor-table-body tr").forEach((tr) => {
          tr.classList.remove("selected");
        });

        // เพิ่ม class selected ให้แถวที่เลือก
        row.classList.add("selected");

        // แสดงข้อมูลผู้ขายที่เลือก
        selectedVendorId = vendor.id;
        displayVendorDetails(vendor);
      });

      tableBody.appendChild(row);
    }

    // สร้างปุ่ม pagination
    createPagination(totalPages);

    // เพิ่ม event listeners สำหรับปุ่มแก้ไขและลบ
    document.querySelectorAll(".action-btn.edit").forEach((button) => {
      button.addEventListener("click", function () {
        const vendorId = this.dataset.id;
        const vendor = vendors.find((v) => v.id === vendorId);

        if (vendor) {
          selectedVendorId = vendor.id;
          displayVendorDetails(vendor);
          isEditing = true;
          document.getElementById("form-title").textContent =
            "แก้ไขข้อมูลผู้ขาย";
        }
      });
    });

    document.querySelectorAll(".action-btn.delete").forEach((button) => {
      button.addEventListener("click", function () {
        const vendorId = this.dataset.id;
        const vendor = vendors.find((v) => v.id === vendorId);

        if (vendor) {
          // เรียกใช้ฟังก์ชัน deleteVendor
          deleteVendor(vendorId);
          document.getElementById("delete-vendor-name").textContent =
            vendor.name;
          document.getElementById("delete-modal").style.display = "block";

          // เก็บ ID ของผู้ขายที่จะลบไว้ใน dataset ของปุ่มยืนยัน
          document.getElementById("confirm-delete-btn").dataset.id = vendor.id;
        }
      });
    });
  }

  // ฟังก์ชันสร้างปุ่ม pagination
  function createPagination(totalPages) {
    const pagination = document.getElementById("pagination");
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
        displayVendors();
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
        displayVendors();
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
        displayVendors();
      }
    });
    pagination.appendChild(nextButton);
  }

  // ฟังก์ชันแสดงข้อมูลผู้ขายที่เลือก
  function displayVendorDetails(vendor) {
    document.getElementById("vendor-id").value = vendor.id;
    document.getElementById("vendor-name").value = vendor.name;
    document.getElementById("vendor-contact").value = vendor.contact;
    document.getElementById("vendor-position").value = vendor.position || "";
    document.getElementById("vendor-phone").value = vendor.phone;
    document.getElementById("vendor-email").value = vendor.email;
    document.getElementById("vendor-address").value = vendor.address || "";
    document.getElementById("vendor-tax-id").value = vendor.taxId || "";
    document.getElementById("vendor-type").value = vendor.type || "";
    document.getElementById("vendor-notes").value = vendor.notes || "";
  }

  // ฟังก์ชันล้างฟอร์ม
  function clearForm() {
    document.getElementById("vendor-id").value = "";
    document.getElementById("vendor-name").value = "";
    document.getElementById("vendor-contact").value = "";
    document.getElementById("vendor-position").value = "";
    document.getElementById("vendor-phone").value = "";
    document.getElementById("vendor-email").value = "";
    document.getElementById("vendor-address").value = "";
    document.getElementById("vendor-tax-id").value = "";
    document.getElementById("vendor-type").value = "";
    document.getElementById("vendor-notes").value = "";

    selectedVendorId = null;
    isEditing = false;
    document.getElementById("form-title").textContent = "ข้อมูลผู้ขาย";
  }

  // ฟังก์ชันบันทึกข้อมูลผู้ขาย
async function saveVendor() {
    // ตรวจสอบความถูกต้องของฟอร์ม
    if (!validateForm()) {
        return;
    }

    // เก็บข้อมูลจากฟอร์ม
    const vendorData = {
        name: document.getElementById('vendor-name').value,
        contact_name: document.getElementById('vendor-contact').value,
        contact_position: document.getElementById('vendor-position').value,
        phone: document.getElementById('vendor-phone').value,
        email: document.getElementById('vendor-email').value,
        address: document.getElementById('vendor-address').value,
        tax_id: document.getElementById('vendor-tax-id').value,
        business_type: document.getElementById('vendor-type').value,
        notes: document.getElementById('vendor-notes').value
    };

    try {
        // แสดงข้อความกำลังดำเนินการ
        showAlert(`กำลัง${isEditing ? 'แก้ไข' : 'เพิ่ม'}ข้อมูลผู้ขาย...`, 'info');

        const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');

        let response;
        if (isEditing) {
            // แก้ไขผู้ขายที่มีอยู่แล้ว
            const vendorId = document.getElementById('vendor-id').value;
            console.log(`Updating vendor with ID: ${vendorId}`, vendorData);

            response = await fetch(`http://localhost:3000/api/vendors/${vendorId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(vendorData)
            });
        } else {
            // เพิ่มผู้ขายใหม่
            console.log('Creating new vendor:', vendorData);

            response = await fetch('http://localhost:3000/api/vendors', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(vendorData)
            });
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลผู้ขาย');
        }

        const result = await response.json();
        console.log('Save vendor result:', result);

        showAlert(`${isEditing ? 'แก้ไข' : 'เพิ่ม'}ผู้ขาย ${result.vendorId || result.id} เรียบร้อยแล้ว`);

        // รอสักครู่ก่อนโหลดข้อมูลใหม่เพื่อให้ฐานข้อมูลมีเวลาอัพเดต
        setTimeout(() => {
            // โหลดข้อมูลผู้ขายใหม่
            fetchVendors();

            // ล้างฟอร์ม
            clearForm();
        }, 500);
    } catch (error) {
        console.error('Error saving vendor:', error);
        showAlert(error.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // ตรวจสอบสิทธิ์การเข้าถึง
    const roleId = localStorage.getItem('role_id') || sessionStorage.getItem('role_id');
    if (roleId != 3) {
        alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
        redirectBasedOnRole(roleId);
        return;
    }

    // เพิ่ม event listeners สำหรับปุ่มต่างๆ
    setupEventListeners();
    
    // โหลดข้อมูลผู้ขาย
    fetchVendors();
});


// ฟังก์ชันลบผู้ขาย
async function deleteVendor(vendorId) {
    try {
        // ในการใช้งานจริงจะส่ง API ไปที่เซิร์ฟเวอร์
        const response = await fetch(`/procurement/vendor/${vendorId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('ไม่สามารถลบผู้ขายได้');
        }

        // ลบผู้ขายออกจากอาร์เรย์ vendors
        vendors = vendors.filter(v => v.id !== vendorId);

        // ปิด modal
        document.getElementById('delete-modal').style.display = 'none';

        showAlert('ลบผู้ขายเรียบร้อยแล้ว');

        // ถ้าผู้ขายที่ลบเป็นผู้ขายที่กำลังแสดงข้อมูลอยู่ ให้ล้างฟอร์ม
        if (vendorId === selectedVendorId) {
            clearForm();
        }

        // แสดงรายการผู้ขายใหม่
        displayVendors();
    } catch (error) {
        console.error('Error deleting vendor:', error);
        showAlert('ไม่สามารถลบผู้ขายได้', 'error');
    }
}

  // ฟังก์ชันตรวจสอบความถูกต้องของฟอร์ม
  function validateForm() {
    const vendorName = document.getElementById("vendor-name").value;
    const vendorContact = document.getElementById("vendor-contact").value;
    const vendorPhone = document.getElementById("vendor-phone").value;

    if (!vendorName) {
      showAlert("กรุณากรอกชื่อผู้ขาย", "error");
      document.getElementById("vendor-name").focus();
      return false;
    }

    if (!vendorContact) {
      showAlert("กรุณากรอกชื่อผู้ติดต่อ", "error");
      document.getElementById("vendor-contact").focus();
      return false;
    }

    if (!vendorPhone) {
      showAlert("กรุณากรอกเบอร์โทรศัพท์", "error");
      document.getElementById("vendor-phone").focus();
      return false;
    }

    return true;
  }

  // ฟังก์ชันแสดงข้อความแจ้งเตือน
  function showAlert(message, type = "success") {
    const alertPopup = document.getElementById("alert-popup");
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

document.addEventListener('DOMContentLoaded', function() {
    // ตรวจสอบสิทธิ์การเข้าถึง
    const roleId = localStorage.getItem('role_id') || sessionStorage.getItem('role_id');
    if (roleId != 3) {
        alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
        redirectBasedOnRole(roleId);
        return;
    }

    // เพิ่ม event listeners สำหรับปุ่มต่างๆ
    setupEventListeners();
    
    // โหลดข้อมูลผู้ขาย
    fetchVendors();
});


// ตั้งค่า event listeners ทั้งหมด
function setupEventListeners() {
    // ปุ่มเพิ่มผู้ขายใหม่
    document.getElementById('add-vendor-btn').addEventListener('click', function() {
        clearForm();
        isEditing = false;
        document.getElementById('form-title').textContent = 'เพิ่มผู้ขายใหม่';
        document.getElementById('vendor-name').focus();
    });

    // ปุ่มบันทึก
    document.getElementById('save-btn').addEventListener('click', saveVendor);

    // ปุ่มยกเลิก
    document.getElementById('cancel-btn').addEventListener('click', function() {
        clearForm();
        isEditing = false;
        document.getElementById('form-title').textContent = 'ข้อมูลผู้ขาย';
    });

    // ปุ่มปิด modal
    document.querySelector('.modal .close').addEventListener('click', function() {
        document.getElementById('delete-modal').style.display = 'none';
    });

    // ปุ่มยกเลิกการลบใน modal
    document.getElementById('cancel-delete-btn').addEventListener('click', function() {
        document.getElementById('delete-modal').style.display = 'none';
    });

    // ช่องค้นหา
    document.getElementById('vendor-search').addEventListener('input', function() {
        const searchText = this.value.toLowerCase();
        const filteredVendors = vendors.filter(vendor =>
            vendor.name.toLowerCase().includes(searchText) ||
            vendor.contact.toLowerCase().includes(searchText)
        );
        displayVendors(filteredVendors);
    });
}

// เพิ่ม event listeners สำหรับปุ่มในตาราง
function setupVendorActionListeners() {
    // ปุ่มแก้ไข
    document.querySelectorAll('.action-btn.edit').forEach(button => {
        button.addEventListener('click', function() {
            const vendorId = this.dataset.id;
            loadVendorForEditing(vendorId);
        });
    });

    // ปุ่มลบ
    document.querySelectorAll('.action-btn.delete').forEach(button => {
        button.addEventListener('click', function() {
            const vendorId = this.dataset.id;
            const vendor = vendors.find(v => v.id === vendorId);
            if (vendor) {
                selectedVendorId = vendorId;
                document.getElementById('delete-vendor-name').textContent = vendor.name;
                document.getElementById('delete-modal').style.display = 'block';
                
                // เพิ่ม event listener สำหรับปุ่มยืนยันการลบ
                document.getElementById('confirm-delete-btn').onclick = function() {
                    deleteVendor(selectedVendorId);
                    document.getElementById('delete-modal').style.display = 'none';
                };
            }
        });
    });
}
async function fetchVendors() {
    try {
        const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');

        const response = await fetch('http://localhost:3000/api/vendors', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error('ไม่สามารถดึงข้อมูลผู้ขายได้');
        }

        // อัพเดตตัวแปร global vendors
        vendors = await response.json();

        // จัดการแสดงผล
        const tableBody = document.getElementById('vendor-table-body');
        tableBody.innerHTML = '';

        if (vendors.length === 0) {
            // ถ้าไม่มีข้อมูลผู้ขาย
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="4" style="text-align: center; padding: 20px;">ไม่พบข้อมูลผู้ขาย</td>
            `;
            tableBody.appendChild(emptyRow);
        } else {
            // แสดงข้อมูลผู้ขาย
            vendors.forEach(vendor => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${vendor.id}</td>
                    <td>${vendor.name}</td>
                    <td>${vendor.contact_name || ''}</td>
                    <td>
                        <button class="action-btn edit" data-id="${vendor.id}" title="แก้ไข">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" data-id="${vendor.id}" title="ลบ">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }

        // ติดตั้ง Event Listeners สำหรับปุ่มแก้ไขและลบ
        setupVendorActionListeners();

        // สร้าง pagination ถ้ามีข้อมูลมากกว่า itemsPerPage
        if (vendors.length > 0) {
            createPagination(Math.ceil(vendors.length / itemsPerPage));
        }
    } catch (error) {
        console.error('Error fetching vendors:', error);
        showAlert('ไม่สามารถดึงข้อมูลผู้ขายได้: ' + error.message, 'error');
    }
}