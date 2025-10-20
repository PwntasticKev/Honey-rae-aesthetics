"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Users, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Camera,
  Plus,
  Filter,
  Download,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MessageSquare,
  FileText,
  Tag,
  MapPin,
  User,
  AlertCircle
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Client {
  id: number;
  fullName: string;
  email: string;
  phones: string[];
  gender: string;
  dateOfBirth?: string;
  address?: string;
  referralSource: string;
  tags: string[];
  clientPortalStatus: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  totalAppointments: number;
  upcomingAppointments: number;
  lastAppointment?: string;
  totalSpent: number;
  photoCount: number;
  activeWorkflows: number;
}

interface ClientAnalytics {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  totalRevenue: number;
  averageSpent: number;
  totalAppointments: number;
  upcomingAppointments: number;
  topReferralSources: Array<{ source: string; count: number }>;
  recentClients: number;
}

interface Pagination {
  page: number;
  limit: number;
  totalClients: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function EnhancedClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [analytics, setAnalytics] = useState<ClientAnalytics | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [selectedClients, setSelectedClients] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [referralSourceFilter, setReferralSourceFilter] = useState("");
  const [tagsFilter, setTagsFilter] = useState("");
  const [sortBy, setSortBy] = useState("created");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // New client form state
  const [newClientForm, setNewClientForm] = useState({
    fullName: "",
    email: "",
    phones: [""],
    gender: "",
    dateOfBirth: "",
    address: "",
    referralSource: "",
    tags: [],
    clientPortalStatus: "inactive",
    notes: "",
  });

