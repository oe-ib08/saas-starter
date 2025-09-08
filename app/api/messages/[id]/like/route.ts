import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { executeQuery } from '@/lib/db/mysql';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messageId = params.id;

    // Check if message exists
    const messageQuery = 'SELECT id FROM messages WHERE id = ?';
    const messageResult = await executeQuery(messageQuery, [messageId]) as any;
    
    if (!messageResult[0]) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user already liked this message
    const existingLikeQuery = 'SELECT id FROM message_likes WHERE user_id = ? AND message_id = ?';
    const existingLike = await executeQuery(existingLikeQuery, [session.user.id, messageId]) as any;

    if (existingLike[0]) {
      return NextResponse.json({ error: 'Message already liked' }, { status: 400 });
    }

    // Add like
    const insertLikeQuery = 'INSERT INTO message_likes (user_id, message_id) VALUES (?, ?)';
    await executeQuery(insertLikeQuery, [session.user.id, messageId]);

    // Update like count
    const updateCountQuery = 'UPDATE messages SET like_count = like_count + 1 WHERE id = ?';
    await executeQuery(updateCountQuery, [messageId]);

    // Get updated like count
    const countQuery = 'SELECT like_count FROM messages WHERE id = ?';
    const countResult = await executeQuery(countQuery, [messageId]) as any;
    const newCount = countResult[0]?.like_count || 0;

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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messageId = params.id;

    // Check if like exists
    const existingLikeQuery = 'SELECT id FROM message_likes WHERE user_id = ? AND message_id = ?';
    const existingLike = await executeQuery(existingLikeQuery, [session.user.id, messageId]) as any;

    if (!existingLike[0]) {
      return NextResponse.json({ error: 'Like not found' }, { status: 404 });
    }

    // Remove like
    const deleteLikeQuery = 'DELETE FROM message_likes WHERE user_id = ? AND message_id = ?';
    await executeQuery(deleteLikeQuery, [session.user.id, messageId]);

    // Update like count
    const updateCountQuery = 'UPDATE messages SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?';
    await executeQuery(updateCountQuery, [messageId]);

    // Get updated like count
    const countQuery = 'SELECT like_count FROM messages WHERE id = ?';
    const countResult = await executeQuery(countQuery, [messageId]) as any;
    const newCount = countResult[0]?.like_count || 0;

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