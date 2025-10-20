"use client";

import { useState, useEffect } from "react";
import { AuthWrapper } from "@/components/AuthWrapper";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Menu,
  CreditCard,
  Calendar,
  Settings,
  Download,
  Check,
  Star,
  Zap,
  Users,
  BarChart3,
  Headphones,
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  current?: boolean;
  popular?: boolean;
}

interface BillingInfo {
  currentPlan: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
  paymentMethod?: {
    type: string;
    last4: string;
    brand: string;
    expMonth: number;
    expYear: number;
  };
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'draft';
  date: string;
  dueDate?: string;
  description: string;
  downloadUrl?: string;
}

export default function BillingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingPlan, setChangingPlan] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    setTimeout(() => {
      setBillingInfo({
        currentPlan: 'professional',
        status: 'active',
        currentPeriodStart: '2025-10-01T00:00:00Z',
        currentPeriodEnd: '2025-11-01T00:00:00Z',
        cancelAtPeriodEnd: false,
        paymentMethod: {
          type: 'card',
          last4: '4242',
          brand: 'visa',
          expMonth: 12,
          expYear: 2026,
        },
      });

      setPlans([
        {
          id: 'basic',
          name: 'Basic',
          price: 2900,
          interval: 'month',
          features: ['Up to 100 clients', 'Basic analytics', 'Email support'],
        },
        {
          id: 'professional',
          name: 'Professional',
          price: 5900,
          interval: 'month',
          features: ['Up to 500 clients', 'Advanced analytics', 'SMS notifications', 'Priority support'],
          current: true,
          popular: true,
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          price: 9900,
          interval: 'month',
          features: ['Unlimited clients', 'Custom workflows', 'API access', 'Dedicated support'],
        },
      ]);

      setInvoices([
        {
          id: 'in_123456789',
          amount: 5900,
          currency: 'usd',
          status: 'paid',
          date: '2025-10-01T00:00:00Z',
          description: 'Professional Plan - October 2025',
          downloadUrl: '#',
        },
        {
          id: 'in_987654321',
          amount: 5900,
          currency: 'usd',
          status: 'paid',
          date: '2025-09-01T00:00:00Z',
          description: 'Professional Plan - September 2025',
          downloadUrl: '#',
        },
        {
          id: 'in_456789123',
          amount: 5900,
          currency: 'usd',
          status: 'paid',
          date: '2025-08-01T00:00:00Z',
          description: 'Professional Plan - August 2025',
          downloadUrl: '#',
        },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
      case 'past_due':
        return <Badge className="bg-red-100 text-red-800">Past Due</Badge>;
      case 'canceled':
        return <Badge className="bg-gray-100 text-gray-800">Canceled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getDaysUntilRenewal = () => {
    if (!billingInfo) return 0;
    const now = new Date();
    const endDate = new Date(billingInfo.currentPeriodEnd);
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handlePlanChange = async (planId: string) => {
    setChangingPlan(true);
    // Simulate API call
    setTimeout(() => {
      setChangingPlan(false);
      // Update current plan
      setPlans(plans.map(plan => ({
        ...plan,
        current: plan.id === planId,
      })));
      
      if (billingInfo) {
        setBillingInfo({
          ...billingInfo,
          currentPlan: planId,
        });
      }
    }, 2000);
  };

  const handleBillingPortal = () => {
    // This would redirect to Stripe billing portal
    window.open('#', '_blank');
  };

  if (loading) {
    return (
      <AuthWrapper>
        <div className="min-h-screen bg-white flex-center">
          <div className="spinner"></div>
        </div>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-white">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex-1 flex flex-col lg:ml-48">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between pl-0 pr-6 h-16">
              <div className="flex items-center space-x-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Billing</h1>
                  <p className="text-sm text-gray-600">Manage your subscription and billing</p>
                </div>
              </div>
              <Button
                onClick={handleBillingPortal}
                variant="outline"
                className="border-gray-300"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Billing Portal
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 section-padding">
            {/* Current Subscription */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <Card className="hover-lift">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Current Subscription
                      {getStatusBadge(billingInfo?.status || 'active')}
                    </CardTitle>
                    <CardDescription>
                      Your current plan and billing cycle
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-black">
                          {plans.find(p => p.id === billingInfo?.currentPlan)?.name || 'Professional'} Plan
                        </h3>
                        <p className="text-gray-600">
                          {formatCurrency(plans.find(p => p.id === billingInfo?.currentPlan)?.price || 5900)} per month
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Next billing date</p>
                        <p className="font-medium text-black">
                          {billingInfo ? formatDate(billingInfo.currentPeriodEnd) : 'Nov 1, 2025'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Billing cycle progress</span>
                        <span className="text-gray-600">{getDaysUntilRenewal()} days remaining</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>

                    {billingInfo?.cancelAtPeriodEnd && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <AlertCircle className="h-5 w-5 text-orange-600 mr-3" />
                          <div>
                            <p className="font-medium text-orange-800">Subscription Ending</p>
                            <p className="text-sm text-orange-700">
                              Your subscription will end on {billingInfo ? formatDate(billingInfo.currentPeriodEnd) : 'Nov 1, 2025'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="hover-lift">
                  <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                    <CardDescription>
                      Your default payment method
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {billingInfo?.paymentMethod ? (
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="font-medium text-black">
                            **** **** **** {billingInfo.paymentMethod.last4}
                          </p>
                          <p className="text-sm text-gray-600">
                            {billingInfo.paymentMethod.brand.toUpperCase()} • Expires {billingInfo.paymentMethod.expMonth}/{billingInfo.paymentMethod.expYear}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <CreditCard className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">No payment method</p>
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      className="w-full mt-4 border-gray-300"
                      onClick={handleBillingPortal}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Update
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Available Plans */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Available Plans</CardTitle>
                <CardDescription>
                  Choose the plan that best fits your practice
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`border rounded-lg p-6 relative ${
                        plan.current ? 'border-black bg-gray-50' : 'border-gray-200'
                      } ${plan.popular ? 'ring-2 ring-black' : ''}`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-black text-white">
                            <Star className="h-3 w-3 mr-1" />
                            Popular
                          </Badge>
                        </div>
                      )}
                      
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-semibold text-black">{plan.name}</h3>
                        <div className="mt-2">
                          <span className="text-3xl font-bold text-black">
                            {formatCurrency(plan.price)}
                          </span>
                          <span className="text-gray-600">/{plan.interval}</span>
                        </div>
                      </div>

                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <Check className="h-4 w-4 text-green-600 mr-3" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className={`w-full ${
                          plan.current
                            ? 'bg-gray-600 text-white cursor-default'
                            : 'bg-black text-white hover:bg-gray-800'
                        }`}
                        disabled={plan.current || changingPlan}
                        onClick={() => handlePlanChange(plan.id)}
                      >
                        {changingPlan ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        {plan.current ? 'Current Plan' : 'Upgrade'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Billing History</CardTitle>
                    <CardDescription>
                      View and download your invoices
                    </CardDescription>
                  </div>
                  <Button variant="outline" className="border-gray-300">
                    <Download className="h-4 w-4 mr-2" />
                    Download All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left font-semibold text-gray-900 px-4 py-3 border-b border-gray-200">
                          Invoice
                        </th>
                        <th className="text-left font-semibold text-gray-900 px-4 py-3 border-b border-gray-200">
                          Date
                        </th>
                        <th className="text-left font-semibold text-gray-900 px-4 py-3 border-b border-gray-200">
                          Amount
                        </th>
                        <th className="text-left font-semibold text-gray-900 px-4 py-3 border-b border-gray-200">
                          Status
                        </th>
                        <th className="text-left font-semibold text-gray-900 px-4 py-3 border-b border-gray-200">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 border-b border-gray-100">
                            <div>
                              <div className="font-medium text-black">{invoice.description}</div>
                              <div className="text-sm text-gray-500">{invoice.id}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 border-b border-gray-100">
                            {formatDate(invoice.date)}
                          </td>
                          <td className="px-4 py-3 border-b border-gray-100">
                            <span className="font-medium text-black">
                              {formatCurrency(invoice.amount, invoice.currency)}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-b border-gray-100">
                            <Badge className={
                              invoice.status === 'paid' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }>
                              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 border-b border-gray-100">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-300"
                              onClick={() => window.open(invoice.downloadUrl, '_blank')}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </AuthWrapper>
  );
}