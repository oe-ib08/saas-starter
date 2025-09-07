import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [prices, products] = await Promise.all([
      getStripePrices(),
      getStripeProducts(),
    ]);

    // Find the Optume Pro Plan product
    const optumePlan = products.find((product) => product.name === 'Optume Pro Plan');
    
    if (!optumePlan) {
      return NextResponse.json({ error: 'Optume Pro Plan not found' }, { status: 404 });
    }

    // Find the monthly and yearly prices for this product
    const monthlyPrice = prices.find((price) => 
      price.productId === optumePlan.id && price.interval === 'month'
    );
    const yearlyPrice = prices.find((price) => 
      price.productId === optumePlan.id && price.interval === 'year'
    );

    return NextResponse.json({
      monthlyPrice,
      yearlyPrice,
      product: optumePlan
    });
  } catch (error) {
    console.error('Error fetching pricing data:', error);
    return NextResponse.json({ error: 'Failed to fetch pricing data' }, { status: 500 });
  }
}
