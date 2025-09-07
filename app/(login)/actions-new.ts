'use server';

import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  User,
  teams,
  teamMembers,
  activityLogs,
  invitations,
  ActivityType
} from '@/lib/db/schema';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { authClient } from '@/lib/auth-client';

async function logActivity(
  teamId: number | null | undefined,
  userId: string,
  action: string
) {
  if (teamId) {
    await db.insert(activityLogs).values({
      teamId,
      userId,
      action,
      timestamp: new Date()
    });
  }
}

// Team management schemas
const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address')
});

const removeTeamMemberSchema = z.object({
  memberId: z.string()
});

const inviteTeamMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['member', 'owner'])
});

// Account update action (placeholder - better-auth handles this)
export async function updateAccount(prevState: any, formData: FormData) {
  return { error: 'Account updates are handled by better-auth authentication system' };
}

// Password update action (placeholder - better-auth handles this)
export async function updatePassword(prevState: any, formData: FormData) {
  return { error: 'Password updates are handled by better-auth authentication system' };
}

// Delete account action (placeholder - better-auth handles this)
export async function deleteAccount(prevState: any, formData: FormData) {
  return { error: 'Account deletion is handled by better-auth authentication system' };
}

// Remove team member action
export async function removeTeamMember(prevState: any, formData: FormData) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const result = removeTeamMemberSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const { memberId } = result.data;

  try {
    // Find the team member to remove
    const memberToRemove = await db
      .select({
        id: teamMembers.id,
        teamId: teamMembers.teamId,
        userId: teamMembers.userId
      })
      .from(teamMembers)
      .where(eq(teamMembers.id, parseInt(memberId)))
      .limit(1);

    if (memberToRemove.length === 0) {
      return { error: 'Team member not found' };
    }

    // Check if the current user is the owner of the team
    const userTeamMembership = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, memberToRemove[0].teamId),
          eq(teamMembers.userId, user.id),
          eq(teamMembers.role, 'owner')
        )
      )
      .limit(1);

    if (userTeamMembership.length === 0) {
      return { error: 'Only team owners can remove members' };
    }

    // Remove the team member
    await db.delete(teamMembers).where(eq(teamMembers.id, parseInt(memberId)));

    // Log the activity
    await logActivity(
      memberToRemove[0].teamId,
      user.id,
      ActivityType.REMOVE_TEAM_MEMBER
    );

    return { success: 'Team member removed successfully' };
  } catch (error) {
    console.error('Remove team member error:', error);
    return { error: 'Failed to remove team member' };
  }
}

// Invite team member action
export async function inviteTeamMember(prevState: any, formData: FormData) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const result = inviteTeamMemberSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const { email, role } = result.data;

  try {
    // Get user's team
    const userTeamMembership = await db
      .select({
        teamId: teamMembers.teamId,
        role: teamMembers.role
      })
      .from(teamMembers)
      .where(eq(teamMembers.userId, user.id))
      .limit(1);

    if (userTeamMembership.length === 0) {
      return { error: 'You are not a member of any team' };
    }

    const teamId = userTeamMembership[0].teamId;

    // Check if the current user can invite (must be owner)
    if (userTeamMembership[0].role !== 'owner') {
      return { error: 'Only team owners can invite members' };
    }

    // Check if invitation already exists
    const existingInvitation = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.teamId, teamId),
          eq(invitations.email, email),
          eq(invitations.status, 'pending')
        )
      )
      .limit(1);

    if (existingInvitation.length > 0) {
      return { error: 'An invitation has already been sent to this email' };
    }

    // Create the invitation
    await db.insert(invitations).values({
      teamId,
      email,
      role,
      invitedBy: user.id,
      status: 'pending'
    });

    // Log the activity
    await logActivity(teamId, user.id, ActivityType.INVITE_TEAM_MEMBER);

    return { success: 'Team member invited successfully' };
  } catch (error) {
    console.error('Invite team member error:', error);
    return { error: 'Failed to invite team member' };
  }
}
