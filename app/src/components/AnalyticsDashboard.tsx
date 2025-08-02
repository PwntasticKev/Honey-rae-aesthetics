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
  TrendingUp,
  Users,
  Calendar,
  MessageSquare,
  Camera,
  Zap,
  BarChart3,
  Activity,
} from "lucide-react";

interface AnalyticsDashboardProps {
  orgId: string;
}

export function AnalyticsDashboard({ orgId }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState("30d");

  // Mock data
  const stats = {
    totalClients: 156,
    newClients: 23,
    appointments: 89,
    messagesSent: 234,
    photosUploaded: 67,
    workflowsTriggered: 45,
    revenue: 12500,
    growth: 12.5,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Analytics</h2>
          <p className="text-muted-foreground">
            Track your practice performance and insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass border-pink-200/50 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4" data-theme-aware="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold gradient-text">
              {stats.totalClients}
            </div>
            <p className="text-xs text-muted-foreground">
              +{stats.newClients} new this month
            </p>
          </CardContent>
        </Card>

        <Card className="glass border-pink-200/50 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4" data-theme-aware="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold gradient-text">
              {stats.appointments}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.growth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="glass border-pink-200/50 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <MessageSquare className="h-4 w-4" data-theme-aware="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold gradient-text">
              {stats.messagesSent}
            </div>
            <p className="text-xs text-muted-foreground">+8% from last week</p>
          </CardContent>
        </Card>

        <Card className="glass border-pink-200/50 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4" data-theme-aware="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold gradient-text">
              ${stats.revenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +{stats.growth}% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Growth Chart */}
        <Card className="glass border-pink-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" data-theme-aware="true" />
              Client Growth
            </CardTitle>
            <CardDescription>
              New client registrations over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Chart visualization would go here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Overview */}
        <Card className="glass border-pink-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" data-theme-aware="true" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest actions and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div
                  className="w-2 h-2 rounded-full"
                  data-theme-aware="true"
                ></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New client added</p>
                  <p className="text-xs text-muted-foreground">
                    Sarah Johnson • 2 hours ago
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div
                  className="w-2 h-2 rounded-full"
                  data-theme-aware="true"
                ></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Appointment scheduled</p>
                  <p className="text-xs text-muted-foreground">
                    Michael Chen • 4 hours ago
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div
                  className="w-2 h-2 rounded-full"
                  data-theme-aware="true"
                ></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Message sent</p>
                  <p className="text-xs text-muted-foreground">
                    Welcome message • 6 hours ago
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div
                  className="w-2 h-2 rounded-full"
                  data-theme-aware="true"
                ></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Workflow triggered</p>
                  <p className="text-xs text-muted-foreground">
                    Google Review Request • 8 hours ago
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-pink-200/50">
          <CardHeader>
            <CardTitle className="text-sm">Photo Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Camera className="h-8 w-8" data-theme-aware="true" />
              <div>
                <div className="text-2xl font-bold">{stats.photosUploaded}</div>
                <p className="text-xs text-muted-foreground">Photos uploaded</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-pink-200/50">
          <CardHeader>
            <CardTitle className="text-sm">Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8" data-theme-aware="true" />
              <div>
                <div className="text-2xl font-bold">
                  {stats.workflowsTriggered}
                </div>
                <p className="text-xs text-muted-foreground">
                  Workflows triggered
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-pink-200/50">
          <CardHeader>
            <CardTitle className="text-sm">Growth Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8" data-theme-aware="true" />
              <div>
                <div className="text-2xl font-bold">+{stats.growth}%</div>
                <p className="text-xs text-muted-foreground">Monthly growth</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
