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
}

export function ClientList({
  clients,
  onAddClient,
  onEditClient,
  onDeleteClient,
  selectedClients = [],
  onSelectionChange,
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
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});
  const [tagLoading, setTagLoading] = useState<Record<string, boolean>>({});

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
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
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
        />
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
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white">
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
                className="text-xs cursor-pointer hover:bg-red-200"
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
      width: "80px",
      render: (value: any, row: Client) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditClient(row._id)}
            className="h-7 w-7 p-0"
            title="Edit Client"
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
          >
            {exportingClient === row._id ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            ) : (
              <Download className="h-3 w-3" />
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
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
        <Button
          onClick={onAddClient}
          className="bg-gradient-to-r from-pink-500 to-purple-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      }
    />
  );
}
