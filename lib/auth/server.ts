import { db } from '@/lib/db/drizzle';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function checkUserDeleted(userId: string): Promise<boolean> {
  const result = await db
    .select({ deletedAt: user.deletedAt })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  
  return !!result[0]?.deletedAt;
}

export async function checkUserDeletedByEmail(email: string): Promise<boolean> {
  const result = await db
    .select({ deletedAt: user.deletedAt })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  
  return !!result[0]?.deletedAt;
}
