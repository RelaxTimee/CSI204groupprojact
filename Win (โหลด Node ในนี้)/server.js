const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");


// สร้าง Express app
const app = express();
const PORT = process.env.PORT || 3000;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// เสิร์ฟไฟล์ static (HTML, CSS, JS, รูปภาพ)
app.use(express.static(path.join(__dirname)));


// กำหนดค่าเชื่อมต่อฐานข้อมูล MySQL
const dbConfig = {
  host: "localhost",
  user: "AdminCSI204",
  password: "AdminCSI204",
  database: "CSI206Project",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// สร้าง pool connection สำหรับ MySQL
const pool = mysql.createPool(dbConfig);

// ฟังก์ชันสำหรับตรวจสอบการเชื่อมต่อฐานข้อมูล
async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("เชื่อมต่อกับฐานข้อมูลสำเร็จ!");
    connection.release();
    return true;
  } catch (error) {
    console.error("ไม่สามารถเชื่อมต่อกับฐานข้อมูล:", error);
    console.log("กำลังใช้ข้อมูลจำลอง...");
    return false;
  }
}

// ตรวจสอบการเชื่อมต่อเมื่อเริ่มต้นเซิร์ฟเวอร์
let dbConnected = false;
(async () => {
  dbConnected = await testDatabaseConnection();
})();



// API สำหรับการล็อกอิน
// แก้ไขในไฟล์ server.js ในส่วนของ /users/login
app.post("/users/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (dbConnected) {
      const [users] = await pool.query(
        "SELECT id, username, password, role_id FROM users WHERE username = ?",
        [username]
      );

      if (users.length === 0) {
        return res.status(401).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
      }

      const user = users[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
      }

      // สร้าง token
      const token = jwt.sign(
        { id: user.id, username: user.username, role_id: user.role_id },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      // บันทึก log การเข้าสู่ระบบ
      await pool.query(
        "INSERT INTO logs (role_id, username, action) VALUES (?, ?, ?)",
        [user.role_id, user.username, "เข้าสู่ระบบ"]
      );

      res.json({
        id: user.id,
        username: user.username,
        role_id: user.role_id,
        token,
      });
    } else {
      // ใช้ข้อมูลจำลอง
      const user = mockUsers.find(
        (u) => u.username === username && u.password === password
      );

      if (!user) {
        return res
          .status(401)
          .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
      }

      // สร้าง token
      const token = jwt.sign(
        { id: user.id, username: user.username, role_id: user.role_id },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        id: user.id,
        username: user.username,
        role_id: user.role_id,
        token,
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง" });
  }
});

// Middleware สำหรับการตรวจสอบ token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "ไม่มี token ที่ใช้ยืนยันตัวตน" });
  }

  try {
    // ตรวจสอบ token
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(403).json({ message: "Token ไม่ถูกต้องหรือหมดอายุ" });
  }
}

// API ตรวจสอบ token
app.get("/users/verify", authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user, message: "Token ถูกต้อง" });
});

// API ข้อมูลผู้ใช้ทั้งหมด (สำหรับ admin)
app.get("/users", authenticateToken, async (req, res) => {
  try {
    if (req.user.role_id !== 1) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
    }

    if (dbConnected) {
      // ใช้ฐานข้อมูลจริง
      const [users] = await pool.query(
        "SELECT id, username, role_id, created_at FROM users"
      );

      res.json(users);
    } else {
      // ใช้ข้อมูลจำลอง
      const users = mockUsers.map((user) => ({
        id: user.id,
        username: user.username,
        role_id: user.role_id,
        created_at: new Date().toISOString(),
      }));

      res.json(users);
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง" });
  }
});

// API นับจำนวนผู้ใช้ทั้งหมด - it's best
app.get("/api/users/count", authenticateToken, async (req, res) => {
  try {
    if (dbConnected) {
      // ใช้ฐานข้อมูลจริง
      const [result] = await pool.query("SELECT COUNT(*) as total FROM users");
      res.json({ count: result[0].total });
    } else {
      // ใช้ข้อมูลจำลอง
      res.json({ count: mockUsers.length });
    }
  } catch (error) {
    console.error("Error counting users:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง" });
  }
});


// Best's implementation: API for creating a new user
app.post('/users/create', authenticateToken, async (req, res) => {
  try {
    // Only admin and manager can create users
    if (req.user.role_id !== 1 && req.user.role_id !== 2) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์ดำเนินการนี้' });
    }

    const { username, password, role_id } = req.body;

    if (!username || !password || !role_id) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    if (dbConnected) {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      const [result] = await pool.query(
        'INSERT INTO users (username, password, role_id) VALUES (?, ?, ?)',
        [username, hashedPassword, role_id]
      );

      res.status(201).json({
        id: result.insertId,
        username,
        role_id,
        created_at: new Date().toISOString()
      });
    } else {
      // Simulate creating a user with mock data
      const newUser = {
        id: mockUsers.length + 1,
        username,
        password, // In a real app, this would be hashed
        role_id: parseInt(role_id),
        created_at: new Date().toISOString()
      };

      mockUsers.push(newUser);

      res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        role_id: newUser.role_id,
        created_at: newUser.created_at
      });
    }
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง' });
  }
});

// Best's implementation: API for updating a user
app.put('/users/update/:id', authenticateToken, async (req, res) => {
  try {
    // Only admin and manager can update users
    if (req.user.role_id !== 1 && req.user.role_id !== 2) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์ดำเนินการนี้' });
    }

    const userId = req.params.id;
    const { username, password, role_id } = req.body;

    if (!username || !role_id) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    if (dbConnected) {
      // If password is provided, update it too
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
          'UPDATE users SET username = ?, password = ?, role_id = ? WHERE id = ?',
          [username, hashedPassword, role_id, userId]
        );
      } else {
        await pool.query(
          'UPDATE users SET username = ?, role_id = ? WHERE id = ?',
          [username, role_id, userId]
        );
      }

      res.json({ message: 'อัปเดตผู้ใช้สำเร็จ' });
    } else {
      // Simulate updating a user with mock data
      const userIndex = mockUsers.findIndex(u => u.id == userId);

      if (userIndex === -1) {
        return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
      }

      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        username,
        role_id: parseInt(role_id),
        ...(password && { password })
      };

      res.json({ message: 'อัปเดตผู้ใช้สำเร็จ' });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง' });
  }
});

// Best's implementation: API for deleting a user
app.delete('/users/delete/:id', authenticateToken, async (req, res) => {
  try {
    // Only admin and manager can delete users
    if (req.user.role_id !== 1 && req.user.role_id !== 2) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์ดำเนินการนี้' });
    }

    const userId = req.params.id;

    if (dbConnected) {
      // Delete the user
      await pool.query('DELETE FROM users WHERE id = ?', [userId]);

      // Reindex IDs to ensure sequential order
      await pool.query(`
        SET @count = 0;
        UPDATE users SET id = @count:= @count + 1 ORDER BY id;
        ALTER TABLE users AUTO_INCREMENT = 1;
      `);

      res.json({ message: 'ลบผู้ใช้สำเร็จ' });
    } else {
      // Simulate deleting a user with mock data
      const userIndex = mockUsers.findIndex(u => u.id == userId);

      if (userIndex === -1) {
        return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
      }

      // Remove the user
      mockUsers.splice(userIndex, 1);

      // Reindex IDs
      mockUsers.forEach((user, index) => {
        user.id = index + 1;
      });

      res.json({ message: 'ลบผู้ใช้สำเร็จ' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง' });
  }
});

// Best's implementation: API for restoring users from backup
app.post('/users/restore', authenticateToken, async (req, res) => {
  try {
    // Only admin and manager can restore users
    if (req.user.role_id !== 1 && req.user.role_id !== 2) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์ดำเนินการนี้' });
    }

    const users = req.body;

    if (!Array.isArray(users)) {
      return res.status(400).json({ message: 'รูปแบบข้อมูลไม่ถูกต้อง' });
    }

    if (dbConnected) {
      // Clear existing users
      await pool.query('DELETE FROM users');

      // Insert restored users
      for (const user of users) {
        // Skip if missing required fields
        if (!user.username || !user.role_id) continue;

        // Use default password if not provided
        const password = user.password || '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQRqQDP8wXZ7q8WQJdcn7zY1J3YypmC';

        await pool.query(
          'INSERT INTO users (id, username, password, role_id, created_at) VALUES (?, ?, ?, ?, ?)',
          [user.id, user.username, password, user.role_id, user.created_at || new Date().toISOString()]
        );
      }

      // Reset auto increment
      await pool.query('ALTER TABLE users AUTO_INCREMENT = 1');

      res.json({ message: 'กู้คืนข้อมูลสำเร็จ' });
    } else {
      // Simulate restoring users with mock data
      mockUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        password: user.password || 'admin123',
        role_id: parseInt(user.role_id),
        created_at: user.created_at || new Date().toISOString()
      }));

      res.json({ message: 'กู้คืนข้อมูลสำเร็จ' });
    }
  } catch (error) {
    console.error('Error restoring users:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง' });
  }
});



// เริ่มการทำงานของเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log(`Server กำลังทำงานที่ http://localhost:${PORT}`);
  console.log(`- เข้าสู่ระบบที่: http://localhost:${PORT}/login.html`);
});

