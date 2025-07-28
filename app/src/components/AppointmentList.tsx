"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Search, Plus, Calendar, Clock, User, CheckCircle, XCircle } from "lucide-react";

interface Appointment {
	_id: string;
	clientId: string;
	clientName: string;
	dateTime: number;
	type: string;
	provider: string;
	status: string;
}

interface AppointmentListProps {
	orgId: string;
	onAddAppointment: () => void;
	onEditAppointment: (appointmentId: string) => void;
	onDeleteAppointment: (appointmentId: string) => void;
}

export function AppointmentList({ orgId, onAddAppointment, onEditAppointment, onDeleteAppointment }: AppointmentListProps) {
	// Mock data
	const appointments: Appointment[] = [
		{ _id: "1", clientId: "1", clientName: "Sarah Johnson", dateTime: Date.now(), type: "Consultation", provider: "Dr. Rae", status: "scheduled" },
		{ _id: "2", clientId: "2", clientName: "Michael Chen", dateTime: Date.now() + 86400000, type: "Treatment", provider: "Dr. Rae", status: "scheduled" },
	];

	const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>(appointments);

	const handleSearch = (term: string) => {
		const filtered = appointments.filter(appointment => {
			return appointment.clientName.toLowerCase().includes(term.toLowerCase()) ||
				appointment.type.toLowerCase().includes(term.toLowerCase()) ||
				appointment.provider.toLowerCase().includes(term.toLowerCase());
		});
		setFilteredAppointments(filtered);
	};

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

	const columns = [
		{
			key: "client",
			label: "Client",
			width: "25%",
			render: (value: any, row: Appointment) => (
				<div className="flex items-center space-x-3">
					<div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center">
						<Calendar className="h-5 w-5 text-white" />
					</div>
					<div>
						<div className="font-medium text-gray-900">{row.clientName}</div>
						<div className="text-sm text-gray-500">{row.type}</div>
					</div>
				</div>
			)
		},
		{
			key: "dateTime",
			label: "Date & Time",
			sortable: true,
			width: "20%",
			render: (value: number) => {
				const { date, time } = formatDateTime(value);
				return (
					<div>
						<div className="font-medium text-gray-900">{date}</div>
						<div className="text-sm text-gray-500">{time}</div>
					</div>
				);
			}
		},
		{
			key: "provider",
			label: "Provider",
			width: "20%",
			render: (value: string) => (
				<div className="flex items-center">
					<User className="h-4 w-4 mr-2 text-gray-400" />
					{value}
				</div>
			)
		},
		{
			key: "type",
			label: "Type",
			width: "15%",
			render: (value: string) => (
				<Badge variant="outline" className="text-xs">
					{value}
				</Badge>
			)
		},
		{
			key: "status",
			label: "Status",
			width: "20%",
			render: (value: string) => (
				<Badge className={getStatusColor(value)}>
					{getStatusIcon(value)}
					<span className="ml-1">{value}</span>
				</Badge>
			)
		}
	];

	return (
		<DataTable
			data={filteredAppointments}
			columns={columns}
			title="Appointments"
			description={`Manage your appointment schedule (${filteredAppointments.length} appointments)`}
			searchPlaceholder="Search appointments by client, type, or provider..."
			onSearch={handleSearch}
			onEdit={onEditAppointment}
			onDelete={onDeleteAppointment}
			actions={
				<Button onClick={onAddAppointment} className="bg-gradient-to-r from-pink-500 to-purple-600">
					<Plus className="w-4 h-4 mr-2" />
					Add Appointment
				</Button>
			}
		/>
	);
} 