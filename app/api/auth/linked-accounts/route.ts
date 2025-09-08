import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { account } from '@/lib/db/schema';
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

    // Get all linked accounts for the current user
    const linkedAccounts = await db.select({
      id: account.id,
      providerId: account.providerId,
      accountId: account.accountId,
      createdAt: account.createdAt,
    }).from(account)
      .where(eq(account.userId, authSession.user.id));

    // Convert timestamps to ISO strings
    const accountsWithIsoTimestamps = linkedAccounts.map(acc => ({
      ...acc,
      createdAt: acc.createdAt.toISOString(),
    }));

    return NextResponse.json({ accounts: accountsWithIsoTimestamps });
  } catch (error) {
    console.error('Error fetching linked accounts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}