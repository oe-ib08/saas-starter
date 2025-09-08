import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { account } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const resolvedParams = await params;
    const authSession = await auth.api.getSession({
      headers: request.headers
    });

    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = resolvedParams.accountId;

    // Ensure user can only unlink their own accounts
    const accountToUnlink = await db.select().from(account)
      .where(and(
        eq(account.id, accountId),
        eq(account.userId, authSession.user.id)
      ))
      .limit(1);

    if (accountToUnlink.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Check if this is the user's only authentication method
    const userAccounts = await db.select().from(account)
      .where(eq(account.userId, authSession.user.id));

    // Don't allow unlinking if it's the only account and user has no password
    if (userAccounts.length === 1 && !accountToUnlink[0].password) {
      return NextResponse.json({ 
        error: 'Cannot unlink the only authentication method. Please set a password first.' 
      }, { status: 400 });
    }

    // Delete the account link
    await db.delete(account).where(eq(account.id, accountId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unlinking account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}