// GuideNight_________________________________________
// API สร้างใบขอซื้อใหม่
app.post("/api/purchase-requisitions", authenticateToken, async (req, res) => {
  try {
    const prData = req.body;
    // ตรวจสอบข้อมูล
    if (!prData.title || !prData.department) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    // สร้างรหัสใบขอซื้อ
    const prId = `PR-${new Date().getFullYear()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    // เตรียมข้อมูลสำหรับบันทึก
    const newPR = {
      id: prId,
      title: prData.title,
      description: prData.description || "",
      date: prData.date || new Date().toISOString().split("T")[0],
      requested_by: req.user.id,
      department: prData.department,
      status: prData.status || "draft",
      total_amount: 0,
    };

    // บันทึกใบขอซื้อลงฐานข้อมูล
    const [result] = await pool.query(
      "INSERT INTO purchase_requisitions (id, title, description, date, requested_by, department, status, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        newPR.id,
        newPR.title,
        newPR.description,
        newPR.date,
        newPR.requested_by,
        newPR.department,
        newPR.status,
        newPR.total_amount,
      ]
    );

    // บันทึกรายการสินค้า
    if (prData.items && prData.items.length > 0) {
      let totalAmount = 0;

      for (const item of prData.items) {
        const amount = item.quantity * item.unitPrice;
        totalAmount += amount;

        await pool.query(
          "INSERT INTO purchase_requisition_items (pr_id, item_name, quantity, unit, unit_price, amount) VALUES (?, ?, ?, ?, ?, ?)",
          [prId, item.name, item.quantity, item.unit, item.unitPrice, amount]
        );
      }

      // อัปเดตยอดรวม
      await pool.query(
        "UPDATE purchase_requisitions SET total_amount = ? WHERE id = ?",
        [totalAmount, prId]
      );
      newPR.total_amount = totalAmount;
    }

    res.status(201).json({
      message: "สร้างใบขอซื้อเรียบร้อยแล้ว",
      data: newPR,
    });
  } catch (error) {
    console.error("Error creating purchase requisition:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
});

// API ดึงรายการใบขอซื้อทั้งหมด
app.get("/api/purchase-requisitions", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM purchase_requisitions ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching purchase requisitions:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
});

// API ดึงรายละเอียดใบขอซื้อตาม ID
app.get(
  "/api/purchase-requisitions/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const prId = req.params.id;

      // ดึงข้อมูลใบขอซื้อ
      const [prs] = await pool.query(
        "SELECT * FROM purchase_requisitions WHERE id = ?",
        [prId]
      );

      if (prs.length === 0) {
        return res.status(404).json({ message: "ไม่พบใบขอซื้อที่ต้องการ" });
      }

      const pr = prs[0];

      // ดึงรายการสินค้า
      const [items] = await pool.query(
        "SELECT * FROM purchase_requisition_items WHERE pr_id = ?",
        [prId]
      );

      // ดึงประวัติการอนุมัติ
      const [approvals] = await pool.query(
        "SELECT * FROM purchase_requisition_approvals WHERE pr_id = ?",
        [prId]
      );

      res.json({
        ...pr,
        items,
        approvals,
      });
    } catch (error) {
      console.error("Error fetching purchase requisition details:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
  }
);

// API แก้ไขใบขอซื้อ
app.put(
  "/api/purchase-requisitions/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const prId = req.params.id;
      const prData = req.body;

      // ตรวจสอบว่าใบขอซื้อมีอยู่จริง
      const [prs] = await pool.query(
        "SELECT * FROM purchase_requisitions WHERE id = ?",
        [prId]
      );

      if (prs.length === 0) {
        return res.status(404).json({ message: "ไม่พบใบขอซื้อที่ต้องการ" });
      }

      // อัปเดตข้อมูลใบขอซื้อ
      await pool.query(
        "UPDATE purchase_requisitions SET title = ?, description = ?, date = ?, department = ?, status = ? WHERE id = ?",
        [
          prData.title,
          prData.description,
          prData.date,
          prData.department,
          prData.status,
          prId,
        ]
      );

      // ลบรายการสินค้าเดิม
      await pool.query(
        "DELETE FROM purchase_requisition_items WHERE pr_id = ?",
        [prId]
      );

      // เพิ่มรายการสินค้าใหม่
      if (prData.items && prData.items.length > 0) {
        let totalAmount = 0;

        for (const item of prData.items) {
          const amount = item.quantity * item.unitPrice;
          totalAmount += amount;

          await pool.query(
            "INSERT INTO purchase_requisition_items (pr_id, item_name, quantity, unit, unit_price, amount) VALUES (?, ?, ?, ?, ?, ?)",
            [prId, item.name, item.quantity, item.unit, item.unitPrice, amount]
          );
        }

        // อัปเดตยอดรวม
        await pool.query(
          "UPDATE purchase_requisitions SET total_amount = ? WHERE id = ?",
          [totalAmount, prId]
        );
      }

      res.json({
        message: "อัปเดตใบขอซื้อเรียบร้อยแล้ว",
        id: prId,
      });
    } catch (error) {
      console.error("Error updating purchase requisition:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
  }
);

// API ส่งใบขอซื้อเพื่ออนุมัติ
app.post(
  "/api/purchase-requisitions/:id/submit",
  authenticateToken,
  async (req, res) => {
    try {
      const prId = req.params.id;

      // อัปเดตสถานะใบขอซื้อเป็น 'pending'
      await pool.query(
        "UPDATE purchase_requisitions SET status = ? WHERE id = ?",
        ["pending", prId]
      );

      res.json({
        message: "ส่งใบขอซื้อเพื่อขออนุมัติเรียบร้อยแล้ว",
        id: prId,
      });
    } catch (error) {
      console.error("Error submitting purchase requisition:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
  }
);

// API อนุมัติหรือปฏิเสธใบขอซื้อ
// แก้ไขเฉพาะส่วนของ API อนุมัติหรือปฏิเสธใบขอซื้อในไฟล์ server.js
app.post(
  "/api/purchase-requisitions/:id/approve",
  authenticateToken,
  async (req, res) => {
    try {
      const prId = req.params.id;
      const { status, comments } = req.body;

      // ตรวจสอบความถูกต้องของสถานะ
      if (status !== 'approved' && status !== 'rejected') {
        return res.status(400).json({ message: "สถานะไม่ถูกต้อง (ต้องเป็น approved หรือ rejected)" });
      }

      // ถ้าเป็นการปฏิเสธ (reject) ให้ทุก role สามารถทำได้ (อนุโลมให้ฝ่ายการเงินปฏิเสธได้)
      if (status === 'rejected') {
        // ตรวจสอบเหตุผลในการปฏิเสธ
        if (!comments || comments.trim() === '') {
          return res.status(400).json({ message: "กรุณาระบุเหตุผลในการปฏิเสธ" });
        }

        // บันทึกการปฏิเสธ
        await pool.query(
          "INSERT INTO purchase_requisition_approvals (pr_id, approved_by, status, comments) VALUES (?, ?, ?, ?)",
          [prId, req.user.id, status, comments]
        );

        // อัปเดตสถานะใบขอซื้อเป็น rejected
        await pool.query(
          "UPDATE purchase_requisitions SET status = ? WHERE id = ?",
          [status, prId]
        );

        return res.json({
          message: "ปฏิเสธคำขอเรียบร้อยแล้ว",
          id: prId,
        });
      } 
      
      // ถ้าเป็นการอนุมัติ ตรวจสอบสิทธิ์ตามปกติ (เฉพาะผู้บริหาร)
      if (req.user.role_id !== 1 && req.user.role_id !== 2) {
        return res
          .status(403)
          .json({ message: "คุณไม่มีสิทธิ์อนุมัติใบขอซื้อ" });
      }

      // สำหรับการอนุมัติ ตรวจสอบว่าคำขอได้รับการยืนยันจากฝ่ายการเงินแล้ว
      const [requisitions] = await pool.query(
        "SELECT status FROM purchase_requisitions WHERE id = ?",
        [prId]
      );

      if (requisitions.length === 0) {
        return res.status(404).json({ message: "ไม่พบคำขอที่ระบุ" });
      }

      const requisition = requisitions[0];
      if (requisition.status !== "confirmed") {
        return res.status(400).json({ 
          message: "คำขอนี้ยังไม่ได้รับการยืนยันจากฝ่ายการเงิน" 
        });
      }

      // บันทึกการอนุมัติ
      await pool.query(
        "INSERT INTO purchase_requisition_approvals (pr_id, approved_by, status, comments) VALUES (?, ?, ?, ?)",
        [prId, req.user.id, status, comments || ""]
      );

      // อัปเดตสถานะใบขอซื้อ
      await pool.query(
        "UPDATE purchase_requisitions SET status = ? WHERE id = ?",
        [status, prId]
      );

      res.json({
        message: "อนุมัติคำขอเรียบร้อยแล้ว",
        id: prId,
      });
    } catch (error) {
      console.error("Error processing purchase requisition:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
  }
);
// API ดึงข้อมูลผู้ขายทั้งหมด
app.get("/api/vendors", authenticateToken, async (req, res) => {
  try {
    // รับพารามิเตอร์การค้นหา
    const search = req.query.search || "";
    const status = req.query.status || "active";

    let query = "SELECT * FROM vendors WHERE status = ?";
    let params = [status];

    // เพิ่มเงื่อนไขการค้นหา
    if (search) {
      query +=
        " AND (name LIKE ? OR contact_name LIKE ? OR id LIKE ? OR phone LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += " ORDER BY name ASC";

    const [rows] = await pool.query(query, params);

    res.json(rows);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ขาย" });
  }
});

// API ดึงข้อมูลผู้ขายตาม ID
app.get("/api/vendors/:id", authenticateToken, async (req, res) => {
  try {
    const [vendors] = await pool.query("SELECT * FROM vendors WHERE id = ?", [
      req.params.id,
    ]);

    if (vendors.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ขาย" });
    }

    res.json(vendors[0]);
  } catch (error) {
    console.error("Error fetching vendor:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ขาย" });
  }
});

// เพิ่มฟังก์ชันจัดการผู้ขายใน server.js

// เพิ่มฟังก์ชันจัดการผู้ขายใน server.js

// API เพิ่มผู้ขายใหม่
app.post("/api/vendors", authenticateToken, async (req, res) => {
  try {
    const {
      name,
      contact_name,
      contact_position,
      phone,
      email,
      address,
      tax_id,
      business_type,
      payment_terms,
      notes,
    } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name || !contact_name || !phone) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    // สร้าง ID สำหรับผู้ขาย (V001, V002, ...)
    const [maxIdResult] = await pool.query(
      'SELECT MAX(id) as maxId FROM vendors WHERE id LIKE "V%"'
    );
    let nextId = "V001";

    if (maxIdResult[0].maxId) {
      const currentId = maxIdResult[0].maxId;
      const currentNumber = parseInt(currentId.substring(1));
      nextId = "V" + String(currentNumber + 1).padStart(3, "0");
    }

    // บันทึกข้อมูลผู้ขาย
    const [result] = await pool.query(
      `INSERT INTO vendors 
          (id, name, contact_name, contact_position, phone, email, 
          address, tax_id, business_type, payment_terms, notes, status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nextId,
        name,
        contact_name,
        contact_position || null,
        phone,
        email || null,
        address || null,
        tax_id || null,
        business_type || null,
        payment_terms || null,
        notes || null,
        "active",
      ]
    );

    res.status(201).json({
      message: "เพิ่มผู้ขายเรียบร้อยแล้ว",
      vendorId: nextId,
    });
  } catch (error) {
    console.error("Error creating vendor:", error);
    res.status(500).json({
      message: "เกิดข้อผิดพลาดในการเพิ่มผู้ขาย",
      error: error.message,
    });
  }
});

