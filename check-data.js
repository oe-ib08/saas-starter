import { db } from './lib/db/drizzle.js';
import { sql } from 'drizzle-orm';

async function checkData() {
  try {
    console.log('Checking activity_logs...');
    const activityLogs = await db.execute(sql`SELECT id, user_id FROM activity_logs LIMIT 5`);
    console.log('Activity logs:', activityLogs.rows);

    console.log('\nChecking team_members...');
    const teamMembers = await db.execute(sql`SELECT id, user_id FROM team_members LIMIT 5`);
    console.log('Team members:', teamMembers.rows);

    console.log('\nChecking invitations...');
    const invitations = await db.execute(sql`SELECT id, invited_by FROM invitations LIMIT 5`);
    console.log('Invitations:', invitations.rows);

    console.log('\nChecking better_auth_user...');
    const users = await db.execute(sql`SELECT id, email FROM better_auth_user LIMIT 5`);
    console.log('Better auth users:', users.rows);
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkData();
