"use client";

import { useState, useEffect } from "react";
import { ClientList } from "@/components/ClientList";
import { ClientImportExport } from "@/components/ClientImportExport";
import { ClientHeaderActions } from "@/components/ClientHeaderActions";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Search, Bell, LogOut } from "lucide-react";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
export default function ClientsPage() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  // Get the user's organization
  const { user: authUser } = useAuth();
  const userData = useQuery(api.users.getByEmail, {
    email: authUser?.email || "admin@honeyrae.com",
  });

  // Fallback: if user not found, use first organization
  const orgs = useQuery(api.orgs.list);
  const orgId = userData?.orgId || orgs?.[0]?._id;

  // Get real client data from Convex
  const clientsQuery = useQuery(
    api.clients.getByOrg,
    orgId ? { orgId: orgId as any } : "skip",
  );

  const clients = clientsQuery || [];

  const handleAddClient = () => {
    // TODO: Implement add client functionality
  };

  const handleEditClient = (clientId: string) => {
    // TODO: Implement edit client functionality
  };

  const handleDeleteClient = (clientId: string) => {
    // TODO: Implement delete client functionality
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50"
      style={{
        background:
          "var(--theme-gradient, linear-gradient(135deg, oklch(0.99 0.005 300) 0%, oklch(0.99 0.005 300) 50%, oklch(0.65 0.15 350)20 100%))",
      }}
    >
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
                <h1 className="text-xl font-bold text-gray-900">Clients</h1>
                <p className="text-sm text-gray-600">
                  Manage your patient database
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
        <main className="flex-1 p-4">
          <div className="max-w-full mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                Client Management
              </h1>
            </div>

            {/* Import/Export Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {orgId && <ClientImportExport orgId={orgId} />}
                </div>

                {/* Client Actions */}
                {orgId && (
                  <ClientHeaderActions
                    orgId={orgId}
                    selectedClients={selectedClients}
                    onSelectionChange={setSelectedClients}
                  />
                )}
              </div>
            </div>

            {/* Client List */}
            <ClientList
              clients={clients}
              onAddClient={handleAddClient}
              onEditClient={handleEditClient}
              onDeleteClient={handleDeleteClient}
              selectedClients={selectedClients}
              onSelectionChange={setSelectedClients}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