// ในไฟล์ server.js
app.get('/api/purchase-orders', authenticateToken, async (req, res) => {
  try {
    // รับพารามิเตอร์การกรอง (ถ้ามี)
    const { status, vendor_id, start_date, end_date } = req.query;
    
    let query = `
      SELECT po.*, v.name as vendor_name 
      FROM purchase_orders po
      LEFT JOIN vendors v ON po.vendor_id = v.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // เพิ่มเงื่อนไขการกรอง
    if (status) {
      query += ' AND po.status = ?';
      params.push(status);
    }
    
    if (vendor_id) {
      query += ' AND po.vendor_id = ?';
      params.push(vendor_id);
    }
    
    if (start_date) {
      query += ' AND po.date >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND po.date <= ?';
      params.push(end_date);
    }
    
    query += ' ORDER BY po.date DESC';
    
    if (dbConnected) {
      // ใช้ฐานข้อมูลจริง
      const [orders] = await pool.query(query, params);
      res.json(orders);
    } else {
      // ข้อมูลจำลองสำหรับการทดสอบ
      const mockOrders = [
        {
          id: "PO-1743716632987",
          po_number: "PO-2025-5034",
          pr_reference: null,
          date: "2025-04-03",
          vendor_id: "V002",
          title: "วัสดุสำนักงาน",
          notes: null,
          status: "pending",
          total_amount: 13500.00,
          payment_terms: "credit-30",
          delivery_date: "2025-04-10",
          delivery_location: "สำนักงานใหญ่",
          created_by: 3,
          created_at: "2025-04-03 21:43:52",
          updated_at: null,
          approved_by: null,
          approved_at: null,
          approval_notes: null,
          vendor_name: "บริษัท ออฟฟิศแมท จำกัด"
        },
        {
          id: "PO-1743716863520",
          po_number: "PO-2025-3871",
          pr_reference: null,
          date: "2025-04-03",
          vendor_id: "V003",
          title: "อุปกรณ์คอมพิวเตอร์",
          notes: null,
          status: "approved",
          total_amount: 45000.00,
          payment_terms: "credit-30",
          delivery_date: "2025-04-15",
          delivery_location: "สำนักงานใหญ่",
          created_by: 3,
          created_at: "2025-04-03 21:47:43",
          updated_at: null,
          approved_by: 2,
          approved_at: "2025-04-04 10:00:00",
          approval_notes: null,
          vendor_name: "บริษัท คอมเทค จำกัด"
        }
      ];
      
      // กรองข้อมูลจำลองตาม query parameters
      let filteredOrders = mockOrders;
      
      if (status) {
        filteredOrders = filteredOrders.filter(po => po.status === status);
      }
      
      if (vendor_id) {
        filteredOrders = filteredOrders.filter(po => po.vendor_id === vendor_id);
      }
      
      if (start_date) {
        filteredOrders = filteredOrders.filter(po => po.date >= start_date);
      }
      
      if (end_date) {
        filteredOrders = filteredOrders.filter(po => po.date <= end_date);
      }
      
      res.json(filteredOrders);
    }
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลใบสั่งซื้อ',
      error: error.message 
    });
  }
});
// ต่อจากโค้ดเดิม
app.put("/api/vendors/:id", authenticateToken, async (req, res) => {
  try {
    const vendorId = req.params.id;
    const {
      name,
      contact_name,
      contact_position,
      phone,
      email,
      address,
      tax_id,
      business_type,
      payment_terms,
      notes,
      status,
    } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name || !contact_name || !phone) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    if (dbConnected) {
      // อัปเดตข้อมูลผู้ขาย
      const [result] = await pool.query(
        `UPDATE vendors
            SET name = ?, contact_name = ?, contact_position = ?,
            phone = ?, email = ?, address = ?, tax_id = ?,
            business_type = ?, payment_terms = ?, notes = ?,
            status = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
        [
          name,
          contact_name,
          contact_position || null,
          phone,
          email || null,
          address || null,
          tax_id || null,
          business_type || null,
          payment_terms || null,
          notes || null,
          status || "active",
          req.user.username,
          vendorId,
        ]
      );

      // ตรวจสอบว่ามีการอัปเดตหรือไม่
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "ไม่พบผู้ขายที่ต้องการแก้ไข" });
      }

      res.json({
        message: "แก้ไขข้อมูลผู้ขายเรียบร้อยแล้ว",
        vendorId: vendorId,
      });
    } else {
      // ถ้าไม่มีการเชื่อมต่อฐานข้อมูล ส่งข้อความแจ้งเตือน
      res.status(503).json({ message: "ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้" });
    }
  } catch (error) {
    console.error("Error updating vendor:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้ขาย" });
  }
});

// API ลบผู้ขาย (Soft Delete)
app.delete("/api/vendors/:id", authenticateToken, async (req, res) => {
  try {
    const vendorId = req.params.id;

    if (dbConnected) {
      // ตรวจสอบว่ามีผู้ขายที่ต้องการลบหรือไม่
      const [vendors] = await pool.query("SELECT * FROM vendors WHERE id = ?", [
        vendorId,
      ]);

      if (vendors.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลผู้ขาย" });
      }

      // ลบแบบ soft delete (เปลี่ยนสถานะเป็น 'inactive')
      await pool.query(
        "UPDATE vendors SET status = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        ["inactive", req.user.username, vendorId]
      );

      res.json({
        message: "ลบผู้ขายเรียบร้อยแล้ว",
        vendorId: vendorId,
      });
    } else {
      // ถ้าไม่มีการเชื่อมต่อฐานข้อมูล ส่งข้อความแจ้งเตือน
      res.status(503).json({ message: "ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้" });
    }
  } catch (error) {
    console.error("Error deleting vendor:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบผู้ขาย" });
  }
});

// API ดึงข้อมูลผู้ขายทั้งหมด
app.get("/api/vendors", authenticateToken, async (req, res) => {
  try {
    // รับพารามิเตอร์การค้นหา
    const search = req.query.search || "";
    const status = req.query.status || "active";

    let query = "SELECT * FROM vendors WHERE status = ?";
    let params = [status];

    // เพิ่มเงื่อนไขการค้นหา
    if (search) {
      query +=
        " AND (name LIKE ? OR contact_name LIKE ? OR id LIKE ? OR phone LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += " ORDER BY name ASC";

    const [rows] = await pool.query(query, params);

    res.json(rows);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ขาย" });
  }
});

// API ดึงข้อมูลผู้ขายตาม ID
app.get("/api/vendors/:id", authenticateToken, async (req, res) => {
  try {
    const [vendors] = await pool.query("SELECT * FROM vendors WHERE id = ?", [
      req.params.id,
    ]);

    if (vendors.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ขาย" });
    }

    res.json(vendors[0]);
  } catch (error) {
    console.error("Error fetching vendor:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ขาย" });
  }
});

// API ดึงประเภทธุรกิจทั้งหมด
app.get("/api/vendor-business-types", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM vendor_business_types ORDER BY name ASC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching vendor business types:", error);
    res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลประเภทธุรกิจ" });
  }
});

// ใน server.js เพิ่ม API นี้
app.get(
  "/api/purchase-requisitions/approved",
  authenticateToken,
  async (req, res) => {
    try {
      const [requisitions] = await pool.query(
        `SELECT pr.id, pr.title, pr.department, pr.requested_by, pr.date, pr.total_amount 
       FROM purchase_requisitions pr 
       WHERE pr.status = 'approved' 
       ORDER BY pr.date DESC`
      );
      res.json(requisitions);
    } catch (error) {
      console.error("Error fetching approved requisitions:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลใบขอซื้อ" });
    }
  }
);

app.get(
  "/api/purchase-requisitions/:id/items",
  authenticateToken,
  async (req, res) => {
    try {
      const [items] = await pool.query(
        `SELECT item_name as name, quantity, unit, unit_price, amount 
       FROM purchase_requisition_items 
       WHERE pr_id = ?`,
        [req.params.id]
      );
      res.json(items);
    } catch (error) {
      console.error("Error fetching requisition items:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงรายการสินค้า" });
    }
  }
);

// เพิ่มใน server.js
app.get(
  "/api/purchase-requisitions/approved",
  authenticateToken,
  async (req, res) => {
    try {
      const [requisitions] = await pool.query(
        `SELECT pr.id, pr.title, pr.department, pr.requested_by, pr.date, pr.total_amount 
       FROM purchase_requisitions pr 
       WHERE pr.status = 'approved' 
       ORDER BY pr.date DESC`
      );
      res.json(requisitions);
    } catch (error) {
      console.error("Error fetching approved requisitions:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลใบขอซื้อ" });
    }
  }
);

// เพิ่มใน server.js
app.post(
  "/api/purchase-requisition-approvals",
  authenticateToken,
  async (req, res) => {
    try {
      const { pr_id, approved_by, STATUS, comments, approved_at } = req.body;

      // ตรวจสอบข้อมูลที่จำเป็น
      if (!pr_id || !approved_by || !STATUS) {
        return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
      }

      // บันทึกข้อมูลการอนุมัติ
      const [result] = await pool.query(
        `INSERT INTO purchase_requisition_approvals 
      (pr_id, approved_by, STATUS, comments, approved_at) 
      VALUES (?, ?, ?, ?, ?)`,
        [
          pr_id,
          approved_by,
          STATUS,
          comments || null,
          approved_at || new Date().toISOString(),
        ]
      );

      // อัพเดตสถานะใบขอซื้อเป็น approved
      await pool.query(
        `UPDATE purchase_requisitions SET status = ? WHERE id = ?`,
        ["approved", pr_id]
      );

      res.status(201).json({
        message: "บันทึกข้อมูลการอนุมัติเรียบร้อยแล้ว",
        id: result.insertId,
      });
    } catch (error) {
      console.error("Error creating approval:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
  }
);

// เพิ่มใน server.js
// ในไฟล์ server.js
// API สำหรับสร้างใบสั่งซื้อ

// เพิ่มใน server.js
app.get('/api/check-db-connection', async (req, res) => {
  try {
    const [result] = await pool.query('SELECT 1 as test');
    res.json({ connected: true, result });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ connected: false, error: error.message });
  }
});
// API Endpoints สำหรับการจัดการสินค้าคงคลัง
// เพิ่มโค้ดต่อไปนี้ในไฟล์ server.js

