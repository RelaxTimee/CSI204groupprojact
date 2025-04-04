// สร้างข้อมูลตัวอย่างสินทรัพย์สำหรับการทดสอบ
const sampleAssets = [
    {
        id: 'AST-2024-001',
        name: 'คอมพิวเตอร์โน้ตบุ๊ก',
        quantity: 5,
        unit: 'เครื่อง',
        description: 'Dell Latitude 5420 i5-1135G7, RAM 8GB, SSD 256GB',
        receiveDate: '2024-01-15',
        poNumber: 'PO-2024-0023',
        cost: 145000,
        department: 'ฝ่ายไอที',
        location: 'สำนักงานใหญ่ ชั้น 3',
        status: 'ใช้งานอยู่'
    },
    {
        id: 'AST-2024-002',
        name: 'เครื่องพิมพ์เลเซอร์',
        quantity: 2,
        unit: 'เครื่อง',
        description: 'HP LaserJet Pro M404dn',
        receiveDate: '2024-02-10',
        poNumber: 'PO-2024-0035',
        cost: 32000,
        department: 'ฝ่ายการเงิน',
        location: 'สำนักงานใหญ่ ชั้น 2',
        status: 'ใช้งานอยู่'
    },
    {
        id: 'AST-2024-003',
        name: 'โต๊ะทำงาน',
        quantity: 10,
        unit: 'ตัว',
        description: 'โต๊ะทำงานขนาด 120x60 ซม. พร้อมลิ้นชัก',
        receiveDate: '2024-02-25',
        poNumber: 'PO-2024-0042',
        cost: 65000,
        department: 'ฝ่ายบุคคล',
        location: 'สำนักงานใหญ่ ชั้น 4',
        status: 'ใช้งานอยู่'
    },
    {
        id: 'AST-2024-004',
        name: 'เครื่องปรับอากาศ',
        quantity: 3,
        unit: 'เครื่อง',
        description: 'Daikin Inverter 18000 BTU',
        receiveDate: '2024-03-05',
        poNumber: 'PO-2024-0050',
        cost: 87000,
        department: 'ฝ่ายอาคาร',
        location: 'สำนักงานใหญ่ ชั้น 1',
        status: 'รอติดตั้ง'
    },
    {
        id: 'AST-2024-005',
        name: 'เก้าอี้สำนักงาน',
        quantity: 15,
        unit: 'ตัว',
        description: 'เก้าอี้สำนักงานแบบมีพนักพิงและที่วางแขน หุ้มด้วยผ้าตาข่าย',
        receiveDate: '2024-03-20',
        poNumber: 'PO-2024-0058',
        cost: 45000,
        department: 'ฝ่ายบุคคล',
        location: 'สำนักงานใหญ่ ชั้น 3',
        status: 'ใช้งานอยู่'
    }
];

// เมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', function() {
    // ตรวจสอบว่าอยู่ในหน้าสินทรัพย์หรือไม่
    if(document.getElementById('asset-listing')) {
        // แสดงรายการสินทรัพย์ทั้งหมด
        displayAssets(sampleAssets);
        
        // เพิ่มการทำงานของปุ่มค้นหา
        const searchInput = document.querySelector('.search-bar input');
        searchInput.addEventListener('input', function() {
            filterAssets(this.value);
        });
        
        // เพิ่มการทำงานของปุ่มกรอง
        setupFilters();
    }
    
    // ตรวจสอบว่าอยู่ในหน้ารายละเอียดสินทรัพย์หรือไม่
    if(document.getElementById('asset-detail')) {
        // แสดงรายละเอียดของสินทรัพย์
        const assetId = new URLSearchParams(window.location.search).get('id');
        displayAssetDetail(assetId);
    }
    
    // เพิ่มการทำงานของปุ่มพิมพ์
    setupPrintButtons();
});

