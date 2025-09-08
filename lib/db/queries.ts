import { desc, and, eq, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, teamMembers, teams, user } from './schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function getUser() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return null;
    }

    // Return the better-auth user directly
    return session.user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId?: string | null;
    stripeProductId?: string | null;
    planName?: string | null;
    subscriptionStatus?: string;
  }
) {
  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date(),
    })
    .where(eq(teams.id, teamId));
}

export async function getUserWithTeam(userId: string) {
  const result = await db
    .select({
      user: user,
      teamId: teamMembers.teamId
    })
    .from(user)
    .leftJoin(teamMembers, eq(user.id, teamMembers.userId))
    .where(eq(user.id, userId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs() {
  const currentUser = await getUser();
  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: user.name
    })
    .from(activityLogs)
    .leftJoin(user, eq(activityLogs.userId, user.id))
    .where(eq(activityLogs.userId, currentUser.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getTeamForUser() {
  const currentUser = await getUser();
  if (!currentUser) {
    return null;
  }

  const result = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, currentUser.id),
    with: {
      team: {
        with: {
          teamMembers: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                }
              }
            }
          }
        }
      }
    }
  });

  return result?.team || null;
}

export async function logActivity(teamId: number, userId: string, action: string, ipAddress?: string) {
  await db.insert(activityLogs).values({
    teamId,
    userId,
    action,
    ipAddress,
  });
}

export async function getUserWithSubscription(userId: string) {
  const result = await db
    .select({
      user: user,
      team: teams
    })
    .from(user)
    .leftJoin(teamMembers, eq(user.id, teamMembers.userId))
    .leftJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(user.id, userId))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return {
    ...result[0].user,
    stripeSubscriptionId: result[0].team?.stripeSubscriptionId || null,
    stripeSubscriptionStatus: result[0].team?.subscriptionStatus || null,
    planName: result[0].team?.planName || 'Free'
  };
}

export async function createTeamForUser(name: string) {
  const currentUser = await getUser();
  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  const team = await db.transaction(async (tx) => {
    const [newTeam] = await tx
      .insert(teams)
      .values({ 
        name,
        planName: 'Free',
        subscriptionStatus: 'inactive'
      })
      .returning();

    await tx.insert(teamMembers).values({
      teamId: newTeam.id,
      userId: currentUser.id,
      role: 'owner',
    });

    // Return the team with members structure
    return {
      ...newTeam,
      teamMembers: [{
        id: 0, // temporary ID
        userId: currentUser.id,
        teamId: newTeam.id,
        role: 'owner',
        joinedAt: new Date(),
        user: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          image: currentUser.image || null,
        }
      }]
    };
  });

  return team;
}
