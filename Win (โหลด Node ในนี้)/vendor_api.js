// API ดึงข้อมูลผู้ขายทั้งหมด
app.get("/api/vendors", authenticateToken, async (req, res) => {
  try {
    // รับพารามิเตอร์การค้นหา
    const search = req.query.search || "";
    const status = req.query.status || "active";

    if (dbConnected) {
      // ใช้ฐานข้อมูลจริง
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
    } else {
      // ใช้ข้อมูลจำลอง
      const mockVendors = [
        {
          id: "V001",
          name: "บริษัท คอมเทค จำกัด",
          contact_name: "คุณสมศักดิ์ เทคโน",
          contact_position: "ผู้จัดการฝ่ายขาย",
          phone: "02-123-4567",
          email: "contact@comtech.co.th",
          address: "123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
          tax_id: "0123456789012",
          business_type: "distributor",
          notes: "ผู้จำหน่ายอุปกรณ์คอมพิวเตอร์และอิเล็กทรอนิกส์",
          status: "active"
        },
        {
          id: "V002",
          name: "บริษัท ไอทีซัพพลาย จำกัด",
          contact_name: "คุณวิภา สุขใจ",
          contact_position: "เจ้าของกิจการ",
          phone: "02-234-5678",
          email: "sales@itsupply.co.th",
          address: "456 ถนนพหลโยธิน แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900",
          tax_id: "0123456789013",
          business_type: "retailer",
          notes: "จำหน่ายอุปกรณ์ไอทีและเครื่องใช้สำนักงาน",
          status: "active"
        },
        {
          id: "V003",
          name: "บริษัท ซอฟต์แวร์ลิงค์ จำกัด",
          contact_name: "คุณนิพนธ์ โปรแกรม",
          contact_position: "ผู้จัดการทั่วไป",
          phone: "02-345-6789",
          email: "info@softwarelink.co.th",
          address: "789 ถนนสีลม แขวงสีลม เขตบางรัก กรุงเทพฯ 10500",
          tax_id: "0123456789014",
          business_type: "service",
          notes: "ให้บริการด้านซอฟต์แวร์และลิขสิทธิ์โปรแกรม",
          status: "active"
        }
      ];
      
      // กรองตามสถานะและคำค้นหา
      let filteredVendors = mockVendors.filter(v => v.status === status);
      
      if (search) {
        const searchLower = search.toLowerCase();
        filteredVendors = filteredVendors.filter(
          vendor =>
            vendor.name.toLowerCase().includes(searchLower) ||
            vendor.contact_name.toLowerCase().includes(searchLower) ||
            vendor.id.toLowerCase().includes(searchLower) ||
            (vendor.phone && vendor.phone.includes(search))
        );
      }
      
      res.json(filteredVendors);
    }
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ขาย" });
  }
});

// API ดึงข้อมูลผู้ขายตาม ID
app.get("/api/vendors/:id", authenticateToken, async (req, res) => {
  try {
    const vendorId = req.params.id;
    
    if (dbConnected) {
      // ใช้ฐานข้อมูลจริง
      const [vendors] = await pool.query("SELECT * FROM vendors WHERE id = ?", [vendorId]);

      if (vendors.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลผู้ขาย" });
      }

      res.json(vendors[0]);
    } else {
      // ใช้ข้อมูลจำลอง
      const mockVendors = [
        {
          id: "V001",
          name: "บริษัท คอมเทค จำกัด",
          contact_name: "คุณสมศักดิ์ เทคโน",
          contact_position: "ผู้จัดการฝ่ายขาย",
          phone: "02-123-4567",
          email: "contact@comtech.co.th",
          address: "123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
          tax_id: "0123456789012",
          business_type: "distributor",
          notes: "ผู้จำหน่ายอุปกรณ์คอมพิวเตอร์และอิเล็กทรอนิกส์",
          status: "active"
        },
        {
          id: "V002",
          name: "บริษัท ไอทีซัพพลาย จำกัด",
          contact_name: "คุณวิภา สุขใจ",
          contact_position: "เจ้าของกิจการ",
          phone: "02-234-5678",
          email: "sales@itsupply.co.th",
          address: "456 ถนนพหลโยธิน แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900",
          tax_id: "0123456789013",
          business_type: "retailer",
          notes: "จำหน่ายอุปกรณ์ไอทีและเครื่องใช้สำนักงาน",
          status: "active"
        },
        {
          id: "V003",
          name: "บริษัท ซอฟต์แวร์ลิงค์ จำกัด",
          contact_name: "คุณนิพนธ์ โปรแกรม",
          contact_position: "ผู้จัดการทั่วไป",
          phone: "02-345-6789",
          email: "info@softwarelink.co.th",
          address: "789 ถนนสีลม แขวงสีลม เขตบางรัก กรุงเทพฯ 10500",
          tax_id: "0123456789014",
          business_type: "service",
          notes: "ให้บริการด้านซอฟต์แวร์และลิขสิทธิ์โปรแกรม",
          status: "active"
        }
      ];
      
      const vendor = mockVendors.find(v => v.id === vendorId);
      
      if (!vendor) {
        return res.status(404).json({ message: "ไม่พบข้อมูลผู้ขาย" });
      }
      
      res.json(vendor);
    }
  } catch (error) {
    console.error("Error fetching vendor:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ขาย" });
  }
});

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

    if (dbConnected) {
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
    } else {
      // จำลองการเพิ่มผู้ขายใหม่
      const nextId = `V${String(Math.floor(6 + Math.random() * 100)).padStart(3, "0")}`;
      
      res.status(201).json({
        message: "เพิ่มผู้ขายเรียบร้อยแล้ว",
        vendorId: nextId,
      });
    }
  } catch (error) {
    console.error("Error creating vendor:", error);
    res.status(500).json({
      message: "เกิดข้อผิดพลาดในการเพิ่มผู้ขาย",
      error: error.message,
    });
  }
});

// API แก้ไขข้อมูลผู้ขาย
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
      // จำลองการแก้ไขข้อมูลผู้ขาย
      res.json({
        message: "แก้ไขข้อมูลผู้ขายเรียบร้อยแล้ว",
        vendorId: vendorId,
      });
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
      // จำลองการลบผู้ขาย
      res.json({
        message: "ลบผู้ขายเรียบร้อยแล้ว",
        vendorId: vendorId,
      });
    }
  } catch (error) {
    console.error("Error deleting vendor:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบผู้ขาย" });
  }
});