// ฟังก์ชันแสดงรายการสินทรัพย์
function displayAssets(assets) {
    const assetListingElement = document.getElementById('asset-listing');
    if (!assetListingElement) return;
    
    let html = '';
    
    // ถ้าไม่มีสินทรัพย์
    if(assets.length === 0) {
        html = '<div class="no-results">ไม่พบสินทรัพย์ที่ตรงกับเงื่อนไขการค้นหา</div>';
        assetListingElement.innerHTML = html;
        return;
    }
    
    // สร้าง HTML สำหรับแต่ละสินทรัพย์
    assets.forEach(asset => {
        html += `
        <div class="asset-item">
            <div class="asset-info">
                <h4>${asset.name}</h4>
                <div class="asset-details">
                    <p><strong>รหัสสินทรัพย์:</strong> ${asset.id}</p>
                    <p><strong>จำนวน:</strong> ${asset.quantity} ${asset.unit}</p>
                    <p><strong>วันที่รับ:</strong> ${formatDate(asset.receiveDate)}</p>
                    <p><strong>หมายเลขใบสั่งซื้อ:</strong> ${asset.poNumber}</p>
                </div>
            </div>
            <div class="asset-actions">
                <a href="asset-detail.html?id=${asset.id}" class="btn detail-btn">
                    <i class="fas fa-info-circle"></i> รายละเอียด
                </a>
                <button class="btn print-btn" data-id="${asset.id}">
                    <i class="fas fa-print"></i> พิมพ์ใบนับ
                </button>
            </div>
        </div>
        `;
    });
    
    assetListingElement.innerHTML = html;
    
    // เพิ่ม event listener สำหรับปุ่มพิมพ์
    document.querySelectorAll('.print-btn').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            printAssetCounting(id);
        });
    });
}

// ฟังก์ชันแสดงรายละเอียดของสินทรัพย์
function displayAssetDetail(assetId) {
    const assetDetailElement = document.getElementById('asset-detail');
    if (!assetDetailElement) return;
    
    // หาสินทรัพย์ด้วย ID
    const asset = sampleAssets.find(a => a.id === assetId);
    
    if (!asset) {
        assetDetailElement.innerHTML = '<div class="error-message">ไม่พบสินทรัพย์ที่ระบุ</div>';
        return;
    }
    
    // สร้าง HTML สำหรับรายละเอียดสินทรัพย์
    const html = `
    <div class="asset-header">
        <h2>${asset.name}</h2>
        <div class="asset-actions">
            <button class="btn edit-btn">
                <i class="fas fa-edit"></i> แก้ไข
            </button>
            <button class="btn print-btn" data-id="${asset.id}">
                <i class="fas fa-print"></i> พิมพ์ใบนับ
            </button>
        </div>
    </div>
    
    <div class="asset-properties">
        <div class="property-group">
            <h3>ข้อมูลทั่วไป</h3>
            <div class="property-row">
                <div class="property-item">
                    <label>รหัสสินทรัพย์</label>
                    <p>${asset.id}</p>
                </div>
                <div class="property-item">
                    <label>ชื่อสินทรัพย์</label>
                    <p>${asset.name}</p>
                </div>
            </div>
            <div class="property-row">
                <div class="property-item">
                    <label>จำนวน</label>
                    <p>${asset.quantity} ${asset.unit}</p>
                </div>
                <div class="property-item">
                    <label>มูลค่า</label>
                    <p>${formatCurrency(asset.cost)}</p>
                </div>
            </div>
            <div class="property-row">
                <div class="property-item">
                    <label>คำอธิบายรายการ</label>
                    <p>${asset.description}</p>
                </div>
            </div>
        </div>
        
        <div class="property-group">
            <h3>ข้อมูลการรับ</h3>
            <div class="property-row">
                <div class="property-item">
                    <label>วันที่รับ</label>
                    <p>${formatDate(asset.receiveDate)}</p>
                </div>
                <div class="property-item">
                    <label>อ้างอิงหมายเลขใบสั่งซื้อ</label>
                    <p>${asset.poNumber}</p>
                </div>
            </div>
        </div>
        
        <div class="property-group">
            <h3>ข้อมูลการใช้งาน</h3>
            <div class="property-row">
                <div class="property-item">
                    <label>แผนก/ฝ่าย</label>
                    <p>${asset.department}</p>
                </div>
                <div class="property-item">
                    <label>สถานที่</label>
                    <p>${asset.location}</p>
                </div>
            </div>
            <div class="property-row">
                <div class="property-item">
                    <label>สถานะ</label>
                    <p>${asset.status}</p>
                </div>
            </div>
        </div>
    </div>
    `;
    
    assetDetailElement.innerHTML = html;
    
    // เพิ่ม event listener สำหรับปุ่มพิมพ์
    document.querySelector('.print-btn').addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        printAssetCounting(id);
    });
}

