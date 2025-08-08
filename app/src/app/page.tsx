"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Menu,
  Search,
  Bell,
  Heart,
  Calendar,
  MessageSquare,
  Camera,
  Zap,
  Activity,
  UserPlus,
  Workflow,
  Sparkles,
  LogOut,
  Users,
  Share2,
  BarChart3,
  CreditCard,
  Settings,
  FileText,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { GlobalSearch } from "@/components/GlobalSearch";
import { EnvironmentToggle } from "@/components/EnvironmentToggle";
import { notificationService } from "@/lib/notificationService";
import { AuthWrapper } from "@/components/AuthWrapper";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Add sample notifications on component mount
  // Temporarily disabled until Convex functions are deployed
  useEffect(() => {
    // Sample notifications temporarily disabled
  }, []);

  // Mock data for testing
  const [clients, setClients] = useState([
    {
      _id: "1",
      fullName: "Sarah Johnson",
      email: "sarah@example.com",
      phones: ["+15551234567"],
      gender: "female",
      tags: ["VIP", "returning"],
      referralSource: "Instagram",
      clientPortalStatus: "active",
      createdAt: Date.now() - 86400000 * 30,
    },
    {
      _id: "2",
      fullName: "Michael Chen",
      email: "michael@example.com",
      phones: ["+15559876543"],
      gender: "male",
      tags: ["consultation"],
      referralSource: "Referral",
      clientPortalStatus: "pending",
      createdAt: Date.now() - 86400000 * 7,
    },
  ]);
  const appointments = [
    {
      _id: "1",
      dateTime: Date.now(),
      type: "Consultation",
      provider: "Dr. Rae",
    },
    {
      _id: "2",
      dateTime: Date.now() + 86400000,
      type: "Treatment",
      provider: "Dr. Rae",
    },
  ];
  const files = [
    { _id: "1", filename: "before1.jpg", tag: "before" },
    { _id: "2", filename: "after1.jpg", tag: "after" },
  ];
  const messages = [
    { _id: "1", content: "Welcome message", status: "sent" },
    { _id: "2", content: "Follow-up reminder", status: "sent" },
  ];

  // Mock workflow data
  const [workflows, setWorkflows] = useState([
    {
      _id: "1",
      name: "Google Review Request",
      description:
        "Send a Google review request 15 minutes after appointment completion",
      trigger: "appointment_completed",
      enabled: true,
      steps: [
        {
          id: "1",
          type: "delay",
          config: { delayMinutes: 15 },
        },
        {
          id: "2",
          type: "send_message",
          config: {
            channel: "sms",
            message:
              "Hi {{first_name}}, thank you for your appointment today! We'd love if you could leave us a Google review. It really helps our practice grow. Thank you!",
          },
        },
      ],
      createdAt: Date.now() - 86400000 * 7,
      lastRun: Date.now() - 3600000,
      runCount: 12,
    },
    {
      _id: "2",
      name: "New Client Welcome",
      description: "Welcome new clients with a series of messages",
      trigger: "client_added",
      enabled: true,
      steps: [
        {
          id: "1",
          type: "send_message",
          config: {
            channel: "sms",
            message:
              "Welcome {{first_name}}! Thank you for choosing Honey Rae Aesthetics. We're excited to help you on your beauty journey!",
          },
        },
        {
          id: "2",
          type: "delay",
          config: { delayMinutes: 60 },
        },
        {
          id: "3",
          type: "send_message",
          config: {
            channel: "email",
            message:
              "Hi {{first_name}}, here's your welcome packet with everything you need to know about your upcoming appointment.",
          },
        },
      ],
      createdAt: Date.now() - 86400000 * 14,
      lastRun: Date.now() - 7200000,
      runCount: 8,
    },
  ]);

  // Calculate today's appointments
  const today = new Date();
  const todayAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.dateTime);
    return aptDate.toDateString() === today.toDateString();
  });
  const upcomingAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.dateTime);
    return aptDate > today;
  });

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:ml-64 relative">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-6 h-16">
              <div className="flex items-center space-x-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden z-10"
                  data-testid="mobile-menu-button"
                >
                  <Menu className="h-5 w-5" />
                </Button>

                {/* Page Title and Greeting */}
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Honey Rae Aesthetics
                  </h1>
                  <p className="text-sm text-gray-600">
                    Hello Dr. Rae, welcome back!
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="hidden md:block">
                  <GlobalSearch />
                </div>

                {/* Notifications */}
                <NotificationDropdown />

                {/* Environment Toggle */}
                <EnvironmentToggle />

                {/* User Menu */}
                <div className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/avatar.jpg" />
                    <AvatarFallback
                      className="text-white avatar-fallback"
                      data-theme-aware="true"
                    >
                      {user?.email?.charAt(0).toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">Dr. Rae</p>
                    <p className="text-xs text-gray-500">Admin</p>
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

          {/* Page Content */}
          <main className="flex-1 p-6 space-y-6">
            {/* Dashboard */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="glass border-pink-200/50 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Clients
                    </CardTitle>
                    <Heart className="h-4 w-4" data-theme-aware="true" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold gradient-text">
                      {clients.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      +12% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass border-pink-200/50 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Today's Appointments
                    </CardTitle>
                    <Calendar className="h-4 w-4" data-theme-aware="true" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold gradient-text">
                      {todayAppointments.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {upcomingAppointments.length} upcoming
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass border-pink-200/50 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Messages Sent
                    </CardTitle>
                    <MessageSquare
                      className="h-4 w-4"
                      data-theme-aware="true"
                    />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold gradient-text">
                      {messages.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      +8% from last week
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass border-pink-200/50 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Workflows
                    </CardTitle>
                    <Zap className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold gradient-text">
                      {workflows.filter((w) => w.enabled).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {workflows.reduce((total, w) => total + w.runCount, 0)}{" "}
                      total runs
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass border-pink-200/50 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Photos Uploaded
                    </CardTitle>
                    <Camera className="h-4 w-4" data-theme-aware="true" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold gradient-text">
                      {files.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      +5 new this week
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <Card className="glass border-pink-200/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" data-theme-aware="true" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full justify-start"
                      data-theme-aware="true"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add New Client
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      data-theme-aware="true"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Appointment
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      data-theme-aware="true"
                    >
                      <Workflow className="w-4 h-4 mr-2" />
                      Create Workflow
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="glass border-pink-200/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" data-theme-aware="true" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-2 h-2 rounded-full"
                          data-theme-aware="true"
                        ></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            New client added
                          </p>
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
                          <p className="text-sm font-medium">
                            Appointment scheduled
                          </p>
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
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthWrapper>
  );
}
