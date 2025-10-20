"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  CreditCard, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign,
  Users,
  Calendar,
  Building,
  Shield,
  MoreHorizontal,
  Eye,
  Edit,
  Pause,
  Play,
  X,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Filter
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Subscription {
  id: number;
  orgName: string;
  orgEmail: string;
  orgStatus: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  monthlyRevenue: number;
  maxUsers: number;
  currentUsers: number;
  usageScore: number;
  billingAmount: number;
  nextBillingDate: string;
  lastBillingDate: string;
  createdAt: string;
}

interface SubscriptionAnalytics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  cancelledSubscriptions: number;
  totalMonthlyRevenue: number;
  averageUsage: number;
  upcomingRenewals: number;
  overusageAlerts: number;
}

interface BillingAlert {
  id: string;
  type: string;
  severity: string;
  organization: string;
  message: string;
  action: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalSubscriptions: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [analytics, setAnalytics] = useState<SubscriptionAnalytics | null>(null);
  const [alerts, setAlerts] = useState<BillingAlert[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkAction, setBulkAction] = useState<"pause" | "resume" | "cancel" | "upgrade" | "downgrade">("pause");
  const [newTier, setNewTier] = useState<"basic" | "pro" | "enterprise">("pro");
  const [showAlerts, setShowAlerts] = useState(false);

