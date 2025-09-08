import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create connection pool for better connection management
const mysqlPool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false
  }
});

export { mysqlPool as mysqlConnection };

// Helper function to execute queries
export async function executeQuery(query: string, params: any[] = []) {
  try {
    // Validate environment variables
    if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_PASSWORD || !process.env.MYSQL_DATABASE) {
      throw new Error('Missing required MySQL environment variables');
    }

    const [results] = await mysqlPool.execute(query, params);
    return results;
  } catch (error) {
    console.error('MySQL query error:', error);
    throw error;
  }
}

// Test database connection
export async function testConnection() {
  try {
    await executeQuery('SELECT 1');
    console.log('MySQL connection successful');
    return true;
  } catch (error) {
    console.error('MySQL connection failed:', error);
    return false;
  }
}

// Initialize messages table
export async function initializeMessagesTable() {
  console.log('Initializing messages table...');
  
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      user_name VARCHAR(255),
      title VARCHAR(500) NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(100),
      priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
      status ENUM('pending', 'in_progress', 'completed', 'rejected') DEFAULT 'pending',
      like_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at),
      INDEX idx_like_count (like_count)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await executeQuery(createTableQuery);
    console.log('Messages table initialized successfully');
  } catch (error) {
    console.error('Error initializing messages table:', error);
    throw error;
  }
}

// Initialize message likes table
export async function initializeMessageLikesTable() {
  console.log('Initializing message likes table...');
  
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS message_likes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      message_id INT NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
      UNIQUE KEY unique_user_message (user_id, message_id),
      INDEX idx_message_id (message_id),
      INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await executeQuery(createTableQuery);
    console.log('Message likes table initialized successfully');
  } catch (error) {
    console.error('Error initializing message likes table:', error);
    throw error;
  }
}
