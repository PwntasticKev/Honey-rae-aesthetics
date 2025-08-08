"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { validateOrganizationProfile, getOrganizationSetupProgress, OrganizationProfile } from "@/lib/organization-validation";
import { ErrorAlert, ValidationError, WarningAlert } from "@/components/ui/error-alert";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Menu,
  Search,
  Bell,
  LogOut,
  Settings,
  Building,
  Users,
  CreditCard,
  Shield,
  Palette,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Zap,
  MessageSquare,
  Camera,
  Database,
  Key,
  Link,
  Save,
  Edit,
  Upload,
  Trash2,
  Plus,
  Check,
  X,
  UserPlus,
  BarChart3,
} from "lucide-react";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { ThemeSelector } from "@/components/ThemeSelector";

interface OrganizationSettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  timezone: string;
  currency: string;
  logo?: string;
  description: string;
  industry: string;
  employeeCount: string;
  established: string;
}

interface ApiIntegration {
  id: string;
  name: string;
  description: string;
  status: "connected" | "disconnected" | "error";
  icon: string;
  lastSync?: Date;
  settings?: Record<string, any>;
}

export default function SettingsPage() {
  const { user, orgId, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Handle OAuth success/error from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthSuccess = urlParams.get('oauth_success');
    const oauthError = urlParams.get('error');
    const platform = urlParams.get('platform');
    const account = urlParams.get('account');
    const message = urlParams.get('message');

    if (oauthSuccess === 'true' && platform && account) {
      // Integration will be automatically updated via the database
      alert(`Successfully connected to ${platform}! Account: ${account}`);
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (oauthError && platform) {
      alert(`Failed to connect to ${platform}: ${message || 'Unknown error'}`);
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const [orgSettings, setOrgSettings] = useState<OrganizationSettings>({
    name: "Honey Rae Aesthetics",
    email: "info@honeyrae.com",
    phone: "+1 (555) 123-4567",
    address: "123 Beauty Lane, Los Angeles, CA 90210",
    website: "https://honeyrae.com",
    timezone: "America/Denver",
    currency: "USD",
    description: "Premium aesthetic services and treatments",
    industry: "Healthcare & Beauty",
    employeeCount: "5-10",
    established: "2020",
  });

  // Get real integration data from database
  const userIntegrations = useQuery(api.integrations.getUserIntegrations, 
    user?.userId && orgId ? {
      userId: user.userId as any,
      orgId: orgId as any
    } : "skip"
  );

  const upsertIntegration = useMutation(api.integrations.upsertIntegration);
  const disconnectIntegration = useMutation(api.integrations.disconnectIntegration);

  // Team management queries
  const teamMembers = useQuery(api.teamManagement.getTeamMembers,
    orgId ? { orgId: orgId as any } : "skip"
  );
  
  const inviteTeamMember = useMutation(api.teamManagement.inviteTeamMember);
  const updateTeamMemberRole = useMutation(api.teamManagement.updateTeamMemberRole);
  const removeTeamMember = useMutation(api.teamManagement.removeTeamMember);

  // Team management handlers
  const handleInviteTeamMember = () => {
    const email = prompt("Enter team member's email:");
    const name = prompt("Enter team member's name:");
    const role = prompt("Enter role (admin, manager, or staff):") as "admin" | "manager" | "staff";
    
    if (email && name && role && user?.userId && orgId) {
      inviteTeamMember({
        orgId: orgId as any,
        email,
        name,
        role,
        invitedBy: user.userId as any,
      }).then(() => {
        alert(`Invitation sent to ${email}!`);
      }).catch((error) => {
        alert(`Failed to send invitation: ${error.message}`);
      });
    }
  };

  const handleUpdateRole = (teamMemberId: any, newRole: "admin" | "manager" | "staff") => {
    if (user?.userId) {
      updateTeamMemberRole({
        teamMemberId,
        newRole,
        updatedBy: user.userId as any,
      }).then(() => {
        alert("Role updated successfully!");
      }).catch((error) => {
        alert(`Failed to update role: ${error.message}`);
      });
    }
  };

  const handleRemoveMember = (teamMemberId: any) => {
    if (confirm("Are you sure you want to remove this team member?") && user?.userId) {
      removeTeamMember({
        teamMemberId,
        removedBy: user.userId as any,
      }).then(() => {
        alert("Team member removed successfully!");
      }).catch((error) => {
        alert(`Failed to remove team member: ${error.message}`);
      });
    }
  };

  // Platform definitions with descriptions and icons
  const platformDefinitions = {
    "google_calendar": {
      name: "Google Calendar",
      description: "Sync appointments and events",
      icon: "📅",
    },
    "stripe": {
      name: "Stripe", 
      description: "Payment processing and billing",
      icon: "💳",
    },
    "twilio": {
      name: "Twilio",
      description: "SMS and voice messaging", 
      icon: "📱",
    },
    "aws_s3": {
      name: "AWS S3",
      description: "File storage and media management",
      icon: "☁️",
    },
    "mailchimp": {
      name: "Mailchimp",
      description: "Email marketing campaigns",
      icon: "📧",
    },
    "instagram": {
      name: "Instagram",
      description: "Post photos, stories, and reels",
      icon: "📸",
    },
    "facebook": {
      name: "Facebook", 
      description: "Share posts and manage pages",
      icon: "📘",
    },
    "youtube": {
      name: "YouTube",
      description: "Upload videos and manage channel", 
      icon: "📺",
    },
    "linkedin": {
      name: "LinkedIn",
      description: "Professional networking and content",
      icon: "💼", 
    },
    "tiktok": {
      name: "TikTok",
      description: "Short-form video content",
      icon: "🎵",
    },
    "google_business": {
      name: "Google Business Profile",
      description: "Manage business listing and reviews",
      icon: "🏢",
    },
    "apple_business": {
      name: "Apple Business Connect", 
      description: "Manage Apple Maps business info",
      icon: "🍎",
    },
  };

  // Create combined integration list with real status
  const apiIntegrations = Object.entries(platformDefinitions).map(([platformId, platform]) => {
    const integration = userIntegrations?.find(i => i.platform === platformId);
    return {
      id: platformId,
      name: platform.name,
      description: platform.description,
      icon: platform.icon,
      status: integration?.isActive ? "connected" : "disconnected",
      lastSync: integration?.lastSync ? new Date(integration.lastSync) : undefined,
      syncError: integration?.syncError,
      accountName: integration?.accountName,
      accountEmail: integration?.accountEmail,
    };
  });

  const handleSaveSettings = () => {
    // In a real app, this would save to the backend
    console.log("Saving organization settings:", orgSettings);
    setIsEditing(false);
  };

  const handleConnectIntegration = async (integrationId: string) => {
    if (!user?.userId || !orgId) {
      alert('Please log in to connect integrations');
      return;
    }

    // Handle social media platforms with OAuth
    const socialPlatforms = ['instagram', 'facebook', 'youtube', 'linkedin', 'tiktok', 'google_business', 'apple_business'];
    
    if (socialPlatforms.includes(integrationId)) {
      try {
        // Call the OAuth API route to get the authorization URL
        const response = await fetch(`/api/oauth/${integrationId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            orgId: user.orgId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to initiate ${integrationId} OAuth`);
        }

        const data = await response.json();
        
        if (data.authUrl) {
          // Redirect to OAuth provider
          window.location.href = data.authUrl;
        } else {
          throw new Error('No authorization URL returned');
        }
      } catch (error) {
        console.error(`${integrationId} OAuth error:`, error);
        alert(`Failed to connect to ${integrationId}. Please ensure your API credentials are configured.`);
      }
    } else {
      // Handle API key based integrations (Stripe, Twilio, etc.)
      const apiKey = prompt(`Enter your ${platformDefinitions[integrationId as keyof typeof platformDefinitions]?.name} API key:`);
      
      if (apiKey) {
        try {
          await upsertIntegration({
            userId: user.userId as any,
            orgId: orgId as any,
            platform: integrationId as any,
            accessToken: apiKey,
            accountName: `${platformDefinitions[integrationId as keyof typeof platformDefinitions]?.name} Account`,
          });
        } catch (error) {
          console.error(`Failed to save ${integrationId} integration:`, error);
          alert(`Failed to connect to ${integrationId}.`);
        }
      }
    }
  };

  const handleDisconnectIntegration = async (integrationId: string) => {
    if (!user?.userId) {
      return;
    }

    try {
      await disconnectIntegration({
        userId: user.userId as any,
        platform: integrationId as any,
      });
    } catch (error) {
      console.error(`Failed to disconnect ${integrationId}:`, error);
      alert(`Failed to disconnect ${integrationId}.`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-800";
      case "disconnected":
        return "bg-gray-100 text-gray-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const tabs = [
    { id: "profile", label: "Organization Profile", icon: Building },
    { id: "organization", label: "Organization Setup", icon: Settings },
    { id: "integrations", label: "API Integrations", icon: Link },
    { id: "team", label: "Team Management", icon: Users },
    { id: "billing", label: "Billing & Plans", icon: CreditCard },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content - Fixed margin to prevent content behind sidebar */}
      <div className="flex-1 flex flex-col lg:ml-64">
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
                <h1 className="text-xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-600">
                  Manage your organization and preferences
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search anything"
                  className="pl-10 pr-4 w-64 bg-gray-50 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                  data-theme-aware="true"
                />
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
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Tab Navigation with shadcn tabs */}
            <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 mb-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center space-x-2 text-sm"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

            {/* Tab Content */}
            <TabsContent value="profile">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Organization Profile</CardTitle>
                        <CardDescription>
                          Manage your organization's basic information and
                          branding
                        </CardDescription>
                      </div>
                      <Button
                        variant={isEditing ? "outline" : "default"}
                        onClick={() => setIsEditing(!isEditing)}
                        className="flex items-center space-x-2"
                        data-theme-aware="true"
                        data-variant={isEditing ? "light" : "solid"}
                      >
                        {isEditing ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <Edit className="h-4 w-4" />
                        )}
                        <span>{isEditing ? "Cancel" : "Edit"}</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Organization Name
                          </label>
                          <Input
                            value={orgSettings.name}
                            onChange={(e) =>
                              setOrgSettings((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            disabled={!isEditing}
                            data-theme-aware="true"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                          </label>
                          <Input
                            type="email"
                            value={orgSettings.email}
                            onChange={(e) =>
                              setOrgSettings((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            disabled={!isEditing}
                            data-theme-aware="true"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number
                          </label>
                          <Input
                            value={orgSettings.phone}
                            onChange={(e) =>
                              setOrgSettings((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                            disabled={!isEditing}
                            data-theme-aware="true"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Website
                          </label>
                          <Input
                            value={orgSettings.website}
                            onChange={(e) =>
                              setOrgSettings((prev) => ({
                                ...prev,
                                website: e.target.value,
                              }))
                            }
                            disabled={!isEditing}
                            data-theme-aware="true"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address
                          </label>
                          <Textarea
                            value={orgSettings.address}
                            onChange={(e) =>
                              setOrgSettings((prev) => ({
                                ...prev,
                                address: e.target.value,
                              }))
                            }
                            disabled={!isEditing}
                            rows={3}
                            data-theme-aware="true"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <Textarea
                            value={orgSettings.description}
                            onChange={(e) =>
                              setOrgSettings((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            disabled={!isEditing}
                            rows={3}
                            data-theme-aware="true"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Timezone
                            </label>
                            <Input
                              value={orgSettings.timezone}
                              onChange={(e) =>
                                setOrgSettings((prev) => ({
                                  ...prev,
                                  timezone: e.target.value,
                                }))
                              }
                              disabled={!isEditing}
                              data-theme-aware="true"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Currency
                            </label>
                            <Input
                              value={orgSettings.currency}
                              onChange={(e) =>
                                setOrgSettings((prev) => ({
                                  ...prev,
                                  currency: e.target.value,
                                }))
                              }
                              disabled={!isEditing}
                              data-theme-aware="true"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    {isEditing && (
                      <div className="mt-6 flex justify-end">
                        <Button
                          onClick={handleSaveSettings}
                          className="flex items-center space-x-2"
                          data-theme-aware="true"
                          data-variant="solid"
                        >
                          <Save className="h-4 w-4" />
                          <span>Save Changes</span>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="organization">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Organization Setup</CardTitle>
                    <CardDescription>
                      Complete your organization setup to unlock all features
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      // Convert current org settings to validation format
                      const profileData: OrganizationProfile = {
                        name: orgSettings.name,
                        email: orgSettings.email,
                        phone: orgSettings.phone,
                        address: orgSettings.address,
                        website: orgSettings.website,
                        industry: orgSettings.industry,
                        description: orgSettings.description,
                      };
                      
                      const validation = validateOrganizationProfile(profileData);
                      const progress = getOrganizationSetupProgress(profileData);
                      
                      return (
                        <div className="space-y-4">
                          {/* Setup Progress */}
                          <div className="bg-blue-50 border border-blue-200 rounded p-4">
                            <h4 className="font-medium text-blue-900 mb-2">Setup Progress</h4>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm">Organization Created: {orgSettings.name || 'Unnamed Organization'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm">User Account: {user?.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 ${user?.orgId ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></div>
                                <span className="text-sm">Organization Linked: {user?.orgId ? 'Yes' : 'No'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 ${validation.isValid ? 'bg-green-500' : 'bg-yellow-500'} rounded-full`}></div>
                                <span className="text-sm">Profile Complete: {progress.completionPercentage}% ({progress.completedSteps}/{progress.totalSteps})</span>
                              </div>
                            </div>
                          </div>

                          {/* Validation Errors */}
                          {validation.missingRequired.length > 0 && (
                            <ErrorAlert
                              variant="error"
                              title="Required Fields Missing"
                              message={`Complete these required fields to finish organization setup:`}
                            >
                              <ul className="list-disc list-inside space-y-1">
                                {validation.missingRequired.map((error, index) => (
                                  <li key={index}>{error}</li>
                                ))}
                              </ul>
                            </ErrorAlert>
                          )}

                          {/* Format Errors */}
                          {validation.errors.length > 0 && (
                            <ValidationError errors={validation.errors} />
                          )}

                          {/* Warnings */}
                          {validation.warnings.length > 0 && (
                            <WarningAlert warnings={validation.warnings} />
                          )}

                          {/* Next Step Recommendation */}
                          {progress.nextStep && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-4">
                              <h4 className="font-medium text-blue-900 mb-2">Next Step</h4>
                              <p className="text-sm text-blue-800 mb-3">{progress.nextStep}</p>
                              <Button 
                                onClick={() => setActiveTab('profile')}
                                variant="outline"
                                size="sm"
                              >
                                Go to Profile Tab
                              </Button>
                            </div>
                          )}

                          {/* Organization Link Status */}
                          {!user?.orgId && (
                            <ErrorAlert
                              variant="warning"
                              title="Action Required"
                              message="Your user account is not properly linked to an organization. This prevents you from using workflows and other features."
                              actions={
                                <Button 
                                  onClick={() => window.location.href = '/org-profile'}
                                  size="sm"
                                >
                                  Complete Organization Setup
                                </Button>
                              }
                            />
                          )}

                          {/* Success State */}
                          {user?.orgId && validation.isValid && (
                            <ErrorAlert
                              variant="success"
                              title="Setup Complete"
                              message="Your organization is properly configured and ready to use all features."
                            />
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="integrations">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>API Integrations</CardTitle>
                    <CardDescription>
                      Connect and manage third-party services and APIs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {apiIntegrations.map((integration) => (
                        <Card key={integration.id} className="relative">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="text-2xl">
                                  {integration.icon}
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {integration.name}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {integration.description}
                                  </p>
                                  {integration.accountName && (
                                    <p className="text-xs text-blue-600 mt-1">
                                      Connected as: {integration.accountName}
                                    </p>
                                  )}
                                  {integration.accountEmail && (
                                    <p className="text-xs text-gray-500">
                                      {integration.accountEmail}
                                    </p>
                                  )}
                                  {integration.lastSync && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Last sync:{" "}
                                      {integration.lastSync.toLocaleDateString()}{" "}
                                      {integration.lastSync.toLocaleTimeString()}
                                    </p>
                                  )}
                                  {integration.syncError && (
                                    <p className="text-xs text-red-500 mt-1">
                                      Error: {integration.syncError}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Badge
                                className={getStatusColor(integration.status)}
                              >
                                {integration.status}
                              </Badge>
                            </div>
                            <div className="mt-4 flex space-x-2">
                              {integration.status === "connected" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleDisconnectIntegration(integration.id)
                                  }
                                  className="flex-1"
                                >
                                  Disconnect
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() =>
                                    handleConnectIntegration(integration.id)
                                  }
                                  className="flex-1"
                                >
                                  Connect
                                </Button>
                              )}
                              <Button variant="ghost" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="team">
              <div className="space-y-6">
                {/* Team Overview */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <Users className="h-5 w-5" />
                          <span>Team Members</span>
                        </CardTitle>
                        <CardDescription>
                          Manage team members and their access levels
                        </CardDescription>
                      </div>
                      <Button onClick={() => handleInviteTeamMember()}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite Member
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Current User (Admin) */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src="/avatar.jpg" />
                            <AvatarFallback className="text-white avatar-fallback" data-theme-aware="true">
                              {user?.email?.charAt(0).toUpperCase() || "A"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user?.name || "Admin User"}</p>
                            <p className="text-sm text-gray-600">{user?.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className="bg-blue-100 text-blue-800">Admin</Badge>
                              <span className="text-xs text-gray-500">You</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Last active</p>
                          <p className="text-xs text-gray-500">Just now</p>
                        </div>
                      </div>

                      {/* Display team members */}
                      {teamMembers?.map((member) => (
                        <div key={member._id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="text-white avatar-fallback" data-theme-aware="true">
                                {member.user?.name?.charAt(0).toUpperCase() || member.user?.email?.charAt(0).toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.user?.name || "Team Member"}</p>
                              <p className="text-sm text-gray-600">{member.user?.email}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge className={
                                  member.role === "admin" ? "bg-blue-100 text-blue-800" :
                                  member.role === "manager" ? "bg-green-100 text-green-800" :
                                  "bg-gray-100 text-gray-800"
                                }>
                                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                </Badge>
                                <span className="text-xs text-gray-500">{member.status}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <select
                              value={member.role}
                              onChange={(e) => handleUpdateRole(member._id, e.target.value as "admin" | "manager" | "staff")}
                              className="text-sm border rounded px-2 py-1"
                              disabled={member.status !== "active"}
                            >
                              <option value="staff">Staff</option>
                              <option value="manager">Manager</option>
                              <option value="admin">Admin</option>
                            </select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveMember(member._id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )) || []}

                      {/* Show placeholder when no team members */}
                      {(!teamMembers || teamMembers.length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No team members yet</p>
                          <p className="text-sm mt-1">Invite team members to collaborate on your workflows</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Role Definitions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Role Permissions</span>
                    </CardTitle>
                    <CardDescription>
                      Understanding what each role can access and do
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                      {/* Admin Role */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <Badge className="bg-blue-100 text-blue-800">Admin</Badge>
                          <span className="text-sm text-gray-600">Full Access</span>
                        </div>
                        <ul className="text-sm space-y-1 text-gray-600">
                          <li>• All page access</li>
                          <li>• Manage team members</li>
                          <li>• View analytics</li>
                          <li>• Manage integrations</li>
                          <li>• Export data</li>
                          <li>• Organization settings</li>
                        </ul>
                      </div>

                      {/* Manager Role */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <Badge className="bg-green-100 text-green-800">Manager</Badge>
                          <span className="text-sm text-gray-600">Create & Edit</span>
                        </div>
                        <ul className="text-sm space-y-1 text-gray-600">
                          <li>• Create/edit workflows</li>
                          <li>• Manage clients</li>
                          <li>• Send messages</li>
                          <li>• Upload files</li>
                          <li>• View reports</li>
                          <li className="text-gray-400">• No team management</li>
                        </ul>
                      </div>

                      {/* Staff Role */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <Badge className="bg-gray-100 text-gray-800">Staff</Badge>
                          <span className="text-sm text-gray-600">Read Only</span>
                        </div>
                        <ul className="text-sm space-y-1 text-gray-600">
                          <li>• View workflows</li>
                          <li>• View clients</li>
                          <li>• View appointments</li>
                          <li>• View gallery</li>
                          <li className="text-gray-400">• No editing</li>
                          <li className="text-gray-400">• No team access</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Invite Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Mail className="h-5 w-5" />
                      <span>Invitation Settings</span>
                    </CardTitle>
                    <CardDescription>
                      Configure how team invitations work
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            defaultChecked 
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Require email verification for new members</span>
                        </label>
                      </div>
                      <div>
                        <label className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            defaultChecked 
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Send welcome email to new team members</span>
                        </label>
                      </div>
                      <div>
                        <label className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Allow team members to invite others</span>
                        </label>
                      </div>
                      <div className="border-t pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Invitation expiry
                        </label>
                        <select className="w-32 p-2 border rounded-md text-sm">
                          <option value="1">1 day</option>
                          <option value="3">3 days</option>
                          <option value="7" selected>7 days</option>
                          <option value="14">14 days</option>
                          <option value="30">30 days</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="billing">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Billing & Plans</CardTitle>
                    <CardDescription>
                      Manage your subscription and billing information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Billing features coming soon...
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="security">
              <div className="space-y-6">
                {/* Two-Factor Authentication */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Two-Factor Authentication</span>
                    </CardTitle>
                    <CardDescription>
                      Add an extra layer of security to your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-600">
                          {user?.twoFactorEnabled 
                            ? `Enabled via ${user.preferredOtpMethod || 'SMS'}`
                            : 'Not enabled'
                          }
                        </p>
                      </div>
                      <Button
                        variant={user?.twoFactorEnabled ? "outline" : "default"}
                        onClick={() => {
                          // TODO: Implement 2FA setup/disable
                          alert('2FA setup will be implemented');
                        }}
                      >
                        {user?.twoFactorEnabled ? 'Disable' : 'Enable'} 2FA
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Session Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Active Sessions</span>
                    </CardTitle>
                    <CardDescription>
                      Manage your active login sessions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Current Session</p>
                          <p className="text-sm text-gray-600">
                            {navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                             navigator.userAgent.includes('Firefox') ? 'Firefox' :
                             navigator.userAgent.includes('Safari') ? 'Safari' : 'Unknown'} 
                            {' '}on {navigator.platform}
                          </p>
                          <p className="text-xs text-gray-500">
                            Active now
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Current</Badge>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="mt-4 w-full"
                      onClick={() => alert('Session management will be implemented')}
                    >
                      Revoke All Other Sessions
                    </Button>
                  </CardContent>
                </Card>

                {/* Security Audit */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>Security Activity</span>
                    </CardTitle>
                    <CardDescription>
                      Monitor login attempts and security events
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">0</div>
                        <div className="text-xs text-gray-500">Failed Logins (24h)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">1</div>
                        <div className="text-xs text-gray-500">Successful Logins</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">0</div>
                        <div className="text-xs text-gray-500">VPN Detections</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">0</div>
                        <div className="text-xs text-gray-500">High Risk Events</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Recent Activity</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">Successful login</span>
                          </div>
                          <span className="text-xs text-gray-500">Just now</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm">Settings accessed</span>
                          </div>
                          <span className="text-xs text-gray-500">1 min ago</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* IP & Location Security */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5" />
                      <span>Location & Access Control</span>
                    </CardTitle>
                    <CardDescription>
                      Monitor access from different locations and IP addresses
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            defaultChecked 
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Alert for new location logins</span>
                        </label>
                      </div>
                      <div>
                        <label className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            defaultChecked 
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Block VPN/Proxy connections</span>
                        </label>
                      </div>
                      <div>
                        <label className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Require approval for new devices</span>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Data Export & Privacy */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Database className="h-5 w-5" />
                      <span>Data & Privacy</span>
                    </CardTitle>
                    <CardDescription>
                      Manage your data and privacy settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button variant="outline" className="w-full">
                        <Database className="h-4 w-4 mr-2" />
                        Export My Data
                      </Button>
                      <Button variant="outline" className="w-full text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notifications">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Configure how you receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Notification settings coming soon...
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="appearance">
              <div className="space-y-6">
                <ThemeSelector />
              </div>
            </TabsContent>

            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
