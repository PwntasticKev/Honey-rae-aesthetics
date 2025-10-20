"use client";

import { useState, useEffect } from "react";
import { AuthWrapper } from "@/components/AuthWrapper";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  MessageSquare,
  Heart,
  BarChart3,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Star,
  Clock,
  Target,
} from "lucide-react";

interface AnalyticsData {
  overview: {
    totalClients: number;
    clientsGrowth: number;
    totalRevenue: number;
    revenueGrowth: number;
    appointmentsThisMonth: number;
    appointmentsGrowth: number;
    messagesGrowth: number;
    totalMessages: number;
  };
  clientMetrics: {
    newClients: number;
    returningClients: number;
    clientRetentionRate: number;
    averageClientValue: number;
  };
  appointmentMetrics: {
    completedAppointments: number;
    canceledAppointments: number;
    noShowRate: number;
    averageAppointmentValue: number;
  };
  revenueBreakdown: {
    consultations: number;
    treatments: number;
    products: number;
    packages: number;
  };
  topServices: Array<{
    name: string;
    bookings: number;
    revenue: number;
    growth: number;
  }>;
  clientSources: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    clients: number;
    revenue: number;
    appointments: number;
  }>;
}

export default function AnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    setTimeout(() => {
      setAnalytics({
        overview: {
          totalClients: 347,
          clientsGrowth: 12.5,
          totalRevenue: 48500,
          revenueGrowth: 18.2,
          appointmentsThisMonth: 156,
          appointmentsGrowth: 8.7,
          totalMessages: 892,
          messagesGrowth: 15.3,
        },
        clientMetrics: {
          newClients: 42,
          returningClients: 305,
          clientRetentionRate: 87.5,
          averageClientValue: 285,
        },
        appointmentMetrics: {
          completedAppointments: 134,
          canceledAppointments: 18,
          noShowRate: 3.2,
          averageAppointmentValue: 165,
        },
        revenueBreakdown: {
          consultations: 8500,
          treatments: 28500,
          products: 7200,
          packages: 4300,
        },
        topServices: [
          { name: 'Botox Treatment', bookings: 45, revenue: 18000, growth: 22.5 },
          { name: 'Facial Treatment', bookings: 38, revenue: 9500, growth: 15.8 },
          { name: 'Dermal Fillers', bookings: 28, revenue: 14000, growth: 31.2 },
          { name: 'Laser Hair Removal', bookings: 25, revenue: 6250, growth: 8.4 },
          { name: 'Chemical Peel', bookings: 22, revenue: 4400, growth: -5.2 },
        ],
        clientSources: [
          { source: 'Instagram', count: 87, percentage: 35.2 },
          { source: 'Referrals', count: 65, percentage: 26.3 },
          { source: 'Google Search', count: 42, percentage: 17.0 },
          { source: 'Facebook', count: 28, percentage: 11.3 },
          { source: 'TikTok', count: 18, percentage: 7.3 },
          { source: 'Other', count: 7, percentage: 2.8 },
        ],
        monthlyTrends: [
          { month: 'Jul', clients: 28, revenue: 32500, appointments: 118 },
          { month: 'Aug', clients: 35, revenue: 38200, appointments: 142 },
          { month: 'Sep', clients: 42, revenue: 41800, appointments: 156 },
          { month: 'Oct', clients: 39, revenue: 48500, appointments: 164 },
        ],
      });
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return 'Last 7 days';
      case '30d': return 'Last 30 days';
      case '90d': return 'Last 90 days';
      case '1y': return 'Last year';
      default: return 'Last 30 days';
    }
  };

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    format = 'number' 
  }: {
    title: string;
    value: number;
    change: number;
    icon: any;
    format?: 'number' | 'currency' | 'percentage';
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'currency': return formatCurrency(val);
        case 'percentage': return `${val}%`;
        default: return val.toLocaleString();
      }
    };

    return (
      <Card className="hover-lift">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          <Icon className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-black">{formatValue(value)}</div>
          <div className={`text-xs flex items-center ${
            change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {formatPercentage(change)} from last period
          </div>
        </CardContent>
      </Card>
    );
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
                  <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
                  <p className="text-sm text-gray-600">Business insights and performance metrics</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
                <Button variant="outline" className="border-gray-300">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" className="border-gray-300">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 section-padding">
            {/* Overview Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Clients"
                value={analytics?.overview.totalClients || 0}
                change={analytics?.overview.clientsGrowth || 0}
                icon={Users}
              />
              <MetricCard
                title="Total Revenue"
                value={analytics?.overview.totalRevenue || 0}
                change={analytics?.overview.revenueGrowth || 0}
                icon={DollarSign}
                format="currency"
              />
              <MetricCard
                title="Appointments"
                value={analytics?.overview.appointmentsThisMonth || 0}
                change={analytics?.overview.appointmentsGrowth || 0}
                icon={Calendar}
              />
              <MetricCard
                title="Messages Sent"
                value={analytics?.overview.totalMessages || 0}
                change={analytics?.overview.messagesGrowth || 0}
                icon={MessageSquare}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Client Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-600" />
                    Client Insights
                  </CardTitle>
                  <CardDescription>
                    Client acquisition and retention metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-black">
                        {analytics?.clientMetrics.newClients}
                      </div>
                      <div className="text-sm text-gray-600">New Clients</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-black">
                        {analytics?.clientMetrics.returningClients}
                      </div>
                      <div className="text-sm text-gray-600">Returning Clients</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Client Retention Rate</span>
                      <span className="font-medium text-black">
                        {analytics?.clientMetrics.clientRetentionRate}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Average Client Value</span>
                      <span className="font-medium text-black">
                        {formatCurrency(analytics?.clientMetrics.averageClientValue || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Appointment Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-600" />
                    Appointment Performance
                  </CardTitle>
                  <CardDescription>
                    Appointment completion and value metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-800">
                        {analytics?.appointmentMetrics.completedAppointments}
                      </div>
                      <div className="text-sm text-green-600">Completed</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-800">
                        {analytics?.appointmentMetrics.canceledAppointments}
                      </div>
                      <div className="text-sm text-red-600">Canceled</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">No-Show Rate</span>
                      <span className="font-medium text-black">
                        {analytics?.appointmentMetrics.noShowRate}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Average Appointment Value</span>
                      <span className="font-medium text-black">
                        {formatCurrency(analytics?.appointmentMetrics.averageAppointmentValue || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Revenue Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-gray-600" />
                    Revenue Breakdown
                  </CardTitle>
                  <CardDescription>
                    Revenue by service category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.revenueBreakdown && Object.entries(analytics.revenueBreakdown).map(([category, amount]) => {
                      const total = Object.values(analytics.revenueBreakdown).reduce((sum, val) => sum + val, 0);
                      const percentage = (amount / total) * 100;
                      
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-black capitalize">
                              {category}
                            </span>
                            <span className="text-sm text-gray-600">
                              {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-black h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Client Sources */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-gray-600" />
                    Client Acquisition Sources
                  </CardTitle>
                  <CardDescription>
                    Where your clients are coming from
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics?.clientSources.map((source, index) => (
                      <div key={source.source} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 rounded-full bg-black" style={{
                            backgroundColor: `hsl(${index * 45}, 50%, 40%)`
                          }}></div>
                          <span className="text-sm font-medium text-black">
                            {source.source}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-black">
                            {source.count}
                          </div>
                          <div className="text-xs text-gray-600">
                            {source.percentage}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Services */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-gray-600" />
                  Top Performing Services
                </CardTitle>
                <CardDescription>
                  Most popular services by bookings and revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left font-semibold text-gray-900 px-4 py-3 border-b border-gray-200">
                          Service
                        </th>
                        <th className="text-left font-semibold text-gray-900 px-4 py-3 border-b border-gray-200">
                          Bookings
                        </th>
                        <th className="text-left font-semibold text-gray-900 px-4 py-3 border-b border-gray-200">
                          Revenue
                        </th>
                        <th className="text-left font-semibold text-gray-900 px-4 py-3 border-b border-gray-200">
                          Growth
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics?.topServices.map((service, index) => (
                        <tr key={service.name} className="hover:bg-gray-50">
                          <td className="px-4 py-3 border-b border-gray-100">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                                {index + 1}
                              </div>
                              <span className="font-medium text-black">
                                {service.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 border-b border-gray-100">
                            <span className="font-medium text-black">
                              {service.bookings}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-b border-gray-100">
                            <span className="font-medium text-black">
                              {formatCurrency(service.revenue)}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-b border-gray-100">
                            <div className={`flex items-center ${
                              service.growth >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {service.growth >= 0 ? 
                                <TrendingUp className="h-3 w-3 mr-1" /> : 
                                <TrendingDown className="h-3 w-3 mr-1" />
                              }
                              {formatPercentage(service.growth)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-gray-600" />
                  Monthly Trends
                </CardTitle>
                <CardDescription>
                  Performance trends over the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {analytics?.monthlyTrends.map((month, index) => (
                    <div key={month.month} className="border-l-4 border-black pl-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-black">{month.month} 2025</h4>
                        <Badge className="bg-gray-100 text-gray-800">
                          {month.clients} new clients
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Revenue:</span>
                          <span className="ml-2 font-medium text-black">
                            {formatCurrency(month.revenue)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Appointments:</span>
                          <span className="ml-2 font-medium text-black">
                            {month.appointments}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Avg/Client:</span>
                          <span className="ml-2 font-medium text-black">
                            {formatCurrency(month.revenue / month.clients)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </AuthWrapper>
  );
}