'use client';

import { checkoutAction } from '@/lib/payments/actions';
import { Check } from 'lucide-react';
import { SubmitButton } from './submit-button';
import { useState } from 'react';

function PricingToggle({ 
  isYearly, 
  onToggle 
}: { 
  isYearly: boolean; 
  onToggle: (yearly: boolean) => void; 
}) {
  return (
    <div className="flex items-center justify-center gap-4 mb-12">
      <span className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
        Monthly
      </span>
      <button
        onClick={() => onToggle(!isYearly)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          isYearly ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isYearly ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
        Yearly
      </span>
      {isYearly && (
        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full font-medium ml-2">
          Save 17%
        </span>
      )}
    </div>
  );
}

function FreePlanCard() {
  return (
    <div className="bg-background border border-border rounded-2xl p-8 relative">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-muted-foreground mb-4">Free Plan</h3>
        <div className="mb-6">
          <span className="text-6xl font-bold text-foreground">Free</span>
        </div>
        <button className="w-full bg-foreground text-background py-3 px-6 rounded-lg font-medium hover:bg-foreground/90 transition-colors">
          Get started now
        </button>
      </div>
      
      <ul className="space-y-3">
        <li className="flex items-center text-sm text-muted-foreground">
          <Check className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
          Standard Essays
        </li>
        <li className="flex items-center text-sm text-muted-foreground">
          <Check className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
          Up to 4 Essay types
        </li>
        <li className="flex items-center text-sm text-muted-foreground">
          <Check className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
          Up to 2000 words per Essay
        </li>
        <li className="flex items-center text-sm text-muted-foreground">
          <Check className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
          Essay Tones (Academic, etc.)
        </li>
        <li className="flex items-center text-sm text-muted-foreground">
          <Check className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
          Academic Citation Formats (APA, etc.)
        </li>
        <li className="flex items-center text-sm text-muted-foreground">
          <Check className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
          Academic Levels (Master, etc.)
        </li>
        <li className="flex items-center text-sm text-muted-foreground">
          <Check className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
          Premium Features
        </li>
        <li className="flex items-center text-sm text-muted-foreground">
          <Check className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
          Priority Support
        </li>
      </ul>
    </div>
  );
}

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  // Your actual Stripe price IDs from your dashboard
  const MONTHLY_PRICE_ID = "price_1S4rOiBCVKaOb1T65Ap7daz4"; // $12/month
  const YEARLY_PRICE_ID = "price_1S4rOiBCVKaOb1T6Z1FWngHP";   // $120/year
  
  const monthlyPrice = 1200; // $12 in cents
  const yearlyPrice = 12000; // $120 in cents
  
  const selectedPriceId = isYearly ? YEARLY_PRICE_ID : MONTHLY_PRICE_ID;
  const displayPrice = isYearly ? Math.floor(yearlyPrice / 12) : monthlyPrice;

  return (
    <main className="min-h-screen bg-background px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            PRICING PLANS
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Choose the right pricing plan
          </h1>
          <p className="text-4xl md:text-5xl font-bold text-foreground">
            for your and your business
          </p>
        </div>

        {/* Pricing Toggle */}
        <PricingToggle isYearly={isYearly} onToggle={setIsYearly} />

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <FreePlanCard />
          
          {/* Optume Pro Plan */}
          <PricingCard
            name="Optume Pro Plan"
            price={displayPrice}
            features={[
              'Standard Essays',
              'Up to 4 Essay types',
              'Up to 2000 words per Essay',
              'Essay Tones (Academic, etc.)',
              'Academic Citation Formats (APA, etc.)',
              'Academic Levels (Master, etc.)',
              'Premium Features',
              'Priority Support',
            ]}
            priceId={selectedPriceId}
            isPopular={true}
            isYearly={isYearly}
            yearlyPrice={yearlyPrice}
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-12 space-y-2">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <span></span> Secured Payment by Stripe
          </p>
        </div>
      </div>
    </main>
  );
}

function PricingCard({
  name,
  price,
  features,
  priceId,
  isPopular,
  isYearly,
  yearlyPrice,
}: {
  name: string;
  price: number;
  features: string[];
  priceId?: string;
  isPopular?: boolean;
  isYearly?: boolean;
  yearlyPrice?: number;
}) {
  return (
    <div className={`relative rounded-2xl p-8 ${
      isPopular 
        ? 'bg-foreground text-background' 
        : 'bg-background border border-border'
    }`}>
      <div className="text-center mb-6">
        <h3 className={`text-lg font-medium mb-4 ${
          isPopular ? 'text-background' : 'text-muted-foreground'
        }`}>
          {name}
        </h3>
        
        <div className="mb-6">
          <span className={`text-6xl font-bold ${
            isPopular ? 'text-background' : 'text-foreground'
          }`}>
            ${price / 100}
          </span>
          <span className={`text-lg font-normal ${
            isPopular ? 'text-background/70' : 'text-muted-foreground'
          }`}>
            /month
          </span>
          {isYearly && yearlyPrice && (
            <div className={`text-sm mt-2 ${
              isPopular ? 'text-background/70' : 'text-muted-foreground'
            }`}>
              Billed annually (${yearlyPrice / 100}/year)
            </div>
          )}
        </div>
        
        <form action={checkoutAction}>
          <input type="hidden" name="priceId" value={priceId} />
          <button className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
            isPopular
              ? 'bg-background text-foreground hover:bg-background/90'
              : 'bg-foreground text-background hover:bg-foreground/90'
          }`}>
            Get started now
          </button>
        </form>
      </div>
      
      <ul className="space-y-3">
        {features.map((feature, index) => (
          <li key={index} className={`flex items-center text-sm ${
            isPopular ? 'text-background/80' : 'text-muted-foreground'
          }`}>
            <Check className={`h-4 w-4 mr-3 flex-shrink-0 ${
              isPopular ? 'text-background' : 'text-primary'
            }`} />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
