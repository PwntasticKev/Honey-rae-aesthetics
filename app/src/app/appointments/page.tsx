"use client";

import { useState, useEffect } from "react";
import { EnhancedCalendar } from "@/components/EnhancedCalendar";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useEnvironment } from "@/contexts/EnvironmentContext";
import { EnvironmentToggle } from "@/components/EnvironmentToggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Bell, LogOut, Plus, Calendar, X } from "lucide-react";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function AppointmentsPage() {
  const { user, logout } = useAuth();
  const { environment } = useEnvironment();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get or create demo org
  const orgs = useQuery(api.orgs.list);
  const createDemoOrg = useMutation(api.orgs.createDemoOrg);

  // Get the first org or create a demo org
  const orgId = orgs && orgs.length > 0 ? orgs[0]._id : null;

  // Get clients for the appointment form
  const clients =
    useQuery(api.clients.getByOrg, orgId ? { orgId: orgId as any } : "skip") ||
    [];
  const createDemoClients = useMutation(api.clients.createDemoClients);

  // Create demo org if none exists
  const handleCreateDemoOrg = async () => {
    if (!orgId) {
      try {
        console.log("🔄 Creating demo org...");
        await createDemoOrg();
        console.log("✅ Demo org created successfully");
      } catch (error) {
        console.error("❌ Failed to create demo org:", error);
      }
    }
  };

  // Create demo clients if none exist
  const handleCreateDemoClients = async () => {
    if (orgId && clients.length === 0) {
      try {
        console.log("🔄 Creating demo clients...");
        await createDemoClients({ orgId });
        console.log("✅ Demo clients created successfully");
      } catch (error) {
        console.error("❌ Failed to create demo clients:", error);
      }
    }
  };

  // Auto-create demo org and clients when component mounts
  useEffect(() => {
    if (!orgId && orgs !== undefined) {
      console.log("🔄 Creating demo org...");
      handleCreateDemoOrg();
    }
  }, [orgId, orgs, createDemoOrg]);

  // Auto-create demo clients when org is available
  useEffect(() => {
    if (orgId && clients.length === 0) {
      console.log("🔄 Creating demo clients...");
      handleCreateDemoClients();
    }
  }, [orgId, clients.length, createDemoClients]);

  return (
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
                <h1 className="text-xl font-bold text-gray-900">Calendar</h1>
                <p className="text-sm text-gray-600">
                  Manage appointments with Google Calendar integration (
                  {environment} environment)
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Environment Toggle */}
              <EnvironmentToggle />

              {/* Search */}
              <div className="hidden md:block">
                <GlobalSearch />
              </div>

              {/* Notifications */}
              <NotificationDropdown />

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/avatar.jpg" />
                  <AvatarFallback className="bg-orange-500 text-white">
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
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Action Bar */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Appointments
                </h2>
              </div>
            </div>

            {/* Loading State */}
            {(!orgId || clients.length === 0) && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Setting up demo data...</p>
                <p className="text-sm text-gray-500 mt-2">
                  {!orgId
                    ? "Creating organization..."
                    : "Creating demo clients..."}
                </p>
                <button
                  onClick={() => {
                    console.log("🔄 Manual refresh triggered");
                    handleCreateDemoOrg();
                    handleCreateDemoClients();
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Retry Setup
                </button>
              </div>
            )}

            {/* Calendar */}
            {orgId && (
              <EnhancedCalendar orgId={orgId as string} clients={clients} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
