import { NextRequest, NextResponse } from "next/server";
import { stripeService, paymentService, subscriptionService } from "@/lib/stripe";

// GET /api/payments-test - Test Stripe integration
export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Testing Stripe Payment System Integration...");

    // Test 1: Health Check
    console.log("📋 Running health check...");
    const healthCheck = await stripeService.healthCheck();
    console.log("✅ Health check:", healthCheck);

    // Test 2: Get Client Config
    console.log("📋 Testing client configuration...");
    const clientConfig = stripeService.getClientConfig();
    console.log("✅ Client config retrieved:", {
      publishableKey: clientConfig.publishableKey ? "✓ Set" : "✗ Missing",
      currency: clientConfig.currency,
      paymentMethods: clientConfig.paymentMethods,
      subscriptionPlans: clientConfig.subscriptionPlans.length,
      serviceCategories: clientConfig.serviceCategories.length,
    });

    // Test 3: Price Calculation
    console.log("📋 Testing price calculation...");
    const priceCalculation = stripeService.calculateTotalCost(10000); // $100.00
    console.log("✅ Price calculation for $100.00:", priceCalculation.formattedAmounts);

    // Test 4: Mock Payment Intent Creation
    console.log("📋 Testing payment intent creation...");
    const paymentIntent = await paymentService.createPaymentIntent({
      amount: 5000, // $50.00
      currency: "usd",
      orgId: 1,
      description: "Test payment - Honey Rae Aesthetics",
      metadata: {
        test: "true",
        environment: "development",
      },
    });
    console.log("✅ Payment intent created:", {
      id: paymentIntent.paymentIntentId,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    });

    // Test 5: Mock Customer Creation
    console.log("📋 Testing customer creation...");
    const customer = await paymentService.createCustomer({
      email: "test@honeyraeasthetics.com",
      name: "Test Customer",
      phone: "+1-555-0123",
      metadata: {
        test: "true",
        clientId: "123",
        orgId: "1",
      },
    });
    console.log("✅ Customer created:", {
      id: customer.id,
      email: customer.email,
      name: customer.name,
    });

    // Test 6: Mock Subscription Creation
    console.log("📋 Testing subscription creation...");
    const subscription = await subscriptionService.createSubscription({
      customerId: customer.id,
      priceId: "price_mock_basic",
      orgId: 1,
      trialDays: 7,
      metadata: {
        test: "true",
        plan: "basic",
      },
    });
    console.log("✅ Subscription created:", {
      id: subscription.subscriptionId,
      status: subscription.status,
      period: `${subscription.currentPeriodStart.toISOString()} - ${subscription.currentPeriodEnd.toISOString()}`,
    });

    // Test 7: Subscription Plans
    console.log("📋 Testing subscription plans...");
    const plans = subscriptionService.getSubscriptionPlans();
    console.log("✅ Subscription plans available:", plans.map(p => ({
      id: p.id,
      name: p.name,
      price: p.formattedPrice,
      interval: p.interval,
    })));

    // Test 8: Mock Setup Intent
    console.log("📋 Testing setup intent creation...");
    const setupIntent = await paymentService.createSetupIntent(customer.id);
    console.log("✅ Setup intent created:", {
      id: setupIntent.setupIntentId,
      clientSecret: setupIntent.clientSecret ? "✓ Generated" : "✗ Missing",
    });

    const results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      tests: {
        healthCheck: "✅ PASSED",
        clientConfig: "✅ PASSED",
        priceCalculation: "✅ PASSED",
        paymentIntent: "✅ PASSED",
        customerCreation: "✅ PASSED",
        subscriptionCreation: "✅ PASSED",
        subscriptionPlans: "✅ PASSED",
        setupIntent: "✅ PASSED",
      },
      summary: {
        totalTests: 8,
        passed: 8,
        failed: 0,
        status: "🎉 ALL TESTS PASSED",
      },
      data: {
        healthCheck,
        clientConfig: {
          ...clientConfig,
          publishableKey: clientConfig.publishableKey ? "[REDACTED]" : null,
        },
        priceCalculation,
        paymentIntent: {
          id: paymentIntent.paymentIntentId,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
        },
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
        },
        subscription: {
          id: subscription.subscriptionId,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
        },
        plans,
        setupIntent: {
          id: setupIntent.setupIntentId,
          hasClientSecret: !!setupIntent.clientSecret,
        },
      },
    };

    console.log("🎉 All Stripe integration tests completed successfully!");

    return NextResponse.json(results);

  } catch (error: any) {
    console.error("❌ Stripe integration test failed:", error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      status: "❌ TESTS FAILED",
      error: {
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      summary: {
        totalTests: 8,
        passed: 0,
        failed: 1,
        status: "❌ INTEGRATION TEST FAILED",
      },
    }, { status: 500 });
  }
}

// POST /api/payments-test - Test specific payment operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { test } = body;

    console.log(`🧪 Running specific test: ${test}`);

    let result;

    switch (test) {
      case 'payment_intent':
        result = await paymentService.createPaymentIntent({
          amount: body.amount || 5000,
          currency: body.currency || "usd",
          orgId: body.orgId || 1,
          description: "Specific test payment",
          metadata: { specificTest: "true" },
        });
        break;

      case 'customer':
        result = await paymentService.createCustomer({
          email: body.email || "specific-test@example.com",
          name: body.name || "Specific Test Customer",
          metadata: { specificTest: "true" },
        });
        break;

      case 'subscription':
        const testCustomer = await paymentService.createCustomer({
          email: "sub-test@example.com",
          name: "Subscription Test Customer",
        });
        
        result = await subscriptionService.createSubscription({
          customerId: testCustomer.id,
          priceId: body.priceId || "price_mock_basic",
          orgId: body.orgId || 1,
          trialDays: body.trialDays || 0,
        });
        break;

      case 'refund':
        // First create a payment intent
        const payment = await paymentService.createPaymentIntent({
          amount: 5000,
          currency: "usd",
          orgId: 1,
          description: "Payment for refund test",
        });

        result = await paymentService.createRefund({
          paymentIntentId: payment.paymentIntentId,
          amount: body.amount,
          reason: body.reason || 'requested_by_customer',
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid test type", availableTests: ['payment_intent', 'customer', 'subscription', 'refund'] },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `Test '${test}' completed successfully`,
      test,
      result,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error(`❌ Test '${request.url}' failed:`, error);
    
    return NextResponse.json({
      message: `Test failed`,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}