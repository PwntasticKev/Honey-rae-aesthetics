import Stripe from 'stripe';
import { stripe, STRIPE_CONFIG, isStripeConfigured, isDevelopment } from './config';

export interface SubscriptionData {
  customerId: string;
  priceId: string;
  orgId: number;
  trialDays?: number;
  metadata?: Record<string, string>;
}

export interface SubscriptionResult {
  subscriptionId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  clientSecret?: string;
  latestInvoice?: {
    id: string;
    status: string;
    amount: number;
    paymentIntent?: {
      clientSecret: string;
    };
  };
}

export interface UsageData {
  subscriptionItemId: string;
  quantity: number;
  timestamp?: number;
  action?: 'increment' | 'set';
}

export class SubscriptionService {
  /**
   * Create a new subscription
   */
  async createSubscription(data: SubscriptionData): Promise<SubscriptionResult> {
    try {
      if (isDevelopment && !isStripeConfigured()) {
        return this.mockCreateSubscription(data);
      }

      const {
        customerId,
        priceId,
        orgId,
        trialDays,
        metadata = {},
      } = data;

      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          ...metadata,
          orgId: orgId.toString(),
          platform: 'honey-rae-aesthetics',
          createdAt: new Date().toISOString(),
        },
      };

      if (trialDays && trialDays > 0) {
        subscriptionData.trial_period_days = trialDays;
      }

      const subscription = await stripe.subscriptions.create(subscriptionData);

      return this.formatSubscriptionResult(subscription);
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      if (isDevelopment && !isStripeConfigured()) {
        return this.mockGetSubscription(subscriptionId);
      }

