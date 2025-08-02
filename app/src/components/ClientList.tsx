"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTable } from "@/components/ui/data-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Phone,
  Mail,
  User,
  Trash2,
  Download,
  MoreHorizontal,
  AlertTriangle,
  X,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";

interface Client {
  _id: string;
  fullName: string;
  email?: string;
  phones: string[];
  gender: string;
  tags: string[];
  referralSource?: string;
  clientPortalStatus?: string;
  createdAt: number;
}

interface ClientListProps {
  clients: Client[];
  onAddClient: () => void;
  onEditClient: (clientId: string) => void;
  onDeleteClient: (clientId: string) => void;
  selectedClients?: string[];
  onSelectionChange?: (clientIds: string[]) => void;
  orgId?: string;
}

export function ClientList({
  clients,
  onAddClient,
  onEditClient,
  onDeleteClient,
  selectedClients = [],
  onSelectionChange,
  orgId,
}: ClientListProps) {
  console.log("ClientList received clients:", clients?.length, clients);
  const [filteredClients, setFilteredClients] = useState<Client[]>(clients);

  // Update filteredClients when clients prop changes
  useEffect(() => {
    setFilteredClients(clients);
  }, [clients]);
  const [exportingClient, setExportingClient] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const addTag = useMutation(api.clients.addTag);
  const removeTag = useMutation(api.clients.removeTag);
  const deleteClient = useMutation(api.clients.remove);
  const deleteMultipleClients = useMutation(api.clients.removeMultiple);
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});
  const [tagLoading, setTagLoading] = useState<Record<string, boolean>>({});
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );
  const [showMassDeleteConfirm, setShowMassDeleteConfirm] = useState(false);

  const handleSearch = (term: string) => {
    const filtered = clients.filter((client) => {
      return (
        client.fullName.toLowerCase().includes(term.toLowerCase()) ||
        (client.email &&
          client.email.toLowerCase().includes(term.toLowerCase())) ||
        client.phones.some((phone) => phone.includes(term))
      );
    });
    setFilteredClients(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-gray-100 text-gray-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleExportClient = async (clientId: string) => {
    setExportingClient(clientId);
    try {
      const csvData = await fetch(`/api/export-client?clientId=${clientId}`);
      if (csvData.ok) {
        const blob = await csvData.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `client-${clientId}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({
          title: "Client Exported",
          description: "Client data has been exported successfully.",
        });
      } else {
        throw new Error("Failed to export client");
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export client data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExportingClient(null);
    }
  };

  const handleAddTag = async (clientId: string) => {
    const tag = tagInputs[clientId]?.trim();
    if (!tag) return;

    console.log("Adding tag:", { clientId, tag });
    setTagLoading((prev) => ({ ...prev, [clientId]: true }));

    try {
      console.log("Calling addTag mutation with:", { id: clientId, tag });
      await addTag({ id: clientId as any, tag });
      console.log("Tag added successfully");

      setTagInputs((prev) => ({ ...prev, [clientId]: "" }));
      toast({
        title: "Tag Added",
        description: `Added tag "${tag}" to client.`,
      });
    } catch (error) {
      console.error("Failed to add tag:", error);
      toast({
        title: "Failed to Add Tag",
        description: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setTagLoading((prev) => ({ ...prev, [clientId]: false }));
    }
  };

  const handleRemoveTag = async (clientId: string, tag: string) => {
    setTagLoading((prev) => ({ ...prev, [clientId]: true }));
    try {
      await removeTag({ id: clientId as any, tag });
      toast({
        title: "Tag Removed",
        description: `Removed tag "${tag}" from client.`,
      });
    } catch (error) {
      console.error("Failed to remove tag:", error);
      toast({
        title: "Failed to Remove Tag",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setTagLoading((prev) => ({ ...prev, [clientId]: false }));
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    setDeleteLoading(clientId);
    try {
      await deleteClient({ id: clientId as any });
      toast({
        title: "Client Deleted",
        description: "Client has been deleted successfully.",
      });
      // Remove from selection if it was selected
      if (onSelectionChange && selectedClients.includes(clientId)) {
        onSelectionChange(selectedClients.filter((id) => id !== clientId));
      }
    } catch (error) {
      console.error("Failed to delete client:", error);
      toast({
        title: "Error",
        description: "Failed to delete client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(null);
      setShowDeleteConfirm(null);
    }
  };

  const handleMassDelete = async () => {
    if (!selectedClients.length) return;

    try {
      const result = await deleteMultipleClients({
        clientIds: selectedClients as any[],
        orgId: orgId as any,
      });

      toast({
        title: "Clients Deleted",
        description: `${result.deletedCount} clients have been deleted successfully.`,
      });

      // Clear selection
      if (onSelectionChange) {
        onSelectionChange([]);
      }
    } catch (error) {
      console.error("Failed to delete clients:", error);
      toast({
        title: "Error",
        description: "Failed to delete clients. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowMassDeleteConfirm(false);
    }
  };

  const getGenderIcon = (gender: string) => {
    switch (gender.toLowerCase()) {
      case "female":
        return "♀";
      case "male":
        return "♂";
      default:
        return "?";
    }
  };

  const columns = [
    {
      key: "select",
      label: "",
      width: "50px",
      render: (value: any, row: Client) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={selectedClients.includes(row._id)}
            onCheckedChange={(checked) => {
              if (onSelectionChange) {
                if (checked) {
                  onSelectionChange([...selectedClients, row._id]);
                } else {
                  onSelectionChange(
                    selectedClients.filter((id) => id !== row._id),
                  );
                }
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className={
              selectedClients.includes(row._id)
                ? "bg-primary border-primary"
                : ""
            }
          />
        </div>
      ),
    },
    {
      key: "client",
      label: "Client",
      width: "30%",
      render: (value: any, row: Client) => (
        <div
          className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
          onClick={() => router.push(`/clients/${row._id}`)}
        >
          <Avatar className="w-10 h-10">
            <AvatarImage src="/avatar.jpg" />
            <AvatarFallback
              className="text-white avatar-fallback"
              data-theme-aware="true"
            >
              {row.fullName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-gray-900 hover:text-blue-600">
              {row.fullName}
            </div>
            <div className="text-sm text-gray-500 flex items-center">
              <span className="mr-2">{getGenderIcon(row.gender)}</span>
              {row.referralSource}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      label: "Contact",
      width: "25%",
      render: (value: any, row: Client) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <Mail className="h-3 w-3 mr-2 text-gray-400" />
            {row.email}
          </div>
          {row.phones.length > 0 && (
            <div className="flex items-center text-sm">
              <Phone className="h-3 w-3 mr-2 text-gray-400" />
              {row.phones[0]}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "tags",
      label: "Tags",
      width: "20%",
      render: (value: any, row: Client) => (
        <div>
          <div className="flex flex-wrap gap-1 mb-1">
            {row.tags.map((tag, index) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs cursor-pointer"
                data-theme-aware="true"
                onClick={() => handleRemoveTag(row._id, tag)}
                title="Remove tag"
              >
                {tag} <span className="ml-1">×</span>
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Input
              value={tagInputs[row._id] || ""}
              onChange={(e) =>
                setTagInputs((prev) => ({ ...prev, [row._id]: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTag(row._id);
              }}
              placeholder="Add tag"
              className="h-6 text-xs px-2 py-1 w-20"
              disabled={tagLoading[row._id]}
            />
            <Button
              size="sm"
              className="h-6 px-2 text-xs"
              data-theme-aware="true"
              onClick={() => handleAddTag(row._id)}
              disabled={tagLoading[row._id] || !tagInputs[row._id]?.trim()}
            >
              Add
            </Button>
          </div>
        </div>
      ),
    },
    {
      key: "clientPortalStatus",
      label: "Status",
      width: "15%",
      render: (value: string) => (
        <Badge className={getStatusColor(value)}>{value}</Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Joined",
      sortable: true,
      width: "10%",
      render: (value: number) => (
        <span className="text-sm text-gray-500">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      width: "120px",
      render: (value: any, row: Client) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditClient(row._id)}
            className="h-7 w-7 p-0"
            title="Edit Client"
            data-theme-aware="true"
          >
            <User className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleExportClient(row._id)}
            className="h-7 w-7 p-0"
            title="Export Client"
            disabled={exportingClient === row._id}
            data-theme-aware="true"
          >
            {exportingClient === row._id ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            ) : (
              <Download className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(row._id)}
            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
            title="Delete Client"
            disabled={deleteLoading === row._id}
            data-theme-aware="true"
          >
            {deleteLoading === row._id ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-red-600" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={filteredClients}
        columns={columns}
        title="Clients"
        description={`Manage your client database (${filteredClients.length} clients)`}
        searchPlaceholder="Search clients by name, email, or phone..."
        onSearch={handleSearch}
        onEdit={onEditClient}
        onDelete={onDeleteClient}
        pageSize={50}
        showPagination={true}
        actions={
          <div className="flex items-center gap-2">
            {selectedClients.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowMassDeleteConfirm(true)}
                data-theme-aware="true"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedClients.length})
              </Button>
            )}
            <Button onClick={onAddClient} data-theme-aware="true">
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </div>
        }
      />

      {/* Individual Delete Confirmation - Right Side Panel */}
      {showDeleteConfirm && (
        <div
          className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg border-l border-gray-200 z-50 transform transition-transform duration-300"
          data-theme-aware="true"
        >
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Delete Client</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteConfirm(null)}
                data-theme-aware="true"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <h4 className="font-medium">Confirm Deletion</h4>
                <p className="text-sm text-gray-600">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex-1">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete this client? All associated data
                including appointments, messages, and files will be permanently
                removed.
              </p>
            </div>

            <div className="flex flex-col gap-3 mt-auto">
              <Button
                variant="destructive"
                onClick={() => handleDeleteClient(showDeleteConfirm)}
                data-theme-aware="true"
                disabled={deleteLoading === showDeleteConfirm}
                className="w-full"
              >
                {deleteLoading === showDeleteConfirm
                  ? "Deleting..."
                  : "Delete Client"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
                data-theme-aware="true"
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mass Delete Confirmation - Right Side Panel */}
      {showMassDeleteConfirm && (
        <div
          className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg border-l border-gray-200 z-50 transform transition-transform duration-300"
          data-theme-aware="true"
        >
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Delete Multiple Clients</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMassDeleteConfirm(false)}
                data-theme-aware="true"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <h4 className="font-medium">Confirm Bulk Deletion</h4>
                <p className="text-sm text-gray-600">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex-1">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete {selectedClients.length}{" "}
                selected clients? All associated data will be permanently
                removed.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 font-medium">Warning:</p>
                <p className="text-xs text-red-600">
                  This will delete {selectedClients.length} clients and all
                  their associated data permanently.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-auto">
              <Button
                variant="destructive"
                onClick={handleMassDelete}
                data-theme-aware="true"
                className="w-full"
              >
                Delete {selectedClients.length} Clients
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowMassDeleteConfirm(false)}
                data-theme-aware="true"
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
