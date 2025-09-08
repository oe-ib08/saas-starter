import { getUser } from '@/lib/db/queries';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { user as userTable, userPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

// Mark this API route as dynamic since it requires authentication
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return Response.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get user preferences
    const preferences = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    const userWithPreferences = {
      ...user,
      theme: preferences[0]?.theme || 'light',
      notifications: {
        email: preferences[0]?.emailNotifications ?? true,
        push: preferences[0]?.pushNotifications ?? true,
        marketing: preferences[0]?.marketingEmails ?? false,
      }
    };

    return Response.json(userWithPreferences);
  } catch (error) {
    console.error('Error fetching user:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, image, theme, notifications } = body;

    // Update user basic info
    await db
      .update(userTable)
      .set({
        name,
        email,
        image,
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, session.user.id));

    // Update or create user preferences
    const existingPrefs = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1);

    if (existingPrefs.length > 0) {
      // Update existing preferences
      await db
        .update(userPreferences)
        .set({
          theme,
          emailNotifications: notifications.email,
          pushNotifications: notifications.push,
          marketingEmails: notifications.marketing,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, session.user.id));
    } else {
      // Create new preferences
      await db.insert(userPreferences).values({
        userId: session.user.id,
        theme,
        emailNotifications: notifications.email,
        pushNotifications: notifications.push,
        marketingEmails: notifications.marketing,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Soft delete the user by setting deletedAt timestamp
    await db
      .update(userTable)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, session.user.id));

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
