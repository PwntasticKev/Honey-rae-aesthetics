"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

	// Mock data
	const appointments = [
		{ _id: "1", clientId: "1", clientName: "Sarah Johnson", dateTime: Date.now(), type: "Consultation", provider: "Dr. Rae", status: "scheduled" },
		{ _id: "2", clientId: "2", clientName: "Michael Chen", dateTime: Date.now() + 86400000, type: "Treatment", provider: "Dr. Rae", status: "scheduled" },
	];

	const filteredAppointments = appointments.filter(appointment => {
		const matchesSearch = !searchTerm || 
			appointment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
					
					<Button onClick={onAddAppointment} className="bg-gradient-to-r from-pink-500 to-purple-600">
						<Plus className="w-4 h-4 mr-2" />
						Add Appointment
					</Button>
				</div>
			</div>

			{/* Appointments List */}
			<div className="space-y-4">
				{filteredAppointments.map((appointment) => {
					const { date, time } = formatDateTime(appointment.dateTime);
					return (
						<Card key={appointment._id} className="hover:shadow-md transition-shadow">
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-3">
										<div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center">
											<Calendar className="h-5 w-5 text-white" />
										</div>
										<div>
											<CardTitle className="text-lg">{appointment.clientName}</CardTitle>
											<CardDescription>
												{appointment.type} with {appointment.provider}
											</CardDescription>
										</div>
									</div>
									<div className="flex items-center space-x-2">
										<Badge className={getStatusColor(appointment.status)}>
											{getStatusIcon(appointment.status)}
											<span className="ml-1">{appointment.status}</span>
										</Badge>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<p className="font-medium text-gray-900">Date & Time</p>
										<p className="text-gray-600">{date} at {time}</p>
									</div>
									<div>
										<p className="font-medium text-gray-900">Type</p>
										<p className="text-gray-600">{appointment.type}</p>
									</div>
								</div>
								
								<div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t">
									<Button
										variant="outline"
										size="sm"
										onClick={() => onEditAppointment(appointment._id)}
									>
										<Edit className="h-4 w-4 mr-1" />
										Edit
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => onDeleteAppointment(appointment._id)}
										className="text-red-600 hover:text-red-700"
									>
										<Trash2 className="h-4 w-4 mr-1" />
										Delete
									</Button>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Empty State */}
			{filteredAppointments.length === 0 && (
				<Card className="text-center py-12">
					<CardContent>
						<Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
						<h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments found</h3>
						<p className="text-gray-600 mb-4">
							{searchTerm || statusFilter !== "all" 
								? "Try adjusting your search or filters"
								: "Get started by adding your first appointment"
							}
						</p>
						<Button onClick={onAddAppointment} className="bg-gradient-to-r from-pink-500 to-purple-600">
							<Plus className="w-4 h-4 mr-2" />
							Add Appointment
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	);
} 