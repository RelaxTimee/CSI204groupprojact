// Database value puller for purchase_orders table
document.addEventListener('DOMContentLoaded', function() {
    // ป้องกันการทำงานซ้ำซ้อน
    if (window.purchaseOrdersInitialized) {
        return;
    }
    window.purchaseOrdersInitialized = true;

    // Function to fetch purchase orders from the database
    async function fetchPurchaseOrders() {
        try {
            const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
            if (!token) {
                console.error('ไม่พบข้อมูลการล็อกอิน กรุณาล็อกอินใหม่');
                return [];
            }

            // Fetch data from the server API
            const response = await fetch('http://localhost:3000/api/purchase-orders/pending', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('ไม่สามารถดึงข้อมูลใบสั่งซื้อได้');
            }

            const data = await response.json();
            console.log('Fetched purchase orders:', data);
            return data;
        } catch (error) {
            console.error('Error fetching purchase orders:', error);
            
            // ข้อมูลจำลองจากตาราง purchase_orders ของคุณ
            return [
                {
                    id: 'PO-1743716632987',
                    po_number: 'PO-2025-5034',
                    title: 'วัสดุสำนักงาน',
                    status: 'pending',
                    date: '2025-04-03',
                    delivery_date: '2025-04-10',
                    delivery_location: 'สำนักงานใหญ่',
                    total_amount: 13.0,
                    payment_terms: 'credit-30'
                },
                {
                    id: 'PO-1743716863520',
                    po_number: 'PO-2025-3871',
                    title: 'จัดซื้อเคมีภัณฑ์',
                    status: 'pending',
                    date: '2025-04-03',
                    delivery_date: '2025-04-10',
                    delivery_location: 'สำนักงานใหญ่',
                    total_amount: 13.0,
                    payment_terms: 'credit-30'
                }
            ];
        }
    }

    // Function to display purchase orders in the dashboard
    async function displayPurchaseOrders() {
        const pendingOrdersList = document.getElementById('pending-orders');
        if (!pendingOrdersList) return;

        // Clear existing content
        pendingOrdersList.innerHTML = '';
        console.log('Displaying purchase orders...');

        // Fetch purchase orders data
        const orders = await fetchPurchaseOrders();

        // Ensure we only process unique orders (no duplicates)
        const uniqueOrders = [];
        const seenIds = new Set();
        
        orders.forEach(order => {
            const orderId = order.po_number || order.id;
            if (!seenIds.has(orderId)) {
                seenIds.add(orderId);
                uniqueOrders.push(order);
            }
        });
        
        console.log('Unique orders to display:', uniqueOrders.length);

        // Display only pending orders
        const pendingOrders = uniqueOrders.filter(order => order.status === 'pending');
        
        // Display the orders
        pendingOrders.forEach(order => {
            const item = document.createElement('div');
            item.className = 'procurement-item';
            
            // Format delivery date
            let deliveryDateText = 'ไม่ระบุ';
            if (order.delivery_date) {
                const deliveryDate = new Date(order.delivery_date);
                deliveryDateText = `${deliveryDate.getDate().toString().padStart(2, '0')}/${(deliveryDate.getMonth() + 1).toString().padStart(2, '0')}/${deliveryDate.getFullYear()}`;
            }
            
            item.innerHTML = `
                <div class="procurement-item-info">
                    <p><strong>${order.po_number || order.id}</strong> - ${order.title}</p>
                    <small>จำนวนเงิน: ${order.total_amount.toLocaleString()} บาท | กำหนดส่ง: ${deliveryDateText}</small>
                </div>
                <div class="procurement-item-status">
                    <span class="status-badge status-pending">${order.status}</span>
                </div>
            `;
            pendingOrdersList.appendChild(item);
        });
    }

    // Export functions for use in other files
    window.purchaseOrdersDB = {
        fetchPurchaseOrders,
        displayPurchaseOrders
    };

    // Initialize display if on the dashboard page
    if (document.getElementById('pending-orders')) {
        displayPurchaseOrders();
    }
});