"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, User, Phone, Mail } from "lucide-react";

interface AppointmentFormProps {
	onSubmit: (data: any) => void;
	onCancel: () => void;
	initialData?: any;
	clients?: any[];
}

export function AppointmentForm({ onSubmit, onCancel, initialData, clients = [] }: AppointmentFormProps) {
	const [formData, setFormData] = useState({
		clientId: initialData?.clientId || "",
		dateTime: initialData?.dateTime || "",
		type: initialData?.type || "consultation",
		duration: initialData?.duration || 60,
		provider: initialData?.provider || "Dr. Rae",
		status: initialData?.status || "scheduled",
		notes: initialData?.notes || "",
		location: initialData?.location || "Main Office",
		reminderSent: initialData?.reminderSent || false,
	});

	const appointmentTypes = [
		{ value: "consultation", label: "Consultation" },
		{ value: "treatment", label: "Treatment" },
		{ value: "follow-up", label: "Follow-up" },
		{ value: "emergency", label: "Emergency" },
		{ value: "maintenance", label: "Maintenance" },
	];

	const appointmentStatuses = [
		{ value: "scheduled", label: "Scheduled" },
		{ value: "confirmed", label: "Confirmed" },
		{ value: "in-progress", label: "In Progress" },
		{ value: "completed", label: "Completed" },
		{ value: "cancelled", label: "Cancelled" },
		{ value: "no-show", label: "No Show" },
	];

	const durationOptions = [
		{ value: 30, label: "30 minutes" },
		{ value: 60, label: "1 hour" },
		{ value: 90, label: "1.5 hours" },
		{ value: 120, label: "2 hours" },
	];

	const handleInputChange = (field: string, value: any) => {
		setFormData(prev => ({
			...prev,
			[field]: value,
		}));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		
		// Validate required fields
		if (!formData.clientId) {
			alert("Please select a client");
			return;
		}
		
		if (!formData.dateTime) {
			alert("Please select a date and time");
			return;
		}
		
		onSubmit(formData);
	};

	const selectedClient = clients.find(client => client._id === formData.clientId);

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Client Selection */}
			<Card>
				<CardHeader>
					<CardTitle>Client Information</CardTitle>
					<CardDescription>Select the client for this appointment</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="clientId">Client *</Label>
						<Select
							value={formData.clientId}
							onValueChange={(value) => handleInputChange("clientId", value)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select a client" />
							</SelectTrigger>
							<SelectContent>
								{clients.map((client) => (
									<SelectItem key={client._id} value={client._id}>
										{client.fullName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{selectedClient && (
						<div className="p-4 bg-gray-50 rounded-lg">
							<div className="flex items-center space-x-3 mb-2">
								<User className="h-4 w-4 text-gray-500" />
								<span className="font-medium">{selectedClient.fullName}</span>
							</div>
							{selectedClient.email && (
								<div className="flex items-center space-x-2 text-sm text-gray-600">
									<Mail className="h-4 w-4" />
									<span>{selectedClient.email}</span>
								</div>
							)}
							{selectedClient.phones && selectedClient.phones.length > 0 && (
								<div className="flex items-center space-x-2 text-sm text-gray-600">
									<Phone className="h-4 w-4" />
									<span>{selectedClient.phones[0]}</span>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Appointment Details */}
			<Card>
				<CardHeader>
					<CardTitle>Appointment Details</CardTitle>
					<CardDescription>Set the appointment time and details</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="dateTime">Date & Time *</Label>
							<Input
								id="dateTime"
								type="datetime-local"
								value={formData.dateTime}
								onChange={(e) => handleInputChange("dateTime", e.target.value)}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="duration">Duration</Label>
							<Select
								value={formData.duration.toString()}
								onValueChange={(value) => handleInputChange("duration", parseInt(value))}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{durationOptions.map((option) => (
										<SelectItem key={option.value} value={option.value.toString()}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="type">Appointment Type</Label>
							<Select
								value={formData.type}
								onValueChange={(value) => handleInputChange("type", value)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{appointmentTypes.map((type) => (
										<SelectItem key={type.value} value={type.value}>
											{type.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="provider">Provider</Label>
							<Input
								id="provider"
								value={formData.provider}
								onChange={(e) => handleInputChange("provider", e.target.value)}
								placeholder="Dr. Rae"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="status">Status</Label>
							<Select
								value={formData.status}
								onValueChange={(value) => handleInputChange("status", value)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{appointmentStatuses.map((status) => (
										<SelectItem key={status.value} value={status.value}>
											{status.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="location">Location</Label>
							<Input
								id="location"
								value={formData.location}
								onChange={(e) => handleInputChange("location", e.target.value)}
								placeholder="Main Office"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Notes */}
			<Card>
				<CardHeader>
					<CardTitle>Notes</CardTitle>
					<CardDescription>Add any additional notes for this appointment</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<Label htmlFor="notes">Appointment Notes</Label>
						<Textarea
							id="notes"
							value={formData.notes}
							onChange={(e) => handleInputChange("notes", e.target.value)}
							placeholder="Enter any notes about this appointment..."
							rows={4}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Form Actions */}
			<div className="flex justify-end space-x-2">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit">
					{initialData ? "Update Appointment" : "Create Appointment"}
				</Button>
			</div>
		</form>
	);
} 