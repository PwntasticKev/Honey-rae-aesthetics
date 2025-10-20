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
import { 
  Search, 
  Users, 
  UserCheck, 
  UserX, 
  Crown, 
  Settings, 
  Mail, 
  Calendar,
  Building,
  Shield,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Filter,
  Download,
  RefreshCw
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  isMasterOwner: boolean;
  lastLoginAt?: string;
  createdAt: string;
  orgId: number;
  orgName: string;
  orgEmail: string;
  orgStatus: string;
  orgSubscriptionTier: string;
}

interface UserSummary {
  total: number;
  active: number;
  inactive: number;
  masterOwners: number;
  admins: number;
  organizations: number;
}

interface Pagination {
  page: number;
  limit: number;
  totalUsers: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function UsersManagementPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orgFilter, setOrgFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkAction, setBulkAction] = useState<"activate" | "deactivate" | "delete">("activate");

  // Check master admin permission
  if (!user?.isMasterOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-red-500" />
              <span>Access Denied</span>
            </CardTitle>
            <CardDescription>
              You need master admin privileges to access user management.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Fetch users data
  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
        page: page.toString(),
        limit: "20",
      });

      if (orgFilter) {
        params.append("orgId", orgFilter);
      }

      const response = await fetch(`/api/master-admin/users?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
        setSummary(data.summary);
        setPagination(data.pagination);
      } else {
        console.error("Failed to fetch users:", data.error);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users on component mount and when filters change
  useEffect(() => {
    fetchUsers(1);
  }, [searchTerm, roleFilter, statusFilter, orgFilter]);

  // Handle user selection
  const toggleUserSelection = (userId: number) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const selectAllUsers = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  // Handle bulk actions
  const handleBulkAction = async () => {
    if (selectedUsers.size === 0) return;

    try {
      const response = await fetch("/api/master-admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: bulkAction,
          userIds: Array.from(selectedUsers),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSelectedUsers(new Set());
        setShowBulkActions(false);
        fetchUsers(pagination?.page || 1);
      } else {
        console.error("Bulk action failed:", data.error);
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error performing bulk action:", error);
      alert("Failed to perform bulk action");
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string, isMasterOwner: boolean) => {
    if (isMasterOwner) return "bg-purple-100 text-purple-800";
    switch (role) {
      case "owner": return "bg-blue-100 text-blue-800";
      case "admin": return "bg-green-100 text-green-800";
      case "manager": return "bg-orange-100 text-orange-800";
      case "staff": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading && !users.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-pink-500 mx-auto" />
          <p className="mt-2 text-gray-600">Loading users...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage users across all organizations</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => fetchUsers(pagination?.page || 1)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export Users
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.active}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <UserX className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-600">Inactive</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.inactive}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Crown className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Master Owners</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.masterOwners}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Admins</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.admins}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-pink-500" />
                  <div>
                    <p className="text-sm text-gray-600">Organizations</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.organizations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search users, emails, or organizations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {selectedUsers.size > 0 && (
                <Button variant="outline" onClick={() => setShowBulkActions(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Bulk Actions ({selectedUsers.size})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Users ({users.length})</CardTitle>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  checked={selectedUsers.size === users.length && users.length > 0}
                  onCheckedChange={selectAllUsers}
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
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">User</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Organization</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Last Login</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                              <span className="text-pink-600 font-medium text-sm">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{user.orgName}</p>
                          <p className="text-sm text-gray-500 capitalize">{user.orgSubscriptionTier}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getRoleBadgeColor(user.role, user.isMasterOwner)}>
                          {user.isMasterOwner ? (
                            <span className="flex items-center">
                              <Crown className="h-3 w-3 mr-1" />
                              Master Owner
                            </span>
                          ) : (
                            user.role.charAt(0).toUpperCase() + user.role.slice(1)
                          )}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}
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
                                setSelectedUser(user);
                                setShowUserDetails(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            {!user.isMasterOwner && (
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            )}
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
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalUsers} total users)
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                disabled={!pagination.hasPrev}
                onClick={() => fetchUsers(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={!pagination.hasNext}
                onClick={() => fetchUsers(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Bulk Actions Dialog */}
        <Dialog open={showBulkActions} onOpenChange={setShowBulkActions}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk User Actions</DialogTitle>
              <DialogDescription>
                Perform actions on {selectedUsers.size} selected users
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Select value={bulkAction} onValueChange={(value: any) => setBulkAction(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activate">Activate Users</SelectItem>
                  <SelectItem value="deactivate">Deactivate Users</SelectItem>
                  <SelectItem value="delete">Delete Users (Soft Delete)</SelectItem>
                </SelectContent>
              </Select>

              {bulkAction === "delete" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> This will soft delete the selected users. 
                    They will be deactivated and their data will be anonymized.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkActions(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkAction}>
                Apply Action
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Details Dialog */}
        <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <p className="text-gray-900">{selectedUser.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Role</label>
                    <Badge className={getRoleBadgeColor(selectedUser.role, selectedUser.isMasterOwner)}>
                      {selectedUser.isMasterOwner ? "Master Owner" : selectedUser.role}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <Badge variant={selectedUser.isActive ? "default" : "secondary"}>
                      {selectedUser.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Organization</label>
                    <p className="text-gray-900">{selectedUser.orgName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Created</label>
                    <p className="text-gray-900">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Login</label>
                    <p className="text-gray-900">
                      {selectedUser.lastLoginAt ? formatDate(selectedUser.lastLoginAt) : "Never"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUserDetails(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}