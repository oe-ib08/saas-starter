import { getTeamForUser, createTeamForUser } from '@/lib/db/queries';
import { getUser } from '@/lib/db/queries';

// Mark this API route as dynamic since it requires authentication
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if user is authenticated first
    const user = await getUser();
    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let team = await getTeamForUser();
    
    // If user doesn't have a team, create one automatically
    if (!team) {
      team = await createTeamForUser('My Team');
    }
    
    return Response.json(team);
  } catch (error) {
    console.error('Error in team API:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
