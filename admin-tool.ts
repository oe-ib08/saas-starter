#!/usr/bin/env tsx

import { db } from './lib/db/drizzle';
import { user as userTable } from './lib/db/schema';
import { eq } from 'drizzle-orm';

async function makeUserAdmin(email: string) {
  console.log(`Making user with email "${email}" an admin...`);
  
  try {
    // Find the user by email
    const users = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email))
      .limit(1);
    
    if (users.length === 0) {
      console.error(`❌ User with email "${email}" not found.`);
      console.log('\nAvailable users:');
      const allUsers = await db
        .select({ id: userTable.id, email: userTable.email, role: userTable.role })
        .from(userTable);
      
      allUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.role})`);
      });
      
      return;
    }
    
    const user = users[0];
    
    if (user.role === 'admin') {
      console.log(`✅ User "${email}" is already an admin.`);
      return;
    }
    
    // Update user role to admin
    await db
      .update(userTable)
      .set({ 
        role: 'admin',
        updatedAt: new Date()
      })
      .where(eq(userTable.id, user.id));
    
    console.log(`✅ Successfully made "${email}" an admin!`);
    console.log(`User ID: ${user.id}`);
    console.log(`Previous role: ${user.role}`);
    console.log(`New role: admin`);
    
  } catch (error) {
    console.error('❌ Error making user admin:', error);
  }
}

async function listUsers() {
  console.log('📋 All users in the database:\n');
  
  try {
    const users = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        role: userTable.role,
        emailVerified: userTable.emailVerified,
        createdAt: userTable.createdAt,
        deletedAt: userTable.deletedAt
      })
      .from(userTable);
    
    if (users.length === 0) {
      console.log('No users found in the database.');
      return;
    }
    
    users.forEach((user, index) => {
      const status = user.deletedAt ? '🗑️ DELETED' : user.emailVerified ? '✅ VERIFIED' : '⏳ PENDING';
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${status}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error listing users:', error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🔧 Admin User Management Tool\n');
    console.log('Usage:');
    console.log('  npm run admin-tool list                    # List all users');
    console.log('  npm run admin-tool promote <email>        # Make user admin');
    console.log('');
    console.log('Examples:');
    console.log('  npm run admin-tool list');
    console.log('  npm run admin-tool promote john@example.com');
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case 'list':
    case 'ls':
      await listUsers();
      break;
      
    case 'promote':
    case 'admin':
    case 'make-admin':
      if (args.length < 2) {
        console.error('❌ Email address is required.');
        console.log('Usage: npm run admin-tool promote <email>');
        return;
      }
      await makeUserAdmin(args[1]);
      break;
      
    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log('Available commands: list, promote');
  }
  
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