// API ดึงข้อมูลสินค้าคงคลังทั้งหมด
app.get('/api/inventory/items', authenticateToken, async (req, res) => {
  try {
    const search = req.query.search || '';
    const category = req.query.category || '';
    
    let query = `
      SELECT i.*, c.name as category_name 
      FROM inventory_items i
      LEFT JOIN item_categories c ON i.category = c.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (search) {
      query += ' AND (i.name LIKE ? OR i.id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (category) {
      query += ' AND i.category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY i.name ASC';
    
    if (dbConnected) {
      const [items] = await pool.query(query, params);
      res.json(items);
    } else {
      // ส่งข้อมูลจำลอง (mock data)
      const mockItems = [
        {
          id: "ITM001",
          name: "กระดาษ A4",
          category: "วัสดุสำนักงาน",
          unit: "รีม",
          unit_price: 120.0,
          in_stock: 45,
          min_stock: 20,
          max_stock: 100,
          notes: ""
        },
        {
          id: "ITM002",
          name: "หมึกพิมพ์ HP 680",
          category: "อุปกรณ์คอมพิวเตอร์",
          unit: "กล่อง",
          unit_price: 650.0,
          in_stock: 12,
          min_stock: 10,
          max_stock: 30,
          notes: ""
        },
        {
          id: "ITM003",
          name: "แฟ้มเอกสาร",
          category: "วัสดุสำนักงาน",
          unit: "แพ็ค",
          unit_price: 180.0,
          in_stock: 25,
          min_stock: 15,
          max_stock: 50,
          notes: ""
        },
        {
          id: "ITM004",
          name: "ปากกาลูกลื่น",
          category: "เครื่องเขียน",
          unit: "กล่อง",
          unit_price: 120.0,
          in_stock: 18,
          min_stock: 20,
          max_stock: 60,
          notes: ""
        },
        {
          id: "ITM005",
          name: "แท็บเล็ต Samsung",
          category: "อุปกรณ์อิเล็กทรอนิกส์",
          unit: "เครื่อง",
          unit_price: 12500.0,
          in_stock: 3,
          min_stock: 2,
          max_stock: 5,
          notes: ""
        }
      ];
      res.json(mockItems);
    }
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า' });
  }
});

// API เพิ่มสินค้าใหม่
app.post('/api/inventory/items', authenticateToken, async (req, res) => {
  try {
    const { 
      name, 
      category, 
      unit, 
      unit_price, 
      in_stock, 
      min_stock, 
      max_stock, 
      notes 
    } = req.body;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name || !category || !unit) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    
    if (dbConnected) {
      // สร้าง ID สำหรับสินค้า
      const [maxIdResult] = await pool.query(
        'SELECT MAX(id) as maxId FROM inventory_items WHERE id LIKE "ITM%"'
      );
      
      let nextId = 'ITM001';
      if (maxIdResult[0].maxId) {
        const currentId = maxIdResult[0].maxId;
        const currentNumber = parseInt(currentId.substring(3));
        nextId = 'ITM' + String(currentNumber + 1).padStart(3, '0');
      }
      
      // บันทึกข้อมูลสินค้า
      const [result] = await pool.query(
        `INSERT INTO inventory_items 
        (id, name, category, unit, unit_price, in_stock, min_stock, max_stock, notes, created_at, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
        [
          nextId, 
          name, 
          category, 
          unit, 
          unit_price || 0, 
          in_stock || 0, 
          min_stock || 0, 
          max_stock || 0, 
          notes || null,
          req.user.id
        ]
      );
      
      res.status(201).json({
        message: 'เพิ่มสินค้าเรียบร้อยแล้ว',
        itemId: nextId
      });
    } else {
      // สำหรับ mock data
      res.status(201).json({
        message: 'เพิ่มสินค้าเรียบร้อยแล้ว',
        itemId: 'ITM' + Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      });
    }
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มสินค้า' });
  }
});

// API แก้ไขสินค้า
app.put('/api/inventory/items/:id', authenticateToken, async (req, res) => {
  try {
    const itemId = req.params.id;
    const { 
      name, 
      category, 
      unit, 
      unit_price, 
      in_stock, 
      min_stock, 
      max_stock, 
      notes 
    } = req.body;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name || !category || !unit) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    
    if (dbConnected) {
      // อัปเดตข้อมูลสินค้า
      const [result] = await pool.query(
        `UPDATE inventory_items 
        SET name = ?, category = ?, unit = ?, unit_price = ?, 
            in_stock = ?, min_stock = ?, max_stock = ?, notes = ?,
            updated_at = NOW(), updated_by = ?
        WHERE id = ?`,
        [
          name, 
          category, 
          unit, 
          unit_price || 0, 
          in_stock || 0, 
          min_stock || 0, 
          max_stock || 0, 
          notes || null,
          req.user.id,
          itemId
        ]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'ไม่พบสินค้าที่ต้องการแก้ไข' });
      }
      
      res.json({
        message: 'แก้ไขสินค้าเรียบร้อยแล้ว',
        itemId: itemId
      });
    } else {
      // สำหรับ mock data
      res.json({
        message: 'แก้ไขสินค้าเรียบร้อยแล้ว',
        itemId: itemId
      });
    }
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขสินค้า' });
  }
});

// API ลบสินค้า
app.delete('/api/inventory/items/:id', authenticateToken, async (req, res) => {
  try {
    const itemId = req.params.id;
    
    if (dbConnected) {
      // ตรวจสอบว่ามีการใช้สินค้านี้ในรายการอื่นหรือไม่
      const [checkUsage] = await pool.query(
        `SELECT 
          (SELECT COUNT(*) FROM inventory_receipt_items WHERE item_id = ?) +
          (SELECT COUNT(*) FROM purchase_requisition_items WHERE item_id = ?) as total_usage`,
        [itemId, itemId]
      );
      
      if (checkUsage[0].total_usage > 0) {
        return res.status(400).json({ 
          message: 'ไม่สามารถลบสินค้านี้ได้เนื่องจากมีการใช้งานในระบบ' 
        });
      }
      
      // ลบสินค้า
      const [result] = await pool.query(
        'DELETE FROM inventory_items WHERE id = ?',
        [itemId]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'ไม่พบสินค้าที่ต้องการลบ' });
      }
      
      res.json({
        message: 'ลบสินค้าเรียบร้อยแล้ว',
        itemId: itemId
      });
    } else {
      // สำหรับ mock data
      res.json({
        message: 'ลบสินค้าเรียบร้อยแล้ว',
        itemId: itemId
      });
    }
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบสินค้า' });
  }
});

// API ดึงหมวดหมู่สินค้า
app.get('/api/inventory/categories', authenticateToken, async (req, res) => {
  try {
    if (dbConnected) {
      const [categories] = await pool.query('SELECT * FROM item_categories ORDER BY name ASC');
      res.json(categories);
    } else {
      // ส่งข้อมูลจำลอง
      const mockCategories = [
        { id: 1, name: "วัสดุสำนักงาน", description: "อุปกรณ์และวัสดุที่ใช้ในสำนักงานทั่วไป" },
        { id: 2, name: "เครื่องเขียน", description: "อุปกรณ์สำหรับการเขียนและงานเอกสาร" },
        { id: 3, name: "อุปกรณ์คอมพิวเตอร์", description: "ฮาร์ดแวร์และอะไหล่คอมพิวเตอร์" },
        { id: 4, name: "อุปกรณ์อิเล็กทรอนิกส์", description: "อุปกรณ์ไฟฟ้าและอิเล็กทรอนิกส์" },
        { id: 5, name: "เฟอร์นิเจอร์", description: "เฟอร์นิเจอร์และอุปกรณ์ตกแต่ง" },
        { id: 6, name: "อื่นๆ", description: "สินค้าประเภทอื่นๆ" }
      ];
      res.json(mockCategories);
    }
  } catch (error) {
    console.error('Error fetching inventory categories:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงหมวดหมู่สินค้า' });
  }
});

