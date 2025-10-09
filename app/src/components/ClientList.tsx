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
import { useToast } from "@/hooks/use-toast";
import { InferSelectModel } from "drizzle-orm";
import { clients as clientsSchema } from "@/db/schema";

type Client = InferSelectModel<typeof clientsSchema>;

interface ClientListProps {
  clients: Client[];
  onAddClient: () => void;
  onEditClient: (clientId: number) => void;
  onDeleteClient: (clientId: number) => void;
  selectedClients?: number[];
  onSelectionChange?: (clientIds: number[]) => void;
}

export function ClientList({
  clients,
  onAddClient,
  onEditClient,
  onDeleteClient,
  selectedClients = [],
  onSelectionChange,
}: ClientListProps) {
  const [filteredClients, setFilteredClients] = useState<Client[]>(clients);

  useEffect(() => {
    setFilteredClients(clients);
  }, [clients]);

  const router = useRouter();
  const { toast } = useToast();

  const handleSearch = (term: string) => {
    const filtered = clients.filter((client) => {
      return (
        client.fullName.toLowerCase().includes(term.toLowerCase()) ||
        (client.email &&
          client.email.toLowerCase().includes(term.toLowerCase())) ||
        (client.phones && client.phones.some((phone) => phone.includes(term)))
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
            checked={selectedClients.includes(row.id)}
            onCheckedChange={(checked) => {
              if (onSelectionChange) {
                if (checked) {
                  onSelectionChange([...selectedClients, row.id]);
                } else {
                  onSelectionChange(
                    selectedClients.filter((id) => id !== row.id),
                  );
                }
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className={
              selectedClients.includes(row.id)
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
          onClick={() => router.push(`/clients/${row.id}`)}
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
          {row.phones && row.phones.length > 0 && (
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
            {row.tags &&
              row.tags.map((tag: string) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs cursor-pointer"
                  data-theme-aware="true"
                  title="Remove tag"
                >
                  {tag} <span className="ml-1">×</span>
                </Badge>
              ))}
          </div>
        </div>
      ),
    },
    {
      key: "clientPortalStatus",
      label: "Status",
      width: "15%",
      render: (value: string, row: Client) => (
        <Badge className={getStatusColor(row.clientPortalStatus)}>
          {row.clientPortalStatus}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Joined",
      sortable: true,
      width: "10%",
      render: (value: any, row: Client) => (
        <span className="text-sm text-gray-500">
          {new Date(row.createdAt).toLocaleDateString()}
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
            onClick={() => onEditClient(row.id)}
            className="h-7 w-7 p-0"
            title="Edit Client"
            data-theme-aware="true"
          >
            <User className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteClient(row.id)}
            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
            title="Delete Client"
            data-theme-aware="true"
          >
            <Trash2 className="h-3 w-3" />
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
        onEdit={(row) => onEditClient((row as Client).id)}
        onDelete={(row) => onDeleteClient((row as Client).id)}
        pageSize={50}
        showPagination={true}
        actions={
          <div className="flex items-center gap-2">
            {selectedClients.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() =>
                  selectedClients.forEach((id) => onDeleteClient(id))
                }
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
    </>
  );
}