  // Check master admin permission
  if (!user?.isMasterOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-red-500" />
              <span>Access Denied</span>
            </CardTitle>
            <CardDescription>
              You need master admin privileges to access subscription management.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Fetch subscriptions data
  const fetchSubscriptions = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter,
        tier: tierFilter,
        page: page.toString(),
        limit: "20",
      });

      const response = await fetch(`/api/master-admin/subscriptions?${params}`);
      const data = await response.json();

      if (response.ok) {
        setSubscriptions(data.subscriptions);
        setAnalytics(data.analytics);
        setAlerts(data.alerts);
        setPagination(data.pagination);
      } else {
        console.error("Failed to fetch subscriptions:", data.error);
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch subscriptions on component mount and when filters change
  useEffect(() => {
    fetchSubscriptions(1);
  }, [searchTerm, statusFilter, tierFilter]);

  // Handle subscription selection
  const toggleSubscriptionSelection = (subscriptionId: number) => {
    const newSelection = new Set(selectedSubscriptions);
    if (newSelection.has(subscriptionId)) {
      newSelection.delete(subscriptionId);
    } else {
      newSelection.add(subscriptionId);
    }
    setSelectedSubscriptions(newSelection);
  };

  const selectAllSubscriptions = () => {
    if (selectedSubscriptions.size === subscriptions.length) {
      setSelectedSubscriptions(new Set());
    } else {
      setSelectedSubscriptions(new Set(subscriptions.map(s => s.id)));
    }
  };

  // Handle bulk actions
  const handleBulkAction = async () => {
    if (selectedSubscriptions.size === 0) return;

    try {
      const requestBody: any = {
        action: bulkAction,
        subscriptionIds: Array.from(selectedSubscriptions),
      };

      if (bulkAction === "upgrade" || bulkAction === "downgrade") {
        requestBody.newTier = newTier;
      }

      const response = await fetch("/api/master-admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        setSelectedSubscriptions(new Set());
        setShowBulkActions(false);
        fetchSubscriptions(pagination?.page || 1);
      } else {
        console.error("Bulk action failed:", data.error);
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error performing bulk action:", error);
      alert("Failed to perform bulk action");
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "trial": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "expired": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Get tier badge color
  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "basic": return "bg-gray-100 text-gray-800";
      case "pro": return "bg-blue-100 text-blue-800";
      case "enterprise": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Get alert severity color
  const getAlertColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-red-50 text-red-800 border-red-200";
      case "medium": return "bg-yellow-50 text-yellow-800 border-yellow-200";
      case "low": return "bg-blue-50 text-blue-800 border-blue-200";
      default: return "bg-gray-50 text-gray-800 border-gray-200";
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading && !subscriptions.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-pink-500 mx-auto" />
          <p className="mt-2 text-gray-600">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
            <p className="text-gray-600">Monitor billing, usage, and subscription status</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowAlerts(true)}>
              <Bell className="h-4 w-4 mr-2" />
              Alerts ({alerts.length})
            </Button>
            <Button variant="outline" onClick={() => fetchSubscriptions(pagination?.page || 1)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Subscriptions</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalSubscriptions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.activeSubscriptions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(analytics.totalMonthlyRevenue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Avg Usage</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.averageUsage}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Trial</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.trialSubscriptions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-600">Cancelled</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.cancelledSubscriptions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Due Soon</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.upcomingRenewals}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-600">Usage Alerts</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.overusageAlerts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search organizations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>

              {selectedSubscriptions.size > 0 && (
                <Button variant="outline" onClick={() => setShowBulkActions(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Bulk Actions ({selectedSubscriptions.size})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Subscriptions ({subscriptions.length})</CardTitle>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  checked={selectedSubscriptions.size === subscriptions.length && subscriptions.length > 0}
                  onCheckedChange={selectAllSubscriptions}
                />
                <span className="text-sm text-gray-600">Select All</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Select</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Organization</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Plan</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Usage</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Revenue</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Next Billing</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {subscriptions.map((subscription) => (
                    <tr key={subscription.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedSubscriptions.has(subscription.id)}
                          onCheckedChange={() => toggleSubscriptionSelection(subscription.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{subscription.orgName}</p>
                          <p className="text-sm text-gray-500">{subscription.orgEmail}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getTierBadgeColor(subscription.subscriptionTier)}>
                          {subscription.subscriptionTier.charAt(0).toUpperCase() + subscription.subscriptionTier.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusBadgeColor(subscription.subscriptionStatus)}>
                          {subscription.subscriptionStatus.charAt(0).toUpperCase() + subscription.subscriptionStatus.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{subscription.currentUsers}/{subscription.maxUsers} users</span>
                            <span>{subscription.usageScore || 0}%</span>
                          </div>
                          <Progress value={subscription.usageScore || 0} className="h-2" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{formatCurrency(subscription.billingAmount)}</p>
                        <p className="text-sm text-gray-500">/month</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(subscription.nextBillingDate)}
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Subscription
                            </DropdownMenuItem>
                            {subscription.subscriptionStatus === "active" ? (
                              <DropdownMenuItem>
                                <Pause className="h-4 w-4 mr-2" />
                                Pause Subscription
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem>
                                <Play className="h-4 w-4 mr-2" />
                                Resume Subscription
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-600">
                              <X className="h-4 w-4 mr-2" />
                              Cancel Subscription
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalSubscriptions} total subscriptions)
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                disabled={!pagination.hasPrev}
                onClick={() => fetchSubscriptions(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={!pagination.hasNext}
                onClick={() => fetchSubscriptions(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Bulk Actions Dialog */}
        <Dialog open={showBulkActions} onOpenChange={setShowBulkActions}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Subscription Actions</DialogTitle>
              <DialogDescription>
                Perform actions on {selectedSubscriptions.size} selected subscriptions
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Select value={bulkAction} onValueChange={(value: any) => setBulkAction(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pause">Pause Subscriptions</SelectItem>
                  <SelectItem value="resume">Resume Subscriptions</SelectItem>
                  <SelectItem value="upgrade">Upgrade Tier</SelectItem>
                  <SelectItem value="downgrade">Downgrade Tier</SelectItem>
                  <SelectItem value="cancel">Cancel Subscriptions</SelectItem>
                </SelectContent>
              </Select>

              {(bulkAction === "upgrade" || bulkAction === "downgrade") && (
                <Select value={newTier} onValueChange={(value: any) => setNewTier(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic Plan</SelectItem>
                    <SelectItem value="pro">Pro Plan</SelectItem>
                    <SelectItem value="enterprise">Enterprise Plan</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {bulkAction === "cancel" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> This will cancel the selected subscriptions. 
                    Organizations will lose access at the end of their billing period.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkActions(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkAction}>
                Apply Action
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Billing Alerts Dialog */}
        <Dialog open={showAlerts} onOpenChange={setShowAlerts}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Billing Alerts</DialogTitle>
              <DialogDescription>
                Current billing and usage alerts across all subscriptions
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alerts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No active alerts</p>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${getAlertColor(alert.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">{alert.organization}</span>
                          <Badge className={getStatusBadgeColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm mb-2">{alert.message}</p>
                        <p className="text-xs opacity-75">Action: {alert.action.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAlerts(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}