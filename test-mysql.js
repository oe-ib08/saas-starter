const { testConnection, initializeMessagesTable, initializeMessageLikesTable } = require('./lib/db/mysql.ts');

async function testMySQLSetup() {
  console.log('Testing MySQL connection...');
  
  try {
    // Test basic connection
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('Failed to connect to MySQL');
      process.exit(1);
    }
    
    console.log('✅ MySQL connection successful');
    
    // Initialize tables
    await initializeMessagesTable();
    await initializeMessageLikesTable();
    
    console.log('✅ All tables initialized successfully');
    console.log('MySQL setup complete!');
    
  } catch (error) {
    console.error('❌ MySQL setup failed:', error);
    process.exit(1);
  }
}

testMySQLSetup();
