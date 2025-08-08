"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WorkflowList } from "@/components/WorkflowList";
import { EnhancedWorkflowList } from "@/components/EnhancedWorkflowList";
import { useWorkflows } from "@/hooks/useWorkflows";
import { useEnvironment } from "@/contexts/EnvironmentContext";
import { EnvironmentToggle } from "@/components/EnvironmentToggle";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Bell, LogOut, Plus } from "lucide-react";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { GlobalSearch } from "@/components/GlobalSearch";

export default function WorkflowsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const workflows = useWorkflows(null); // Pass null for all workflows
  const { environment } = useEnvironment();
  const { user, orgId, logout } = useAuth();

  // Transform real workflow data to match the list format
  const transformedWorkflows =
    workflows?.map((workflow: any) => ({
      _id: workflow._id,
      name: workflow.name,
      description: workflow.description,
      trigger: workflow.trigger,
      enabled: workflow.isActive || false,
      steps: workflow.actions || [],
      createdAt: workflow._creationTime,
      lastRun: workflow.updatedAt || workflow._creationTime,
      runCount: 0, // TODO: Add run count tracking
    })) || [];

  const allWorkflows = transformedWorkflows;

  // Filter workflows based on search term
  const filteredWorkflows = allWorkflows.filter(
    (workflow: any) =>
      workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAddWorkflow = () => {
    // Navigate to workflow editor with new workflow
    window.location.href = "/workflow-editor?id=new";
  };

  if (!workflows) {
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
                  <h1 className="text-xl font-bold text-gray-900">Workflows</h1>
                  <p className="text-sm text-gray-600">
                    Manage automation workflows ({environment} environment)
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

          {/* Page Content - Remove padding and max-width for full height */}
          <main className="flex-1 p-2">
            <div className="h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Workflows
                  </h1>
                  <p className="text-gray-600">
                    Manage your automation workflows ({environment} environment)
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <EnvironmentToggle />
                  <Button onClick={handleAddWorkflow} data-theme-aware="true">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Workflow
                  </Button>
                </div>
              </div>
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading workflows...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

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
                <h1 className="text-xl font-bold text-gray-900">Workflows</h1>
                <p className="text-sm text-gray-600">
                  Manage automation workflows ({environment} environment)
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

        {/* Page Content - Remove padding and max-width for full height */}
        <main className="flex-1 p-2">
          <div className="h-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
                <p className="text-gray-600">
                  Manage your automation workflows ({environment} environment)
                </p>
              </div>
              <div className="flex items-center gap-4">
                <EnvironmentToggle />
                <Button onClick={handleAddWorkflow} data-theme-aware="true">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Workflow
                </Button>
              </div>
            </div>

            {orgId ? (
              <EnhancedWorkflowList orgId={orgId} />
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Authentication Required
                </h3>
                <p className="text-gray-600 mb-4">
                  Please log in to view your workflows.
                </p>
                <Button onClick={() => window.location.href = "/login"}>
                  <Plus className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
