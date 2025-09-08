import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const userResult = await db
      .select({ 
        id: user.id,
        deletedAt: user.deletedAt,
        email: user.email 
      })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!userResult[0]) {
      return NextResponse.json({ exists: false, deleted: false });
    }

    return NextResponse.json({ 
      exists: true, 
      deleted: !!userResult[0].deletedAt,
      deletedAt: userResult[0].deletedAt
    });

  } catch (error) {
    console.error('Error checking user status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
