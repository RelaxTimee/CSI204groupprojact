// Database value puller for purchase_requisition_approvals table
document.addEventListener('DOMContentLoaded', function() {
    // Function to fetch purchase orders from the database
    async function fetchPurchaseOrders() {
        try {
            const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
            if (!token) {
                console.error('ไม่พบข้อมูลการล็อกอิน กรุณาล็อกอินใหม่');
                return [];
            }

            // Fetch data from the server API 
            // แก้ route ให้ดึงข้อมูล purchase_orders แทน
            const response = await fetch('http://localhost:3000/api/purchase-orders', {
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
            return data;
        } catch (error) {
            console.error('Error fetching purchase orders:', error);
            
            // For testing/development, return mock data when database connection fails
            return [
                {
                    id: 'PO-1743716632987',
                    po_number: 'PO-2025-5034',
                    title: 'ว้สดุสำนักงาน',
                    status: 'pending',
                    created_at: '2025-04-03 21:43:52'
                },
                {
                    id: 'PO-1743716863520',
                    po_number: 'PO-2025-3871',
                    title: 'จัดซื้อเคมีภัณฑ์',
                    status: 'pending',
                    created_at: '2025-04-03 21:47:43'
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

        // Fetch purchase orders data
        const orders = await fetchPurchaseOrders();

        // Display only pending orders
        const pendingOrders = orders.filter(order => order.status === 'pending');
        
        // Display the orders
        pendingOrders.forEach(order => {
            // Format date for display
            const createdDate = new Date(order.created_at);
            const formattedDate = `${createdDate.getDate().toString().padStart(2, '0')}/${(createdDate.getMonth() + 1).toString().padStart(2, '0')}/${createdDate.getFullYear()}`;
            
            const item = document.createElement('div');
            item.className = 'procurement-item';
            item.innerHTML = `
                <div class="procurement-item-info">
                    <p><strong>${order.po_number || order.id}</strong> - ${order.title}</p>
                    <small>สถานะ: ${order.status} | วันที่: ${formattedDate}</small>
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