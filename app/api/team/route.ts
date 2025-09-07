import { getTeamForUser, createTeamForUser } from '@/lib/db/queries';

// Mark this API route as dynamic since it requires authentication
export const dynamic = 'force-dynamic';

export async function GET() {
  let team = await getTeamForUser();
  
  // If user doesn't have a team, create one automatically
  if (!team) {
    team = await createTeamForUser('My Team');
  }
  
  return Response.json(team);
}
