-- สร้างฐานข้อมูล
CREATE DATABASE IF NOT EXISTS `CSI206Project` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- สร้างผู้ใช้ใหม่
CREATE USER IF NOT EXISTS 'AdminCSI204'@'localhost' IDENTIFIED BY 'AdminCSI204';

-- ให้สิทธิ์ทั้งหมดกับผู้ใช้บนฐานข้อมูล CSI206Project
GRANT ALL PRIVILEGES ON `CSI206Project`.* TO 'AdminCSI204'@'localhost';

-- นำการเปลี่ยนแปลงสิทธิ์ไปใช้
FLUSH PRIVILEGES;

-- GuideNight___________________________________________________
-- ตารางหลักสำหรับใบขอซื้อ
CREATE TABLE purchase_requisitions (
    id VARCHAR(20) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    requested_by INT NOT NULL,
    department VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requested_by) REFERENCES users(id)
);

-- ตารางสำหรับรายการสินค้าในใบขอซื้อ
CREATE TABLE purchase_requisition_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pr_id VARCHAR(20) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit VARCHAR(50) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    FOREIGN KEY (pr_id) REFERENCES purchase_requisitions(id) ON DELETE CASCADE
);

-- ตารางสำหรับประวัติการอนุมัติใบขอซื้อ
CREATE TABLE purchase_requisition_approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pr_id VARCHAR(20) NOT NULL,
    approved_by INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    comments TEXT,
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pr_id) REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id)
);