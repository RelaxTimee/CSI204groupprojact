// Database value puller for purchase_requisitions table
document.addEventListener('DOMContentLoaded', function() {
    // Function to fetch purchase requisitions from the database
    async function fetchPurchaseRequisitions() {
        try {
            const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
            if (!token) {
                console.error('ไม่พบข้อมูลการล็อกอิน กรุณาล็อกอินใหม่');
                return [];
            }

            // Fetch data from the server API
            const response = await fetch('http://localhost:3000/api/purchase-requisitions', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('ไม่สามารถดึงข้อมูลใบขอซื้อได้');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching purchase requisitions:', error);
            
            // For testing/development, return mock data when database connection fails
            return [
                {
                    id: 'PR-2024-0056',
                    title: 'อุปกรณ์สำนักงาน',
                    status: 'รออนุมัติ',
                    updated_at: '2024-03-25 10:30:00'
                },
                {
                    id: 'PR-2024-0057',
                    title: 'อุปกรณ์คอมพิวเตอร์',
                    status: 'อนุมัติแล้ว',
                    updated_at: '2024-03-26 14:15:00'
                },
                {
                    id: 'PR-2024-0058',
                    title: 'เฟอร์นิเจอร์สำนักงาน',
                    status: 'รอตรวจสอบ',
                    updated_at: '2024-03-27 09:45:00'
                }
            ];
        }
    }

    // Function to display purchase requisitions in the dashboard
    async function displayPurchaseRequisitions() {
        const pendingRequisitionsList = document.getElementById('pending-requisitions');
        if (!pendingRequisitionsList) return;

        // Clear existing content
        pendingRequisitionsList.innerHTML = '';

        // Fetch purchase requisitions data
        const requisitions = await fetchPurchaseRequisitions();

        // Display the requisitions
        requisitions.forEach(req => {
            // Format date for display
            const updatedDate = new Date(req.updated_at);
            const formattedDate = `${updatedDate.getDate().toString().padStart(2, '0')}/${(updatedDate.getMonth() + 1).toString().padStart(2, '0')}/${updatedDate.getFullYear()}`;
            
            const item = document.createElement('div');
            item.className = 'procurement-item';
            item.innerHTML = `
                <div class="procurement-item-info">
                    <p><strong>${req.id}</strong> - ${req.title}</p>
                    <small>สถานะ: ${req.status} | อัปเดตล่าสุด: ${formattedDate}</small>
                </div>
                <div class="procurement-item-status">
                    <span class="status-badge status-${req.status === 'อนุมัติแล้ว' ? 'approved' : 'pending'}">${req.status}</span>
                </div>
            `;
            pendingRequisitionsList.appendChild(item);
        });
    }

    // Export functions for use in other files
    window.purchaseRequisitionsDB = {
        fetchPurchaseRequisitions,
        displayPurchaseRequisitions
    };

    // Initialize display if on the dashboard page
    if (document.getElementById('pending-requisitions')) {
        displayPurchaseRequisitions();
    }
});