import { getUser } from '@/lib/db/queries';

// Mark this API route as dynamic since it requires authentication
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();
  return Response.json(user);
}
