import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { executeQuery, initializeMessagesTable } from '@/lib/db/mysql';
import { getUserWithSubscription } from '@/lib/db/queries';

// Initialize table on first import
initializeMessagesTable().catch(console.error);

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all messages (admin view) or user's own messages
    const isAdmin = session.user.email === 'admin@example.com'; // Replace with your admin logic
    
    let query: string;
    let params: any[] = [];

    if (isAdmin) {
      // Admin can see all messages
      query = `
        SELECT id, user_id, user_email, user_name, title, content, category, 
               priority, status, created_at, updated_at
        FROM messages
        ORDER BY created_at DESC
      `;
    } else {
      // Users can only see their own messages
      query = `
        SELECT id, user_id, user_email, user_name, title, content, category,
               priority, status, created_at, updated_at
        FROM messages
        WHERE user_id = ?
        ORDER BY created_at DESC
      `;
      params = [session.user.id];
    }

    const messages = await executeQuery(query, params);
    return NextResponse.json({ messages });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from PostgreSQL to check plan
    const user = await getUserWithSubscription(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check user's message count and plan limits
    const countQuery = 'SELECT COUNT(*) as count FROM messages WHERE user_id = ?';
    const countResult = await executeQuery(countQuery, [session.user.id]) as any;
    const messageCount = countResult[0]?.count || 0;

    // Define limits based on plan
    const isPro = user.stripeSubscriptionId && user.stripeSubscriptionStatus === 'active';
    const messageLimit = isPro ? 3 : 1;

    if (messageCount >= messageLimit) {
      return NextResponse.json({ 
        error: `Message limit reached. ${isPro ? 'Pro' : 'Free'} users can submit up to ${messageLimit} message${messageLimit > 1 ? 's' : ''}.`,
        limit: messageLimit,
        current: messageCount
      }, { status: 429 });
    }

    const body = await request.json();
    const { title, content, category, priority } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const insertQuery = `
      INSERT INTO messages (user_id, user_email, user_name, title, content, category, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      session.user.id,
      session.user.email,
      session.user.name || 'Anonymous',
      title,
      content,
      category || 'general',
      priority || 'medium'
    ];

    const result = await executeQuery(insertQuery, params);
    
    return NextResponse.json({ 
      success: true, 
      messageId: (result as any).insertId,
      remainingSlots: messageLimit - messageCount - 1
    });

  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, status } = body;

    if (!messageId || !status) {
      return NextResponse.json({ error: 'Message ID and status are required' }, { status: 400 });
    }

    // Check if user owns the message or is admin
    const checkQuery = 'SELECT user_id FROM messages WHERE id = ?';
    const messageResult = await executeQuery(checkQuery, [messageId]) as any;
    
    if (!messageResult[0]) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const isOwner = messageResult[0].user_id === session.user.id;
    const isAdmin = session.user.email === 'admin@example.com'; // Replace with your admin logic

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateQuery = 'UPDATE messages SET status = ?, updated_at = NOW() WHERE id = ?';
    await executeQuery(updateQuery, [status, messageId]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating message:', error);
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

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('id');

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Check if user owns the message or is admin
    const checkQuery = 'SELECT user_id FROM messages WHERE id = ?';
    const messageResult = await executeQuery(checkQuery, [messageId]) as any;
    
    if (!messageResult[0]) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const isOwner = messageResult[0].user_id === session.user.id;
    const isAdmin = session.user.email === 'admin@example.com'; // Replace with your admin logic

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const deleteQuery = 'DELETE FROM messages WHERE id = ?';
    await executeQuery(deleteQuery, [messageId]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
