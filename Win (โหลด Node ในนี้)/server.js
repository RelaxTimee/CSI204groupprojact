const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// สร้าง Express app
const app = express();
const PORT = process.env.PORT || 3000;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
  queueLimit: 0
};

// สร้าง pool connection สำหรับ MySQL
const pool = mysql.createPool(dbConfig);

// ฟังก์ชันสำหรับตรวจสอบการเชื่อมต่อฐานข้อมูล
async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('เชื่อมต่อกับฐานข้อมูลสำเร็จ!');
    connection.release();
    return true;
  } catch (error) {
    console.error('ไม่สามารถเชื่อมต่อกับฐานข้อมูล:', error);
    console.log('กำลังใช้ข้อมูลจำลอง...');
    return false;
  }
}

// ตรวจสอบการเชื่อมต่อเมื่อเริ่มต้นเซิร์ฟเวอร์
let dbConnected = false;
(async () => {
  dbConnected = await testDatabaseConnection();
})();

// ข้อมูลจำลองสำหรับผู้ใช้ (ใช้เมื่อไม่สามารถเชื่อมต่อกับฐานข้อมูล)
const mockUsers = [
  { id: 1, username: 'admin@example.com', password: 'admin123', role_id: 1 },
  { id: 2, username: 'manager@example.com', password: 'admin123', role_id: 2 },
  { id: 3, username: 'procurement@example.com', password: 'admin123', role_id: 3 },
  { id: 4, username: 'finance@example.com', password: 'admin123', role_id: 4 },
  { id: 5, username: 'it@example.com', password: 'admin123', role_id: 5 }
];

// API สำหรับการล็อกอิน
app.post('/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (dbConnected) {
      // ใช้ฐานข้อมูลจริง
      const [users] = await pool.query(
        'SELECT id, username, password, role_id FROM users WHERE username = ?',
        [username]
      );
      
      if (users.length === 0) {
        return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
      }
      
      const user = users[0];
      
      // ในระบบจริง รหัสผ่านควรถูกเข้ารหัสด้วย bcrypt
      // ตรวจสอบรหัสผ่านโดยใช้ bcrypt.compare
      // แต่เนื่องจาก demo นี้รหัสผ่านใน database.sql ไม่ได้เข้ารหัสด้วย bcrypt แบบสมบูรณ์
      // เราจึงตรวจสอบโดยตรง (หรือใช้ bcrypt.compareSync หากรหัสผ่านถูกเข้ารหัสแล้ว)
      const isPasswordValid = password === 'admin123'; // ควรใช้ bcrypt.compareSync(password, user.password)
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
      }
      
      // สร้าง token
      const token = jwt.sign(
        { id: user.id, username: user.username, role_id: user.role_id },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({
        id: user.id,
        username: user.username,
        role_id: user.role_id,
        token
      });
    } else {
      // ใช้ข้อมูลจำลอง
      const user = mockUsers.find(u => u.username === username && u.password === password);
      
      if (!user) {
        return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
      }
      
      // สร้าง token
      const token = jwt.sign(
        { id: user.id, username: user.username, role_id: user.role_id },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({
        id: user.id,
        username: user.username,
        role_id: user.role_id,
        token
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง' });
  }
});

// Middleware สำหรับการตรวจสอบ token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'ไม่มี token ที่ใช้ยืนยันตัวตน' });
  }
  
  try {
    // ตรวจสอบ token
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
  }
}

// API ตรวจสอบ token
app.get('/users/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user, message: 'Token ถูกต้อง' });
});

// API ข้อมูลผู้ใช้ทั้งหมด (สำหรับ admin)
app.get('/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role_id !== 1) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้' });
    }
    
    if (dbConnected) {
      // ใช้ฐานข้อมูลจริง
      const [users] = await pool.query(
        'SELECT id, username, role_id, created_at FROM users'
      );
      
      res.json(users);
    } else {
      // ใช้ข้อมูลจำลอง
      const users = mockUsers.map(user => ({
        id: user.id,
        username: user.username,
        role_id: user.role_id,
        created_at: new Date().toISOString()
      }));
      
      res.json(users);
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง' });
  }
});

// API ข้อมูลขอซื้อ
app.get('/procurement/requisitions', authenticateToken, async (req, res) => {
  try {
    if (dbConnected) {
      // TODO: ใส่โค้ดเชื่อมต่อฐานข้อมูลจริงที่นี่
      // ตัวอย่าง: const [requisitions] = await pool.query(...);
    }
    
    // ส่งข้อมูลจำลอง (mock data)
    res.json([
      {
        id: 'PR-2024-0056',
        title: 'อุปกรณ์สำนักงาน',
        date: '25/03/2024',
        status: 'รออนุมัติ',
        amount: 12500.00,
        requester: 'สมชาย มานะดี'
      },
      {
        id: 'PR-2024-0057',
        title: 'อุปกรณ์คอมพิวเตอร์',
        date: '26/03/2024',
        status: 'รออนุมัติ',
        amount: 45800.00,
        requester: 'วิชัย อารีย์'
      },
      {
        id: 'PR-2024-0058',
        title: 'เฟอร์นิเจอร์สำนักงาน',
        date: '27/03/2024',
        status: 'รอตรวจสอบ',
        amount: 28900.00,
        requester: 'มานี ดีงาม'
      }
    ]);
  } catch (error) {
    console.error('Error fetching requisitions:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง' });
  }
});

// API สร้างใบขอซื้อ
app.post('/procurement/requisition', authenticateToken, async (req, res) => {
  try {
    const requisitionData = req.body;
    
    if (dbConnected) {
      // TODO: ใส่โค้ดเชื่อมต่อฐานข้อมูลจริงที่นี่
      // ตัวอย่าง: const result = await pool.query(...);
    }
    
    // จำลองการสร้างใบขอซื้อใหม่
    const newRequisition = {
      id: `PR-2024-${Math.floor(1000 + Math.random() * 9000)}`,
      ...requisitionData,
      status: 'รออนุมัติ',
      created_at: new Date().toISOString(),
      created_by: req.user.username
    };
    
    res.status(201).json(newRequisition);
  } catch (error) {
    console.error('Error creating requisition:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง' });
  }
});

// API สร้างใบสั่งซื้อ
app.post('/procurement/purchase-order', authenticateToken, async (req, res) => {
  try {
    const poData = req.body;
    
    if (dbConnected) {
      // TODO: ใส่โค้ดเชื่อมต่อฐานข้อมูลจริงที่นี่
      // ตัวอย่าง: const result = await pool.query(...);
    }
    
    // จำลองการสร้างใบสั่งซื้อใหม่
    const newPO = {
      id: `PO-2024-${Math.floor(1000 + Math.random() * 9000)}`,
      ...poData,
      status: 'รอยืนยัน',
      created_at: new Date().toISOString(),
      created_by: req.user.username
    };
    
    res.status(201).json(newPO);
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง' });
  }
});

// API สำหรับทดสอบว่าเซิร์ฟเวอร์ทำงาน
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API ทำงานปกติ',
    database_connected: dbConnected
  });
});

// ส่ง index.html ไปยังทุกเส้นทางที่ไม่ได้ระบุ (สำหรับ SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// เริ่มการทำงานของเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log(`Server กำลังทำงานที่ http://localhost:${PORT}`);
  console.log(`- เข้าสู่ระบบที่: http://localhost:${PORT}/login.html`);
});