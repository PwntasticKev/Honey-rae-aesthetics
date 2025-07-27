"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
	Zap, 
	Clock, 
	MessageSquare, 
	Mail, 
	Calendar,
	Plus,
	X,
	Settings,
	Play
} from "lucide-react";

interface WorkflowFormProps {
	onSubmit: (data: any) => void;
	onCancel: () => void;
	initialData?: any;
}

export function WorkflowForm({ onSubmit, onCancel, initialData }: WorkflowFormProps) {
	const [formData, setFormData] = useState({
		name: initialData?.name || "",
		description: initialData?.description || "",
		trigger: initialData?.trigger || "appointment_completed",
		enabled: initialData?.enabled ?? true,
		steps: initialData?.steps || [
			{
				id: "1",
				type: "delay",
				config: {
					delayMinutes: 15,
				},
			},
			{
				id: "2", 
				type: "send_message",
				config: {
					channel: "sms",
					template: "google_review_request",
					message: "Hi {{first_name}}, thank you for your appointment today! We'd love if you could leave us a Google review. It really helps our practice grow. Thank you!",
				},
			},
		],
	});

	const triggers = [
		{ value: "appointment_completed", label: "Appointment Completed" },
		{ value: "appointment_scheduled", label: "Appointment Scheduled" },
		{ value: "client_added", label: "New Client Added" },
		{ value: "follow_up_due", label: "Follow-up Due" },
		{ value: "birthday", label: "Client Birthday" },
	];

	const stepTypes = [
		{ value: "delay", label: "Wait/Delay", icon: Clock },
		{ value: "send_message", label: "Send Message", icon: MessageSquare },
		{ value: "send_email", label: "Send Email", icon: Mail },
		{ value: "add_tag", label: "Add Tag", icon: Settings },
		{ value: "create_appointment", label: "Schedule Appointment", icon: Calendar },
	];

	const handleInputChange = (field: string, value: any) => {
		setFormData(prev => ({
			...prev,
			[field]: value,
		}));
	};

	const addStep = () => {
		const newStep = {
			id: Date.now().toString(),
			type: "delay",
			config: {
				delayMinutes: 15,
			},
		};
		setFormData(prev => ({
			...prev,
			steps: [...prev.steps, newStep],
		}));
	};

	const updateStep = (stepId: string, field: string, value: any) => {
		setFormData(prev => ({
			...prev,
			steps: prev.steps.map(step => 
				step.id === stepId 
					? { ...step, [field]: value }
					: step
			),
		}));
	};

	const updateStepConfig = (stepId: string, config: any) => {
		setFormData(prev => ({
			...prev,
			steps: prev.steps.map(step => 
				step.id === stepId 
					? { ...step, config: { ...step.config, ...config } }
					: step
			),
		}));
	};

	const removeStep = (stepId: string) => {
		setFormData(prev => ({
			...prev,
			steps: prev.steps.filter(step => step.id !== stepId),
		}));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!formData.name.trim()) {
			alert("Workflow name is required");
			return;
		}
		
		if (formData.steps.length === 0) {
			alert("At least one step is required");
			return;
		}
		
		onSubmit(formData);
	};

	const renderStepConfig = (step: { id: string; type: string; config?: any }) => {
		switch (step.type) {
			case "delay":
				return (
					<div className="space-y-2">
						<Label>Delay (minutes)</Label>
						<Input
							type="number"
							value={step.config?.delayMinutes || 15}
							onChange={(e) => updateStepConfig(step.id, { delayMinutes: parseInt(e.target.value) })}
							min="1"
							max="1440"
						/>
					</div>
				);
			
			case "send_message":
				return (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Channel</Label>
							<Select
								value={step.config?.channel || "sms"}
								onValueChange={(value) => updateStepConfig(step.id, { channel: value })}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="sms">SMS</SelectItem>
									<SelectItem value="email">Email</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Message</Label>
							<Textarea
								value={step.config?.message || ""}
								onChange={(e) => updateStepConfig(step.id, { message: e.target.value })}
								placeholder="Enter your message. Use {{first_name}} for personalization..."
								rows={4}
							/>
						</div>
					</div>
				);
			
			case "send_email":
				return (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Subject</Label>
							<Input
								value={step.config?.subject || ""}
								onChange={(e) => updateStepConfig(step.id, { subject: e.target.value })}
								placeholder="Email subject"
							/>
						</div>
						<div className="space-y-2">
							<Label>Message</Label>
							<Textarea
								value={step.config?.message || ""}
								onChange={(e) => updateStepConfig(step.id, { message: e.target.value })}
								placeholder="Enter your email message..."
								rows={4}
							/>
						</div>
					</div>
				);
			
			case "add_tag":
				return (
					<div className="space-y-2">
						<Label>Tag to Add</Label>
						<Input
							value={step.config?.tag || ""}
							onChange={(e) => updateStepConfig(step.id, { tag: e.target.value })}
							placeholder="Enter tag name"
						/>
					</div>
				);
			
			case "create_appointment":
				return (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Appointment Type</Label>
							<Select
								value={step.config?.appointmentType || "follow-up"}
								onValueChange={(value) => updateStepConfig(step.id, { appointmentType: value })}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="follow-up">Follow-up</SelectItem>
									<SelectItem value="consultation">Consultation</SelectItem>
									<SelectItem value="treatment">Treatment</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Days from Trigger</Label>
							<Input
								type="number"
								value={step.config?.daysFromTrigger || 7}
								onChange={(e) => updateStepConfig(step.id, { daysFromTrigger: parseInt(e.target.value) })}
								min="1"
								max="365"
							/>
						</div>
					</div>
				);
			
			default:
				return <div className="text-sm text-gray-500">Configure this step</div>;
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Basic Information */}
			<Card>
				<CardHeader>
					<CardTitle>Workflow Information</CardTitle>
					<CardDescription>Set up your automated workflow</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Workflow Name *</Label>
						<Input
							id="name"
							value={formData.name}
							onChange={(e) => handleInputChange("name", e.target.value)}
							placeholder="e.g., Google Review Request"
							required
						/>
					</div>
					
					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							value={formData.description}
							onChange={(e) => handleInputChange("description", e.target.value)}
							placeholder="Describe what this workflow does..."
							rows={3}
						/>
					</div>
					
					<div className="space-y-2">
						<Label htmlFor="trigger">Trigger *</Label>
						<Select
							value={formData.trigger}
							onValueChange={(value) => handleInputChange("trigger", value)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select a trigger" />
							</SelectTrigger>
							<SelectContent>
								{triggers.map((trigger) => (
									<SelectItem key={trigger.value} value={trigger.value}>
										{trigger.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Workflow Steps */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Workflow Steps</CardTitle>
							<CardDescription>Define the actions to take when triggered</CardDescription>
						</div>
						<Button type="button" onClick={addStep} variant="outline" size="sm">
							<Plus className="h-4 w-4 mr-2" />
							Add Step
						</Button>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{formData.steps.map((step: { id: string; type: string; config?: any }, index: number) => {
						const stepType = stepTypes.find(t => t.value === step.type);
						const Icon = stepType?.icon || Settings;
						
						return (
							<div key={step.id} className="border rounded-lg p-4 space-y-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-3">
										<Badge variant="outline" className="flex items-center space-x-1">
											<Icon className="h-3 w-3" />
											<span>Step {index + 1}</span>
										</Badge>
										<span className="text-sm font-medium">{stepType?.label}</span>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => removeStep(step.id)}
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
								
								<div className="space-y-4">
									<div className="space-y-2">
										<Label>Step Type</Label>
										<Select
											value={step.type}
											onValueChange={(value) => updateStep(step.id, "type", value)}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{stepTypes.map((type) => (
													<SelectItem key={type.value} value={type.value}>
														{type.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									
									{renderStepConfig(step)}
								</div>
							</div>
						);
					})}
					
					{formData.steps.length === 0 && (
						<div className="text-center py-8 text-gray-500">
							<Zap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
							<p>No steps added yet. Click "Add Step" to get started.</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Form Actions */}
			<div className="flex justify-end space-x-2">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit">
					{initialData ? "Update Workflow" : "Create Workflow"}
				</Button>
			</div>
		</form>
	);
} 