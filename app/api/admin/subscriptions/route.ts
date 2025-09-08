import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { user as userTable } from '@/lib/db/schema';
import { eq, desc, like, or, and, isNull, isNotNull } from 'drizzle-orm';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

// Helper function to check if user is admin
async function isAdminUser(session: any) {
  if (!session?.user?.id) return false;
  return session.user.email === 'admin@example.com' || session.user.role === 'admin';
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isAdminUser(session))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all'; // all, active, inactive, canceled
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query conditions
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          like(userTable.name, `%${search}%`),
          like(userTable.email, `%${search}%`)
        )
      );
    }

    // Filter by subscription status
    if (status === 'active') {
      conditions.push(eq(userTable.subscriptionStatus, 'active'));
    } else if (status === 'inactive') {
      conditions.push(
        or(
          isNull(userTable.subscriptionStatus),
          eq(userTable.subscriptionStatus, 'incomplete'),
          eq(userTable.subscriptionStatus, 'incomplete_expired')
        )
      );
    } else if (status === 'canceled') {
      conditions.push(
        or(
          eq(userTable.subscriptionStatus, 'canceled'),
          eq(userTable.subscriptionStatus, 'past_due'),
          eq(userTable.subscriptionStatus, 'unpaid')
        )
      );
    }

    // Exclude deleted users from subscription management
    conditions.push(isNull(userTable.deletedAt));

    const whereClause = conditions.length > 0 ? and(...conditions) : isNull(userTable.deletedAt);

    // Get users with subscription data
    const users = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        role: userTable.role,
        stripeCustomerId: userTable.stripeCustomerId,
        stripeSubscriptionId: userTable.stripeSubscriptionId,
        stripeProductId: userTable.stripeProductId,
        subscriptionStatus: userTable.subscriptionStatus,
        createdAt: userTable.createdAt,
        updatedAt: userTable.updatedAt,
      })
      .from(userTable)
      .where(whereClause)
      .orderBy(desc(userTable.createdAt))
      .limit(limit)
      .offset(offset);

    // Enhance users with Stripe subscription details
    const usersWithSubscriptionDetails = await Promise.all(
      users.map(async (user) => {
        let subscriptionDetails = null;
        let customerDetails = null;

        try {
          // Get Stripe customer details
          if (user.stripeCustomerId) {
            customerDetails = await stripe.customers.retrieve(user.stripeCustomerId);
          }

          // Get Stripe subscription details
          if (user.stripeSubscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
              expand: ['items.data.price.product']
            });
            
            subscriptionDetails = {
              id: subscription.id,
              status: subscription.status,
              currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
              currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
              cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
              canceledAt: (subscription as any).canceled_at ? new Date((subscription as any).canceled_at * 1000) : null,
              amount: (subscription as any).items.data[0]?.price.unit_amount || 0,
              currency: (subscription as any).items.data[0]?.price.currency || 'usd',
              interval: (subscription as any).items.data[0]?.price.recurring?.interval || 'month',
              productName: (subscription as any).items.data[0]?.price.product?.name || 'Unknown Product',
              trialEnd: (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000) : null,
            };
          }
        } catch (error) {
          console.error(`Error fetching Stripe data for user ${user.id}:`, error);
        }

        return {
          ...user,
          subscriptionDetails,
          customerDetails: customerDetails ? {
            id: customerDetails.id,
            created: new Date((customerDetails as any).created * 1000),
            defaultPaymentMethod: (customerDetails as any).default_payment_method,
          } : null,
        };
      })
    );

    // Get summary statistics
    const stats = {
      total: users.length,
      activeSubscriptions: users.filter(u => u.subscriptionStatus === 'active').length,
      canceledSubscriptions: users.filter(u => ['canceled', 'past_due', 'unpaid'].includes(u.subscriptionStatus || '')).length,
      totalRevenue: 0, // Will be calculated from Stripe data
    };

    return NextResponse.json({
      users: usersWithSubscriptionDetails,
      stats,
      hasMore: users.length === limit
    });

  } catch (error) {
    console.error('Error fetching subscription data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isAdminUser(session))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, userId, subscriptionId, ...actionData } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user data
    const user = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = user[0];

    switch (action) {
      case 'cancel_subscription':
        if (!userData.stripeSubscriptionId) {
          return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
        }

        try {
          const subscription = await stripe.subscriptions.update(userData.stripeSubscriptionId, {
            cancel_at_period_end: true,
          });

          await db
            .update(userTable)
            .set({
              subscriptionStatus: subscription.status,
              updatedAt: new Date(),
            })
            .where(eq(userTable.id, userId));

          return NextResponse.json({
            success: true,
            message: 'Subscription will be canceled at the end of the current period',
            subscription: {
              id: subscription.id,
              status: subscription.status,
              cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
              currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
            }
          });
        } catch (stripeError) {
          console.error('Stripe cancellation error:', stripeError);
          return NextResponse.json({ error: 'Failed to cancel subscription in Stripe' }, { status: 500 });
        }

      case 'reactivate_subscription':
        if (!userData.stripeSubscriptionId) {
          return NextResponse.json({ error: 'No subscription found' }, { status: 400 });
        }

        try {
          const subscription = await stripe.subscriptions.update(userData.stripeSubscriptionId, {
            cancel_at_period_end: false,
          });

          await db
            .update(userTable)
            .set({
              subscriptionStatus: subscription.status,
              updatedAt: new Date(),
            })
            .where(eq(userTable.id, userId));

          return NextResponse.json({
            success: true,
            message: 'Subscription reactivated successfully',
            subscription: {
              id: subscription.id,
              status: subscription.status,
              cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
            }
          });
        } catch (stripeError) {
          console.error('Stripe reactivation error:', stripeError);
          return NextResponse.json({ error: 'Failed to reactivate subscription in Stripe' }, { status: 500 });
        }

      case 'immediate_cancel':
        if (!userData.stripeSubscriptionId) {
          return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
        }

        try {
          const subscription = await stripe.subscriptions.cancel(userData.stripeSubscriptionId);

          await db
            .update(userTable)
            .set({
              subscriptionStatus: 'canceled',
              stripeSubscriptionId: null,
              stripeProductId: null,
              updatedAt: new Date(),
            })
            .where(eq(userTable.id, userId));

          return NextResponse.json({
            success: true,
            message: 'Subscription canceled immediately',
            subscription: {
              id: subscription.id,
              status: subscription.status,
              canceledAt: new Date((subscription as any).canceled_at! * 1000),
            }
          });
        } catch (stripeError) {
          console.error('Stripe immediate cancellation error:', stripeError);
          return NextResponse.json({ error: 'Failed to cancel subscription immediately' }, { status: 500 });
        }

      case 'create_subscription':
        const { priceId, paymentMethodId } = actionData;
        
        if (!priceId) {
          return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
        }

        try {
          // Create or get Stripe customer
          let customerId = userData.stripeCustomerId;
          if (!customerId) {
            const customer = await stripe.customers.create({
              email: userData.email,
              name: userData.name,
              metadata: {
                userId: userData.id,
              },
            });
            customerId = customer.id;

            await db
              .update(userTable)
              .set({
                stripeCustomerId: customerId,
                updatedAt: new Date(),
              })
              .where(eq(userTable.id, userId));
          }

          // Create subscription
          const subscriptionData: any = {
            customer: customerId,
            items: [{ price: priceId }],
            metadata: {
              userId: userData.id,
            },
          };

          if (paymentMethodId) {
            subscriptionData.default_payment_method = paymentMethodId;
          }

          const subscription = await stripe.subscriptions.create(subscriptionData);

          await db
            .update(userTable)
            .set({
              stripeSubscriptionId: subscription.id,
              subscriptionStatus: subscription.status,
              stripeProductId: subscription.items.data[0].price.product as string,
              updatedAt: new Date(),
            })
            .where(eq(userTable.id, userId));

          return NextResponse.json({
            success: true,
            message: 'Subscription created successfully',
            subscription: {
              id: subscription.id,
              status: subscription.status,
              currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
            }
          });
        } catch (stripeError) {
          console.error('Stripe subscription creation error:', stripeError);
          return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error managing subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
