import { db } from './drizzle';
import { teams } from './schema';
import { eq } from 'drizzle-orm';

export async function setTestPlanData() {
  console.log('Setting test plan data...');
  
  try {
    // Get all teams
    const allTeams = await db.select().from(teams);
    
    if (allTeams.length === 0) {
      console.log('No teams found');
      return;
    }

    // Set different plans for testing
    const testPlans = ['Free', 'Basic', 'Plus', 'Pro', 'Premium'];
    
    for (let i = 0; i < allTeams.length && i < testPlans.length; i++) {
      await db
        .update(teams)
        .set({
          planName: testPlans[i],
          subscriptionStatus: testPlans[i] === 'Free' ? 'inactive' : 'active'
        })
        .where(eq(teams.id, allTeams[i].id));
      
      console.log(`Updated team ${allTeams[i].id} to ${testPlans[i]} plan`);
    }
    
    console.log('Test plan data set successfully');
  } catch (error) {
    console.error('Error setting test plan data:', error);
    throw error;
  }
}

// Run this if called directly
if (require.main === module) {
  setTestPlanData()
    .then(() => {
      console.log('Test plan setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test plan setup failed:', error);
      process.exit(1);
    });
}
