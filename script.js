// Global variables
let prItemCount = 0;
let issueItemCount = 1;

// Show section function
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('[id$="-section"]').forEach(section => {
        section.classList.add('d-none');
    });
    
    // Show selected section
    document.getElementById(`${sectionId}-section`).classList.remove('d-none');
    
    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'purchase-request': 'Purchase Request',
        'purchase-order': 'Purchase Order',
        'fixed-assets': 'Fixed Assets',
        'inventory': 'Inventory Management',
        'reports': 'Reports',
        'settings': 'Settings'
    };
    document.getElementById('page-title').textContent = titles[sectionId];
    
    // Update active menu item
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.menu-item[onclick="showSection('${sectionId}')"]`).classList.add('active');
}

// Purchase Request functions
function addPRItem() {
    prItemCount++;
    const itemsContainer = document.getElementById('pr-items');
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" class="form-control" name="pr-item-desc" required></td>
        <td><input type="text" class="form-control" name="pr-item-unit" required></td>
        <td><input type="number" class="form-control" name="pr-item-qty" min="1" required></td>
        <td><input type="number" class="form-control" name="pr-item-price" step="0.01" min="0" required></td>
        <td><input type="number" class="form-control" name="pr-item-amount" step="0.01" min="0" readonly></td>
        <td><input type="date" class="form-control" name="pr-item-date" required></td>
        <td><button type="button" class="btn btn-danger" onclick="removePRItem(this)">Remove</button></td>
    `;
    
    itemsContainer.appendChild(row);
    
    // Add event listeners for auto-calculation
    const qtyInput = row.querySelector('[name="pr-item-qty"]');
    const priceInput = row.querySelector('[name="pr-item-price"]');
    const amountInput = row.querySelector('[name="pr-item-amount"]');
    
    qtyInput.addEventListener('input', updatePRItemAmount);
    priceInput.addEventListener('input', updatePRItemAmount);
    
    function updatePRItemAmount() {
        const qty = parseFloat(qtyInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        amountInput.value = (qty * price).toFixed(2);
    }
}

function removePRItem(button) {
    button.closest('tr').remove();
    prItemCount--;
}

// Purchase Order functions
function showPOTab(tabId) {
    document.getElementById('po-create-tab').classList.add('d-none');
    document.getElementById('po-list-tab').classList.add('d-none');
    document.getElementById(`po-${tabId}-tab`).classList.remove('d-none');
    
    document.querySelectorAll('#purchase-order-section .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`#purchase-order-section .tab[onclick="showPOTab('${tabId}')"]`).classList.add('active');
}

// Inventory functions
function showInventoryTab(tabId) {
    document.getElementById('inventory-items-tab').classList.add('d-none');
    document.getElementById('inventory-receiving-tab').classList.add('d-none');
    document.getElementById('inventory-issuing-tab').classList.add('d-none');
    document.getElementById(`inventory-${tabId}-tab`).classList.remove('d-none');
    
    document.querySelectorAll('#inventory-section .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`#inventory-section .tab[onclick="showInventoryTab('${tabId}')"]`).classList.add('active');
}

function addIssueItem() {
    issueItemCount++;
    const container = document.getElementById('ii-items-container');
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'form-group';
    itemDiv.innerHTML = `
        <label>Item</label>
        <select class="form-control">
            <option value="">Select Item</option>
            <option value="IT-001">Computer Mouse</option>
            <option value="OFF-001">A4 Paper</option>
        </select>
    `;
    
    const qtyDiv = document.createElement('div');
    qtyDiv.className = 'form-group';
    qtyDiv.innerHTML = `
        <label>Quantity</label>
        <input type="number" class="form-control" min="1">
    `;
    
    container.appendChild(itemDiv);
    container.appendChild(qtyDiv);
}

// Reports functions
function showReportTab(tabId) {
    document.getElementById('report-pr-tab').classList.add('d-none');
    document.getElementById('report-po-tab').classList.add('d-none');
    document.getElementById('report-assets-tab').classList.add('d-none');
    document.getElementById('report-inventory-tab').classList.add('d-none');
    document.getElementById(`report-${tabId}-tab`).classList.remove('d-none');
    
    document.querySelectorAll('#reports-section .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`#reports-section .tab[onclick="showReportTab('${tabId}')"]`).classList.add('active');
}

function generatePRReport() {
    const period = document.getElementById('pr-report-period').value;
    let results = '';
    
    if (period === 'custom') {
        const fromDate = document.getElementById('pr-from-date').value;
        const toDate = document.getElementById('pr-to-date').value;
        
        if (!fromDate || !toDate) {
            alert('Please select both from and to dates');
            return;
        }
        
        results = `<p>Showing custom report from ${fromDate} to ${toDate}</p>`;
    } else {
        results = `<p>Showing report for ${period.replace('-', ' ')}</p>`;
    }
    
    // Add sample report data
    results += `
        <table class="table">
            <thead>
                <tr>
                    <th>PR Number</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>PR-2023-001</td>
                    <td>2023-11-15</td>
                    <td>Office Chairs</td>
                    <td><span class="badge badge-success">Approved</span></td>
                    <td>$1,200.00</td>
                </tr>
                <tr>
                    <td>PR-2023-002</td>
                    <td>2023-11-10</td>
                    <td>Computer Monitors</td>
                    <td><span class="badge badge-warning">Pending</span></td>
                    <td>$2,500.00</td>
                </tr>
            </tbody>
        </table>
    `;
    
    document.getElementById('pr-report-results').innerHTML = results;
}

// Settings functions
function showSettingsTab(tabId) {
    document.getElementById('settings-users-tab').classList.add('d-none');
    document.getElementById('settings-budgets-tab').classList.add('d-none');
    document.getElementById('settings-vendors-tab').classList.add('d-none');
    document.getElementById('settings-system-tab').classList.add('d-none');
    document.getElementById(`settings-${tabId}-tab`).classList.remove('d-none');
    
    document.querySelectorAll('#settings-section .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`#settings-section .tab[onclick="showSettingsTab('${tabId}')"]`).classList.add('active');
}

function showAddUserForm() {
    alert('Add user form would appear here in a real implementation');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Form submissions
    document.getElementById('purchase-request-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Purchase request submitted successfully!');
    });
    
    document.getElementById('purchase-order-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Purchase order created successfully!');
    });
    
    document.getElementById('fixed-asset-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Fixed asset registered successfully!');
    });
    
    document.getElementById('receive-items-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Items received successfully!');
    });
    
    document.getElementById('issue-items-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Items issued successfully!');
    });
    
    // Report period change
    document.getElementById('pr-report-period')?.addEventListener('change', function() {
        document.getElementById('pr-custom-range').classList.toggle('d-none', this.value !== 'custom');
    });
    
    // Initialize the page
    showSection('dashboard');
    addPRItem();
});