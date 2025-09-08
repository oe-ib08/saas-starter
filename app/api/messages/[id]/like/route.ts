import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { messages, messageLikes } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: messageId } = await params;

    // Check if message exists
    const messageResult = await db
      .select({ id: messages.id })
      .from(messages)
      .where(eq(messages.id, parseInt(messageId)));
    
    if (!messageResult[0]) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user already liked this message
    const existingLike = await db
      .select({ id: messageLikes.id })
      .from(messageLikes)
      .where(and(
        eq(messageLikes.userId, session.user.id),
        eq(messageLikes.messageId, parseInt(messageId))
      ));

    if (existingLike[0]) {
      return NextResponse.json({ error: 'Message already liked' }, { status: 400 });
    }

    // Add like
    await db.insert(messageLikes).values({
      userId: session.user.id,
      messageId: parseInt(messageId)
    });

    // Update like count
    await db
      .update(messages)
      .set({ 
        likeCount: sql`${messages.likeCount} + 1`
      })
      .where(eq(messages.id, parseInt(messageId)));

    // Get updated like count
    const countResult = await db
      .select({ likeCount: messages.likeCount })
      .from(messages)
      .where(eq(messages.id, parseInt(messageId)));
    const newCount = countResult[0]?.likeCount || 0;

    return NextResponse.json({ 
      success: true, 
      liked: true,
      likeCount: newCount
    });

  } catch (error) {
    console.error('Error liking message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: messageId } = await params;

    // Check if like exists
    const existingLike = await db
      .select({ id: messageLikes.id })
      .from(messageLikes)
      .where(and(
        eq(messageLikes.userId, session.user.id),
        eq(messageLikes.messageId, parseInt(messageId))
      ));

    if (!existingLike[0]) {
      return NextResponse.json({ error: 'Like not found' }, { status: 404 });
    }

    // Remove like
    await db
      .delete(messageLikes)
      .where(and(
        eq(messageLikes.userId, session.user.id),
        eq(messageLikes.messageId, parseInt(messageId))
      ));

    // Update like count
    await db
      .update(messages)
      .set({ 
        likeCount: sql`GREATEST(${messages.likeCount} - 1, 0)`
      })
      .where(eq(messages.id, parseInt(messageId)));

    // Get updated like count
    const countResult = await db
      .select({ likeCount: messages.likeCount })
      .from(messages)
      .where(eq(messages.id, parseInt(messageId)));
    const newCount = countResult[0]?.likeCount || 0;

    return NextResponse.json({ 
      success: true, 
      liked: false,
      likeCount: newCount
    });

  } catch (error) {
    console.error('Error unliking message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}