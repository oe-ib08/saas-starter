import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { executeQuery } from '@/lib/db/mysql';

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
    const feedQuery = `
      SELECT 
        m.id,
        m.user_id,
        m.user_name,
        m.title,
        m.content,
        m.category,
        m.like_count,
        m.created_at,
        CASE WHEN ml.user_id IS NOT NULL THEN 1 ELSE 0 END as is_liked_by_user
      FROM messages m
      LEFT JOIN message_likes ml ON m.id = ml.message_id AND ml.user_id = ?
      WHERE m.status IN ('pending', 'completed')
      ORDER BY m.like_count DESC, m.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const messages = await executeQuery(feedQuery, [session.user.id, limit, offset]);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM messages 
      WHERE status IN ('pending', 'completed')
    `;
    const countResult = await executeQuery(countQuery) as any;
    const total = countResult[0]?.total || 0;

    return NextResponse.json({
      messages,
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