// API สร้างใบรับสินค้าใหม่
app.post('/api/inventory/receipts', authenticateToken, async (req, res) => {
  try {
    const { receipt_date, supplier_name, po_reference, notes, items } = req.body;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!receipt_date || !items || items.length === 0) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    if (dbConnected) {
      // เริ่ม Transaction
      const connection = await pool.getConnection();
      
      try {
        await connection.beginTransaction();
        
        // สร้าง ID สำหรับใบรับสินค้า
        const year = new Date(receipt_date).getFullYear();
        const [maxIdResult] = await connection.query(
          'SELECT MAX(id) as maxId FROM inventory_receipts WHERE id LIKE ?',
          [`RCV-${year}-%`]
        );
        
        let nextId = `RCV-${year}-0001`;
        
        if (maxIdResult[0].maxId) {
          const currentId = maxIdResult[0].maxId;
          const currentNumber = parseInt(currentId.split('-')[2]);
          nextId = `RCV-${year}-${String(currentNumber + 1).padStart(4, '0')}`;
        }
        
        // บันทึกข้อมูลใบรับสินค้า
        await connection.query(
          `INSERT INTO inventory_receipts 
            (id, receipt_date, supplier_name, po_reference, notes, status, created_by, created_at) 
            VALUES (?, ?, ?, ?, ?, 'pending', ?, NOW())`,
          [
            nextId,
            receipt_date,
            supplier_name || null,
            po_reference || null,
            notes || null,
            req.user.id
          ]
        );
        
        // บันทึกรายการสินค้าที่รับเข้า
        for (const item of items) {
          // ตรวจสอบว่ามีสินค้านั้นในระบบหรือไม่
          const [existingItems] = await connection.query(
            'SELECT * FROM inventory_items WHERE id = ?',
            [item.item_id]
          );
          
          if (existingItems.length === 0) {
            throw new Error(`ไม่พบสินค้ารหัส ${item.item_id} ในระบบ`);
          }
          
          // บันทึกรายการสินค้าที่รับเข้า
          await connection.query(
            `INSERT INTO inventory_receipt_items 
              (receipt_id, item_id, quantity, unit_price) 
              VALUES (?, ?, ?, ?)`,
            [
              nextId,
              item.item_id,
              item.quantity,
              item.unit_price
            ]
          );
        }
        
        // Commit Transaction
        await connection.commit();
        
        res.status(201).json({
          message: 'บันทึกรายการรับสินค้าเรียบร้อยแล้ว (รอการอนุมัติ)',
          receiptId: nextId
        });
      } catch (error) {
        // Rollback ถ้าเกิดข้อผิดพลาด
        await connection.rollback();
        throw error;
      } finally {
        // คืน connection กลับสู่ pool
        connection.release();
      }
    } else {
      // สำหรับ mock data
      const receiptId = `RCV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      res.status(201).json({
        message: 'บันทึกรายการรับสินค้าเรียบร้อยแล้ว (รอการอนุมัติ)',
        receiptId: receiptId
      });
    }
  } catch (error) {
    console.error('Error creating inventory receipt:', error);
    res.status(500).json({ 
      message: 'เกิดข้อผิดพลาดในการบันทึกรายการรับสินค้า',
      error: error.message
    });
  }
});

// API ดึงรายการใบรับสินค้าทั้งหมด
app.get('/api/inventory/receipts', authenticateToken, async (req, res) => {
  try {
    const status = req.query.status; // กรองตามสถานะ (pending, approved, rejected)
    
    if (dbConnected) {
      let query = `
        SELECT r.*, 
               u1.username as created_by_name, 
               u2.username as approved_by_name 
        FROM inventory_receipts r 
        LEFT JOIN users u1 ON r.created_by = u1.id 
        LEFT JOIN users u2 ON r.approved_by = u2.id
      `;
      
      const params = [];
      
      if (status) {
        query += ' WHERE r.status = ?';
        params.push(status);
      }
      
      query += ' ORDER BY r.created_at DESC';
      
      const [receipts] = await pool.query(query, params);
      res.json(receipts);
    } else {
      
      // กรองตามสถานะถ้ามีการระบุ
      let filteredReceipts = mockReceipts;
      if (status) {
        filteredReceipts = mockReceipts.filter(receipt => receipt.status === status);
      }
      
      res.json(filteredReceipts);
    }
  } catch (error) {
    console.error('Error fetching inventory receipts:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายการรับสินค้า' });
  }
});

// API ดึงข้อมูลรายละเอียดใบรับสินค้า
app.get('/api/inventory/receipts/:id', authenticateToken, async (req, res) => {
  try {
    const receiptId = req.params.id;
    
    if (dbConnected) {
      // ดึงข้อมูลใบรับสินค้า
      const [receipts] = await pool.query(
        `SELECT r.*, 
                u1.username as created_by_name, 
                u2.username as approved_by_name 
         FROM inventory_receipts r 
         LEFT JOIN users u1 ON r.created_by = u1.id 
         LEFT JOIN users u2 ON r.approved_by = u2.id 
         WHERE r.id = ?`,
        [receiptId]
      );
      
      if (receipts.length === 0) {
        return res.status(404).json({ message: 'ไม่พบรายการรับสินค้า' });
      }
      
      // ดึงรายการสินค้า
      const [items] = await pool.query(
        `SELECT ri.*, i.name as item_name, i.unit 
         FROM inventory_receipt_items ri 
         JOIN inventory_items i ON ri.item_id = i.id 
         WHERE ri.receipt_id = ?`,
        [receiptId]
      );
      
      res.json({
        ...receipts[0],
        items: items
      });
    } else {
      // ข้อมูลจำลอง
      const receipt = {
        id: receiptId,
        receipt_date: '2024-04-01',
        supplier_name: 'บริษัท คอมเทค จำกัด',
        po_reference: 'PO-2024-0042',
        notes: 'อุปกรณ์สำนักงานประจำเดือน',
        status: 'pending',
        created_by: 3,
        created_by_name: 'procurement@example.com',
        created_at: '2024-04-01T08:00:00Z',
        approved_by: null,
        approved_by_name: null,
        approved_at: null,
        approval_notes: null,
        items: [
          {
            id: 1,
            receipt_id: receiptId,
            item_id: 'ITM001',
            item_name: 'กระดาษ A4',
            quantity: 10,
            unit_price: 120,
            unit: 'รีม'
          },
          {
            id: 2,
            receipt_id: receiptId,
            item_id: 'ITM003',
            item_name: 'แฟ้มเอกสาร',
            quantity: 20,
            unit_price: 180,
            unit: 'แพ็ค'
          }
        ]
      };
      
      res.json(receipt);
    }
  } catch (error) {
    console.error('Error fetching receipt details:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายละเอียดการรับสินค้า' });
  }
});

// API อนุมัติหรือปฏิเสธใบรับสินค้า
app.post('/api/inventory/receipts/:id/approve', authenticateToken, async (req, res) => {
  try {
    const receiptId = req.params.id;
    const { status, notes } = req.body; // status: approved, rejected
    
    // ตรวจสอบสิทธิ์ (เฉพาะ admin และ manager เท่านั้นที่อนุมัติได้)
    if (req.user.role_id !== 1 && req.user.role_id !== 2) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์อนุมัติรายการรับสินค้า' });
    }
    
    // ตรวจสอบความถูกต้องของสถานะ
    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ message: 'สถานะไม่ถูกต้อง (ต้องเป็น approved หรือ rejected)' });
    }
    
    if (dbConnected) {
      // เริ่ม Transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      try {
        // ตรวจสอบว่ามีใบรับสินค้านี้หรือไม่
        const [receipts] = await connection.query(
          'SELECT * FROM inventory_receipts WHERE id = ?',
          [receiptId]
        );
        
        if (receipts.length === 0) {
          throw new Error('ไม่พบรายการรับสินค้า');
        }
        
        const receipt = receipts[0];
        
        // ตรวจสอบว่าใบรับสินค้านี้อยู่ในสถานะ pending หรือไม่
        if (receipt.status !== 'pending') {
          throw new Error('รายการรับสินค้านี้ได้รับการอนุมัติหรือปฏิเสธไปแล้ว');
        }
        
        // อัปเดตสถานะและข้อมูลการอนุมัติ
        await connection.query(
          `UPDATE inventory_receipts 
           SET status = ?, approval_notes = ?, approved_by = ?, approved_at = NOW() 
           WHERE id = ?`,
          [status, notes || null, req.user.id, receiptId]
        );
        
        // ถ้าสถานะเป็น approved ให้อัปเดตสินค้าคงคลัง
        if (status === 'approved') {
          // ดึงรายการสินค้า
          const [items] = await connection.query(
            'SELECT * FROM inventory_receipt_items WHERE receipt_id = ?',
            [receiptId]
          );
          
          // อัปเดตสินค้าคงคลัง
          for (const item of items) {
            // ดึงข้อมูลสินค้าปัจจุบัน
            const [existingItems] = await connection.query(
              'SELECT * FROM inventory_items WHERE id = ?',
              [item.item_id]
            );
            
            if (existingItems.length === 0) {
              throw new Error(`ไม่พบสินค้ารหัส ${item.item_id} ในระบบ`);
            }
            
            const existingItem = existingItems[0];
            const newStock = existingItem.in_stock + item.quantity;
            
            // อัปเดตจำนวนสินค้าและราคา
            await connection.query(
              'UPDATE inventory_items SET in_stock = ?, unit_price = ?, updated_at = NOW(), updated_by = ? WHERE id = ?',
              [newStock, item.unit_price, req.user.id, item.item_id]
            );
          }
        }
        
        // Commit Transaction
        await connection.commit();
        
        res.json({
          message: status === 'approved' 
            ? 'อนุมัติรายการรับสินค้าเรียบร้อยแล้ว' 
            : 'ปฏิเสธรายการรับสินค้าเรียบร้อยแล้ว',
          receiptId: receiptId
        });
      } catch (error) {
        // Rollback ถ้าเกิดข้อผิดพลาด
        await connection.rollback();
        throw error;
      } finally {
        // คืน connection กลับสู่ pool
        connection.release();
      }
    } else {
      // สำหรับ mock data
      const responseMessage = status === 'approved' 
        ? 'อนุมัติรายการรับสินค้าเรียบร้อยแล้ว' 
        : 'ปฏิเสธรายการรับสินค้าเรียบร้อยแล้ว';
        
      res.json({
        message: responseMessage,
        receiptId: receiptId
      });
    }
  } catch (error) {
    console.error('Error approving inventory receipt:', error);
    res.status(500).json({ 
      message: 'เกิดข้อผิดพลาดในการอนุมัติรายการรับสินค้า',
      error: error.message 
    });
  }
});
// API เบิกสินค้าอย่างง่าย (เพียงลดจำนวนในคลัง)
// แทนที่ API เบิกสินค้าเดิมด้วยโค้ดนี้


// API เบิกสินค้า (อัปเดตจำนวนในคลัง)
// แทนที่ API เบิกสินค้าเดิมทั้งหมดด้วยฟังก์ชันนี้
// API เบิกสินค้า (ปรับปรุงให้สมบูรณ์)
app.post('/api/inventory/issue', authenticateToken, async (req, res) => {
  try {
    const { items, requester_name, department, notes } = req.body;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'กรุณาระบุรายการสินค้าที่ต้องการเบิก' });
    }

    if (!requester_name) {
      return res.status(400).json({ message: 'กรุณาระบุชื่อผู้เบิก' });
    }
    
    // เริ่ม Transaction
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // สร้าง ID สำหรับใบเบิกสินค้า
      const year = new Date().getFullYear();
      const [maxIdResult] = await connection.query(
        'SELECT MAX(id) as maxId FROM inventory_issues WHERE id LIKE ?',
        [`ISS-${year}-%`]
      );
      
      let issueId = `ISS-${year}-0001`;
      
      if (maxIdResult[0].maxId) {
        const currentId = maxIdResult[0].maxId;
        const currentNumber = parseInt(currentId.split('-')[2]);
        issueId = `ISS-${year}-${String(currentNumber + 1).padStart(4, '0')}`;
      }
      
      // บันทึกข้อมูลใบเบิกสินค้า
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await connection.query(
        `INSERT INTO inventory_issues 
          (id, issue_date, department, requester_name, notes, status, created_at) 
          VALUES (?, ?, ?, ?, ?, 'completed', ?)`,
        [
          issueId,
          now,
          department || 'ไม่ระบุ',
          requester_name,
          notes || null,
          now
        ]
      );
      
      // อัปเดตจำนวนสินค้าคงเหลือและบันทึกรายการเบิก
      for (const item of items) {
        // ตรวจสอบรหัสสินค้าและจำนวน
        if (!item.item_id || !item.quantity) {
          await connection.rollback();
          return res.status(400).json({ message: 'กรุณาระบุรหัสสินค้าและจำนวน' });
        }
        
        // แปลงข้อมูลเป็นตัวเลข
        const quantity = parseInt(item.quantity);
        if (isNaN(quantity) || quantity <= 0) {
          await connection.rollback();
          return res.status(400).json({ message: 'จำนวนสินค้าต้องเป็นตัวเลขที่มากกว่า 0' });
        }
        
        // ตรวจสอบว่ามีสินค้าในระบบ
        const [existingItems] = await connection.query(
          'SELECT * FROM inventory_items WHERE id = ?',
          [item.item_id]
        );
        
        if (existingItems.length === 0) {
          await connection.rollback();
          return res.status(404).json({ message: `ไม่พบสินค้ารหัส ${item.item_id} ในระบบ` });
        }
        
        const existingItem = existingItems[0];
        
        // ตรวจสอบว่ามีสินค้าเพียงพอ
        if (existingItem.in_stock < quantity) {
          await connection.rollback();
          return res.status(400).json({ 
            message: `สินค้า ${existingItem.name} มีไม่เพียงพอสำหรับการเบิก (มี ${existingItem.in_stock} ${existingItem.unit})` 
          });
        }
        
        // บันทึกรายการสินค้าที่เบิก
        await connection.query(
          `INSERT INTO inventory_issue_items 
            (issue_id, item_id, quantity, unit_price) 
            VALUES (?, ?, ?, ?)`,
          [
            issueId,
            item.item_id,
            quantity,
            existingItem.unit_price
          ]
        );
        
        // อัปเดตจำนวนสินค้าคงเหลือ
        const newStock = existingItem.in_stock - quantity;
        await connection.query(
          'UPDATE inventory_items SET in_stock = ? WHERE id = ?',
          [newStock, item.item_id]
        );
      }
      
      // Commit Transaction
      await connection.commit();
      
      res.status(201).json({
        success: true,
        message: 'เบิกสินค้าเรียบร้อยแล้ว',
        issue_id: issueId
      });
    } catch (error) {
      // Rollback ถ้าเกิดข้อผิดพลาด
      await connection.rollback();
      throw error;
    } finally {
      // คืน connection กลับสู่ pool
      connection.release();
    }
  } catch (error) {
    console.error('Error issuing inventory:', error);
    res.status(500).json({ 
      success: false,
      message: 'เกิดข้อผิดพลาดในการเบิกสินค้า',
      error: error.message
    });
  }
});

// เพิ่มใน server.js
app.post('/direct-update-inventory', async (req, res) => {
  try {
    const { item_id, quantity } = req.body;
    
    if (!item_id || !quantity) {
      return res.status(400).json({ message: 'กรุณาระบุรหัสสินค้าและจำนวน' });
    }
    
    // อัปเดตจำนวนสินค้าในคลังโดยตรง
    const [result] = await pool.query(
      'UPDATE inventory_items SET in_stock = in_stock - ? WHERE id = ?',
      [quantity, item_id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบสินค้าที่ต้องการอัปเดต' });
    }
    
    res.json({ message: 'อัปเดตจำนวนสินค้าเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตสินค้า' });
  }
});

// API เบิกสินค้าอย่างง่าย (เพียงลดจำนวนในคลัง)
// แก้ไข API endpoint เบิกสินค้า
app.post('/api/inventory/simple-issue', authenticateToken, async (req, res) => {
  try {
    const { items } = req.body;
    
    console.log("Received data for simple issue:", req.body);
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'กรุณาระบุรายการสินค้าที่ต้องการเบิก' });
    }
    
    // เริ่ม Transaction
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // อัปเดตจำนวนสินค้าคงเหลือ
      for (const item of items) {
        console.log("Processing item:", item);
        
        if (!item.item_id || !item.quantity) {
          await connection.rollback();
          return res.status(400).json({ message: 'กรุณาระบุรหัสสินค้าและจำนวน' });
        }
        
        // ตรวจสอบมีสินค้าพอหรือไม่
        const [existingItems] = await connection.query(
          'SELECT * FROM inventory_items WHERE id = ?',
          [item.item_id]
        );
        
        console.log("Found items:", existingItems);
        
        if (existingItems.length === 0) {
          await connection.rollback();
          return res.status(404).json({ message: `ไม่พบสินค้ารหัส ${item.item_id} ในระบบ` });
        }
        
        const existingItem = existingItems[0];
        
        if (existingItem.in_stock < item.quantity) {
          await connection.rollback();
          return res.status(400).json({ 
            message: `สินค้า ${existingItem.name} มีไม่เพียงพอสำหรับการเบิก (มี ${existingItem.in_stock} ${existingItem.unit})` 
          });
        }
        
        // คำนวณจำนวนคงเหลือใหม่
        const newStock = existingItem.in_stock - item.quantity;
        console.log(`Updating stock: ${existingItem.id} from ${existingItem.in_stock} to ${newStock}`);
        
        // อัปเดตจำนวนสินค้าคงเหลือโดยตรง
        const [updateResult] = await connection.query(
          'UPDATE inventory_items SET in_stock = ? WHERE id = ?',
          [newStock, item.item_id]
        );
        
        console.log("Update result:", updateResult);
        
        if (updateResult.affectedRows === 0) {
          await connection.rollback();
          return res.status(500).json({ message: `ไม่สามารถอัปเดตสินค้ารหัส ${item.item_id}` });
        }
      }
      
      // Commit Transaction
      await connection.commit();
      console.log("Transaction committed successfully");
      
      res.json({ 
        success: true,
        message: 'เบิกสินค้าเรียบร้อยแล้ว'
      });
    } catch (error) {
      // Rollback ถ้าเกิดข้อผิดพลาด
      await connection.rollback();
      console.error("Transaction error, rolling back:", error);
      throw error;
    } finally {
      // คืน connection กลับสู่ pool
      connection.release();
    }
  } catch (error) {
    console.error('Error issuing inventory:', error);
    res.status(500).json({ 
      success: false,
      message: 'เกิดข้อผิดพลาดในการเบิกสินค้า',
      error: error.message
    });
  }
});


// เพิ่มใน server.js
app.post('/direct-update-inventory', async (req, res) => {
  try {
    const { item_id, quantity } = req.body;
    
    if (!item_id || !quantity) {
      return res.status(400).json({ message: 'กรุณาระบุรหัสสินค้าและจำนวน' });
    }
    
    // อัปเดตจำนวนสินค้าในคลังโดยตรง
    const [result] = await pool.query(
      'UPDATE inventory_items SET in_stock = in_stock - ? WHERE id = ?',
      [quantity, item_id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบสินค้าที่ต้องการอัปเดต' });
    }
    
    res.json({ message: 'อัปเดตจำนวนสินค้าเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตสินค้า' });
  }
});




// --------------------------------------------------------------
// เพิ่มใน server.js หลังส่วนกำหนดค่า Middleware
app.post('/api/logs', authenticateToken, async (req, res) => {
  try {
    const { role_id, username, action } = req.body;

    if (!role_id || !username || !action) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    if (dbConnected) {
      const [result] = await pool.query(
        'INSERT INTO logs (role_id, username, action) VALUES (?, ?, ?)',
        [role_id, username, action]
      );

      res.status(201).json({
        message: 'บันทึกข้อมูล log เรียบร้อยแล้ว',
        logId: result.insertId
      });
    } else {
      // สำหรับ mock data
      res.status(201).json({
        message: 'บันทึกข้อมูล log เรียบร้อยแล้ว (mock data)',
        logId: Math.floor(Math.random() * 1000)
      });
    }
  } catch (error) {
    console.error('Error creating log:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึก log' });
  }
});

// API สำหรับบันทึก log โดยตรง (ไม่ต้องการ authentication) - it's best
app.post('/direct-log', async (req, res) => {
  try {
    const { role_id, username, action } = req.body;
    console.log('Received direct log request:', { role_id, username, action });

    if (!role_id || !username || !action) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    if (dbConnected) {
      const [result] = await pool.query(
        'INSERT INTO logs (role_id, username, action) VALUES (?, ?, ?)',
        [role_id, username, action]
      );

      console.log('Direct log inserted successfully:', result.insertId);
      res.status(201).json({
        message: 'บันทึกข้อมูล log เรียบร้อยแล้ว',
        logId: result.insertId
      });
    } else {
      // สำหรับ mock data
      console.log('Direct log mock data created');
      res.status(201).json({
        message: 'บันทึกข้อมูล log เรียบร้อยแล้ว (mock data)',
        logId: Math.floor(Math.random() * 1000)
      });
    }
  } catch (error) {
    console.error('Error creating direct log:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึก log' });
  }
});


// เพิ่มใน server.js
app.get("/api/logs", authenticateToken, async (req, res) => {
  try {
    // ตรวจสอบสิทธิ์ (เฉพาะ admin เท่านั้นที่ดู logs ได้)
    if (req.user.role_id !== 1) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    if (dbConnected) {
      // ดึงข้อมูล logs พร้อม pagination
      const [logs] = await pool.query(
        `SELECT l.*, r.name as role_name 
         FROM logs l
         JOIN roles r ON l.role_id = r.id
         ORDER BY l.created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      // นับจำนวนทั้งหมดสำหรับ pagination
      const [total] = await pool.query("SELECT COUNT(*) as count FROM logs");
      
      res.json({
        logs,
        pagination: {
          total: total[0].count,
          page,
          limit,
          totalPages: Math.ceil(total[0].count / limit)
        }
      });
    } else {
      // สำหรับ mock data
      res.json({
        logs: [
          {
            id: 1,
            role_id: 1,
            username: "admin",
            action: "เข้าสู่ระบบ",
            created_at: new Date().toISOString(),
            role_name: "Admin"
          }
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1
        }
      });
    }
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล logs" });
  }
});



