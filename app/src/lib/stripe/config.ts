import Stripe from 'stripe';

// Stripe Configuration
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Validate Stripe credentials
if (!STRIPE_SECRET_KEY || !STRIPE_PUBLISHABLE_KEY) {
  console.warn("Stripe credentials not found. Payment features may not work in production.");
}

// Initialize Stripe client
export const stripe = new Stripe(STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2024-06-20',
  typescript: true,
});

// Stripe Configuration
export const STRIPE_CONFIG = {
  publishableKey: STRIPE_PUBLISHABLE_KEY,
  webhookSecret: STRIPE_WEBHOOK_SECRET,
  currency: 'usd',
  // Payment method types to accept
  paymentMethods: [
    'card',
    'apple_pay',
    'google_pay',
    'link',
  ] as Stripe.PaymentIntentCreateParams.PaymentMethodType[],
  // Countries where service is available
  allowedCountries: ['US', 'CA'],
  // Business information
  business: {
    name: 'Honey Rae Aesthetics',
    website: process.env.NEXTAUTH_URL || 'https://honeyraeasthetics.com',
    supportEmail: process.env.STRIPE_SUPPORT_EMAIL || 'support@honeyraeasthetics.com',
    supportPhone: process.env.STRIPE_SUPPORT_PHONE || '+1-555-0123',
  },
  // Fee structure
  fees: {
    // Platform fee percentage (for multi-tenant)
    platformFeePercent: 0.029, // 2.9%
    platformFeeFixed: 30, // $0.30 in cents
    // Stripe fees (for reference)
    stripeFeePercent: 0.029,
    stripeFeeFixed: 30,
  },
  // Subscription plans
  subscriptionPlans: {
    basic: {
      priceId: process.env.STRIPE_BASIC_PRICE_ID,
      amount: 2900, // $29.00 in cents
      interval: 'month' as Stripe.Price.Recurring.Interval,
      features: ['Up to 100 clients', 'Basic analytics', 'Email support'],
    },
    professional: {
      priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
      amount: 5900, // $59.00 in cents
      interval: 'month' as Stripe.Price.Recurring.Interval,
      features: ['Up to 500 clients', 'Advanced analytics', 'SMS notifications', 'Priority support'],
    },
    enterprise: {
      priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
      amount: 9900, // $99.00 in cents
      interval: 'month' as Stripe.Price.Recurring.Interval,
      features: ['Unlimited clients', 'Custom workflows', 'API access', 'Dedicated support'],
    },
  },
  // Service categories and pricing
  serviceCategories: {
    consultation: {
      name: 'Consultation',
      defaultPrice: 5000, // $50.00 in cents
      description: 'Initial consultation and skin analysis',
    },
    facial: {
      name: 'Facial Treatments',
      defaultPrice: 12000, // $120.00 in cents
      description: 'Various facial treatments and therapies',
    },
    injection: {
      name: 'Injectable Treatments',
      defaultPrice: 40000, // $400.00 in cents
      description: 'Botox, dermal fillers, and other injectables',
    },
    laser: {
      name: 'Laser Treatments',
      defaultPrice: 25000, // $250.00 in cents
      description: 'Laser hair removal, skin resurfacing, etc.',
    },
    skincare: {
      name: 'Skincare Products',
      defaultPrice: 5000, // $50.00 in cents
      description: 'Professional skincare products',
    },
    package: {
      name: 'Treatment Packages',
      defaultPrice: 50000, // $500.00 in cents
      description: 'Bundled treatment packages',
    },
  },
};

// Environment checks
export const isStripeConfigured = () => {
  return !!(STRIPE_SECRET_KEY && STRIPE_PUBLISHABLE_KEY);
};

export const isDevelopment = process.env.NODE_ENV === "development";

// Helper functions
export const formatCurrency = (amountInCents: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountInCents / 100);
};

export const calculateFees = (amount: number): {
  subtotal: number;
  platformFee: number;
  stripeFee: number;
  total: number;
} => {
  const platformFee = Math.round(amount * STRIPE_CONFIG.fees.platformFeePercent) + STRIPE_CONFIG.fees.platformFeeFixed;
  const stripeFee = Math.round(amount * STRIPE_CONFIG.fees.stripeFeePercent) + STRIPE_CONFIG.fees.stripeFeeFixed;
  
  return {
    subtotal: amount,
    platformFee,
    stripeFee,
    total: amount + platformFee + stripeFee,
  };
};

// Development mode fallbacks
if (isDevelopment && !isStripeConfigured()) {
  console.log("🔧 Development mode: Payment services will use mock implementations");
}

// Export webhook secret for webhook verification
export { STRIPE_WEBHOOK_SECRET };