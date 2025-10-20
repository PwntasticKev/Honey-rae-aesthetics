// Stripe Services Integration
export { stripe, STRIPE_CONFIG, isStripeConfigured, isDevelopment, formatCurrency, calculateFees, STRIPE_WEBHOOK_SECRET } from './config';
export { 
  paymentService, 
  type PaymentIntentData, 
  type PaymentResult, 
  type RefundData, 
  type CustomerData 
} from './payments';
export { 
  subscriptionService, 
  type SubscriptionData, 
  type SubscriptionResult, 
  type UsageData 
} from './subscriptions';

// Import required functions for the service class
import { stripe, STRIPE_CONFIG, isStripeConfigured, isDevelopment, formatCurrency, calculateFees } from './config';
import { paymentService } from './payments';
import { subscriptionService } from './subscriptions';

// Unified Stripe service interface
export class StripeService {
  constructor() {
    // Initialize any cross-service functionality here
  }

  // Payment operations
  get payments() {
    return paymentService;
  }

  // Subscription operations
  get subscriptions() {
    return subscriptionService;
  }

  // Health check for all Stripe services
  async healthCheck(): Promise<{
    configured: boolean;
    publishableKey: boolean;
    webhookSecret: boolean;
    developmentMode: boolean;
    services: {
      payments: boolean;
      subscriptions: boolean;
      webhooks: boolean;
    };
  }> {
    const configured = isStripeConfigured();
    
    return {
      configured,
      publishableKey: !!STRIPE_CONFIG.publishableKey,
      webhookSecret: !!STRIPE_CONFIG.webhookSecret,
      developmentMode: isDevelopment,
      services: {
        payments: true, // Mock or real services always work
        subscriptions: true,
        webhooks: !!STRIPE_CONFIG.webhookSecret,
      },
    };
  }

  // Get client configuration (safe for frontend)
  getClientConfig() {
    return {
      publishableKey: STRIPE_CONFIG.publishableKey,
      currency: STRIPE_CONFIG.currency,
      paymentMethods: STRIPE_CONFIG.paymentMethods,
      allowedCountries: STRIPE_CONFIG.allowedCountries,
      business: STRIPE_CONFIG.business,
      serviceCategories: Object.entries(STRIPE_CONFIG.serviceCategories).map(([key, category]) => ({
        id: key,
        name: category.name,
        description: category.description,
        defaultPrice: category.defaultPrice,
        formattedPrice: formatCurrency(category.defaultPrice),
      })),
      subscriptionPlans: subscriptionService.getSubscriptionPlans(),
    };
  }

  // Calculate total cost including fees
  calculateTotalCost(baseAmount: number): {
    baseAmount: number;
    fees: ReturnType<typeof calculateFees>;
    formattedAmounts: {
      base: string;
      platformFee: string;
      stripeFee: string;
      total: string;
    };
  } {
    const fees = calculateFees(baseAmount);
    
    return {
      baseAmount,
      fees,
      formattedAmounts: {
        base: formatCurrency(baseAmount),
        platformFee: formatCurrency(fees.platformFee),
        stripeFee: formatCurrency(fees.stripeFee),
        total: formatCurrency(fees.total),
      },
    };
  }

  // Validate webhook signature
  validateWebhookSignature(payload: string, signature: string): any {
    if (!STRIPE_CONFIG.webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    try {
      return stripe.webhooks.constructEvent(payload, signature, STRIPE_CONFIG.webhookSecret);
    } catch (error: any) {
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  }
}

// Export singleton instance
export const stripeService = new StripeService();