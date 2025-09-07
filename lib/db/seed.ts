import { stripe } from '../payments/stripe';
import { db } from './drizzle';
import { user, teams, teamMembers } from './schema';
// Note: Using better-auth for user management now, no password hashing needed

async function createStripeProducts() {
  console.log('Creating Stripe products and prices...');

  const baseProduct = await stripe.products.create({
    name: 'Base',
    description: 'Base subscription plan',
  });

  await stripe.prices.create({
    product: baseProduct.id,
    unit_amount: 800, // $8 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
  });

  const plusProduct = await stripe.products.create({
    name: 'Plus',
    description: 'Plus subscription plan',
  });

  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200, // $12 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
  });

  console.log('Stripe products and prices created successfully.');
}

async function seed() {
  // Note: User creation is now handled by better-auth authentication
  // Users will be created when they sign up through the application
  
  console.log('Skipping user creation - using better-auth for user management');

  // Create a default team that can be used for testing
  const [team] = await db
    .insert(teams)
    .values({
      name: 'Default Team',
    })
    .returning();

  console.log('Default team created.');

  // Note: Team members will be created when users sign up and access the application

  await createStripeProducts();
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
