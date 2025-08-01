"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Download,
  Settings,
} from "lucide-react";

interface BillingManagerProps {
  orgId: string;
}

export function BillingManager({ orgId }: BillingManagerProps) {
  const [selectedPlan, setSelectedPlan] = useState("premium");

  // Mock data
  const billingData = {
    currentPlan: "Premium",
    nextBilling: "2024-08-15",
    amount: 99.0,
    usage: {
      sms: 2340,
      smsLimit: 5000,
      storage: 2.5,
      storageLimit: 10,
      clients: 156,
      clientsLimit: 500,
    },
    invoices: [
      { id: "1", date: "2024-07-15", amount: 99.0, status: "paid" },
      { id: "2", date: "2024-06-15", amount: 99.0, status: "paid" },
      { id: "3", date: "2024-05-15", amount: 99.0, status: "paid" },
    ],
  };

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: 29,
      features: [
        "Up to 100 clients",
        "500 SMS/month",
        "5GB storage",
        "Basic support",
      ],
      current: false,
    },
    {
      id: "premium",
      name: "Premium",
      price: 99,
      features: [
        "Up to 500 clients",
        "5000 SMS/month",
        "10GB storage",
        "Priority support",
        "Advanced analytics",
      ],
      current: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 299,
      features: [
        "Unlimited clients",
        "Unlimited SMS",
        "Unlimited storage",
        "24/7 support",
        "Custom integrations",
      ],
      current: false,
    },
  ];

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage > 90) return "text-red-600";
    if (percentage > 70) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Billing</h2>
          <p className="text-muted-foreground">
            Manage your subscription and billing information
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download Invoice
        </Button>
      </div>

      {/* Current Plan */}
      <Card className="glass border-pink-200/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" data-theme-aware="true" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">{billingData.currentPlan}</h3>
              <p className="text-muted-foreground">
                ${billingData.amount}/month
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Next billing</p>
              <p className="font-medium">{billingData.nextBilling}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-pink-200/50">
          <CardHeader>
            <CardTitle className="text-sm">SMS Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">
                  {billingData.usage.sms.toLocaleString()}
                </div>
                <p
                  className={`text-xs ${getUsageColor(getUsagePercentage(billingData.usage.sms, billingData.usage.smsLimit))}`}
                >
                  {getUsagePercentage(
                    billingData.usage.sms,
                    billingData.usage.smsLimit,
                  )}
                  % of limit
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-pink-200/50">
          <CardHeader>
            <CardTitle className="text-sm">Storage Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Settings className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {billingData.usage.storage}GB
                </div>
                <p
                  className={`text-xs ${getUsageColor(getUsagePercentage(billingData.usage.storage, billingData.usage.storageLimit))}`}
                >
                  {getUsagePercentage(
                    billingData.usage.storage,
                    billingData.usage.storageLimit,
                  )}
                  % of limit
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-pink-200/50">
          <CardHeader>
            <CardTitle className="text-sm">Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {billingData.usage.clients}
                </div>
                <p
                  className={`text-xs ${getUsageColor(getUsagePercentage(billingData.usage.clients, billingData.usage.clientsLimit))}`}
                >
                  {getUsagePercentage(
                    billingData.usage.clients,
                    billingData.usage.clientsLimit,
                  )}
                  % of limit
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Plans */}
      <Card className="glass border-pink-200/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" data-theme-aware="true" />
            Payment Plans
          </CardTitle>
          <CardDescription>
            Choose the plan that best fits your practice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${plan.current ? "ring-2 ring-pink-500" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {plan.current && (
                      <Badge className="bg-pink-100 text-pink-800">
                        Current
                      </Badge>
                    )}
                  </div>
                  <div className="text-3xl font-bold">
                    ${plan.price}
                    <span className="text-sm font-normal text-muted-foreground">
                      /month
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full mt-4"
                    data-theme-aware="true"
                    disabled={plan.current}
                  >
                    {plan.current ? "Current Plan" : "Upgrade"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      <Card className="glass border-pink-200/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" data-theme-aware="true" />
            Recent Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {billingData.invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">Invoice #{invoice.id}</p>
                  <p className="text-sm text-muted-foreground">
                    {invoice.date}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <p className="font-medium">${invoice.amount}</p>
                  <Badge
                    className={
                      invoice.status === "paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {invoice.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Warning */}
      {billingData.usage.sms > billingData.usage.smsLimit * 0.8 && (
        <Card className="glass border-yellow-200/50 bg-yellow-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">
                  SMS usage approaching limit
                </p>
                <p className="text-sm text-yellow-700">
                  You've used{" "}
                  {getUsagePercentage(
                    billingData.usage.sms,
                    billingData.usage.smsLimit,
                  )}
                  % of your SMS limit. Consider upgrading your plan to avoid
                  service interruption.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
