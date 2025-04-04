// Database connection module
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'AdminCSI204',
  password: 'AdminCSI204',
  database: 'CSI206Project',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
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

// Export the pool for use in other modules
module.exports = pool;

// Also export the test function
module.exports.testDatabaseConnection = testDatabaseConnection;