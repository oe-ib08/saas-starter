import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { session, activityLogs } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authSession = await auth.api.getSession({
      headers: request.headers
    });

    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get last login session
    const lastSession = await db.select({
      createdAt: session.createdAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    }).from(session)
      .where(eq(session.userId, authSession.user.id))
      .orderBy(desc(session.createdAt))
      .limit(1);

    // Get recent activity logs
    const recentEvents = await db.select().from(activityLogs)
      .where(eq(activityLogs.userId, authSession.user.id))
      .orderBy(desc(activityLogs.timestamp))
      .limit(10);

    // Mock security events (in a real app, you'd have a proper audit log)
    const mockEvents = [
      {
        id: '1',
        type: 'login' as const,
        timestamp: new Date().toISOString(),
        ipAddress: lastSession[0]?.ipAddress,
        success: true,
        location: 'New York, US' // Mock location
      },
      {
        id: '2',
        type: 'password_change' as const,
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        success: true,
      }
    ];

    // Calculate security score (mock calculation)
    let securityScore = 70;
    if (authSession.user.emailVerified) securityScore += 15;
    if (lastSession.length > 0) securityScore += 10;
    securityScore = Math.min(securityScore, 100);

    const response = {
      lastLogin: lastSession[0] ? {
        timestamp: lastSession[0].createdAt.toISOString(),
        ipAddress: lastSession[0].ipAddress,
        location: 'Unknown location' // In real app, use IP geolocation
      } : undefined,
      recentEvents: mockEvents,
      securityScore
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching security dashboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}