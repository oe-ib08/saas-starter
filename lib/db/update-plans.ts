import { db } from './drizzle';
import { teams } from './schema';
import { isNull, eq, or } from 'drizzle-orm';

export async function updateTeamsWithPlans() {
  console.log('Updating existing teams with default plan data...');
  
  try {
    // Update all teams that don't have a plan set to "Free"
    const result = await db
      .update(teams)
      .set({
        planName: 'Free',
        subscriptionStatus: 'trialing'
      })
      .where(or(isNull(teams.planName), eq(teams.planName, '')));
    
    console.log('Successfully updated teams with default plan data');
    return result;
  } catch (error) {
    console.error('Error updating teams:', error);
    throw error;
  }
}

// Run this if called directly
if (require.main === module) {
  updateTeamsWithPlans()
    .then(() => {
      console.log('Plan update completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Plan update failed:', error);
      process.exit(1);
    });
}