// ฟังก์ชันค้นหาและกรองสินทรัพย์
function filterAssets(searchText) {
    // ถ้าไม่มีคำค้นหา แสดงทั้งหมด
    if (!searchText) {
        displayAssets(sampleAssets);
        return;
    }
    
    // แปลงเป็นตัวพิมพ์เล็กสำหรับการค้นหาแบบไม่คำนึงถึงตัวพิมพ์ใหญ่-เล็ก
    searchText = searchText.toLowerCase();
    
    // กรองสินทรัพย์ตามคำค้นหา
    const filteredAssets = sampleAssets.filter(asset => {
        return asset.id.toLowerCase().includes(searchText) ||
               asset.name.toLowerCase().includes(searchText) ||
               asset.description.toLowerCase().includes(searchText) ||
               asset.poNumber.toLowerCase().includes(searchText);
    });
    
    // แสดงผลลัพธ์ที่กรองแล้ว
    displayAssets(filteredAssets);
}

// ฟังก์ชันตั้งค่าตัวกรอง
function setupFilters() {
    const filterForm = document.querySelector('.filter-form');
    if (!filterForm) return;
    
    // ปุ่มรีเซ็ตตัวกรอง
    const resetBtn = filterForm.querySelector('.filter-reset');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            // รีเซ็ตฟอร์ม
            filterForm.reset();
            
            // แสดงสินทรัพย์ทั้งหมดอีกครั้ง
            displayAssets(sampleAssets);
        });
    }
    
    // ปุ่มกรองข้อมูล
    const filterBtn = filterForm.querySelector('.filter-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', function() {
            // ดึงค่าจากฟอร์ม
            const department = document.getElementById('department-filter').value;
            const status = document.getElementById('status-filter').value;
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            
            // กรองสินทรัพย์ตามเงื่อนไข
            const filteredAssets = sampleAssets.filter(asset => {
                let match = true;
                
                // กรองตามแผนก/ฝ่าย
                if (department && department !== 'all') {
                    match = match && asset.department === department;
                }
                
                // กรองตามสถานะ
                if (status && status !== 'all') {
                    match = match && asset.status === status;
                }
                
                // กรองตามวันที่รับ
                if (startDate) {
                    match = match && asset.receiveDate >= startDate;
                }
                
                if (endDate) {
                    match = match && asset.receiveDate <= endDate;
                }
                
                return match;
            });
            
            // แสดงผลลัพธ์ที่กรองแล้ว
            displayAssets(filteredAssets);
        });
    }
}

// ฟังก์ชันตั้งค่าปุ่มพิมพ์
function setupPrintButtons() {
    // ปุ่มพิมพ์ทั่วไป
    const printButtons = document.querySelectorAll('.print-btn:not([data-id])');
    printButtons.forEach(button => {
        button.addEventListener('click', function() {
            window.print();
        });
    });
}