// API ดึงข้อมูลงบประมาณประจำปี
app.get('/api/annual-budgets', authenticateToken, async (req, res) => {
  try {
    if (dbConnected) {
      // ดึงข้อมูลงบประมาณประจำปีจากฐานข้อมูล
      const [budgets] = await pool.query(
        'SELECT fiscal_year, total_amount, capital_budget, operating_budget FROM annual_budgets ORDER BY fiscal_year DESC'
      );
      
      res.json(budgets);
    } else {
      // ข้อมูลจำลอง
      const mockBudgets = [
        {
          fiscal_year: 2024,
          total_amount: 15000000.00,
          capital_budget: 9000000.00,
          operating_budget: 6000000.00
        },
        {
          fiscal_year: 2023,
          total_amount: 14000000.00,
          capital_budget: 8000000.00,
          operating_budget: 6000000.00
        }
      ];
      
      res.json(mockBudgets);
    }
  } catch (error) {
    console.error('Error fetching annual budgets:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลงบประมาณ' });
  }
});

// API ดึงรายการงบประมาณ
app.get('/api/budget-transactions', authenticateToken, async (req, res) => {
  try {
    const { year, quarter } = req.query;
    
    if (dbConnected) {
      let query = `
        SELECT * FROM budget_transactions 
        WHERE budget_year = ?
      `;
      const queryParams = [year];
      
      // กรองตามไตรมาส
      if (quarter && quarter !== 'all') {
        // เพิ่มการกรองตามไตรมาส
        const quarterMap = {
          'Q1': ['01', '02', '03'],
          'Q2': ['04', '05', '06'],
          'Q3': ['07', '08', '09'],
          'Q4': ['10', '11', '12']
        };
        
        if (quarterMap[quarter]) {
          query += ` AND MONTH(transaction_date) IN (?)`;
          queryParams.push(quarterMap[quarter]);
        }
      }
      
      query += ' ORDER BY transaction_date DESC';
      
      const [transactions] = await pool.query(query, queryParams);
      
      res.json(transactions);
    } else {
      // ข้อมูลจำลอง
      const mockTransactions = [
        {
          transaction_date: '2024-04-01',
          budget_year: 2024,
          description: 'เฟอร์นิเจอร์สำนักงาน',
          amount: 45000.00,
          transaction_type: 'capital',
          department: 'procurement',
          status: 'approved'
        },
        {
          transaction_date: '2024-03-28',
          budget_year: 2024,
          description: 'อุปกรณ์คอมพิวเตอร์',
          amount: 85600.00,
          transaction_type: 'capital',
          department: 'it',
          status: 'approved'
        },
        {
          transaction_date: '2024-03-25',
          budget_year: 2024,
          description: 'อุปกรณ์สำนักงาน',
          amount: 18200.00,
          transaction_type: 'operating',
          department: 'procurement',
          status: 'approved'
        }
      ];
      
      // กรองตามไตรมาส
      const filteredTransactions = mockTransactions.filter(transaction => {
        const transactionYear = new Date(transaction.transaction_date).getFullYear();
        const transactionMonth = String(new Date(transaction.transaction_date).getMonth() + 1).padStart(2, '0');
        
        const yearMatch = transactionYear === parseInt(year);
        
        if (!quarter || quarter === 'all') return yearMatch;
        
        const quarterMap = {
          'Q1': ['01', '02', '03'],
          'Q2': ['04', '05', '06'],
          'Q3': ['07', '08', '09'],
          'Q4': ['10', '11', '12']
        };
        
        return yearMatch && quarterMap[quarter].includes(transactionMonth);
      });
      
      res.json(filteredTransactions);
    }
  } catch (error) {
    console.error('Error fetching budget transactions:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายการงบประมาณ' });
  }
});

