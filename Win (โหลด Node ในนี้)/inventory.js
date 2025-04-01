// ===== ระบบจัดการคลังสินค้า =====
document.addEventListener('DOMContentLoaded', function() {
    // ข้อมูลตัวอย่างสินค้าคงคลัง
    const inventoryItems = [
        {
            id: 'ITM001',
            name: 'กระดาษ A4',
            category: 'วัสดุสำนักงาน',
            unit: 'รีม',
            unitPrice: 120.00,
            inStock: 45,
            minStock: 20,
            maxStock: 100
        },
        {
            id: 'ITM002',
            name: 'หมึกพิมพ์ HP 680',
            category: 'อุปกรณ์คอมพิวเตอร์',
            unit: 'กล่อง',
            unitPrice: 650.00,
            inStock: 12,
            minStock: 10,
            maxStock: 30
        },
        {
            id: 'ITM003',
            name: 'แฟ้มเอกสาร',
            category: 'วัสดุสำนักงาน',
            unit: 'แพ็ค',
            unitPrice: 180.00,
            inStock: 25,
            minStock: 15,
            maxStock: 50
        },
        {
            id: 'ITM004',
            name: 'ปากกาลูกลื่น',
            category: 'เครื่องเขียน',
            unit: 'กล่อง',
            unitPrice: 120.00,
            inStock: 18,
            minStock: 20,
            maxStock: 60
        },
        {
            id: 'ITM005',
            name: 'แท็บเล็ต Samsung',
            category: 'อุปกรณ์อิเล็กทรอนิกส์',
            unit: 'เครื่อง',
            unitPrice: 12500.00,
            inStock: 3,
            minStock: 2,
            maxStock: 5
        }
    ];

    // ฟังก์ชันสำหรับตรวจสอบสินค้าที่ต้องสั่งซื้อเพิ่ม (ต่ำกว่าพิกัดต่ำ - Min Stock)
    function checkLowStockItems() {
        return inventoryItems.filter(item => item.inStock <= item.minStock);
    }

    // ฟังก์ชันสำหรับดึงข้อมูลสินค้าคงคลังทั้งหมด
    async function fetchInventoryItems() {
        try {
            const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
            if (!token) return inventoryItems; // ใช้ข้อมูลตัวอย่าง

            // ในการใช้งานจริงจะส่ง API ไปที่เซิร์ฟเวอร์
            const response = await fetch('http://localhost:3000/inventory/items', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('ไม่สามารถดึงข้อมูลสินค้าคงคลังได้');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching inventory items:', error);
            // ส่งคืนข้อมูลตัวอย่าง
            return inventoryItems;
        }
    }

    // ฟังก์ชันสำหรับสร้างใบขอซื้อจากสินค้าที่ต่ำกว่าพิกัดต่ำ
    async function createRequisitionFromLowStock() {
        const lowStockItems = checkLowStockItems();
        if (lowStockItems.length === 0) {
            return { success: false, message: 'ไม่พบสินค้าที่ต้องสั่งซื้อเพิ่ม' };
        }

        try {
            const requisitionItems = lowStockItems.map(item => {
                const orderQuantity = item.maxStock - item.inStock;
                return {
                    itemId: item.id,
                    itemName: item.name,
                    unit: item.unit,
                    unitPrice: item.unitPrice,
                    quantity: orderQuantity,
                    amount: item.unitPrice * orderQuantity
                };
            });

            const requisitionData = {
                title: 'เติมสินค้าคงคลังประจำเดือน',
                description: 'สั่งซื้อสินค้าที่ต่ำกว่าพิกัดต่ำ (Min Stock)',
                items: requisitionItems,
                totalAmount: requisitionItems.reduce((sum, item) => sum + item.amount, 0),
                requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 วันถัดไป
            };

            // ในการใช้งานจริงจะส่ง API ไปที่เซิร์ฟเวอร์
            // ใช้ฟังก์ชัน createNewRequisition จาก procurement.js
            if (window.procurementFunctions && window.procurementFunctions.createNewRequisition) {
                const result = await window.procurementFunctions.createNewRequisition(requisitionData);
                return { success: true, data: result };
            } else {
                throw new Error('ไม่พบฟังก์ชันสำหรับสร้างใบขอซื้อ');
            }
        } catch (error) {
            console.error('Error creating requisition from low stock:', error);
            return { success: false, message: error.message };
        }
    }

    // ฟังก์ชันสำหรับรับสินค้าเข้าคลัง
    async function receiveInventory(receiptData) {
        try {
            const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
            if (!token) {
                throw new Error('ไม่พบข้อมูลการล็อกอิน กรุณาล็อกอินใหม่');
            }

            // ในการใช้งานจริงจะส่ง API ไปที่เซิร์ฟเวอร์
            const response = await fetch('http://localhost:3000/inventory/receive', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(receiptData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'ไม่สามารถรับสินค้าเข้าคลังได้');
            }

            return await response.json();
        } catch (error) {
            console.error('Error receiving inventory:', error);
            // สำหรับการทดสอบ mockup ข้อมูล
            return {
                id: `RCV-2024-${Math.floor(1000 + Math.random() * 9000)}`,
                poId: receiptData.poId,
                receiveDate: new Date().toISOString(),
                items: receiptData.items,
                receivedBy: localStorage.getItem('username') || sessionStorage.getItem('username'),
                status: 'received'
            };
        }
    }

    // ฟังก์ชันสำหรับเบิกสินค้าออกจากคลัง
    async function issueInventory(issueData) {
        try {
            const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
            if (!token) {
                throw new Error('ไม่พบข้อมูลการล็อกอิน กรุณาล็อกอินใหม่');
            }

            // ในการใช้งานจริงจะส่ง API ไปที่เซิร์ฟเวอร์
            const response = await fetch('http://localhost:3000/inventory/issue', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(issueData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'ไม่สามารถเบิกสินค้าจากคลังได้');
            }

            return await response.json();
        } catch (error) {
            console.error('Error issuing inventory:', error);
            // สำหรับการทดสอบ mockup ข้อมูล
            return {
                id: `ISS-2024-${Math.floor(1000 + Math.random() * 9000)}`,
                issueDate: new Date().toISOString(),
                department: issueData.department,
                requestedBy: issueData.requestedBy,
                items: issueData.items,
                issuedBy: localStorage.getItem('username') || sessionStorage.getItem('username'),
                status: 'issued'
            };
        }
    }

    // ฟังก์ชันสำหรับคำนวณต้นทุนสินค้าคงเหลือ
    function calculateInventoryValue() {
        let totalValue = 0;
        inventoryItems.forEach(item => {
            totalValue += (item.unitPrice * item.inStock);
        });
        return totalValue;
    }

    // ฟังก์ชันสำหรับสร้างรายงานสินค้าคงคลัง
    function generateInventoryReport() {
        const report = {
            reportDate: new Date().toISOString(),
            totalItems: inventoryItems.length,
            totalValue: calculateInventoryValue(),
            lowStockItems: checkLowStockItems().length,
            categories: {},
            items: inventoryItems
        };

        // คำนวณจำนวนสินค้าและมูลค่าในแต่ละหมวดหมู่
        inventoryItems.forEach(item => {
            if (!report.categories[item.category]) {
                report.categories[item.category] = {
                    count: 0,
                    value: 0
                };
            }
            report.categories[item.category].count++;
            report.categories[item.category].value += (item.unitPrice * item.inStock);
        });

        return report;
    }

    // จัดการการแจ้งเตือนเมื่อสินค้าต่ำกว่าพิกัดต่ำ
    function notifyLowStock() {
        const lowStockItems = checkLowStockItems();
        if (lowStockItems.length > 0) {
            // ถ้ามีการใช้งาน dashboard functions
            if (window.dashboardFunctions && window.dashboardFunctions.showNotification) {
                window.dashboardFunctions.showNotification(
                    `มีสินค้า ${lowStockItems.length} รายการที่ต่ำกว่าพิกัดต่ำสุด`, 
                    'warning'
                );
            } else {
                console.warn(`มีสินค้า ${lowStockItems.length} รายการที่ต่ำกว่าพิกัดต่ำสุด`);
            }
        }
    }

    // เรียกใช้ฟังก์ชันตรวจสอบสินค้าต่ำกว่าพิกัดต่ำเมื่อโหลดหน้า
    notifyLowStock();

    // สำหรับการ export ฟังก์ชันไปใช้ในไฟล์อื่น
    window.inventoryFunctions = {
        fetchInventoryItems,
        checkLowStockItems,
        createRequisitionFromLowStock,
        receiveInventory,
        issueInventory,
        calculateInventoryValue,
        generateInventoryReport
    };

    console.log('ระบบจัดการคลังสินค้าพร้อมใช้งาน');
});