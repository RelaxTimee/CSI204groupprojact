// API endpoints for purchase requisitions and approvals
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth_middleware'); // Assuming you have this middleware

// Import database connection pool
const pool = require('./db_connection'); // Assuming you have this module

// Global variable to check if database is connected
let dbConnected = true; // This should be set based on your actual database connection status

// API to get all purchase requisitions
router.get('/api/purchase-requisitions', authenticateToken, async (req, res) => {
  try {
    if (dbConnected) {
      // Use real database
      const query = `
        SELECT id, title, status, updated_at 
        FROM purchase_requisitions 
        ORDER BY updated_at DESC
      `;
      
      const [rows] = await pool.query(query);
      res.json(rows);
    } else {
      // Use mock data
      const mockRequisitions = [
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
      
      res.json(mockRequisitions);
    }
  } catch (error) {
    console.error('Error fetching purchase requisitions:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลใบขอซื้อ' });
  }
});

// API to get purchase requisition by ID
router.get('/api/purchase-requisitions/:id', authenticateToken, async (req, res) => {
  try {
    const requisitionId = req.params.id;
    
    if (dbConnected) {
      // Use real database
      const query = `
        SELECT * FROM purchase_requisitions 
        WHERE id = ?
      `;
      
      const [rows] = await pool.query(query, [requisitionId]);
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'ไม่พบใบขอซื้อที่ต้องการ' });
      }
      
      res.json(rows[0]);
    } else {
      // Use mock data
      const mockRequisitions = [
        {
          id: 'PR-2024-0056',
          title: 'อุปกรณ์สำนักงาน',
          description: 'อุปกรณ์สำนักงานประจำเดือน',
          status: 'รออนุมัติ',
          created_at: '2024-03-25 09:15:00',
          updated_at: '2024-03-25 10:30:00',
          created_by: 'สมชาย มานะดี'
        },
        {
          id: 'PR-2024-0057',
          title: 'อุปกรณ์คอมพิวเตอร์',
          description: 'คอมพิวเตอร์สำหรับฝ่ายการตลาด',
          status: 'อนุมัติแล้ว',
          created_at: '2024-03-26 11:30:00',
          updated_at: '2024-03-26 14:15:00',
          created_by: 'วิชัย อารีย์'
        },
        {
          id: 'PR-2024-0058',
          title: 'เฟอร์นิเจอร์สำนักงาน',
          description: 'เฟอร์นิเจอร์สำหรับห้องประชุม',
          status: 'รอตรวจสอบ',
          created_at: '2024-03-27 08:45:00',
          updated_at: '2024-03-27 09:45:00',
          created_by: 'มานี ดีงาม'
        }
      ];
      
      const requisition = mockRequisitions.find(pr => pr.id === requisitionId);
      
      if (!requisition) {
        return res.status(404).json({ message: 'ไม่พบใบขอซื้อที่ต้องการ' });
      }
      
      res.json(requisition);
    }
  } catch (error) {
    console.error('Error fetching purchase requisition:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลใบขอซื้อ' });
  }
});

// API to get all purchase requisition approvals
router.get('/api/purchase-requisition-approvals', authenticateToken, async (req, res) => {
  try {
    if (dbConnected) {
      // Use real database
      const query = `
        SELECT id, pr_id, status, approved_at 
        FROM purchase_requisition_approvals 
        ORDER BY id DESC
      `;
      
      const [rows] = await pool.query(query);
      res.json(rows);
    } else {
      // Use mock data
      const mockApprovals = [
        {
          id: 1,
          pr_id: 'PR-2024-0056',
          status: 'รออนุมัติ',
          approved_at: null
        },
        {
          id: 2,
          pr_id: 'PR-2024-0057',
          status: 'อนุมัติแล้ว',
          approved_at: '2024-03-26 14:15:00'
        },
        {
          id: 3,
          pr_id: 'PR-2024-0058',
          status: 'รอตรวจสอบ',
          approved_at: null
        }
      ];
      
      res.json(mockApprovals);
    }
  } catch (error) {
    console.error('Error fetching purchase requisition approvals:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการอนุมัติใบขอซื้อ' });
  }
});

// API to get purchase requisition approval by ID
router.get('/api/purchase-requisition-approvals/:id', authenticateToken, async (req, res) => {
  try {
    const approvalId = req.params.id;
    
    if (dbConnected) {
      // Use real database
      const query = `
        SELECT * FROM purchase_requisition_approvals 
        WHERE id = ?
      `;
      
      const [rows] = await pool.query(query, [approvalId]);
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'ไม่พบข้อมูลการอนุมัติที่ต้องการ' });
      }
      
      res.json(rows[0]);
    } else {
      // Use mock data
      const mockApprovals = [
        {
          id: 1,
          pr_id: 'PR-2024-0056',
          status: 'รออนุมัติ',
          approved_at: null,
          approved_by: null,
          comments: null
        },
        {
          id: 2,
          pr_id: 'PR-2024-0057',
          status: 'อนุมัติแล้ว',
          approved_at: '2024-03-26 14:15:00',
          approved_by: 'ผู้จัดการฝ่ายจัดซื้อ',
          comments: 'อนุมัติตามงบประมาณที่ได้รับ'
        },
        {
          id: 3,
          pr_id: 'PR-2024-0058',
          status: 'รอตรวจสอบ',
          approved_at: null,
          approved_by: null,
          comments: 'รอตรวจสอบรายละเอียดเพิ่มเติม'
        }
      ];
      
      const approval = mockApprovals.find(a => a.id === parseInt(approvalId));
      
      if (!approval) {
        return res.status(404).json({ message: 'ไม่พบข้อมูลการอนุมัติที่ต้องการ' });
      }
      
      res.json(approval);
    }
  } catch (error) {
    console.error('Error fetching purchase requisition approval:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการอนุมัติใบขอซื้อ' });
  }
});

module.exports = router;