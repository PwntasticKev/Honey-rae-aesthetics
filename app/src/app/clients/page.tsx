"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { ClientList } from "@/components/ClientList";
import { clients as clientsSchema } from "@/db/schema";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Menu, LogOut } from "lucide-react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Client = InferSelectModel<typeof clientsSchema>;
type NewClient = InferInsertModel<typeof clientsSchema>;

async function fetchClients(): Promise<Client[]> {
  const res = await fetch("/api/clients");
  if (!res.ok) {
    throw new Error("Network response was not ok");
  }
  return res.json();
}

async function createClient(newClient: NewClient): Promise<Client> {
  const res = await fetch("/api/clients", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newClient),
  });
  if (!res.ok) {
    throw new Error("Network response was not ok");
  }
  return res.json();
}

async function deleteClient(clientId: number): Promise<void> {
  const res = await fetch(`/api/clients/${clientId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Network response was not ok");
  }
}

export default function ClientsPage() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const queryClient = useQueryClient();

  const {
    data: clients = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const createClientMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });

  const handleAddClient = () => {
    // For testing, we'll use some dummy data.
    // In a real app, this would come from a form.
    const testClient: NewClient = {
      orgId: 1, // Assuming an org with ID 1 exists for testing
      fullName: "Test User",
      email: "test@example.com",
      phones: ["123-456-7890"],
      gender: "Female",
      referralSource: "Web",
      tags: ["new", "test"],
      clientPortalStatus: "active",
    };
    createClientMutation.mutate(testClient);
  };

  const handleEditClient = (clientId: number) => {
    console.log("Edit client:", clientId);
  };

  const handleDeleteClient = (clientId: number) => {
    deleteClientMutation.mutate(clientId);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-rose-900"
      style={{
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Sidebar
        user={user}
        logout={logout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      <div className="flex flex-1 flex-col md:pl-64">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between pl-0 pr-6 h-16">
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
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Clients
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your patient database
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <GlobalSearch />
              </div>
              <NotificationDropdown />
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/avatar.jpg" />
                  <AvatarFallback className="text-white avatar-fallback">
                    {user?.email?.charAt(0).toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Dr. Rae
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Admin
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  title="Logout"
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              {isLoading && <p>Loading clients...</p>}
              {error && <p>Error loading clients: {error.message}</p>}
              {!isLoading && !error && (
                <ClientList
                  clients={clients}
                  onAddClient={handleAddClient}
                  onEditClient={handleEditClient}
                  onDeleteClient={handleDeleteClient}
                  selectedClients={selectedClients}
                  onSelectionChange={setSelectedClients}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
