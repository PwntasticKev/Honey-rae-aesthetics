import Stripe from 'stripe';
import { stripe, STRIPE_CONFIG, isStripeConfigured, isDevelopment, formatCurrency } from './config';

export interface PaymentIntentData {
  amount: number;
  currency?: string;
  customerId?: string;
  appointmentId?: number;
  clientId?: number;
  orgId: number;
  description?: string;
  metadata?: Record<string, string>;
  paymentMethods?: Stripe.PaymentIntentCreateParams.PaymentMethodType[];
  returnUrl?: string;
}

export interface PaymentResult {
  paymentIntentId: string;
  clientSecret: string;
  status: string;
  amount: number;
  currency: string;
  paymentMethods: string[];
}

export interface RefundData {
  paymentIntentId: string;
  amount?: number; // Partial refund amount, if not provided will refund full amount
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  metadata?: Record<string, string>;
}

export interface CustomerData {
  email: string;
  name?: string;
  phone?: string;
  address?: Stripe.CustomerCreateParams.Address;
  metadata?: Record<string, string>;
}

export class PaymentService {
  /**
   * Create a payment intent for appointment booking
   */
  async createPaymentIntent(data: PaymentIntentData): Promise<PaymentResult> {
    try {
      if (isDevelopment && !isStripeConfigured()) {
        return this.mockCreatePaymentIntent(data);
      }

      const {
        amount,
        currency = STRIPE_CONFIG.currency,
        customerId,
        appointmentId,
        clientId,
        orgId,
        description,
        metadata = {},
        paymentMethods = STRIPE_CONFIG.paymentMethods,
        returnUrl,
      } = data;

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        customer: customerId,
        description: description || 'Appointment payment - Honey Rae Aesthetics',
        payment_method_types: paymentMethods,
        metadata: {
          ...metadata,
          appointmentId: appointmentId?.toString() || '',
          clientId: clientId?.toString() || '',
          orgId: orgId.toString(),
          platform: 'honey-rae-aesthetics',
        },
        automatic_payment_methods: {
          enabled: true,
        },
        ...(returnUrl && { return_url: returnUrl }),
      });

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paymentMethods: paymentIntent.payment_method_types,
      };
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Retrieve payment intent details
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      if (isDevelopment && !isStripeConfigured()) {
        return this.mockGetPaymentIntent(paymentIntentId);
      }

      return await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error: any) {
      console.error('Error retrieving payment intent:', error);
      throw new Error(`Failed to retrieve payment intent: ${error.message}`);
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      if (isDevelopment && !isStripeConfigured()) {
        return this.mockConfirmPaymentIntent(paymentIntentId, paymentMethodId);
      }

      return await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
        return_url: `${STRIPE_CONFIG.business.website}/payment/success`,
      });
    } catch (error: any) {
      console.error('Error confirming payment intent:', error);
      throw new Error(`Failed to confirm payment: ${error.message}`);
    }
  }

  /**
   * Cancel a payment intent
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      if (isDevelopment && !isStripeConfigured()) {
        return this.mockCancelPaymentIntent(paymentIntentId);
      }

      return await stripe.paymentIntents.cancel(paymentIntentId);
    } catch (error: any) {
      console.error('Error canceling payment intent:', error);
      throw new Error(`Failed to cancel payment: ${error.message}`);
    }
  }

  /**
   * Create a refund
   */
  async createRefund(data: RefundData): Promise<Stripe.Refund> {
    try {
      if (isDevelopment && !isStripeConfigured()) {
        return this.mockCreateRefund(data);
      }

      const { paymentIntentId, amount, reason = 'requested_by_customer', metadata = {} } = data;

      return await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
        reason,
        metadata: {
          ...metadata,
          platform: 'honey-rae-aesthetics',
          refundedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('Error creating refund:', error);
      throw new Error(`Failed to create refund: ${error.message}`);
    }
  }

  /**
   * Create or retrieve a customer
   */
  async createCustomer(data: CustomerData): Promise<Stripe.Customer> {
    try {
      if (isDevelopment && !isStripeConfigured()) {
        return this.mockCreateCustomer(data);
      }

      // Check if customer already exists
      const existingCustomers = await stripe.customers.list({
        email: data.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0];
      }

      // Create new customer
      return await stripe.customers.create({
        email: data.email,
        name: data.name,
        phone: data.phone,
        address: data.address,
        metadata: {
          ...data.metadata,
          platform: 'honey-rae-aesthetics',
          createdAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('Error creating customer:', error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      if (isDevelopment && !isStripeConfigured()) {
        return this.mockGetCustomer(customerId);
      }

      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted) {
        throw new Error('Customer was deleted');
      }
      return customer as Stripe.Customer;
    } catch (error: any) {
      console.error('Error retrieving customer:', error);
      throw new Error(`Failed to retrieve customer: ${error.message}`);
    }
  }

  /**
   * Update customer information
   */
  async updateCustomer(
    customerId: string,
    data: Partial<CustomerData>
  ): Promise<Stripe.Customer> {
    try {
      if (isDevelopment && !isStripeConfigured()) {
        return this.mockUpdateCustomer(customerId, data);
      }

      return await stripe.customers.update(customerId, {
        ...data,
        metadata: {
          ...data.metadata,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('Error updating customer:', error);
      throw new Error(`Failed to update customer: ${error.message}`);
    }
  }

  /**
   * List customer's payment methods
   */
  async getCustomerPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      if (isDevelopment && !isStripeConfigured()) {
        return this.mockGetCustomerPaymentMethods(customerId);
      }

      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error: any) {
      console.error('Error retrieving payment methods:', error);
      throw new Error(`Failed to retrieve payment methods: ${error.message}`);
    }
  }

  /**
   * Calculate service price with fees
   */
  calculateServicePrice(
    serviceType: keyof typeof STRIPE_CONFIG.serviceCategories,
    customAmount?: number
  ): {
    baseAmount: number;
    fees: {
      subtotal: number;
      platformFee: number;
      stripeFee: number;
      total: number;
    };
    formattedPrice: string;
  } {
    const baseAmount = customAmount || STRIPE_CONFIG.serviceCategories[serviceType].defaultPrice;
    const fees = this.calculateFees(baseAmount);
    
    return {
      baseAmount,
      fees,
      formattedPrice: formatCurrency(baseAmount),
    };
  }

  /**
   * Create setup intent for saving payment method
   */
  async createSetupIntent(customerId: string): Promise<{
    setupIntentId: string;
    clientSecret: string;
  }> {
    try {
      if (isDevelopment && !isStripeConfigured()) {
        return this.mockCreateSetupIntent(customerId);
      }

      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
      });

      return {
        setupIntentId: setupIntent.id,
        clientSecret: setupIntent.client_secret!,
      };
    } catch (error: any) {
      console.error('Error creating setup intent:', error);
      throw new Error(`Failed to create setup intent: ${error.message}`);
    }
  }

  // Private helper methods
  private calculateFees(amount: number) {
    const platformFee = Math.round(amount * STRIPE_CONFIG.fees.platformFeePercent) + STRIPE_CONFIG.fees.platformFeeFixed;
    const stripeFee = Math.round(amount * STRIPE_CONFIG.fees.stripeFeePercent) + STRIPE_CONFIG.fees.stripeFeeFixed;
    
    return {
      subtotal: amount,
      platformFee,
      stripeFee,
      total: amount + platformFee + stripeFee,
    };
  }

  // Mock implementations for development
  private async mockCreatePaymentIntent(data: PaymentIntentData): Promise<PaymentResult> {
    console.log('💳 Mock Payment Intent Created:', {
      amount: formatCurrency(data.amount),
      appointmentId: data.appointmentId,
      clientId: data.clientId,
    });

    return {
      paymentIntentId: `pi_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      clientSecret: `pi_mock_${Date.now()}_secret_mock`,
      status: 'requires_payment_method',
      amount: data.amount,
      currency: data.currency || 'usd',
      paymentMethods: data.paymentMethods || ['card'],
    };
  }

  private async mockGetPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    console.log('💳 Mock Get Payment Intent:', paymentIntentId);
    
    return {
      id: paymentIntentId,
      amount: 10000,
      currency: 'usd',
      status: 'succeeded',
      created: Math.floor(Date.now() / 1000),
      metadata: { mock: 'true' },
    } as Stripe.PaymentIntent;
  }

  private async mockConfirmPaymentIntent(paymentIntentId: string, paymentMethodId: string): Promise<Stripe.PaymentIntent> {
    console.log('💳 Mock Confirm Payment:', { paymentIntentId, paymentMethodId });
    
    return {
      id: paymentIntentId,
      amount: 10000,
      currency: 'usd',
      status: 'succeeded',
      created: Math.floor(Date.now() / 1000),
      metadata: { mock: 'true', confirmed: 'true' },
    } as Stripe.PaymentIntent;
  }

  private async mockCancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    console.log('💳 Mock Cancel Payment:', paymentIntentId);
    
    return {
      id: paymentIntentId,
      amount: 10000,
      currency: 'usd',
      status: 'canceled',
      created: Math.floor(Date.now() / 1000),
      metadata: { mock: 'true', canceled: 'true' },
    } as Stripe.PaymentIntent;
  }

  private async mockCreateRefund(data: RefundData): Promise<Stripe.Refund> {
    console.log('💳 Mock Refund Created:', {
      paymentIntentId: data.paymentIntentId,
      amount: data.amount ? formatCurrency(data.amount) : 'Full refund',
      reason: data.reason,
    });

    return {
      id: `re_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      amount: data.amount || 10000,
      currency: 'usd',
      status: 'succeeded',
      payment_intent: data.paymentIntentId,
      reason: data.reason || 'requested_by_customer',
      created: Math.floor(Date.now() / 1000),
      metadata: { mock: 'true', ...data.metadata },
    } as Stripe.Refund;
  }

  private async mockCreateCustomer(data: CustomerData): Promise<Stripe.Customer> {
    console.log('💳 Mock Customer Created:', { email: data.email, name: data.name });
    
    return {
      id: `cus_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      email: data.email,
      name: data.name,
      phone: data.phone,
      address: data.address,
      created: Math.floor(Date.now() / 1000),
      metadata: { mock: 'true', ...data.metadata },
    } as Stripe.Customer;
  }

  private async mockGetCustomer(customerId: string): Promise<Stripe.Customer> {
    console.log('💳 Mock Get Customer:', customerId);
    
    return {
      id: customerId,
      email: 'mock@example.com',
      name: 'Mock Customer',
      created: Math.floor(Date.now() / 1000),
      metadata: { mock: 'true' },
    } as Stripe.Customer;
  }

  private async mockUpdateCustomer(customerId: string, data: Partial<CustomerData>): Promise<Stripe.Customer> {
    console.log('💳 Mock Update Customer:', { customerId, data });
    
    return {
      id: customerId,
      email: data.email || 'mock@example.com',
      name: data.name || 'Mock Customer',
      phone: data.phone,
      address: data.address,
      created: Math.floor(Date.now() / 1000),
      metadata: { mock: 'true', ...data.metadata },
    } as Stripe.Customer;
  }

  private async mockGetCustomerPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    console.log('💳 Mock Get Payment Methods:', customerId);
    
    return [
      {
        id: `pm_mock_${Date.now()}`,
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
        },
        created: Math.floor(Date.now() / 1000),
      } as Stripe.PaymentMethod,
    ];
  }

  private async mockCreateSetupIntent(customerId: string): Promise<{
    setupIntentId: string;
    clientSecret: string;
  }> {
    console.log('💳 Mock Setup Intent Created:', customerId);
    
    return {
      setupIntentId: `seti_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      clientSecret: `seti_mock_${Date.now()}_secret_mock`,
    };
  }
}

// Export singleton instance
export const paymentService = new PaymentService();