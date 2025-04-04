// ===== ระบบการจัดซื้อ =====
document.addEventListener('DOMContentLoaded', function() {
    // ใช้ข้อมูลจากฐานข้อมูลแทนข้อมูลตัวอย่าง
    // การแสดงผลข้อมูลใบขอซื้อและการอนุมัติจะถูกจัดการโดย
    // db-purchase-requisitions.js และ db-purchase-requisition-approvals.js

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