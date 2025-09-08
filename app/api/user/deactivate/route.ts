import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authSession = await auth.api.getSession({
      headers: request.headers
    });

    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Set deletedAt timestamp to mark account as deactivated
    const deactivatedAt = new Date();
    
    await db.update(user)
      .set({ 
        deletedAt: deactivatedAt 
      })
      .where(eq(user.id, authSession.user.id));

    return NextResponse.json({ 
      success: true, 
      message: 'Account deactivated successfully',
      reactivationDeadline: new Date(deactivatedAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('Error deactivating account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}