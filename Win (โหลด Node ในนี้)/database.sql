-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: mysql
-- Generation Time: Apr 02, 2025 at 06:27 PM
-- Server version: 9.2.0
-- PHP Version: 8.2.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `CSI206Project`
--

-- --------------------------------------------------------

--
-- Table structure for table `inventory_items`
--

CREATE TABLE `inventory_items` (
  `id` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `unit` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `unit_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `in_stock` int NOT NULL DEFAULT '0',
  `min_stock` int DEFAULT '0',
  `max_stock` int DEFAULT '0',
  `notes` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory_items`
--

INSERT INTO `inventory_items` (`id`, `name`, `category`, `unit`, `unit_price`, `in_stock`, `min_stock`, `max_stock`, `notes`, `created_at`) VALUES
('ITM001', 'กระดาษ A4', 'วัสดุสำนักงาน', 'รีม', 120.00, 45, 20, 100, 'กระดาษสำหรับใช้ในสำนักงาน', '2025-04-02 12:55:25'),
('ITM002', 'หมึกพิมพ์ HP 680', 'อุปกรณ์คอมพิวเตอร์', 'กล่อง', 650.00, 12, 10, 30, 'สำหรับเครื่องพิมพ์ HP', '2025-04-02 12:55:25'),
('ITM003', 'แฟ้มเอกสาร', 'วัสดุสำนักงาน', 'แพ็ค', 180.00, 25, 15, 50, 'แฟ้มใส่เอกสาร A4', '2025-04-02 12:55:25'),
('ITM004', 'ปากกาลูกลื่น', 'เครื่องเขียน', 'กล่อง', 120.00, 18, 20, 60, 'สีน้ำเงิน', '2025-04-02 12:55:25'),
('ITM005', 'แท็บเล็ต Samsung', 'อุปกรณ์อิเล็กทรอนิกส์', 'เครื่อง', 12500.00, 3, 2, 5, 'สำหรับฝ่ายการตลาด', '2025-04-02 12:55:25');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_receipts`
--

CREATE TABLE `inventory_receipts` (
  `id` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `receipt_date` date NOT NULL,
  `supplier_name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `po_reference` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_general_ci,
  `status` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approval_notes` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory_receipts`
--

INSERT INTO `inventory_receipts` (`id`, `receipt_date`, `supplier_name`, `po_reference`, `notes`, `status`, `created_by`, `created_at`, `approved_by`, `approved_at`, `approval_notes`) VALUES
('RCV-2025-0004', '2025-04-02', 'dddddddd', NULL, NULL, 'pending', 3, '2025-04-02 17:59:36', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `inventory_receipt_items`
--

CREATE TABLE `inventory_receipt_items` (
  `id` int NOT NULL,
  `receipt_id` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `item_id` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(15,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory_receipt_items`
--

INSERT INTO `inventory_receipt_items` (`id`, `receipt_id`, `item_id`, `quantity`, `unit_price`) VALUES
(4, 'RCV-2025-0004', 'ITM004', 1, 120.00);

-- --------------------------------------------------------

--
-- Table structure for table `item_categories`
--

CREATE TABLE `item_categories` (
  `id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `product_type` tinyint DEFAULT '1' COMMENT '1=สินค้าไม่ถาวร, 2=สินค้าถาวร'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `item_categories`
--

INSERT INTO `item_categories` (`id`, `name`, `product_type`) VALUES
(1, 'วัสดุสำนักงาน', 1),
(2, 'เครื่องเขียน', 1),
(3, 'อุปกรณ์คอมพิวเตอร์', 1),
(4, 'อุปกรณ์อิเล็กทรอนิกส์', 1),
(5, 'เฟอร์นิเจอร์', 2),
(6, 'อุปกรณ์สำนักงาน', 2);

-- --------------------------------------------------------

--
-- Table structure for table `purchase_requisitions`
--

CREATE TABLE `purchase_requisitions` (
  `id` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `DATE` date NOT NULL,
  `requested_by` int NOT NULL,
  `department` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `STATUS` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'draft',
  `total_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_requisitions`
--

INSERT INTO `purchase_requisitions` (`id`, `title`, `description`, `DATE`, `requested_by`, `department`, `STATUS`, `total_amount`, `created_at`, `updated_at`) VALUES
('PR-2025-5018', 'tew', 'dasdwasd', '2025-04-01', 3, 'procurement', 'draft', 12.00, '2025-04-01 17:35:24', '2025-04-01 17:35:24'),
('PR-2025-7797', 'homegaming', 'Kuy Project', '2025-04-02', 3, 'procurement', 'draft', 90.00, '2025-04-02 14:21:08', '2025-04-02 14:21:08');

-- --------------------------------------------------------

--
-- Table structure for table `purchase_requisition_approvals`
--

CREATE TABLE `purchase_requisition_approvals` (
  `id` int NOT NULL,
  `pr_id` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `STATUS` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `comments` text COLLATE utf8mb4_general_ci,
  `approved_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_requisition_approvals`
--

INSERT INTO `purchase_requisition_approvals` (`id`, `pr_id`, `approved_by`, `STATUS`, `comments`, `approved_at`) VALUES
(21, 'PR-2025-5018', 3, 'pending', 'รอการอนุมัติใบสั่งซื้อ', '2025-04-02 14:59:12'),
(22, 'PR-2025-7797', 3, 'pending', 'รอการอนุมัติใบสั่งซื้อ', '2025-04-02 16:07:15');

-- --------------------------------------------------------

--
-- Table structure for table `purchase_requisition_items`
--

CREATE TABLE `purchase_requisition_items` (
  `id` int NOT NULL,
  `pr_id` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `item_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `quantity` int NOT NULL,
  `unit` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `amount` decimal(15,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_requisition_items`
--

INSERT INTO `purchase_requisition_items` (`id`, `pr_id`, `item_name`, `quantity`, `unit`, `unit_price`, `amount`) VALUES
(12, 'PR-2025-5018', 'Bangboo', 1, 'ชิ้น', 12.00, 12.00),
(14, 'PR-2025-7797', 'Bangboo', 6, 'ชุด', 15.00, 90.00);

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'ADMIN', 'ผู้ดูแลระบบ'),
(2, 'MANAGER', 'ผู้จัดการ'),
(3, 'PROCUREMENT', 'ฝ่ายจัดซื้อ'),
(4, 'FINANCE', 'ฝ่ายการเงินและบัญชี'),
(5, 'IT', 'ฝ่ายไอที');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role_id`, `created_at`) VALUES
(1, 'Admin', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQRqQDP8wXZ7q8WQJdcn7zY1J3YypmC', 1, '2025-04-01 09:17:07'),
(2, 'Manager', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQRqQDP8wXZ7q8WQJdcn7zY1J3YypmC', 2, '2025-04-01 09:17:07'),
(3, 'Procurement', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQRqQDP8wXZ7q8WQJdcn7zY1J3YypmC', 3, '2025-04-01 09:17:07'),
(4, 'Finance', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQRqQDP8wXZ7q8WQJdcn7zY1J3YypmC', 4, '2025-04-01 09:17:07'),
(5, 'It', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQRqQDP8wXZ7q8WQJdcn7zY1J3YypmC', 5, '2025-04-01 09:17:07');

-- --------------------------------------------------------

--
-- Table structure for table `vendors`
--

CREATE TABLE `vendors` (
  `id` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `contact_name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `contact_position` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_general_ci,
  `tax_id` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `business_type` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `payment_terms` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_general_ci,
  `STATUS` varchar(20) COLLATE utf8mb4_general_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vendors`
--

INSERT INTO `vendors` (`id`, `name`, `contact_name`, `contact_position`, `phone`, `email`, `address`, `tax_id`, `business_type`, `payment_terms`, `notes`, `STATUS`, `created_at`, `created_by`, `updated_at`, `updated_by`) VALUES
('V001', 'fgrgr', 'ergerg', 'gergreg', 'reg', 'gergrg', 'erger', '345345', 'distributor', NULL, 'rge', 'active', '2025-04-01 15:19:23', NULL, '2025-04-01 15:19:23', NULL),
('V002', '2ewq2', 'eqwe2', 'qwe2', '1323123', 'wqdwqdq', 'qwdwqd', 'wdqwd', 'retailer', NULL, 'qwdwq', 'active', '2025-04-01 16:25:37', NULL, '2025-04-01 16:25:37', NULL),
('V003', 'Manageboo', 'Joyboo', 'Superboo', '12321312312', 'ewdwqwad', 'asdwasd', 'wdsawd', 'retailer', NULL, 'wsasdw', 'active', '2025-04-02 14:22:18', NULL, '2025-04-02 14:22:18', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `vendor_business_types`
--

CREATE TABLE `vendor_business_types` (
  `id` int NOT NULL,
  `NAME` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vendor_business_types`
--

INSERT INTO `vendor_business_types` (`id`, `NAME`, `description`) VALUES
(1, 'manufacturer', 'ผู้ผลิต'),
(2, 'distributor', 'ผู้จัดจำหน่าย'),
(3, 'retailer', 'ร้านค้าปลีก'),
(4, 'service', 'ผู้ให้บริการ'),
(5, 'other', 'อื่นๆ');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `inventory_items`
--
ALTER TABLE `inventory_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `inventory_receipts`
--
ALTER TABLE `inventory_receipts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `approved_by` (`approved_by`);

--
-- Indexes for table `inventory_receipt_items`
--
ALTER TABLE `inventory_receipt_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `receipt_id` (`receipt_id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `item_categories`
--
ALTER TABLE `item_categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `purchase_requisitions`
--
ALTER TABLE `purchase_requisitions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `requested_by` (`requested_by`);

--
-- Indexes for table `purchase_requisition_approvals`
--
ALTER TABLE `purchase_requisition_approvals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pr_id` (`pr_id`),
  ADD KEY `approved_by` (`approved_by`);

--
-- Indexes for table `purchase_requisition_items`
--
ALTER TABLE `purchase_requisition_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pr_id` (`pr_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `role_id` (`role_id`);

--
-- Indexes for table `vendors`
--
ALTER TABLE `vendors`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `vendor_business_types`
--
ALTER TABLE `vendor_business_types`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `inventory_receipt_items`
--
ALTER TABLE `inventory_receipt_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `item_categories`
--
ALTER TABLE `item_categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `purchase_requisition_approvals`
--
ALTER TABLE `purchase_requisition_approvals`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `purchase_requisition_items`
--
ALTER TABLE `purchase_requisition_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `vendor_business_types`
--
ALTER TABLE `vendor_business_types`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `inventory_receipts`
--
ALTER TABLE `inventory_receipts`
  ADD CONSTRAINT `inventory_receipts_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `inventory_receipts_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `inventory_receipt_items`
--
ALTER TABLE `inventory_receipt_items`
  ADD CONSTRAINT `inventory_receipt_items_ibfk_1` FOREIGN KEY (`receipt_id`) REFERENCES `inventory_receipts` (`id`),
  ADD CONSTRAINT `inventory_receipt_items_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `inventory_items` (`id`);

--
-- Constraints for table `purchase_requisitions`
--
ALTER TABLE `purchase_requisitions`
  ADD CONSTRAINT `purchase_requisitions_ibfk_1` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `purchase_requisition_approvals`
--
ALTER TABLE `purchase_requisition_approvals`
  ADD CONSTRAINT `purchase_requisition_approvals_ibfk_1` FOREIGN KEY (`pr_id`) REFERENCES `purchase_requisitions` (`id`),
  ADD CONSTRAINT `purchase_requisition_approvals_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `purchase_requisition_items`
--
ALTER TABLE `purchase_requisition_items`
  ADD CONSTRAINT `purchase_requisition_items_ibfk_1` FOREIGN KEY (`pr_id`) REFERENCES `purchase_requisitions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);

--
-- Constraints for table `vendors`
--
ALTER TABLE `vendors`
  ADD CONSTRAINT `vendors_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `vendors_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
