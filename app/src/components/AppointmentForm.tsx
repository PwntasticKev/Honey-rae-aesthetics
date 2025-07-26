"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, FileText } from "lucide-react";

const appointmentSchema = z.object({
	clientId: z.string().min(1, "Please select a client"),
	dateTime: z.string().min(1, "Please select a date and time"),
	type: z.string().min(1, "Appointment type is required"),
	provider: z.string().min(1, "Provider is required"),
	notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
	orgId: any; // Using any for now since we're passing from parent
	onSubmit: (data: AppointmentFormData) => void;
	onCancel: () => void;
	initialData?: Partial<AppointmentFormData>;
}

export function AppointmentForm({ orgId, onSubmit, onCancel, initialData }: AppointmentFormProps) {
	const [selectedDate, setSelectedDate] = useState("");
	const [selectedTime, setSelectedTime] = useState("");

	const clients = useQuery(api.clients.getByOrg, { orgId: orgId }) || [];

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
	} = useForm<AppointmentFormData>({
		resolver: zodResolver(appointmentSchema),
		defaultValues: {
			clientId: initialData?.clientId || "",
			dateTime: initialData?.dateTime || "",
			type: initialData?.type || "",
			provider: initialData?.provider || "Dr. Kevin Rae",
			notes: initialData?.notes || "",
		},
	});

	const handleDateTimeChange = () => {
		if (selectedDate && selectedTime) {
			const dateTime = new Date(`${selectedDate}T${selectedTime}`);
			setValue("dateTime", dateTime.toISOString());
		}
	};

	const appointmentTypes = [
		"Consultation",
		"Botox Treatment",
		"Filler Treatment",
		"Laser Treatment",
		"Chemical Peel",
		"Microdermabrasion",
		"Follow-up",
		"Other",
	];

	const providers = [
		"Dr. Kevin Rae",
		"Dr. Sarah Smith",
		"Nurse Practitioner Johnson",
		"Esthetician Davis",
	];

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Client Selection */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium text-gray-900">Client Information</h3>
					
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Client *
						</label>
						<select
							{...register("clientId")}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						>
							<option value="">Select a client</option>
							{clients.map((client) => (
								<option key={client._id} value={client._id}>
									{client.fullName} - {client.phones[0]}
								</option>
							))}
						</select>
						{errors.clientId && (
							<p className="mt-1 text-sm text-red-600">{errors.clientId.message}</p>
						)}
					</div>
				</div>

				{/* Appointment Details */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium text-gray-900">Appointment Details</h3>
					
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Appointment Type *
						</label>
						<select
							{...register("type")}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						>
							<option value="">Select appointment type</option>
							{appointmentTypes.map((type) => (
								<option key={type} value={type}>
									{type}
								</option>
							))}
						</select>
						{errors.type && (
							<p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
						)}
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Provider *
						</label>
						<select
							{...register("provider")}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						>
							{providers.map((provider) => (
								<option key={provider} value={provider}>
									{provider}
								</option>
							))}
						</select>
						{errors.provider && (
							<p className="mt-1 text-sm text-red-600">{errors.provider.message}</p>
						)}
					</div>
				</div>
			</div>

			{/* Date and Time */}
			<div className="space-y-4">
				<h3 className="text-lg font-medium text-gray-900">Schedule</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Date *
						</label>
						<div className="mt-1 relative">
							<Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
							<input
								type="date"
								value={selectedDate}
								onChange={(e) => {
									setSelectedDate(e.target.value);
									handleDateTimeChange();
								}}
								className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
								min={new Date().toISOString().split('T')[0]}
							/>
						</div>
					</div>
					
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Time *
						</label>
						<div className="mt-1 relative">
							<Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
							<input
								type="time"
								value={selectedTime}
								onChange={(e) => {
									setSelectedTime(e.target.value);
									handleDateTimeChange();
								}}
								className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							/>
						</div>
					</div>
				</div>
				{errors.dateTime && (
					<p className="text-sm text-red-600">{errors.dateTime.message}</p>
				)}
			</div>

			{/* Notes */}
			<div className="space-y-4">
				<h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
				<div>
					<label className="block text-sm font-medium text-gray-700">
						Notes
					</label>
					<div className="mt-1 relative">
						<FileText className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
						<textarea
							{...register("notes")}
							rows={4}
							className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							placeholder="Add any notes about this appointment..."
						/>
					</div>
				</div>
			</div>

			{/* Form Actions */}
			<div className="flex justify-end space-x-3 pt-6 border-t">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit">
					{initialData ? "Update Appointment" : "Schedule Appointment"}
				</Button>
			</div>
		</form>
	);
} 