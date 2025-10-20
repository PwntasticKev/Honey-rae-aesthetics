import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripeService } from "@/lib/stripe";

// GET /api/payments/config - Get Stripe configuration for client-side
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get client-safe Stripe configuration
    const config = stripeService.getClientConfig();

    // Get health check
    const healthCheck = await stripeService.healthCheck();

    return NextResponse.json({
      message: "Stripe configuration retrieved successfully",
      config: {
        publishableKey: config.publishableKey,
        currency: config.currency,
        paymentMethods: config.paymentMethods,
        allowedCountries: config.allowedCountries,
        business: config.business,
        serviceCategories: config.serviceCategories,
        subscriptionPlans: config.subscriptionPlans,
      },
      status: {
        configured: healthCheck.configured,
        developmentMode: healthCheck.developmentMode,
        services: healthCheck.services,
      },
    });

  } catch (error: any) {
    console.error("Error retrieving Stripe config:", error);
    return NextResponse.json(
      { error: "Failed to retrieve Stripe configuration", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/payments/config - Calculate pricing for services
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount } = body;

    if (!amount || amount < 50) {
      return NextResponse.json(
        { error: "Amount must be at least $0.50" },
        { status: 400 }
      );
    }

    // Calculate total cost including fees
    const calculation = stripeService.calculateTotalCost(amount);

    return NextResponse.json({
      message: "Price calculation completed",
      calculation,
    });

  } catch (error: any) {
    console.error("Error calculating pricing:", error);
    return NextResponse.json(
      { error: "Failed to calculate pricing", details: error.message },
      { status: 500 }
    );
  }
}