      return await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['latest_invoice.payment_intent', 'customer'],
      });
    } catch (error: any) {
      console.error('Error retrieving subscription:', error);
      throw new Error(`Failed to retrieve subscription: ${error.message}`);
    }
  }

  /**
   * Update subscription (change plan, quantity, etc.)
   */
  async updateSubscription(
    subscriptionId: string,
    updates: {
      priceId?: string;
      quantity?: number;
      prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
      metadata?: Record<string, string>;
    }
  ): Promise<SubscriptionResult> {
    try {
      if (isDevelopment && !isStripeConfigured()) {
        return this.mockUpdateSubscription(subscriptionId, updates);
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      const updateData: Stripe.SubscriptionUpdateParams = {
        expand: ['latest_invoice.payment_intent'],
        proration_behavior: updates.prorationBehavior || 'create_prorations',
        metadata: {
          ...subscription.metadata,
          ...updates.metadata,
          updatedAt: new Date().toISOString(),
        },
      };

      if (updates.priceId) {
        updateData.items = [
          {
            id: subscription.items.data[0].id,
            price: updates.priceId,
            ...(updates.quantity && { quantity: updates.quantity }),
          },
        ];
      } else if (updates.quantity) {
        updateData.items = [
          {
            id: subscription.items.data[0].id,
            quantity: updates.quantity,
          },
        ];
      }

      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, updateData);

      return this.formatSubscriptionResult(updatedSubscription);
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      throw new Error(`Failed to update subscription: ${error.message}`);
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<Stripe.Subscription> {
    try {
      if (isDevelopment && !isStripeConfigured()) {
        return this.mockCancelSubscription(subscriptionId, cancelAtPeriodEnd);
      }

      if (cancelAtPeriodEnd) {
        // Cancel at the end of the current period
        return await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
          metadata: {
            canceledAt: new Date().toISOString(),
            cancelAtPeriodEnd: 'true',
          },
        });
      } else {
        // Cancel immediately
        return await stripe.subscriptions.cancel(subscriptionId, {
          prorate: true,
        });
      }
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Resume a canceled subscription (if not yet ended)
   */
  async resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      if (isDevelopment && !isStripeConfigured()) {
        return this.mockResumeSubscription(subscriptionId);
      }

      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
        metadata: {
          resumedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('Error resuming subscription:', error);
      throw new Error(`Failed to resume subscription: ${error.message}`);
    }
  }

  /**
   * Get customer's active subscriptions
   */
  async getCustomerSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
    try {
      if (isDevelopment && !isStripeConfigured()) {
        return this.mockGetCustomerSubscriptions(customerId);
      }

      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        expand: ['data.latest_invoice'],
      });

      return subscriptions.data;
    } catch (error: any) {
      console.error('Error retrieving customer subscriptions:', error);
      throw new Error(`Failed to retrieve subscriptions: ${error.message}`);
    }
  }

  /**
   * Record usage for metered billing
   */
  async recordUsage(data: UsageData): Promise<Stripe.UsageRecord> {
    try {
      if (isDevelopment && !isStripeConfigured()) {
        return this.mockRecordUsage(data);
      }

      const { subscriptionItemId, quantity, timestamp, action = 'increment' } = data;

      return await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
        quantity,
        timestamp: timestamp || Math.floor(Date.now() / 1000),
        action,
      });
    } catch (error: any) {
      console.error('Error recording usage:', error);
      throw new Error(`Failed to record usage: ${error.message}`);
    }
  }

  /**
   * Get usage summaries for a subscription item
   */
  async getUsageSummaries(subscriptionItemId: string): Promise<Stripe.UsageRecordSummary[]> {
    try {
      if (isDevelopment && !isStripeConfigured()) {
        return this.mockGetUsageSummaries(subscriptionItemId);
      }

      const summaries = await stripe.subscriptionItems.listUsageRecordSummaries(subscriptionItemId);
      return summaries.data;
    } catch (error: any) {
      console.error('Error retrieving usage summaries:', error);
      throw new Error(`Failed to retrieve usage summaries: ${error.message}`);
    }
  }

  /**
   * Create a billing portal session
   */
  async createBillingPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<{ url: string }> {
    try {
      if (isDevelopment && !isStripeConfigured()) {
        return this.mockCreateBillingPortalSession(customerId, returnUrl);
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return { url: session.url };
    } catch (error: any) {
      console.error('Error creating billing portal session:', error);
      throw new Error(`Failed to create billing portal session: ${error.message}`);
    }
  }

  /**
   * Get upcoming invoice for a customer
   */
  async getUpcomingInvoice(customerId: string): Promise<Stripe.Invoice | null> {
    try {
      if (isDevelopment && !isStripeConfigured()) {
        return this.mockGetUpcomingInvoice(customerId);
      }

      try {
        return await stripe.invoices.retrieveUpcoming({ customer: customerId });
      } catch (error: any) {
        if (error.code === 'invoice_upcoming_none') {
          return null;
        }
        throw error;
      }
    } catch (error: any) {
      console.error('Error retrieving upcoming invoice:', error);
      throw new Error(`Failed to retrieve upcoming invoice: ${error.message}`);
    }
  }

  /**
   * Get subscription plans with pricing
   */
  getSubscriptionPlans() {
    return Object.entries(STRIPE_CONFIG.subscriptionPlans).map(([key, plan]) => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      priceId: plan.priceId,
      amount: plan.amount,
      interval: plan.interval,
      features: plan.features,
      formattedPrice: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(plan.amount / 100),
    }));
  }

  // Private helper methods
  private formatSubscriptionResult(subscription: Stripe.Subscription): SubscriptionResult {
    const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent;

    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      clientSecret: subscription.pending_setup_intent?.client_secret || undefined,
      latestInvoice: latestInvoice ? {
        id: latestInvoice.id,
        status: latestInvoice.status!,
        amount: latestInvoice.amount_due,
        paymentIntent: paymentIntent?.client_secret ? {
          clientSecret: paymentIntent.client_secret,
        } : undefined,
      } : undefined,
    };
  }

  // Mock implementations for development
  private async mockCreateSubscription(data: SubscriptionData): Promise<SubscriptionResult> {
    console.log('💳 Mock Subscription Created:', {
      customerId: data.customerId,
      priceId: data.priceId,
      orgId: data.orgId,
      trialDays: data.trialDays,
    });

    const now = new Date();
    const periodEnd = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now

    return {
      subscriptionId: `sub_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      status: data.trialDays ? 'trialing' : 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      clientSecret: `sub_mock_${Date.now()}_secret`,
      latestInvoice: {
        id: `in_mock_${Date.now()}`,
        status: 'paid',
        amount: STRIPE_CONFIG.subscriptionPlans.basic.amount,
      },
    };
  }

  private async mockGetSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    console.log('💳 Mock Get Subscription:', subscriptionId);
    
    const now = Math.floor(Date.now() / 1000);
    
    return {
      id: subscriptionId,
      status: 'active',
      current_period_start: now,
      current_period_end: now + (30 * 24 * 60 * 60), // 30 days
      items: {
        data: [{
          id: 'si_mock',
          price: {
            id: 'price_mock',
            unit_amount: STRIPE_CONFIG.subscriptionPlans.basic.amount,
          },
        }],
      },
      metadata: { mock: 'true' },
    } as Stripe.Subscription;
  }

  private async mockUpdateSubscription(subscriptionId: string, updates: any): Promise<SubscriptionResult> {
    console.log('💳 Mock Update Subscription:', { subscriptionId, updates });
    
    const now = new Date();
    
    return {
      subscriptionId,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)),
    };
  }

  private async mockCancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean): Promise<Stripe.Subscription> {
    console.log('💳 Mock Cancel Subscription:', { subscriptionId, cancelAtPeriodEnd });
    
    return {
      id: subscriptionId,
      status: cancelAtPeriodEnd ? 'active' : 'canceled',
      cancel_at_period_end: cancelAtPeriodEnd,
      canceled_at: cancelAtPeriodEnd ? null : Math.floor(Date.now() / 1000),
      metadata: { mock: 'true', canceled: 'true' },
    } as Stripe.Subscription;
  }

  private async mockResumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    console.log('💳 Mock Resume Subscription:', subscriptionId);
    
    return {
      id: subscriptionId,
      status: 'active',
      cancel_at_period_end: false,
      canceled_at: null,
      metadata: { mock: 'true', resumed: 'true' },
    } as Stripe.Subscription;
  }

  private async mockGetCustomerSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
    console.log('💳 Mock Get Customer Subscriptions:', customerId);
    
    return [
      {
        id: `sub_mock_${customerId}`,
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        metadata: { mock: 'true' },
      } as Stripe.Subscription,
    ];
  }

  private async mockRecordUsage(data: UsageData): Promise<Stripe.UsageRecord> {
    console.log('💳 Mock Record Usage:', data);
    
    return {
      id: `ur_mock_${Date.now()}`,
      quantity: data.quantity,
      timestamp: data.timestamp || Math.floor(Date.now() / 1000),
      subscription_item: data.subscriptionItemId,
    } as Stripe.UsageRecord;
  }

  private async mockGetUsageSummaries(subscriptionItemId: string): Promise<Stripe.UsageRecordSummary[]> {
    console.log('💳 Mock Get Usage Summaries:', subscriptionItemId);
    
    return [
      {
        id: `urs_mock_${Date.now()}`,
        total_usage: 100,
        period: {
          start: Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60),
          end: Math.floor(Date.now() / 1000),
        },
      } as Stripe.UsageRecordSummary,
    ];
  }

  private async mockCreateBillingPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
    console.log('💳 Mock Billing Portal Session:', { customerId, returnUrl });
    
    return {
      url: `${returnUrl}?mock_billing_portal=true&customer=${customerId}`,
    };
  }

  private async mockGetUpcomingInvoice(customerId: string): Promise<Stripe.Invoice | null> {
    console.log('💳 Mock Get Upcoming Invoice:', customerId);
    
    return {
      id: `in_mock_upcoming_${Date.now()}`,
      amount_due: STRIPE_CONFIG.subscriptionPlans.basic.amount,
      currency: 'usd',
      period_start: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      period_end: Math.floor(Date.now() / 1000) + (60 * 24 * 60 * 60),
      status: 'draft',
    } as Stripe.Invoice;
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();