-- สร้างฐานข้อมูล
CREATE DATABASE IF NOT EXISTS `CSI206Project` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `CSI206Project`;

-- ตาราง roles
CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ข้อมูล roles
INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'ADMIN', 'ผู้ดูแลระบบ'),
(2, 'MANAGER', 'ผู้จัดการ'),
(3, 'PROCUREMENT', 'ฝ่ายจัดซื้อ'),
(4, 'FINANCE', 'ฝ่ายการเงินและบัญชี'),
(5, 'IT', 'ฝ่ายไอที');

-- ตาราง users
CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ตัวอย่างข้อมูลผู้ใช้
INSERT INTO `users` (`id`, `username`, `password`, `role_id`) VALUES
(1, 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQRqQDP8wXZ7q8WQJdcn7zY1J3YypmC', 1), -- password: admin123
(2, 'manager@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQRqQDP8wXZ7q8WQJdcn7zY1J3YypmC', 2),
(3, 'procurement@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQRqQDP8wXZ7q8WQJdcn7zY1J3YypmC', 3),
(4, 'finance@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQRqQDP8wXZ7q8WQJdcn7zY1J3YypmC', 4),
(5, 'it@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQRqQDP8wXZ7q8WQJdcn7zY1J3YypmC', 5);

-- สร้าง primary key และ auto increment
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `role_id` (`role_id`);

ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

-- สร้าง foreign key
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);