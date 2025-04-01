-- สร้างฐานข้อมูล
CREATE DATABASE IF NOT EXISTS `CSI206Project` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- สร้างผู้ใช้ใหม่
CREATE USER IF NOT EXISTS 'AdminCSI204'@'localhost' IDENTIFIED BY 'AdminCSI204';

-- ให้สิทธิ์ทั้งหมดกับผู้ใช้บนฐานข้อมูล CSI206Project
GRANT ALL PRIVILEGES ON `CSI206Project`.* TO 'AdminCSI204'@'localhost';

-- นำการเปลี่ยนแปลงสิทธิ์ไปใช้
FLUSH PRIVILEGES;