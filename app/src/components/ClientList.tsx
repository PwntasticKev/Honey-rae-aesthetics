"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Search, Plus, Edit, Trash2, Phone, Mail, Tag } from "lucide-react";

interface ClientListProps {
	orgId: string;
	onAddClient: () => void;
	onEditClient: (clientId: string) => void;
	onDeleteClient: (clientId: string) => void;
}

export function ClientList({ orgId, onAddClient, onEditClient, onDeleteClient }: ClientListProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [filterTag, setFilterTag] = useState("");

	const clients = useQuery(api.clients.getByOrg, { orgId: orgId as any }) || [];

	const filteredClients = clients.filter(client => {
		const matchesSearch = client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			client.phones.some(phone => phone.includes(searchTerm));
		
		const matchesTag = !filterTag || client.tags.includes(filterTag);
		
		return matchesSearch && matchesTag;
	});

	const allTags = Array.from(new Set(clients.flatMap(client => client.tags)));

	const formatPhone = (phone: string) => {
		// Simple phone formatting
		const cleaned = phone.replace(/\D/g, "");
		if (cleaned.length === 10) {
			return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
		}
		return phone;
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString();
	};

	return (
		<div className="space-y-6">
			{/* Header with Search and Filters */}
			<div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
				<div className="flex-1 max-w-md">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
						<input
							type="text"
							placeholder="Search clients..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
				</div>
				
				<div className="flex gap-2">
					<select
						value={filterTag}
						onChange={(e) => setFilterTag(e.target.value)}
						className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						<option value="">All Tags</option>
						{allTags.map(tag => (
							<option key={tag} value={tag}>{tag}</option>
						))}
					</select>
					
					<Button onClick={onAddClient} className="flex items-center space-x-2">
						<Plus className="h-4 w-4" />
						<span>Add Client</span>
					</Button>
				</div>
			</div>

			{/* Client Count */}
			<div className="text-sm text-gray-600">
				{filteredClients.length} of {clients.length} clients
			</div>

			{/* Client List */}
			<div className="bg-white rounded-lg shadow overflow-hidden">
				{filteredClients.length === 0 ? (
					<div className="p-8 text-center">
						<div className="text-gray-400 mb-4">
							{clients.length === 0 ? (
								<>
									<Search className="h-12 w-12 mx-auto mb-4" />
									<h3 className="text-lg font-medium text-gray-900 mb-2">
										No clients yet
									</h3>
									<p className="text-gray-500 mb-4">
										Start by adding your first client to the system.
									</p>
									<Button onClick={onAddClient}>
										Add Your First Client
									</Button>
								</>
							) : (
								<>
									<Search className="h-12 w-12 mx-auto mb-4" />
									<h3 className="text-lg font-medium text-gray-900 mb-2">
										No clients found
									</h3>
									<p className="text-gray-500">
										Try adjusting your search or filter criteria.
									</p>
								</>
							)}
						</div>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Client
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Contact
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Tags
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Status
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Created
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{filteredClients.map((client) => (
									<tr key={client._id} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex items-center">
												<div className="flex-shrink-0 h-10 w-10">
													{client.profileImageUrl ? (
														<img
															className="h-10 w-10 rounded-full"
															src={client.profileImageUrl}
															alt={client.fullName}
														/>
													) : (
														<div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
															<span className="text-white font-medium">
																{client.fullName.charAt(0).toUpperCase()}
															</span>
														</div>
													)}
												</div>
												<div className="ml-4">
													<div className="text-sm font-medium text-gray-900">
														{client.fullName}
													</div>
													<div className="text-sm text-gray-500">
														{client.gender} • {client.dateOfBirth ? formatDate(client.dateOfBirth) : "No DOB"}
													</div>
												</div>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="space-y-1">
												{client.phones.map((phone, index) => (
													<div key={index} className="flex items-center text-sm text-gray-900">
														<Phone className="h-3 w-3 mr-1 text-gray-400" />
														{formatPhone(phone)}
													</div>
												))}
												{client.email && (
													<div className="flex items-center text-sm text-gray-900">
														<Mail className="h-3 w-3 mr-1 text-gray-400" />
														{client.email}
													</div>
												)}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex flex-wrap gap-1">
												{client.tags.map((tag) => (
													<span
														key={tag}
														className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
													>
														<Tag className="h-3 w-3 mr-1" />
														{tag}
													</span>
												))}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
												client.clientPortalStatus === "active"
													? "bg-green-100 text-green-800"
													: client.clientPortalStatus === "inactive"
													? "bg-red-100 text-red-800"
													: "bg-yellow-100 text-yellow-800"
											}`}>
												{client.clientPortalStatus}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{new Date(client.createdAt).toLocaleDateString()}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
											<div className="flex justify-end space-x-2">
												<button
													onClick={() => onEditClient(client._id)}
													className="text-blue-600 hover:text-blue-900"
												>
													<Edit className="h-4 w-4" />
												</button>
												<button
													onClick={() => onDeleteClient(client._id)}
													className="text-red-600 hover:text-red-900"
												>
													<Trash2 className="h-4 w-4" />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
} 