  // Fetch clients data
  const fetchClients = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter,
        gender: genderFilter,
        referralSource: referralSourceFilter,
        tags: tagsFilter,
        page: page.toString(),
        limit: "20",
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/clients?${params}`);
      const data = await response.json();

      if (response.ok) {
        setClients(data.clients);
        setAnalytics(data.analytics);
        setPagination(data.pagination);
      } else {
        console.error("Failed to fetch clients:", data.error);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch clients on component mount and when filters change
  useEffect(() => {
    fetchClients(1);
  }, [searchTerm, statusFilter, genderFilter, referralSourceFilter, tagsFilter, sortBy, sortOrder]);

  // Handle client selection
  const toggleClientSelection = (clientId: number) => {
    const newSelection = new Set(selectedClients);
    if (newSelection.has(clientId)) {
      newSelection.delete(clientId);
    } else {
      newSelection.add(clientId);
    }
    setSelectedClients(newSelection);
  };

  const selectAllClients = () => {
    if (selectedClients.size === clients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(clients.map(c => c.id)));
    }
  };

  // Handle new client creation
  const handleCreateClient = async () => {
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newClientForm,
          phones: newClientForm.phones.filter(phone => phone.trim() !== ""),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowCreateDialog(false);
        setNewClientForm({
          fullName: "",
          email: "",
          phones: [""],
          gender: "",
          dateOfBirth: "",
          address: "",
          referralSource: "",
          tags: [],
          clientPortalStatus: "inactive",
          notes: "",
        });
        fetchClients(pagination?.page || 1);
      } else {
        console.error("Failed to create client:", data.error);
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error creating client:", error);
      alert("Failed to create client");
    }
  };

  // Add phone number field
  const addPhoneField = () => {
    setNewClientForm({
      ...newClientForm,
      phones: [...newClientForm.phones, ""],
    });
  };

  // Remove phone number field
  const removePhoneField = (index: number) => {
    const newPhones = newClientForm.phones.filter((_, i) => i !== index);
    setNewClientForm({
      ...newClientForm,
      phones: newPhones.length > 0 ? newPhones : [""],
    });
  };

  // Update phone number
  const updatePhone = (index: number, value: string) => {
    const newPhones = [...newClientForm.phones];
    newPhones[index] = value;
    setNewClientForm({
      ...newClientForm,
      phones: newPhones,
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      case "invited": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading && !clients.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-pink-500 mx-auto" />
          <p className="mt-2 text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
            <p className="text-gray-600">Manage client profiles, appointments, and communication</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" onClick={() => fetchClients(pagination?.page || 1)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Clients</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalClients}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Active Clients</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.activeClients}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(analytics.totalRevenue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Upcoming Appointments</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.upcomingAppointments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Main search bar */}
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search clients by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created">Date Added</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="lastAppointment">Last Appointment</SelectItem>
                    <SelectItem value="totalSpent">Total Spent</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Advanced filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="invited">Invited</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={genderFilter} onValueChange={setGenderFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genders</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Referral Source"
                    value={referralSourceFilter}
                    onChange={(e) => setReferralSourceFilter(e.target.value)}
                  />

                  <Input
                    placeholder="Tags (comma-separated)"
                    value={tagsFilter}
                    onChange={(e) => setTagsFilter(e.target.value)}
                  />

                  <Button variant="outline" onClick={() => {
                    setStatusFilter("all");
                    setGenderFilter("all");
                    setReferralSourceFilter("");
                    setTagsFilter("");
                    setSearchTerm("");
                  }}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Clients ({clients.length})</CardTitle>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  checked={selectedClients.size === clients.length && clients.length > 0}
                  onCheckedChange={selectAllClients}
                />
                <span className="text-sm text-gray-600">Select All</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Select</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Client</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Contact</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Appointments</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Total Spent</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Last Visit</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedClients.has(client.id)}
                          onCheckedChange={() => toggleClientSelection(client.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-pink-600" />
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{client.fullName}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              {client.tags?.slice(0, 2).map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {client.tags?.length > 2 && (
                                <span className="text-xs text-gray-500">+{client.tags.length - 2}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-gray-900">{client.email}</p>
                          {client.phones && client.phones.length > 0 && (
                            <p className="text-sm text-gray-500">{client.phones[0]}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusBadgeColor(client.clientPortalStatus)}>
                          {client.clientPortalStatus.charAt(0).toUpperCase() + client.clientPortalStatus.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{client.totalAppointments} total</p>
                          <p className="text-gray-500">{client.upcomingAppointments} upcoming</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{formatCurrency(client.totalSpent)}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {client.lastAppointment ? formatDate(client.lastAppointment) : "Never"}
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedClient(client);
                                setShowClientDetails(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Client
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="h-4 w-4 mr-2" />
                              Book Appointment
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Client
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalClients} total clients)
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                disabled={!pagination.hasPrev}
                onClick={() => fetchClients(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={!pagination.hasNext}
                onClick={() => fetchClients(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Create Client Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Create a new client profile with their details and preferences.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={newClientForm.fullName}
                  onChange={(e) => setNewClientForm({...newClientForm, fullName: e.target.value})}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClientForm.email}
                  onChange={(e) => setNewClientForm({...newClientForm, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select 
                  value={newClientForm.gender} 
                  onValueChange={(value) => setNewClientForm({...newClientForm, gender: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={newClientForm.dateOfBirth}
                  onChange={(e) => setNewClientForm({...newClientForm, dateOfBirth: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="referralSource">Referral Source *</Label>
                <Input
                  id="referralSource"
                  value={newClientForm.referralSource}
                  onChange={(e) => setNewClientForm({...newClientForm, referralSource: e.target.value})}
                  placeholder="How did they find us?"
                />
              </div>

              <div>
                <Label htmlFor="clientPortalStatus">Portal Status</Label>
                <Select 
                  value={newClientForm.clientPortalStatus} 
                  onValueChange={(value: any) => setNewClientForm({...newClientForm, clientPortalStatus: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="invited">Invited</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label>Phone Numbers</Label>
                {newClientForm.phones.map((phone, index) => (
                  <div key={index} className="flex space-x-2 mt-2">
                    <Input
                      value={phone}
                      onChange={(e) => updatePhone(index, e.target.value)}
                      placeholder="Enter phone number"
                    />
                    {newClientForm.phones.length > 1 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => removePhoneField(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={addPhoneField}
                >
                  Add Phone
                </Button>
              </div>

              <div className="col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={newClientForm.address}
                  onChange={(e) => setNewClientForm({...newClientForm, address: e.target.value})}
                  placeholder="Enter full address"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newClientForm.notes}
                  onChange={(e) => setNewClientForm({...newClientForm, notes: e.target.value})}
                  placeholder="Additional notes about the client"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateClient}>
                Create Client
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Client Details Dialog */}
        <Dialog open={showClientDetails} onOpenChange={setShowClientDetails}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Client Details</DialogTitle>
            </DialogHeader>

            {selectedClient && (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="appointments">Appointments</TabsTrigger>
                  <TabsTrigger value="photos">Photos</TabsTrigger>
                  <TabsTrigger value="communication">Communication</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Name</label>
                      <p className="text-gray-900">{selectedClient.fullName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{selectedClient.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Gender</label>
                      <p className="text-gray-900">{selectedClient.gender}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                      <p className="text-gray-900">{selectedClient.dateOfBirth || "Not provided"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Referral Source</label>
                      <p className="text-gray-900">{selectedClient.referralSource}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Portal Status</label>
                      <Badge className={getStatusBadgeColor(selectedClient.clientPortalStatus)}>
                        {selectedClient.clientPortalStatus}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-700">Phone Numbers</label>
                      <div className="space-y-1">
                        {selectedClient.phones?.map((phone, index) => (
                          <p key={index} className="text-gray-900">{phone}</p>
                        )) || <p className="text-gray-500">No phone numbers</p>}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-700">Address</label>
                      <p className="text-gray-900">{selectedClient.address || "Not provided"}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-700">Notes</label>
                      <p className="text-gray-900">{selectedClient.notes || "No notes"}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="appointments">
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">{selectedClient.totalAppointments}</p>
                            <p className="text-sm text-gray-600">Total Appointments</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">{selectedClient.upcomingAppointments}</p>
                            <p className="text-sm text-gray-600">Upcoming</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedClient.totalSpent)}</p>
                            <p className="text-sm text-gray-600">Total Spent</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <p className="text-gray-500 text-center py-8">Appointment history will be displayed here</p>
                  </div>
                </TabsContent>

                <TabsContent value="photos">
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{selectedClient.photoCount}</p>
                      <p className="text-sm text-gray-600">Photos</p>
                    </div>
                    <p className="text-gray-500 text-center py-8">Client photos will be displayed here</p>
                  </div>
                </TabsContent>

                <TabsContent value="communication">
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{selectedClient.activeWorkflows}</p>
                      <p className="text-sm text-gray-600">Active Workflows</p>
                    </div>
                    <p className="text-gray-500 text-center py-8">Communication history will be displayed here</p>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowClientDetails(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}