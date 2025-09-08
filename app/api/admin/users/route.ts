import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { 
  user as userTable, 
  session as sessionTable, 
  account as accountTable, 
  messages, 
  messageLikes, 
  teamMembers 
} from '@/lib/db/schema';
import { eq, desc, like, or, and, isNull, count } from 'drizzle-orm';

// Helper function to check if user is admin
async function isAdminUser(session: any) {
  if (!session?.user?.id) return false;
  return session.user.email === 'admin@example.com' || session.user.role === 'admin';
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isAdminUser(session))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query conditions
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          like(userTable.name, `%${search}%`),
          like(userTable.email, `%${search}%`)
        )
      );
    }

    if (!includeDeleted) {
      conditions.push(isNull(userTable.deletedAt));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get users with stats
    const users = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        emailVerified: userTable.emailVerified,
        image: userTable.image,
        role: userTable.role,
        createdAt: userTable.createdAt,
        updatedAt: userTable.updatedAt,
        deletedAt: userTable.deletedAt,
      })
      .from(userTable)
      .where(whereClause)
      .orderBy(desc(userTable.createdAt))
      .limit(limit)
      .offset(offset);

    // Get user statistics for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [messageCount, sessionCount] = await Promise.all([
          db.select({ count: count() }).from(messages).where(eq(messages.userId, user.id)),
          db.select({ count: count() }).from(sessionTable).where(eq(sessionTable.userId, user.id))
        ]);

        return {
          ...user,
          stats: {
            totalMessages: messageCount[0]?.count || 0,
            activeSessions: sessionCount[0]?.count || 0,
          }
        };
      })
    );

    return NextResponse.json({
      users: usersWithStats,
      total: users.length,
      hasMore: users.length === limit
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isAdminUser(session))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const hardDelete = searchParams.get('hardDelete') === 'true';

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Prevent self-deletion
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Check if user exists
    const userToDelete = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    if (!userToDelete[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (hardDelete) {
      // Hard delete - remove all user data
      await db.transaction(async (tx) => {
        // Delete user's message likes
        await tx.delete(messageLikes).where(eq(messageLikes.userId, userId));
        
        // Delete user's messages
        await tx.delete(messages).where(eq(messages.userId, userId));
        
        // Delete user's team memberships
        await tx.delete(teamMembers).where(eq(teamMembers.userId, userId));
        
        // Delete user's sessions
        await tx.delete(sessionTable).where(eq(sessionTable.userId, userId));
        
        // Delete user's accounts
        await tx.delete(accountTable).where(eq(accountTable.userId, userId));
        
        // Finally delete the user
        await tx.delete(userTable).where(eq(userTable.id, userId));
      });

      return NextResponse.json({ 
        success: true, 
        message: 'User permanently deleted',
        type: 'hard_delete'
      });
    } else {
      // Soft delete - set deletedAt timestamp
      await db
        .update(userTable)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userTable.id, userId));

      return NextResponse.json({ 
        success: true, 
        message: 'User soft deleted',
        type: 'soft_delete'
      });
    }

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isAdminUser(session))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, action, ...updateData } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists
    const userToUpdate = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    if (!userToUpdate[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'restore') {
      // Restore soft-deleted user
      await db
        .update(userTable)
        .set({
          deletedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(userTable.id, userId));

      return NextResponse.json({ success: true, message: 'User restored successfully' });
    } else if (action === 'update') {
      // Update user data
      const allowedFields = ['name', 'email', 'role', 'emailVerified'];
      const updates: any = {
        updatedAt: new Date(),
      };

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          updates[key] = value;
        }
      }

      await db
        .update(userTable)
        .set(updates)
        .where(eq(userTable.id, userId));

      return NextResponse.json({ success: true, message: 'User updated successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
