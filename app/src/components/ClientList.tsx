"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
	Search, 
	Plus, 
	Edit, 
	Trash2, 
	Phone, 
	Mail, 
	MapPin,
	Filter,
	MoreHorizontal
} from "lucide-react";
import { ClientForm } from "./ClientForm";

interface Client {
	_id: string;
	fullName: string;
	email?: string;
	phones: string[];
	gender: string;
	tags: string[];
	referralSource?: string;
	clientPortalStatus: string;
	createdAt: number;
}

interface ClientListProps {
	clients: Client[];
	onAddClient: () => void;
	onEditClient: (clientId: string) => void;
	onDeleteClient: (clientId: string) => void;
}

export function ClientList({ clients, onAddClient, onEditClient, onDeleteClient }: ClientListProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [showAddForm, setShowAddForm] = useState(false);
	const [editingClient, setEditingClient] = useState<Client | null>(null);

	const filteredClients = clients.filter(client => {
		const matchesSearch = client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			client.phones.some(phone => phone.includes(searchTerm));
		
		const matchesStatus = statusFilter === "all" || client.clientPortalStatus === statusFilter;
		
		return matchesSearch && matchesStatus;
	});

	const handleAddClient = (data: any) => {
		// In a real app, this would call an API
		console.log("Adding client:", data);
		
		// Add the new client to the list
		const newClient = {
			_id: Date.now().toString(),
			...data,
			createdAt: Date.now(),
		};
		
		// This would normally update the parent state
		// For now, we'll just close the form
		setShowAddForm(false);
		onAddClient();
	};

	const handleEditClient = (data: any) => {
		// In a real app, this would call an API
		console.log("Updating client:", data);
		setEditingClient(null);
		onEditClient(editingClient!._id);
	};

	const handleDeleteClient = (clientId: string) => {
		if (confirm("Are you sure you want to delete this client?")) {
			onDeleteClient(clientId);
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "active": return "bg-green-100 text-green-800";
			case "inactive": return "bg-gray-100 text-gray-800";
			case "pending": return "bg-yellow-100 text-yellow-800";
			default: return "bg-gray-100 text-gray-800";
		}
	};

	if (showAddForm) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold gradient-text">Add New Client</h2>
					<Button variant="outline" onClick={() => setShowAddForm(false)}>
						Cancel
					</Button>
				</div>
				<ClientForm
					onSubmit={handleAddClient}
					onCancel={() => setShowAddForm(false)}
				/>
			</div>
		);
	}

	if (editingClient) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold gradient-text">Edit Client</h2>
					<Button variant="outline" onClick={() => setEditingClient(null)}>
						Cancel
					</Button>
				</div>
				<ClientForm
					onSubmit={handleEditClient}
					onCancel={() => setEditingClient(null)}
					initialData={editingClient}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold gradient-text">Clients</h2>
					<p className="text-muted-foreground">
						Manage your client database ({filteredClients.length} clients)
					</p>
				</div>
				<Button onClick={() => setShowAddForm(true)} className="bg-gradient-to-r from-pink-500 to-purple-600">
					<Plus className="w-4 h-4 mr-2" />
					Add Client
				</Button>
			</div>

			{/* Filters */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col md:flex-row gap-4">
						<div className="flex-1 relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
							<Input
								placeholder="Search clients..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Filter className="h-4 w-4 text-muted-foreground" />
							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value)}
								className="border border-gray-300 rounded-md px-3 py-2 text-sm"
							>
								<option value="all">All Status</option>
								<option value="active">Active</option>
								<option value="inactive">Inactive</option>
								<option value="pending">Pending</option>
							</select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Client Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{filteredClients.map((client) => (
					<Card key={client._id} className="hover:shadow-lg transition-shadow">
						<CardHeader className="pb-3">
							<div className="flex items-start justify-between">
								<div className="flex items-center space-x-3">
									<Avatar className="w-12 h-12">
										<AvatarImage src={`/api/avatar/${client._id}`} />
										<AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white">
											{client.fullName.charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div>
										<CardTitle className="text-lg">{client.fullName}</CardTitle>
										<CardDescription>
											{client.gender.charAt(0).toUpperCase() + client.gender.slice(1)} • 
											{new Date(client.createdAt).toLocaleDateString()}
										</CardDescription>
									</div>
								</div>
								<div className="flex items-center space-x-1">
									<Button
										variant="ghost"
										size="icon"
										onClick={() => setEditingClient(client)}
										title="Edit"
									>
										<Edit className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => handleDeleteClient(client._id)}
										title="Delete"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							{/* Contact Info */}
							<div className="space-y-2">
								{client.email && (
									<div className="flex items-center space-x-2 text-sm">
										<Mail className="h-4 w-4 text-muted-foreground" />
										<span>{client.email}</span>
									</div>
								)}
								{client.phones.length > 0 && (
									<div className="flex items-center space-x-2 text-sm">
										<Phone className="h-4 w-4 text-muted-foreground" />
										<span>{client.phones[0]}</span>
									</div>
								)}
							</div>

							{/* Tags */}
							{client.tags.length > 0 && (
								<div className="flex flex-wrap gap-1">
									{client.tags.slice(0, 3).map((tag) => (
										<Badge key={tag} variant="secondary" className="text-xs">
											{tag}
										</Badge>
									))}
									{client.tags.length > 3 && (
										<Badge variant="outline" className="text-xs">
											+{client.tags.length - 3} more
										</Badge>
									)}
								</div>
							)}

							{/* Status */}
							<div className="flex items-center justify-between">
								<Badge className={getStatusColor(client.clientPortalStatus)}>
									{client.clientPortalStatus.charAt(0).toUpperCase() + client.clientPortalStatus.slice(1)}
								</Badge>
								{client.referralSource && (
									<span className="text-xs text-muted-foreground">
										via {client.referralSource}
									</span>
								)}
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Empty State */}
			{filteredClients.length === 0 && (
				<Card className="text-center py-12">
					<CardContent>
						<div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
							<Plus className="w-8 h-8 text-gray-400" />
						</div>
						<h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
						<p className="text-gray-500 mb-4">
							{searchTerm || statusFilter !== "all" 
								? "Try adjusting your search or filters"
								: "Get started by adding your first client"
							}
						</p>
						{!searchTerm && statusFilter === "all" && (
							<Button onClick={() => setShowAddForm(true)}>
								<Plus className="w-4 h-4 mr-2" />
								Add Your First Client
							</Button>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
} 