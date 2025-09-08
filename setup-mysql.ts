import { initializeMessagesTable } from '@/lib/db/mysql';

async function setupMysqlDatabase() {
  try {
    console.log('Initializing MySQL messages table...');
    await initializeMessagesTable();
    console.log('MySQL messages table initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up MySQL database:', error);
    process.exit(1);
  }
}

setupMysqlDatabase();
