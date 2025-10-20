"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart3,
  Users,
  Building,
  CreditCard,
  Settings,
  Shield,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  Database,
  LogOut,
  Bell,
  Search,
  Menu,
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { NotificationDropdown } from "@/components/NotificationDropdown";

// Master Admin Dashboard - Cross-organization overview and management
export default function MasterAdminDashboard() {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Load master admin dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with real API call
      // const response = await fetch('/api/master-admin/dashboard');
      // const data = await response.json();
      
      // Mock data for now
      const mockData = {
        overview: {
          totalOrganizations: 24,
          totalUsers: 156,
          activeSubscriptions: 22,
          monthlyRevenue: 12450,
          systemHealth: "excellent",
          lastUpdate: new Date().toISOString(),
        },
        organizations: {
          active: 22,
          suspended: 2,
          pending: 1,
          growth: "+15% this month",
        },
        users: {
          total: 156,
          masterOwners: 3,
          admins: 25,
          managers: 48,
          staff: 80,
          activeToday: 89,
        },
        subscriptions: {
          active: 22,
          trial: 1,
          expired: 1,
          revenue: 12450,
          churn: "2.1%",
        },
        recentActivity: [
          {
            id: 1,
            type: "org_created",
            message: "New organization 'Bella Vista Spa' created",
            timestamp: "2 hours ago",
            severity: "info",
          },
          {
            id: 2,
            type: "subscription_renewed",
            message: "Subscription renewed for 'Elite Aesthetics'",
            timestamp: "4 hours ago",
            severity: "success",
          },
          {
            id: 3,
            type: "payment_failed",
            message: "Payment failed for 'Downtown Clinic'",
            timestamp: "6 hours ago",
            severity: "warning",
          },
        ],
        systemAlerts: [
          {
            id: 1,
            type: "performance",
            message: "Database response time increased by 15%",
            severity: "warning",
            action: "investigate",
          },
          {
            id: 2,
            type: "security",
            message: "3 failed login attempts detected",
            severity: "info",
            action: "monitor",
          },
        ],
      };
      
      setDashboardData(mockData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has master admin permissions
  if (!user?.isMasterOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-red-500" />
              <span>Access Denied</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              You don't have permission to access the Master Admin Portal.
            </p>
            <Button onClick={() => window.location.href = "/workflows"} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Master Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 h-16">
          <div className="flex items-center space-x-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Shield className="h-6 w-6 text-purple-600" />
                <span>Master Admin Portal</span>
              </h1>
              <p className="text-sm text-gray-600">
                System-wide management and oversight
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search organizations, users..."
                className="pl-10 pr-4 py-2 w-64 bg-gray-50 border border-gray-200 rounded-md focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {/* Notifications */}
            <NotificationDropdown />

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar || ""} />
                <AvatarFallback className="text-white bg-purple-600">
                  {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">{user?.name || "Master Admin"}</p>
                <p className="text-xs text-gray-500 flex items-center space-x-1">
                  <Shield className="h-3 w-3" />
                  <span>Master Owner</span>
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                title="Logout"
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Navigation Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "organizations", label: "Organizations", icon: Building },
              { id: "users", label: "Users", icon: Users },
              { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
              { id: "system", label: "System", icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-white text-orange-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Total Organizations</p>
                        <p className="text-3xl font-bold">{dashboardData.overview.totalOrganizations}</p>
                        <p className="text-blue-100 text-xs mt-1">{dashboardData.organizations.growth}</p>
                      </div>
                      <Building className="h-12 w-12 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Total Users</p>
                        <p className="text-3xl font-bold">{dashboardData.overview.totalUsers}</p>
                        <p className="text-green-100 text-xs mt-1">{dashboardData.users.activeToday} active today</p>
                      </div>
                      <Users className="h-12 w-12 text-green-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">Active Subscriptions</p>
                        <p className="text-3xl font-bold">{dashboardData.overview.activeSubscriptions}</p>
                        <p className="text-purple-100 text-xs mt-1">Churn: {dashboardData.subscriptions.churn}</p>
                      </div>
                      <CreditCard className="h-12 w-12 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm">Monthly Revenue</p>
                        <p className="text-3xl font-bold">${dashboardData.overview.monthlyRevenue.toLocaleString()}</p>
                        <p className="text-orange-100 text-xs mt-1">+12% from last month</p>
                      </div>
                      <TrendingUp className="h-12 w-12 text-orange-200" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Health & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Health */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-5 w-5" />
                      <span>System Health</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Overall Status</span>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Excellent
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Database</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{width: '95%'}}></div>
                            </div>
                            <span className="text-xs text-gray-500">95%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">API Response</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div className="bg-yellow-500 h-2 rounded-full" style={{width: '82%'}}></div>
                            </div>
                            <span className="text-xs text-gray-500">82%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Storage</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{width: '68%'}}></div>
                            </div>
                            <span className="text-xs text-gray-500">68%</span>
                          </div>
                        </div>
                      </div>

                      {/* System Alerts */}
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Active Alerts</h4>
                        <div className="space-y-2">
                          {dashboardData.systemAlerts.map((alert: any) => (
                            <div 
                              key={alert.id} 
                              className={`p-2 rounded text-xs flex items-center justify-between ${
                                alert.severity === 'warning' 
                                  ? 'bg-yellow-50 text-yellow-800' 
                                  : 'bg-blue-50 text-blue-800'
                              }`}
                            >
                              <span>{alert.message}</span>
                              <AlertTriangle className="h-3 w-3" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span>Recent Activity</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData.recentActivity.map((activity: any) => (
                        <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b last:border-b-0">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            activity.severity === 'success' 
                              ? 'bg-green-500' 
                              : activity.severity === 'warning'
                              ? 'bg-yellow-500'
                              : 'bg-blue-500'
                          }`}></div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{activity.message}</p>
                            <p className="text-xs text-gray-500">{activity.timestamp}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Button variant="outline" size="sm" className="w-full mt-4">
                      View All Activity
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col items-center justify-center space-y-2"
                      onClick={() => window.location.href = "/master-admin/organizations"}
                    >
                      <Plus className="h-6 w-6" />
                      <span className="text-sm">New Organization</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col items-center justify-center space-y-2"
                      onClick={() => window.location.href = "/master-admin/users"}
                    >
                      <Users className="h-6 w-6" />
                      <span className="text-sm">Manage Users</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                      <BarChart3 className="h-6 w-6" />
                      <span className="text-sm">View Reports</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                      <Settings className="h-6 w-6" />
                      <span className="text-sm">System Settings</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Organizations Tab */}
          {activeTab === "organizations" && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <Building className="h-16 w-16 mx-auto text-gray-400" />
                  <h3 className="text-lg font-medium">Organization Management</h3>
                  <p className="text-gray-600 mb-4">
                    Manage all organizations, view details, and configure settings.
                  </p>
                  <Button onClick={() => window.location.href = "/master-admin/organizations"}>
                    Go to Organizations
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <Users className="h-16 w-16 mx-auto text-gray-400" />
                  <h3 className="text-lg font-medium">User Management</h3>
                  <p className="text-gray-600 mb-4">
                    Manage users across all organizations, view permissions, and perform bulk actions.
                  </p>
                  <Button onClick={() => window.location.href = "/master-admin/users"}>
                    Go to User Management
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subscriptions Tab */}
          {activeTab === "subscriptions" && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <CreditCard className="h-16 w-16 mx-auto text-gray-400" />
                  <h3 className="text-lg font-medium">Subscription Management</h3>
                  <p className="text-gray-600 mb-4">
                    Monitor billing, usage tracking, and subscription status across all organizations.
                  </p>
                  <Button onClick={() => window.location.href = "/master-admin/subscriptions"}>
                    Go to Subscription Management
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Placeholder for other tabs */}
          {!["overview", "organizations", "users", "subscriptions"].includes(activeTab) && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <div className="text-4xl">🚧</div>
                  <h3 className="text-lg font-medium">Coming Soon</h3>
                  <p className="text-gray-600">
                    The {activeTab} section is currently under development.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}