// API ดึงรายการใบสั่งซื้อที่รอดำเนินการ
app.get("/api/purchase-orders/pending", authenticateToken, async (req, res) => {
  try {
    if (dbConnected) {
      const [orders] = await pool.query(
        `SELECT po.id, po.po_number, po.pr_reference, po.date, po.vendor_id, 
                po.title, po.status, po.total_amount, po.payment_terms,
                po.delivery_date, po.delivery_location, po.created_at
         FROM purchase_orders po 
         WHERE po.status = 'pending' 
         ORDER BY po.created_at DESC`
      );
      res.json(orders);
    } else {
      // ข้อมูลจำลอง
      const mockOrders = [
        {
          id: 'PO-1743716632987',
          po_number: 'PO-2025-5034',
          pr_reference: null,
          date: '2025-04-03',
          vendor_id: 'V002',
          title: 'ว้สดุสำนักงาน',
          status: 'pending',
          total_amount: 13.0,
          payment_terms: 'credit-30',
          delivery_date: '2025-04-10',
          delivery_location: 'สำนักงานใหญ่'
        },
        {
          id: 'PO-1743716863520',
          po_number: 'PO-2025-3871',
          pr_reference: null,
          date: '2025-04-03',
          vendor_id: 'V002',
          title: 'จัดซื้อเคมีภัณฑ์',
          status: 'pending',
          total_amount: 13.0,
          payment_terms: 'credit-30',
          delivery_date: '2025-04-10',
          delivery_location: 'สำนักงานใหญ่'
        }
      ];
      res.json(mockOrders);
    }
  } catch (error) {
    console.error("Error fetching pending purchase orders:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลใบสั่งซื้อ" });
  }
});


// API ดึงรายการใบสั่งซื้อทั้งหมด
// API ดึงรายการใบสั่งซื้อทั้งหมด
app.get("/api/purchase-orders", authenticateToken, async (req, res) => {
  try {
    if (dbConnected) {
      const [orders] = await pool.query(
        "SELECT * FROM purchase_orders ORDER BY created_at DESC"
      );
      res.json(orders);
    } else {
      // ข้อมูลจำลองจากตาราง purchase_orders ของคุณ
      const mockOrders = [
        {
            id: 'PO-1743716632987',
            po_number: 'PO-2025-5034',
            pr_reference: null,
            date: '2025-04-03',
            vendor_id: 'V002',
            title: 'ว้สดุสำนักงาน',
            status: 'pending',
            total_amount: 13.0,
            payment_terms: 'credit-30',
            delivery_date: '2025-04-10',
            delivery_location: 'สำนักงานใหญ่'
        },
        {
            id: 'PO-1743716863520',
            po_number: 'PO-2025-3871',
            pr_reference: null,
            date: '2025-04-03',
            vendor_id: 'V002',
            title: 'จัดซื้อเคมีภัณฑ์',
            status: 'pending',
            total_amount: 13.0,
            payment_terms: 'credit-30',
            delivery_date: '2025-04-10',
            delivery_location: 'สำนักงานใหญ่'
        }
      ];
      res.json(mockOrders);
    }
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลใบสั่งซื้อ" });
  }
});


