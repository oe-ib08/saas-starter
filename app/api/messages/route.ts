import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { messages, messageLikes, user } from '@/lib/db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';
import { getUserWithSubscription } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (you can enhance this logic)
    const isAdmin = session.user.email === 'admin@example.com' || session.user.role === 'admin';
    
    let messageResults;

    if (isAdmin) {
      // Admin can see all messages with like counts
      messageResults = await db
        .select({
          id: messages.id,
          userId: messages.userId,
          userEmail: messages.userEmail,
          userName: messages.userName,
          title: messages.title,
          content: messages.content,
          category: messages.category,
          priority: messages.priority,
          status: messages.status,
          likeCount: messages.likeCount,
          createdAt: messages.createdAt,
          updatedAt: messages.updatedAt,
        })
        .from(messages)
        .orderBy(desc(messages.createdAt));
    } else {
      // Users can only see their own messages with like counts
      messageResults = await db
        .select({
          id: messages.id,
          userId: messages.userId,
          userEmail: messages.userEmail,
          userName: messages.userName,
          title: messages.title,
          content: messages.content,
          category: messages.category,
          priority: messages.priority,
          status: messages.status,
          likeCount: messages.likeCount,
          createdAt: messages.createdAt,
          updatedAt: messages.updatedAt,
        })
        .from(messages)
        .where(eq(messages.userId, session.user.id))
        .orderBy(desc(messages.createdAt));
    }

    return NextResponse.json({ messages: messageResults, isAdmin });

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
    const messageCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(eq(messages.userId, session.user.id));
    const messageCount = messageCountResult[0]?.count || 0;

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

    const insertResult = await db.insert(messages).values({
      userId: session.user.id,
      userEmail: session.user.email || '',
      userName: session.user.name || 'Anonymous',
      title,
      content,
      category: category || 'general',
      priority: priority || 'medium'
    }).returning({ id: messages.id });
    
    return NextResponse.json({ 
      success: true, 
      messageId: insertResult[0].id,
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
    const messageResult = await db
      .select({ userId: messages.userId })
      .from(messages)
      .where(eq(messages.id, parseInt(messageId)));
    
    if (!messageResult[0]) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const isOwner = messageResult[0].userId === session.user.id;
    const isAdmin = session.user.email === 'admin@example.com' || session.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db
      .update(messages)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(messages.id, parseInt(messageId)));

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
    const messageResult = await db
      .select({ userId: messages.userId })
      .from(messages)
      .where(eq(messages.id, parseInt(messageId)));
    
    if (!messageResult[0]) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const isOwner = messageResult[0].userId === session.user.id;
    const isAdmin = session.user.email === 'admin@example.com' || session.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db
      .delete(messages)
      .where(eq(messages.id, parseInt(messageId)));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
