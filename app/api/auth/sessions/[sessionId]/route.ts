import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { session } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const resolvedParams = await params;
    const authSession = await auth.api.getSession({
      headers: request.headers
    });

    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = resolvedParams.sessionId;

    // Ensure user can only delete their own sessions
    const sessionToDelete = await db.select().from(session)
      .where(and(
        eq(session.id, sessionId),
        eq(session.userId, authSession.user.id)
      ))
      .limit(1);

    if (sessionToDelete.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Prevent deletion of current session
    if (sessionToDelete[0].token === authSession.session.token) {
      return NextResponse.json({ error: 'Cannot delete current session' }, { status: 400 });
    }

    // Delete the session
    await db.delete(session).where(eq(session.id, sessionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}