app.post(
  "/api/purchase-requisitions/:id/confirm",
  authenticateToken,
  async (req, res) => {
    try {
      const prId = req.params.id;
      const { comments } = req.body;

      // ตรวจสอบว่าเป็นฝ่ายการเงิน (role_id 4)
      if (req.user.role_id !== 4) {
        return res
          .status(403)
          .json({ message: "เฉพาะฝ่ายการเงินเท่านั้นที่สามารถยืนยันคำขอได้" });
      }

      // ตรวจสอบสถานะปัจจุบันของคำขอ
      const [requisitions] = await pool.query(
        "SELECT status FROM purchase_requisitions WHERE id = ?",
        [prId]
      );

      if (requisitions.length === 0) {
        return res.status(404).json({ message: "ไม่พบคำขอที่ระบุ" });
      }

      const requisition = requisitions[0];
      if (requisition.status !== "pending") {
        return res.status(400).json({ 
          message: "คำขอนี้ไม่ได้อยู่ในสถานะรออนุมัติ" 
        });
      }

      // บันทึกการยืนยัน
      await pool.query(
        "INSERT INTO purchase_requisition_approvals (pr_id, approved_by, status, comments) VALUES (?, ?, ?, ?)",
        [prId, req.user.id, "confirmed", comments || "ยืนยันโดยฝ่ายการเงิน"]
      );

      // อัปเดตสถานะใบขอซื้อเป็น confirmed
      await pool.query(
        "UPDATE purchase_requisitions SET status = ? WHERE id = ?",
        ["confirmed", prId]
      );

      res.json({
        message: "ยืนยันคำขอเรียบร้อยแล้ว รอการอนุมัติจากผู้บริหาร",
        id: prId,
      });
    } catch (error) {
      console.error("Error confirming purchase requisition:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
  }
);

app.get('/api/purchase-orders', authenticateToken, async (req, res) => {
  try {
    const { status, vendor_id, start_date, end_date } = req.query;
    
    let query = `
      SELECT po.*, v.name as vendor_name 
      FROM purchase_orders po
      LEFT JOIN vendors v ON po.vendor_id = v.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (status) {
      query += ' AND po.status = ?';
      params.push(status);
    }
    
    if (vendor_id) {
      query += ' AND po.vendor_id = ?';
      params.push(vendor_id);
    }
    
    if (start_date) {
      query += ' AND po.date >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND po.date <= ?';
      params.push(end_date);
    }
    
    query += ' ORDER BY po.date DESC';
    
    if (dbConnected) {
      const [orders] = await pool.query(query, params);
      res.json(orders);
    } else {
      // ข้อมูลจำลองสำหรับการทดสอบ
      const mockOrders = [
        {
          id: "PO-1743716632987",
          po_number: "PO-2025-5034",
          pr_reference: null,
          date: "2025-04-03",
          vendor_id: "V002",
          title: "ำำดฟกไกหกไ",
          notes: null,
          status: "pending",
          total_amount: 13.00,
          payment_terms: "credit-30",
          delivery_date: "2025-04-10",
          delivery_location: "สำนักงานใหญ่",
          created_by: 3,
          created_at: "2025-04-03 21:43:52",
          updated_at: null,
          approved_by: null,
          approved_at: null,
          approval_notes: null,
          vendor_name: "บริษัท ออฟฟิศแมท จำกัด"
        },
        {
          id: "PO-1743716863520",
          po_number: "PO-2025-3871",
          pr_reference: null,
          date: "2025-04-03",
          vendor_id: "V002",
          title: "ำำดฟกไกหกไ",
          notes: null,
          status: "pending",
          total_amount: 13.00,
          payment_terms: "credit-30",
          delivery_date: "2025-04-10",
          delivery_location: "สำนักงานใหญ่",
          created_by: 3,
          created_at: "2025-04-03 21:47:43",
          updated_at: null,
          approved_by: null,
          approved_at: null,
          approval_notes: null,
          vendor_name: "บริษัท ออฟฟิศแมท จำกัด"
        },
        {
          id: "PO-1743718690720",
          po_number: "PO-2025-1329",
          pr_reference: null,
          date: "2025-04-03",
          vendor_id: "V002",
          title: "ำำดฟกไกหกไ",
          notes: "i want",
          status: "pending",
          total_amount: 13.00,
          payment_terms: "credit-30",
          delivery_date: "2025-04-10",
          delivery_location: "สำนักงานใหญ่",
          created_by: 3,
          created_at: "2025-04-03 22:18:10",
          updated_at: null,
          approved_by: null,
          approved_at: null,
          approval_notes: null,
          vendor_name: "บริษัท ออฟฟิศแมท จำกัด"
        }
      ];
      
      // กรองข้อมูลจำลองตาม query parameters
      let filteredOrders = mockOrders;
      
      if (status) {
        filteredOrders = filteredOrders.filter(po => po.status === status);
      }
      
      if (vendor_id) {
        filteredOrders = filteredOrders.filter(po => po.vendor_id === vendor_id);
      }
      
      if (start_date) {
        filteredOrders = filteredOrders.filter(po => po.date >= start_date);
      }
      
      if (end_date) {
        filteredOrders = filteredOrders.filter(po => po.date <= end_date);
      }
      
      res.json(filteredOrders);
    }
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลใบสั่งซื้อ' });
  }
});

// API อัปเดตสถานะการชำระเงินใบสั่งซื้อ
app.post('/api/purchase-orders/:id/pay', authenticateToken, async (req, res) => {
  try {
    const poId = req.params.id;
    const { paid, paid_by, paid_at } = req.body;

    if (dbConnected) {
      // อัปเดตสถานะใบสั่งซื้อเป็น 'completed' (ชำระแล้ว)
      await pool.query(
        'UPDATE purchase_orders SET status = ?, approved_by = ?, approved_at = ? WHERE id = ?',
        ['completed', paid_by, paid_at || new Date(), poId]
      );

      res.json({
        message: 'อัปเดตสถานะการชำระเงินเรียบร้อยแล้ว',
        poId: poId
      });
    } else {
      // สำหรับข้อมูลจำลอง
      res.json({
        message: 'อัปเดตสถานะการชำระเงินเรียบร้อยแล้ว (ข้อมูลจำลอง)',
        poId: poId
      });
    }
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะการชำระเงิน' });
  }
});
// API ดึงรายการสินค้าของใบสั่งซื้อ
app.get('/api/purchase-orders/:id/items', authenticateToken, async (req, res) => {
  try {
    const poId = req.params.id;
    
    if (dbConnected) {
      const [items] = await pool.query(
        `SELECT item_name, quantity, unit_price, amount 
         FROM purchase_order_items 
         WHERE po_id = ?`,
        [poId]
      );
      res.json(items);
    } else {
      // ข้อมูลจำลอง
      const mockItems = [
        {
          item_name: "กระดาษ A4",
          quantity: 10,
          unit_price: 1200,
          amount: 12000
        },
        {
          item_name: "ปากกา",
          quantity: 50,
          unit_price: 30,
          amount: 1500
        }
      ];
      res.json(mockItems);
    }
  } catch (error) {
    console.error('Error fetching PO items:', error);
    res.status(500).json({ 
      message: 'เกิดข้อผิดพลาดในการดึงรายการสินค้า',
      error: error.message 
    });
  }
});
// API ดึงข้อมูลใบสั่งซื้อเฉพาะ
app.get('/api/purchase-orders/:id', authenticateToken, async (req, res) => {
  try {
    const poId = req.params.id;
    
    let query = `
      SELECT po.*, v.name as vendor_name 
      FROM purchase_orders po
      LEFT JOIN vendors v ON po.vendor_id = v.id
      WHERE po.id = ? OR po.po_number = ?
    `;
    
    if (dbConnected) {
      const [orders] = await pool.query(query, [poId, poId]);
      
      if (orders.length === 0) {
        return res.status(404).json({ message: 'ไม่พบใบสั่งซื้อ' });
      }
      
      res.json(orders[0]);
    } else {
      // ข้อมูลจำลอง
      const mockOrders = {
        "PO-2025-5034": {
          id: "PO-1743716632987",
          po_number: "PO-2025-5034",
          pr_reference: null,
          date: "2025-04-03",
          vendor_id: "V002",
          title: "วัสดุสำนักงาน",
          notes: null,
          status: "pending",
          total_amount: 13500.00,
          payment_terms: "credit-30",
          delivery_date: "2025-04-10",
          delivery_location: "สำนักงานใหญ่",
          created_by: 3,
          created_at: "2025-04-03 21:43:52",
          updated_at: null,
          approved_by: null,
          approved_at: null,
          approval_notes: null,
          vendor_name: "บริษัท ออฟฟิศแมท จำกัด"
        }
      };
      
      const order = mockOrders[poId] || {
        id: poId,
        po_number: poId,
        date: new Date().toISOString().split('T')[0],
        vendor_id: "V001",
        title: "ใบสั่งซื้อทดสอบ",
        status: "pending",
        total_amount: 0,
        vendor_name: "ผู้ขายทดสอบ"
      };
      
      res.json(order);
    }
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({ 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลใบสั่งซื้อ',
      error: error.message 
    });
  }
});
// API อัปเดตสถานะการชำระเงินใบสั่งซื้อ
app.post('/api/purchase-orders/:id/pay', authenticateToken, async (req, res) => {
  try {
    const poId = req.params.id;
    const { paid_by } = req.body;

    if (dbConnected) {
      // อัปเดตสถานะใบสั่งซื้อเป็น 'completed' (ชำระแล้ว)
      await pool.query(
        'UPDATE purchase_orders SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ? OR po_number = ?',
        ['completed', paid_by, poId, poId]
      );

      res.json({
        message: 'อัปเดตสถานะการชำระเงินเรียบร้อยแล้ว',
        poId: poId
      });
    } else {
      // สำหรับข้อมูลจำลอง
      res.json({
        message: 'อัปเดตสถานะการชำระเงินเรียบร้อยแล้ว (ข้อมูลจำลอง)',
        poId: poId
      });
    }
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ 
      message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะการชำระเงิน',
      error: error.message 
    });
  }
});

app.get('/api/payments', async (req, res) => {
  try {
    const [payments] = await pool.query('SELECT * FROM payments');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' });
  }
});

app.post('/api/payments', async (req, res) => {
  const { id, invoiceNumber, paymentDate, amount, paymentMethod, payee, notes, status } = req.body;
  
  try {
    await pool.query(
      `INSERT INTO payments 
      (id, invoice_number, payment_date, amount, payment_method, payee, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, invoiceNumber, paymentDate, amount, paymentMethod, payee, notes, status]
    );
    res.status(201).json({ message: 'บันทึกข้อมูลสำเร็จ' });
  } catch (error) {
    res.status(500).json({ error: 'บันทึกข้อมูลไม่สำเร็จ' });
  }
});

// อัปเดตใบแจ้งหนี้
app.put('/api/invoices/:id', async (req, res) => {
  const invoiceId = req.params.id;
  const { description, vendor, issueDate, dueDate, amount, status, items } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // อัปเดตข้อมูลใบแจ้งหนี้
    await connection.query(
      `UPDATE invoices SET
      description = ?, vendor = ?, issue_date = ?, due_date = ?,
      amount = ?, status = ? WHERE id = ?`,
      [description, vendor, issueDate, dueDate, amount, status, invoiceId]
    );

    // ลบรายการสินค้าเดิม
    await connection.query('DELETE FROM invoice_items WHERE invoice_id = ?', [invoiceId]);

    // เพิ่มรายการสินค้าใหม่
    for (const item of items) {
      await connection.query(
        `INSERT INTO invoice_items 
        (invoice_id, name, quantity, unit_price, total)
        VALUES (?, ?, ?, ?, ?)`,
        [invoiceId, item.name, item.quantity, item.unitPrice, item.total]
      );
    }

    await connection.commit();
    res.json({ message: 'อัปเดตข้อมูลสำเร็จ' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: 'อัปเดตข้อมูลไม่สำเร็จ' });
  } finally {
    connection.release();
  }
});

// แก้ไข API endpoint สำหรับอัปเดตใบสั่งซื้อ
app.put('/api/purchase-orders/:id', authenticateToken, async (req, res) => {
  try {
      const poId = req.params.id;
      const { description, vendor, issueDate, dueDate, status, items } = req.body;

      // อัปเดตข้อมูลหลัก
      await pool.query(
          `UPDATE purchase_orders SET
          title = ?, 
          vendor_id = ?, 
          date = ?, 
          delivery_date = ?, 
          status = ?
          WHERE id = ?`,
          [description, vendor, issueDate, dueDate, status, poId]
      );

      // ลบรายการเก่าและเพิ่มรายการใหม่
      await pool.query('DELETE FROM purchase_order_items WHERE po_id = ?', [poId]);
      for (const item of items) {
          await pool.query(
              `INSERT INTO purchase_order_items 
              (po_id, item_name, quantity, unit_price) 
              VALUES (?, ?, ?, ?)`,
              [poId, item.name, item.quantity, item.unit_price]
          );
      }

      res.json({ message: 'อัปเดตใบสั่งซื้อสำเร็จ' });
  } catch (error) {
      console.error('Error updating PO:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตใบสั่งซื้อ' });
  }
});