"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Calendar, 
  Clock,
  User,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Filter,
  Download,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  CalendarDays,
  CalendarCheck,
  CalendarX,
  TrendingUp,
  MapPin
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Appointment {
  id: number;
  clientId: number;
  providerId: number;
  service: string;
  dateTime: string;
  duration: number;
  status: string;
  price: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  endTime: string;
  dayOfWeek: number;
  clientName: string;
  clientEmail: string;
  clientPhones?: string[];
  providerName: string;
  providerEmail: string;
  providerRole: string;
}

interface AppointmentAnalytics {
  totalAppointments: number;
  scheduledAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalRevenue: number;
  averageDuration: number;
  providerStats: Array<{
    name: string;
    appointments: number;
    revenue: number;
    completedAppointments: number;
  }>;
  serviceStats: Array<{
    service: string;
    appointments: number;
    revenue: number;
    averageDuration: number;
  }>;
  todayAppointments: number;
}

interface ViewParams {
  view: string;
  startDate: string;
  endDate: string;
}

interface Client {
  id: number;
  fullName: string;
  email: string;
}

interface Provider {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function EnhancedAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [analytics, setAnalytics] = useState<AppointmentAnalytics | null>(null);
  const [viewParams, setViewParams] = useState<ViewParams | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [view, setView] = useState("week");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // New appointment form state
  const [newAppointmentForm, setNewAppointmentForm] = useState({
    clientId: "",
    providerId: "",
    service: "",
    dateTime: "",
    duration: 60,
    status: "scheduled",
    price: 0,
    notes: "",
  });