// ฟังก์ชันพิมพ์ใบนับสินทรัพย์
function printAssetCounting(assetId) {
    // หาสินทรัพย์ด้วย ID
    const asset = sampleAssets.find(a => a.id === assetId);
    
    if (!asset) {
        alert('ไม่พบสินทรัพย์ที่ระบุ');
        return;
    }
    
    // สร้างหน้าต่างใหม่สำหรับการพิมพ์
    const printWindow = window.open('', '_blank');
    
    // สร้าง HTML สำหรับพิมพ์
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>ใบนับสินทรัพย์ - ${asset.id}</title>
        <style>
            body {
                font-family: 'Prompt', 'Sarabun', sans-serif;
                margin: 0;
                padding: 20px;
            }
            .print-container {
                max-width: 800px;
                margin: 0 auto;
            }
            .company-header {
                text-align: center;
                margin-bottom: 30px;
            }
            .company-header h1 {
                margin: 0;
                font-size: 24px;
            }
            .document-title {
                text-align: center;
                font-size: 20px;
                margin: 20px 0;
                font-weight: bold;
            }
            .asset-info {
                margin-bottom: 30px;
            }
            .info-group {
                margin-bottom: 20px;
            }
            .info-row {
                display: flex;
                margin-bottom: 10px;
            }
            .info-label {
                font-weight: bold;
                width: 150px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            table, th, td {
                border: 1px solid #000;
            }
            th, td {
                padding: 10px;
                text-align: left;
            }
            th {
                background-color: #f2f2f2;
            }
            .signature-section {
                margin-top: 50px;
                display: flex;
                justify-content: space-between;
            }
            .signature-box {
                width: 45%;
                text-align: center;
            }
            .signature-line {
                border-top: 1px solid #000;
                margin-top: 50px;
                padding-top: 5px;
            }
            .qr-code {
                text-align: right;
                margin-top: 20px;
            }
            @media print {
                @page {
                    size: A4;
                    margin: 10mm;
                }
                body {
                    padding: 0;
                }
                .print-header {
                    display: none;
                }
            }
        </style>
    </head>
    <body>
        <div class="print-header" style="text-align: right; margin-bottom: 20px;">
            <button onclick="window.print();" style="padding: 8px 16px; cursor: pointer;">
                พิมพ์เอกสาร
            </button>
        </div>
        
        <div class="print-container">
            <div class="company-header">
                <h1>บริษัท เอบีซี จำกัด</h1>
                <p>123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110</p>
                <p>โทร: 02-123-4567 | อีเมล: info@abc-company.co.th</p>
            </div>
            
            <div class="document-title">
                ใบนับสินทรัพย์
            </div>
            
            <div class="asset-info">
                <div class="info-group">
                    <div class="info-row">
                        <span class="info-label">รหัสสินทรัพย์:</span>
                        <span>${asset.id}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">ชื่อสินทรัพย์:</span>
                        <span>${asset.name}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">คำอธิบายรายการ:</span>
                        <span>${asset.description}</span>
                    </div>
                </div>
                
                <div class="info-group">
                    <div class="info-row">
                        <span class="info-label">ปริมาณการรับ:</span>
                        <span>${asset.quantity} ${asset.unit}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">วันที่รับ:</span>
                        <span>${formatDate(asset.receiveDate)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">อ้างอิงใบสั่งซื้อ:</span>
                        <span>${asset.poNumber}</span>
                    </div>
                </div>
                
                <div class="info-group">
                    <div class="info-row">
                        <span class="info-label">มูลค่า:</span>
                        <span>${formatCurrency(asset.cost)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">แผนก/ฝ่าย:</span>
                        <span>${asset.department}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">สถานที่:</span>
                        <span>${asset.location}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">สถานะ:</span>
                        <span>${asset.status}</span>
                    </div>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th colspan="3">การตรวจนับสินทรัพย์</th>
                    </tr>
                    <tr>
                        <th style="width: 25%;">วันที่ตรวจนับ</th>
                        <th style="width: 50%;">ผลการตรวจนับ</th>
                        <th style="width: 25%;">ผู้ตรวจนับ</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="height: 40px;"></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td style="height: 40px;"></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td style="height: 40px;"></td>
                        <td></td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
            
            <div class="signature-section">
                <div class="signature-box">
                    <div class="signature-line">
                        ผู้รับผิดชอบสินทรัพย์
                    </div>
                    <div>
                        วันที่: ____________________
                    </div>
                </div>
                <div class="signature-box">
                    <div class="signature-line">
                        ผู้ตรวจสอบ
                    </div>
                    <div>
                        วันที่: ____________________
                    </div>
                </div>
            </div>
            
            <div class="qr-code">
                <svg width="100" height="100" style="border: 1px solid #ddd;">
                    <!-- Placeholder for QR code -->
                    <rect x="0" y="0" width="100" height="100" fill="#f5f5f5"></rect>
                    <text x="10" y="50" font-size="10">QR Code: ${asset.id}</text>
                </svg>
            </div>
        </div>
    </body>
    </html>
    `;
    
    // เขียน HTML ไปยังหน้าต่างการพิมพ์
    printWindow.document.write(html);
    printWindow.document.close();
    
    // เมื่อโหลดเสร็จแล้วให้เริ่มพิมพ์
    printWindow.onload = function() {
        // หน่วงเวลาเล็กน้อยเพื่อให้แน่ใจว่าทุกอย่างโหลดเสร็จแล้ว
        setTimeout(function() {
            printWindow.print();
        }, 500);
    };
}

// ฟังก์ชันช่วยจัดรูปแบบวันที่
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    // ตรวจสอบว่าวันที่ถูกต้องหรือไม่
    if (isNaN(date.getTime())) return dateString;
    
    // จัดรูปแบบวันที่เป็น dd/mm/yyyy
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
}

// ฟังก์ชันช่วยจัดรูปแบบเงิน
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '';
    
    return '฿' + amount.toLocaleString('th-TH');
}