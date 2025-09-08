import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { session } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authSession = await auth.api.getSession({
      headers: request.headers
    });

    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all sessions for the current user
    const userSessions = await db.select({
      id: session.id,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      token: session.token,
    }).from(session)
      .where(eq(session.userId, authSession.user.id));

    // Mark the current session
    const sessionsWithCurrent = userSessions.map(s => ({
      ...s,
      isCurrent: s.token === authSession.session.token,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    return NextResponse.json({ sessions: sessionsWithCurrent });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}