  // Fetch appointments data
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter,
        providerId: providerFilter,
        service: serviceFilter,
        view,
        limit: "50",
      });

      const response = await fetch(`/api/appointments?${params}`);
      const data = await response.json();

      if (response.ok) {
        setAppointments(data.appointments);
        setAnalytics(data.analytics);
        setViewParams(data.viewParams);
      } else {
        console.error("Failed to fetch appointments:", data.error);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch clients and providers for dropdowns
  const fetchClientsAndProviders = async () => {
    try {
      // Fetch clients
      const clientsResponse = await fetch("/api/clients?limit=100");
      const clientsData = await clientsResponse.json();
      if (clientsResponse.ok) {
        setClients(clientsData.clients || []);
      }

      // Fetch providers (team members)
      const providersResponse = await fetch("/api/teams-test");
      const providersData = await providersResponse.json();
      if (providersResponse.ok) {
        setProviders(providersData.members || []);
      }
    } catch (error) {
      console.error("Error fetching clients and providers:", error);
    }
  };

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchAppointments();
  }, [searchTerm, statusFilter, providerFilter, serviceFilter, view]);

  useEffect(() => {
    fetchClientsAndProviders();
  }, []);

  // Handle new appointment creation
  const handleCreateAppointment = async () => {
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newAppointmentForm,
          clientId: parseInt(newAppointmentForm.clientId),
          providerId: parseInt(newAppointmentForm.providerId),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowCreateDialog(false);
        setNewAppointmentForm({
          clientId: "",
          providerId: "",
          service: "",
          dateTime: "",
          duration: 60,
          status: "scheduled",
          price: 0,
          notes: "",
        });
        fetchAppointments();
      } else {
        console.error("Failed to create appointment:", data.error);
        if (data.conflictingAppointments) {
          alert(`Scheduling conflict detected with existing appointments. Please choose a different time.`);
        } else {
          alert(`Error: ${data.error}`);
        }
      }
    } catch (error) {
      console.error("Error creating appointment:", error);
      alert("Failed to create appointment");
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "confirmed": return "bg-green-100 text-green-800";
      case "completed": return "bg-emerald-100 text-emerald-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "no_show": return "bg-gray-100 text-gray-800";
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

  // Format date and time
  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format time only
  const formatTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? mins + 'm' : ''}`;
    }
    return `${mins}m`;
  };

  if (loading && !appointments.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-pink-500 mx-auto" />
          <p className="mt-2 text-gray-600">Loading appointments...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Appointment Scheduling</h1>
            <p className="text-gray-600">Manage appointments, schedules, and booking calendar</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" onClick={() => fetchAppointments()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Book Appointment
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Appointments</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalAppointments}</p>
                    <p className="text-xs text-gray-500">{analytics.todayAppointments} today</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.completedAppointments}</p>
                    <p className="text-xs text-gray-500">{analytics.confirmedAppointments} confirmed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Revenue</p>
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
                  <Clock className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Avg Duration</p>
                    <p className="text-2xl font-bold text-gray-900">{formatDuration(analytics.averageDuration)}</p>
                    <p className="text-xs text-gray-500">{analytics.scheduledAppointments} scheduled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* View Selector and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* View selector and main search */}
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex space-x-1">
                  {["day", "week", "month", "list"].map((viewOption) => (
                    <Button
                      key={viewOption}
                      variant={view === viewOption ? "default" : "outline"}
                      size="sm"
                      onClick={() => setView(viewOption)}
                    >
                      {viewOption.charAt(0).toUpperCase() + viewOption.slice(1)}
                    </Button>
                  ))}
                </div>

                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search appointments, clients, or services..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Advanced filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="no_show">No Show</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={providerFilter} onValueChange={setProviderFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Providers</SelectItem>
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id.toString()}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Service"
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                  />

                  <Button variant="outline" onClick={() => {
                    setStatusFilter("all");
                    setProviderFilter("");
                    setServiceFilter("");
                    setSearchTerm("");
                  }}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Appointments List/Calendar */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Appointments ({appointments.length})
                {viewParams && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    {new Date(viewParams.startDate).toLocaleDateString()} - {new Date(viewParams.endDate).toLocaleDateString()}
                  </span>
                )}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Client</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Service</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Provider</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Duration</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Price</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatTime(appointment.dateTime)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(appointment.dateTime).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              weekday: "short"
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-pink-600" />
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{appointment.clientName}</p>
                            <p className="text-sm text-gray-500">{appointment.clientEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{appointment.service}</p>
                        {appointment.notes && (
                          <p className="text-sm text-gray-500 truncate max-w-32">{appointment.notes}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{appointment.providerName}</p>
                          <p className="text-sm text-gray-500 capitalize">{appointment.providerRole}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900">{formatDuration(appointment.duration)}</p>
                        <p className="text-sm text-gray-500">
                          Until {formatTime(appointment.endTime)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusBadgeColor(appointment.status)}>
                          {appointment.status.replace('_', ' ').charAt(0).toUpperCase() + appointment.status.replace('_', ' ').slice(1)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{formatCurrency(appointment.price)}</p>
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
                                setSelectedAppointment(appointment);
                                setShowAppointmentDetails(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Appointment
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirm
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Phone className="h-4 w-4 mr-2" />
                              Call Client
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel
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

        {/* Provider and Service Stats */}
        {analytics && (analytics.providerStats.length > 0 || analytics.serviceStats.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Provider Stats */}
            {analytics.providerStats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Provider Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.providerStats.slice(0, 5).map((provider, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{provider.name}</p>
                            <p className="text-sm text-gray-500">{provider.appointments} appointments</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(provider.revenue)}</p>
                          <p className="text-sm text-gray-500">{provider.completedAppointments} completed</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Service Stats */}
            {analytics.serviceStats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Popular Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.serviceStats.slice(0, 5).map((service, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{service.service}</p>
                          <p className="text-sm text-gray-500">
                            {service.appointments} appointments • Avg {formatDuration(service.averageDuration)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(service.revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Create Appointment Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Book New Appointment</DialogTitle>
              <DialogDescription>
                Schedule a new appointment for a client with a service provider.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              <div>
                <Label htmlFor="clientId">Client *</Label>
                <Select 
                  value={newAppointmentForm.clientId} 
                  onValueChange={(value) => setNewAppointmentForm({...newAppointmentForm, clientId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="providerId">Provider *</Label>
                <Select 
                  value={newAppointmentForm.providerId} 
                  onValueChange={(value) => setNewAppointmentForm({...newAppointmentForm, providerId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id.toString()}>
                        {provider.name} ({provider.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="service">Service *</Label>
                <Input
                  id="service"
                  value={newAppointmentForm.service}
                  onChange={(e) => setNewAppointmentForm({...newAppointmentForm, service: e.target.value})}
                  placeholder="Enter service name"
                />
              </div>

              <div>
                <Label htmlFor="dateTime">Date & Time *</Label>
                <Input
                  id="dateTime"
                  type="datetime-local"
                  value={newAppointmentForm.dateTime}
                  onChange={(e) => setNewAppointmentForm({...newAppointmentForm, dateTime: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={newAppointmentForm.duration}
                  onChange={(e) => setNewAppointmentForm({...newAppointmentForm, duration: parseInt(e.target.value) || 60})}
                  min="15"
                  step="15"
                />
              </div>

              <div>
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  value={newAppointmentForm.price}
                  onChange={(e) => setNewAppointmentForm({...newAppointmentForm, price: parseFloat(e.target.value) || 0})}
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={newAppointmentForm.status} 
                  onValueChange={(value) => setNewAppointmentForm({...newAppointmentForm, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newAppointmentForm.notes}
                  onChange={(e) => setNewAppointmentForm({...newAppointmentForm, notes: e.target.value})}
                  placeholder="Additional notes about the appointment"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAppointment}>
                Book Appointment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Appointment Details Dialog */}
        <Dialog open={showAppointmentDetails} onOpenChange={setShowAppointmentDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Appointment Details</DialogTitle>
            </DialogHeader>

            {selectedAppointment && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Client</label>
                    <p className="text-gray-900">{selectedAppointment.clientName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Provider</label>
                    <p className="text-gray-900">{selectedAppointment.providerName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Service</label>
                    <p className="text-gray-900">{selectedAppointment.service}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <Badge className={getStatusBadgeColor(selectedAppointment.status)}>
                      {selectedAppointment.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Date & Time</label>
                    <p className="text-gray-900">{formatDateTime(selectedAppointment.dateTime)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Duration</label>
                    <p className="text-gray-900">{formatDuration(selectedAppointment.duration)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Price</label>
                    <p className="text-gray-900">{formatCurrency(selectedAppointment.price)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Client Email</label>
                    <p className="text-gray-900">{selectedAppointment.clientEmail}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-700">Notes</label>
                    <p className="text-gray-900">{selectedAppointment.notes || "No notes"}</p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAppointmentDetails(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}