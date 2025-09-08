import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { messages, messageLikes, user } from '@/lib/db/schema';
import { desc, eq, inArray, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get public feed with like counts and user's like status
    const feedMessages = await db
      .select({
        id: messages.id,
        userId: messages.userId,
        userName: messages.userName,
        title: messages.title,
        content: messages.content,
        category: messages.category,
        likeCount: messages.likeCount,
        createdAt: messages.createdAt,
        isLikedByUser: sql<number>`CASE WHEN ${messageLikes.userId} IS NOT NULL THEN 1 ELSE 0 END`.as('is_liked_by_user')
      })
      .from(messages)
      .leftJoin(messageLikes, 
        sql`${messageLikes.messageId} = ${messages.id} AND ${messageLikes.userId} = ${session.user.id}`
      )
      .where(inArray(messages.status, ['pending', 'completed']))
      .orderBy(desc(messages.likeCount), desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(inArray(messages.status, ['pending', 'completed']));
    
    const total = countResult[0]?.count || 0;

    return NextResponse.json({
      messages: feedMessages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching feed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}