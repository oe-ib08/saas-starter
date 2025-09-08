import { testConnection, initializeMessagesTable, initializeMessageLikesTable } from '@/lib/db/mysql';

async function setupMysqlDatabase() {
  console.log('🔄 Setting up MySQL database...');
  
  try {
    // Test connection first
    console.log('Testing MySQL connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ Failed to connect to MySQL database');
      console.log('Please check your environment variables:');
      console.log('- MYSQL_HOST');
      console.log('- MYSQL_PORT'); 
      console.log('- MYSQL_USER');
      console.log('- MYSQL_PASSWORD');
      console.log('- MYSQL_DATABASE');
      process.exit(1);
    }
    
    console.log('✅ MySQL connection successful');
    
    // Initialize tables
    console.log('🔄 Initializing database tables...');
    await initializeMessagesTable();
    await initializeMessageLikesTable();
    
    console.log('✅ Database setup complete!');
    console.log('📊 Tables created:');
    console.log('  - messages');
    console.log('  - message_likes');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        console.log('💡 Connection refused. Please check:');
        console.log('  - Database server is running');
        console.log('  - Host and port are correct');
        console.log('  - Firewall settings allow connections');
      } else if (error.message.includes('Access denied')) {
        console.log('💡 Access denied. Please check:');
        console.log('  - Username and password are correct');
        console.log('  - User has permissions for the database');
      } else if (error.message.includes('Missing required MySQL environment variables')) {
        console.log('💡 Environment variables missing. Please set:');
        console.log('  - MYSQL_HOST=your_mysql_host');
        console.log('  - MYSQL_PORT=3306');
        console.log('  - MYSQL_USER=your_username');
        console.log('  - MYSQL_PASSWORD=your_password');
        console.log('  - MYSQL_DATABASE=your_database');
      }
    }
    
    process.exit(1);
  }
}

setupMysqlDatabase();
