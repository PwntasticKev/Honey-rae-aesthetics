"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Search, Plus, Calendar, Clock, User, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";

interface AppointmentListProps {
	orgId: string;
	onAddAppointment: () => void;
	onEditAppointment: (appointmentId: string) => void;
	onDeleteAppointment: (appointmentId: string) => void;
}

export function AppointmentList({ orgId, onAddAppointment, onEditAppointment, onDeleteAppointment }: AppointmentListProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	const appointments = useQuery(api.appointments.getByOrg, { orgId: orgId as any }) || [];
	const clients = useQuery(api.clients.getByOrg, { orgId: orgId as any }) || [];

	const filteredAppointments = appointments.filter(appointment => {
		const client = clients.find(c => c._id === appointment.clientId);
		const matchesSearch = !searchTerm || 
			client?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			appointment.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
			appointment.provider.toLowerCase().includes(searchTerm.toLowerCase());
		
		const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
		
		return matchesSearch && matchesStatus;
	});

	const formatDateTime = (timestamp: number) => {
		const date = new Date(timestamp);
		return {
			date: date.toLocaleDateString(),
			time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
			full: date.toLocaleString(),
		};
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "scheduled":
				return "bg-blue-100 text-blue-800";
			case "completed":
				return "bg-green-100 text-green-800";
			case "cancelled":
				return "bg-red-100 text-red-800";
			case "no_show":
				return "bg-yellow-100 text-yellow-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "completed":
				return <CheckCircle className="h-4 w-4" />;
			case "cancelled":
			case "no_show":
				return <XCircle className="h-4 w-4" />;
			default:
				return <Clock className="h-4 w-4" />;
		}
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
							placeholder="Search appointments..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
				</div>
				
				<div className="flex gap-2">
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						<option value="all">All Status</option>
						<option value="scheduled">Scheduled</option>
						<option value="completed">Completed</option>
						<option value="cancelled">Cancelled</option>
						<option value="no_show">No Show</option>
					</select>
					
					<Button onClick={onAddAppointment} className="flex items-center space-x-2">
						<Plus className="h-4 w-4" />
						<span>Schedule Appointment</span>
					</Button>
				</div>
			</div>

			{/* Appointment Count */}
			<div className="text-sm text-gray-600">
				{filteredAppointments.length} of {appointments.length} appointments
			</div>

			{/* Appointment List */}
			<div className="bg-white rounded-lg shadow overflow-hidden">
				{filteredAppointments.length === 0 ? (
					<div className="p-8 text-center">
						<div className="text-gray-400 mb-4">
							{appointments.length === 0 ? (
								<>
									<Calendar className="h-12 w-12 mx-auto mb-4" />
									<h3 className="text-lg font-medium text-gray-900 mb-2">
										No appointments scheduled
									</h3>
									<p className="text-gray-500 mb-4">
										Schedule your first appointment to get started.
									</p>
									<Button onClick={onAddAppointment}>
										Schedule Appointment
									</Button>
								</>
							) : (
								<>
									<Search className="h-12 w-12 mx-auto mb-4" />
									<h3 className="text-lg font-medium text-gray-900 mb-2">
										No appointments found
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
										Client & Details
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Date & Time
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Provider
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Status
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{filteredAppointments.map((appointment) => {
									const client = clients.find(c => c._id === appointment.clientId);
									const dateTime = formatDateTime(appointment.dateTime);
									
									return (
										<tr key={appointment._id} className="hover:bg-gray-50">
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center">
													<div className="flex-shrink-0 h-10 w-10">
														<div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
															<span className="text-white font-medium">
																{client?.fullName.charAt(0).toUpperCase() || "?"}
															</span>
														</div>
													</div>
													<div className="ml-4">
														<div className="text-sm font-medium text-gray-900">
															{client?.fullName || "Unknown Client"}
														</div>
														<div className="text-sm text-gray-500">
															{appointment.type}
														</div>
														{appointment.notes && (
															<div className="text-xs text-gray-400 mt-1">
																{appointment.notes.substring(0, 50)}
																{appointment.notes.length > 50 && "..."}
															</div>
														)}
													</div>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-gray-900">
													<div className="flex items-center">
														<Calendar className="h-3 w-3 mr-1 text-gray-400" />
														{dateTime.date}
													</div>
													<div className="flex items-center mt-1">
														<Clock className="h-3 w-3 mr-1 text-gray-400" />
														{dateTime.time}
													</div>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center text-sm text-gray-900">
													<User className="h-3 w-3 mr-1 text-gray-400" />
													{appointment.provider}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(appointment.status)}`}>
													{getStatusIcon(appointment.status)}
													<span className="ml-1">{appointment.status}</span>
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
												<div className="flex justify-end space-x-2">
													<button
														onClick={() => onEditAppointment(appointment._id)}
														className="text-blue-600 hover:text-blue-900"
													>
														<Edit className="h-4 w-4" />
													</button>
													<button
														onClick={() => onDeleteAppointment(appointment._id)}
														className="text-red-600 hover:text-red-900"
													>
														<Trash2 className="h-4 w-4" />
													</button>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
} 