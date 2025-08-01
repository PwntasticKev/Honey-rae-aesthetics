"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Menu,
  Bell,
  LogOut,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Edit,
  Trash2,
  Heart,
  Star,
  Clock,
  DollarSign,
} from "lucide-react";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { GlobalSearch } from "@/components/GlobalSearch";

// Mock client data - in real app, this would come from the database
const mockClient = {
  _id: "1",
  fullName: "Sarah Johnson",
  firstName: "Sarah",
  lastName: "Johnson",
  email: "sarah.johnson@email.com",
  phones: ["+1 (555) 123-4567"],
  phone2: "+1 (555) 987-6543",
  gender: "female",
  dateOfBirth: "1985-03-15",
  nickName: "SJ",
  address: {
    street: "123 Main St",
    addressLine2: "Apt 4B",
    city: "Beverly Hills",
    state: "CA",
    country: "USA",
    zip: "90210",
  },
  referralSource: "Google Search",
  membershipType: "Premium",
  totalSales: 2500,
  relationship: "Regular Client",
  visited: true,
  fired: false,
  upcomingAppointment: Date.now() + 86400000 * 7, // 7 days from now
  clientPortalStatus: "active",
  tags: ["VIP", "Regular", "Botox", "Filler"],
  clientCreatedDate: Date.now() - 86400000 * 365, // 1 year ago
  createdAt: Date.now() - 86400000 * 30,
  updatedAt: Date.now(),
};

export default function ClientDetailPage() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const handleEditClient = () => {
    console.log("Edit client clicked:", clientId);
    // TODO: Implement edit client functionality
  };

  const handleDeleteClient = () => {
    console.log("Delete client clicked:", clientId);
    // TODO: Implement delete client functionality
  };

  const handleBackToClients = () => {
    router.push("/clients");
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

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

              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToClients}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Clients
                </Button>

                {/* Page Title */}
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Client Profile
                  </h1>
                  <p className="text-sm text-gray-600">
                    View and manage client information
                  </p>
                </div>
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
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Client Header */}
            <div className="mb-8">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src="/avatar.jpg" />
                    <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white text-2xl">
                      {mockClient.fullName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {mockClient.fullName}
                    </h1>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="secondary">{mockClient.gender}</Badge>
                      <Badge variant="outline">
                        {mockClient.membershipType}
                      </Badge>
                      <Badge
                        className={
                          mockClient.clientPortalStatus === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {mockClient.clientPortalStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={handleEditClient}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" onClick={handleDeleteClient}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>

            {/* Client Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Full Name
                    </label>
                    <p className="text-gray-900">{mockClient.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Nickname
                    </label>
                    <p className="text-gray-900">
                      {mockClient.nickName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Date of Birth
                    </label>
                    <p className="text-gray-900">
                      {mockClient.dateOfBirth || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Gender
                    </label>
                    <p className="text-gray-900 capitalize">
                      {mockClient.gender}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Client Since
                    </label>
                    <p className="text-gray-900">
                      {formatDate(mockClient.clientCreatedDate)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{mockClient.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">
                      {mockClient.phones[0]}
                    </span>
                  </div>
                  {mockClient.phone2 && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{mockClient.phone2}</span>
                    </div>
                  )}
                  {mockClient.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div className="text-gray-900">
                        <p>{mockClient.address.street}</p>
                        {mockClient.address.addressLine2 && (
                          <p>{mockClient.address.addressLine2}</p>
                        )}
                        <p>
                          {mockClient.address.city}, {mockClient.address.state}{" "}
                          {mockClient.address.zip}
                        </p>
                        {mockClient.address.country && (
                          <p>{mockClient.address.country}</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Business Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Referral Source
                    </label>
                    <p className="text-gray-900">{mockClient.referralSource}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Membership Type
                    </label>
                    <p className="text-gray-900">{mockClient.membershipType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Total Sales
                    </label>
                    <p className="text-gray-900">
                      {formatCurrency(mockClient.totalSales)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Relationship
                    </label>
                    <p className="text-gray-900">{mockClient.relationship}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Status
                    </label>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={mockClient.visited ? "default" : "secondary"}
                      >
                        {mockClient.visited ? "Visited" : "Not Visited"}
                      </Badge>
                      {mockClient.fired && (
                        <Badge variant="destructive">Fired</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {mockClient.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Appointment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Appointment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {mockClient.upcomingAppointment ? (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-gray-900">
                        {formatDate(mockClient.upcomingAppointment)}
                      </span>
                    </div>
                  ) : (
                    <p className="text-gray-500">No upcoming appointments</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
