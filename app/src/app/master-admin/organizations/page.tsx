"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building,
  Users,
  CreditCard,
  Calendar,
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Shield,
  Activity,
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  Globe,
} from "lucide-react";

interface Organization {
  id: number;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  status: "active" | "suspended" | "pending";
  subscriptionTier: "basic" | "pro" | "enterprise";
  userCount: number;
  createdAt: string;
  lastActive: string;
  monthlyRevenue: number;
  logo?: string;
}

export default function OrganizationManagement() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [viewingOrg, setViewingOrg] = useState<Organization | null>(null);

  // New organization form data
  const [newOrg, setNewOrg] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    subscriptionTier: "basic" as const,
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      // TODO: Replace with real API
      // const response = await fetch('/api/master-admin/organizations');
      // const data = await response.json();
      
      // Mock data for now
      const mockOrgs: Organization[] = [
        {
          id: 15,
          name: "Honey Rae Aesthetics",
          email: "admin@honeyraeaesthetics.com",
          phone: "+1 (555) 123-4567",
          website: "https://honeyraeaesthetics.com",
          address: "123 Beauty Lane, Los Angeles, CA 90210",
          status: "active",
          subscriptionTier: "enterprise",
          userCount: 4,
          createdAt: "2025-01-01T00:00:00Z",
          lastActive: "2025-10-14T00:00:00Z",
          monthlyRevenue: 2500,
        },
        {
          id: 16,
          name: "Bella Vista Spa",
          email: "info@bellavistaspa.com",
          phone: "+1 (555) 234-5678",
          website: "https://bellavistaspa.com",
          address: "456 Wellness Blvd, Miami, FL 33101",
          status: "active",
          subscriptionTier: "pro",
          userCount: 8,
          createdAt: "2025-01-15T00:00:00Z",
          lastActive: "2025-10-13T12:30:00Z",
          monthlyRevenue: 1850,
        },
        {
          id: 17,
          name: "Elite Aesthetics",
          email: "contact@eliteaesthetics.com",
          phone: "+1 (555) 345-6789",
          website: "https://eliteaesthetics.com",
          address: "789 Luxury Ave, Beverly Hills, CA 90210",
          status: "active",
          subscriptionTier: "enterprise",
          userCount: 12,
          createdAt: "2025-02-01T00:00:00Z",
          lastActive: "2025-10-14T08:15:00Z",
          monthlyRevenue: 3200,
        },
        {
          id: 18,
          name: "Downtown Clinic",
          email: "admin@downtownclinic.com",
          phone: "+1 (555) 456-7890",
          website: "",
          address: "321 Main St, Chicago, IL 60601",
          status: "suspended",
          subscriptionTier: "basic",
          userCount: 3,
          createdAt: "2025-03-01T00:00:00Z",
          lastActive: "2025-09-15T00:00:00Z",
          monthlyRevenue: 0,
        },
        {
          id: 19,
          name: "Serenity Wellness",
          email: "hello@serenitywellness.com",
          phone: "+1 (555) 567-8901",
          website: "https://serenitywellness.com",
          address: "654 Peace Rd, Austin, TX 78701",
          status: "pending",
          subscriptionTier: "basic",
          userCount: 1,
          createdAt: "2025-10-10T00:00:00Z",
          lastActive: "2025-10-10T00:00:00Z",
          monthlyRevenue: 0,
        },
      ];
      
      setOrganizations(mockOrgs);
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter organizations based on search and status
  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || org.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateOrganization = async () => {
    try {
      // TODO: API call to create organization
      console.log('Creating organization:', newOrg);
      
      // Mock creation
      const newOrgData: Organization = {
        id: Date.now(),
        ...newOrg,
        status: "pending",
        userCount: 0,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        monthlyRevenue: 0,
      };
      
      setOrganizations(prev => [newOrgData, ...prev]);
      setCreateDialogOpen(false);
      setNewOrg({
        name: "",
        email: "",
        phone: "",
        website: "",
        address: "",
        subscriptionTier: "basic",
      });
      
      alert('Organization created successfully!');
    } catch (error) {
      console.error('Error creating organization:', error);
      alert('Failed to create organization');
    }
  };

  const handleUpdateStatus = async (orgId: number, newStatus: Organization['status']) => {
    try {
      // TODO: API call to update status
      setOrganizations(prev => 
        prev.map(org => 
          org.id === orgId 
            ? { ...org, status: newStatus }
            : org
        )
      );
      alert(`Organization status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating organization status:', error);
      alert('Failed to update organization status');
    }
  };

  const getStatusBadge = (status: Organization['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const getTierBadge = (tier: Organization['subscriptionTier']) => {
    switch (tier) {
      case 'basic':
        return <Badge variant="outline">Basic</Badge>;
      case 'pro':
        return <Badge className="bg-blue-100 text-blue-800">Pro</Badge>;
      case 'enterprise':
        return <Badge className="bg-purple-100 text-purple-800">Enterprise</Badge>;
    }
  };

  if (!user?.isMasterOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600">Master admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 h-16">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => window.location.href = '/master-admin'}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Building className="h-6 w-6 text-blue-600" />
                <span>Organization Management</span>
              </h1>
              <p className="text-sm text-gray-600">
                Manage and monitor all organizations
              </p>
            </div>
          </div>

          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Organization
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
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

                {/* Status Filter */}
                <div className="w-full md:w-48">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Organizations</p>
                    <p className="text-2xl font-bold">{organizations.length}</p>
                  </div>
                  <Building className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-green-600">
                      {organizations.filter(o => o.status === 'active').length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold">
                      {organizations.reduce((sum, org) => sum + org.userCount, 0)}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${organizations.reduce((sum, org) => sum + org.monthlyRevenue, 0).toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Organizations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Organizations ({filteredOrganizations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading organizations...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrganizations.map((org) => (
                    <div
                      key={org.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={org.logo} />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {org.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <h3 className="font-medium text-gray-900">{org.name}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center space-x-1">
                                <Mail className="h-3 w-3" />
                                <span>{org.email}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Users className="h-3 w-3" />
                                <span>{org.userCount} users</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <CreditCard className="h-3 w-3" />
                                <span>${org.monthlyRevenue}/mo</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          {getStatusBadge(org.status)}
                          {getTierBadge(org.subscriptionTier)}
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setViewingOrg(org)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingOrg(org)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {org.status === 'active' ? (
                                <DropdownMenuItem 
                                  onClick={() => handleUpdateStatus(org.id, 'suspended')}
                                  className="text-red-600"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Suspend
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => handleUpdateStatus(org.id, 'active')}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Additional info row */}
                      <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-gray-500">
                        <span>Created: {new Date(org.createdAt).toLocaleDateString()}</span>
                        <span>Last active: {new Date(org.lastActive).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}

                  {filteredOrganizations.length === 0 && (
                    <div className="text-center py-8">
                      <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No organizations found</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Create Organization Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
            <DialogDescription>
              Add a new organization to the system
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={newOrg.name}
                onChange={(e) => setNewOrg(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter organization name"
              />
            </div>

            <div>
              <Label htmlFor="org-email">Email Address</Label>
              <Input
                id="org-email"
                type="email"
                value={newOrg.email}
                onChange={(e) => setNewOrg(prev => ({ ...prev, email: e.target.value }))}
                placeholder="admin@organization.com"
              />
            </div>

            <div>
              <Label htmlFor="org-phone">Phone Number</Label>
              <Input
                id="org-phone"
                value={newOrg.phone}
                onChange={(e) => setNewOrg(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <Label htmlFor="org-tier">Subscription Tier</Label>
              <select
                id="org-tier"
                value={newOrg.subscriptionTier}
                onChange={(e) => setNewOrg(prev => ({ ...prev, subscriptionTier: e.target.value as any }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateOrganization}
              disabled={!newOrg.name || !newOrg.email}
            >
              Create Organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Organization Dialog */}
      {viewingOrg && (
        <Dialog open={!!viewingOrg} onOpenChange={() => setViewingOrg(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {viewingOrg.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span>{viewingOrg.name}</span>
                {getStatusBadge(viewingOrg.status)}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="text-sm">{viewingOrg.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Phone</Label>
                  <p className="text-sm">{viewingOrg.phone || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Website</Label>
                  <p className="text-sm">{viewingOrg.website || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Subscription</Label>
                  <div>{getTierBadge(viewingOrg.subscriptionTier)}</div>
                </div>
              </div>

              {/* Address */}
              {viewingOrg.address && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Address</Label>
                  <p className="text-sm">{viewingOrg.address}</p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-bold">{viewingOrg.userCount}</p>
                  <p className="text-xs text-gray-500">Users</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">${viewingOrg.monthlyRevenue}</p>
                  <p className="text-xs text-gray-500">Monthly Revenue</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">
                    {Math.floor((Date.now() - new Date(viewingOrg.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                  </p>
                  <p className="text-xs text-gray-500">Days Active</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingOrg(null)}>
                Close
              </Button>
              <Button onClick={() => {
                setEditingOrg(viewingOrg);
                setViewingOrg(null);
              }}>
                Edit Organization
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}