// ===== ระบบการจัดซื้อ =====
document.addEventListener('DOMContentLoaded', function() {
    // ข้อมูลตัวอย่างสำหรับใบขอซื้อที่รอดำเนินการ
    const pendingRequisitions = [
        {
            id: 'PR-2024-0056',
            title: 'อุปกรณ์สำนักงาน',
            date: '25/03/2024',
            status: 'รออนุมัติ',
            amount: 12500.00,
            requester: 'สมชาย มานะดี'
        },
        {
            id: 'PR-2024-0057',
            title: 'อุปกรณ์คอมพิวเตอร์',
            date: '26/03/2024',
            status: 'รออนุมัติ',
            amount: 45800.00,
            requester: 'วิชัย อารีย์'
        },
        {
            id: 'PR-2024-0058',
            title: 'เฟอร์นิเจอร์สำนักงาน',
            date: '27/03/2024',
            status: 'รอตรวจสอบ',
            amount: 28900.00,
            requester: 'มานี ดีงาม'
        }
    ];

    // ข้อมูลตัวอย่างสำหรับใบสั่งซื้อที่รอดำเนินการ
    const pendingOrders = [
        {
            id: 'PO-2024-0042',
            title: 'คอมพิวเตอร์โน้ตบุ๊ค',
            date: '22/03/2024',
            status: 'รอการจัดส่ง',
            amount: 76500.00,
            vendor: 'บริษัท คอมเทค จำกัด'
        },
        {
            id: 'PO-2024-0043',
            title: 'เครื่องพิมพ์มัลติฟังก์ชั่น',
            date: '23/03/2024',
            status: 'รอการจัดส่ง',
            amount: 18900.00,
            vendor: 'บริษัท ไอทีซัพพลาย จำกัด'
        },
        {
            id: 'PO-2024-0044',
            title: 'ซอฟต์แวร์ออฟฟิศ',
            date: '24/03/2024',
            status: 'รอยืนยัน',
            amount: 32000.00,
            vendor: 'บริษัท ซอฟต์แวร์ลิงค์ จำกัด'
        }
    ];

    // แสดงรายการใบขอซื้อที่รอดำเนินการ
    const pendingRequisitionsList = document.getElementById('pending-requisitions');
    if (pendingRequisitionsList) {
        pendingRequisitions.forEach(req => {
            const item = document.createElement('div');
            item.className = 'procurement-item';
            item.innerHTML = `
                <div class="procurement-item-info">
                    <p><strong>${req.id}</strong> - ${req.title}</p>
                    <small>โดย ${req.requester} | วันที่ ${req.date}</small>
                </div>
                <div class="procurement-item-status">
                    <span class="status-badge status-pending">${req.status}</span>
                </div>
            `;
            pendingRequisitionsList.appendChild(item);
        });
    }

    // แสดงรายการใบสั่งซื้อที่รอดำเนินการ
    const pendingOrdersList = document.getElementById('pending-orders');
    if (pendingOrdersList) {
        pendingOrders.forEach(order => {
            const item = document.createElement('div');
            item.className = 'procurement-item';
            item.innerHTML = `
                <div class="procurement-item-info">
                    <p><strong>${order.id}</strong> - ${order.title}</p>
                    <small>ผู้ขาย: ${order.vendor} | วันที่ ${order.date}</small>
                </div>
                <div class="procurement-item-status">
                    <span class="status-badge status-pending">${order.status}</span>
                </div>
            `;
            pendingOrdersList.appendChild(item);
        });
    }

    // ===== ฟังก์ชันสำหรับทำใบขอซื้อใหม่ =====
    function createNewRequisition(requisitionData) {
        return new Promise(async (resolve, reject) => {
            try {
                const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
                if (!token) {
                    throw new Error('ไม่พบข้อมูลการล็อกอิน กรุณาล็อกอินใหม่');
                }

                // ในการใช้งานจริงจะส่ง API ไปที่เซิร์ฟเวอร์
                const response = await fetch('http://localhost:3000/procurement/requisition', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requisitionData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'ไม่สามารถสร้างใบขอซื้อได้');
                }

                const result = await response.json();
                resolve(result);
            } catch (error) {
                // สำหรับการทดสอบ mockup ข้อมูล
                console.log('ข้อมูลตัวอย่างสำหรับการสร้างใบขอซื้อ:', requisitionData);
                setTimeout(() => {
                    resolve({
                        id: `PR-2024-${Math.floor(1000 + Math.random() * 9000)}`,
                        ...requisitionData,
                        status: 'รออนุมัติ',
                        created_at: new Date().toISOString()
                    });
                }, 500);
            }
        });
    }

    // ===== ฟังก์ชันสำหรับสร้างใบสั่งซื้อใหม่ =====
    function createNewPurchaseOrder(poData) {
        return new Promise(async (resolve, reject) => {
            try {
                const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
                if (!token) {
                    throw new Error('ไม่พบข้อมูลการล็อกอิน กรุณาล็อกอินใหม่');
                }

                // ในการใช้งานจริงจะส่ง API ไปที่เซิร์ฟเวอร์
                const response = await fetch('http://localhost:3000/procurement/purchase-order', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(poData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'ไม่สามารถสร้างใบสั่งซื้อได้');
                }

                const result = await response.json();
                resolve(result);
            } catch (error) {
                // สำหรับการทดสอบ mockup ข้อมูล
                console.log('ข้อมูลตัวอย่างสำหรับการสร้างใบสั่งซื้อ:', poData);
                setTimeout(() => {
                    resolve({
                        id: `PO-2024-${Math.floor(1000 + Math.random() * 9000)}`,
                        ...poData,
                        status: 'รอยืนยัน',
                        created_at: new Date().toISOString()
                    });
                }, 500);
            }
        });
    }

    // ===== ฟังก์ชันสำหรับตรวจสอบงบประมาณ =====
    function checkBudget(departmentId, amount) {
        return new Promise(async (resolve, reject) => {
            try {
                const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
                if (!token) {
                    throw new Error('ไม่พบข้อมูลการล็อกอิน กรุณาล็อกอินใหม่');
                }

                // ในการใช้งานจริงจะส่ง API ไปที่เซิร์ฟเวอร์
                const response = await fetch(`http://localhost:3000/finance/budget/${departmentId}?amount=${amount}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'ไม่สามารถตรวจสอบงบประมาณได้');
                }

                const result = await response.json();
                resolve(result);
            } catch (error) {
                // สำหรับการทดสอบ mockup ข้อมูล
                console.log('ข้อมูลตัวอย่างสำหรับการตรวจสอบงบประมาณ:', {departmentId, amount});
                setTimeout(() => {
                    resolve({
                        departmentId: departmentId,
                        budgetTotal: 2000000,
                        budgetUsed: 850000,
                        budgetRemaining: 1150000,
                        requestAmount: amount,
                        isApproved: amount <= 1150000
                    });
                }, 500);
            }
        });
    }

    // ===== ฟังก์ชันสำหรับค้นหาผู้ขาย =====
    function searchVendors(keyword) {
        return new Promise(async (resolve, reject) => {
            try {
                const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
                if (!token) {
                    throw new Error('ไม่พบข้อมูลการล็อกอิน กรุณาล็อกอินใหม่');
                }

                // ในการใช้งานจริงจะส่ง API ไปที่เซิร์ฟเวอร์
                const response = await fetch(`http://localhost:3000/procurement/vendors?search=${keyword}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'ไม่สามารถค้นหาผู้ขายได้');
                }

                const result = await response.json();
                resolve(result);
            } catch (error) {
                // สำหรับการทดสอบ mockup ข้อมูล
                console.log('ข้อมูลตัวอย่างสำหรับการค้นหาผู้ขาย:', keyword);
                setTimeout(() => {
                    resolve([
                        {
                            id: 'V001',
                            name: 'บริษัท คอมเทค จำกัด',
                            contact: 'คุณสมศักดิ์ เทคโน',
                            phone: '02-123-4567',
                            email: 'contact@comtech.co.th'
                        },
                        {
                            id: 'V002',
                            name: 'บริษัท ไอทีซัพพลาย จำกัด',
                            contact: 'คุณวิภา สุขใจ',
                            phone: '02-234-5678',
                            email: 'sales@itsupply.co.th'
                        },
                        {
                            id: 'V003',
                            name: 'บริษัท ซอฟต์แวร์ลิงค์ จำกัด',
                            contact: 'คุณนิพนธ์ โปรแกรม',
                            phone: '02-345-6789',
                            email: 'info@softwarelink.co.th'
                        }
                    ].filter(vendor => 
                        vendor.name.toLowerCase().includes(keyword.toLowerCase()) || 
                        vendor.contact.toLowerCase().includes(keyword.toLowerCase())
                    ));
                }, 500);
            }
        });
    }

    // เชื่อมต่อปุ่มดำเนินการต่างๆ (ถ้ามี)
    const quickActionButtons = document.querySelectorAll('.action-btn');
    if (quickActionButtons.length > 0) {
        quickActionButtons.forEach(button => {
            button.addEventListener('click', function() {
                const action = this.innerText.trim();
                console.log(`ดำเนินการ: ${action}`);
                // เพิ่มการดำเนินการตามปุ่มที่กด
            });
        });
    }

    // สำหรับการ export ฟังก์ชันไปใช้ในไฟล์อื่น
    window.procurementFunctions = {
        createNewRequisition,
        createNewPurchaseOrder,
        checkBudget,
        searchVendors
    };

    console.log('ระบบการจัดซื้อพร้อมใช้งาน');
});