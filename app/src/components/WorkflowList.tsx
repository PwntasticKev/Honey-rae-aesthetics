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
	Zap,
	Play,
	Pause,
	Clock,
	MessageSquare,
	Mail,
	Calendar,
	Settings
} from "lucide-react";
import { WorkflowForm } from "./WorkflowForm";
import { VisualWorkflowEditor } from "./VisualWorkflowEditor";

interface Workflow {
	_id: string;
	name: string;
	description: string;
	trigger: string;
	enabled: boolean;
	steps: any[];
	createdAt: number;
	lastRun?: number;
	runCount: number;
}

interface WorkflowListProps {
	workflows: Workflow[];
	onAddWorkflow: () => void;
	onEditWorkflow: (workflowId: string) => void;
	onDeleteWorkflow: (workflowId: string) => void;
	onToggleWorkflow: (workflowId: string) => void;
}

export function WorkflowList({ workflows, onAddWorkflow, onEditWorkflow, onDeleteWorkflow, onToggleWorkflow }: WorkflowListProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [showAddForm, setShowAddForm] = useState(false);
	const [showVisualEditor, setShowVisualEditor] = useState(false);
	const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

	const filteredWorkflows = workflows.filter(workflow => {
		const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
		return matchesSearch;
	});

	const handleAddWorkflow = (data: any) => {
		// In a real app, this would call an API
		console.log("Adding workflow:", data);
		setShowAddForm(false);
		onAddWorkflow();
	};

	const handleEditWorkflow = (data: any) => {
		// In a real app, this would call an API
		console.log("Updating workflow:", data);
		setEditingWorkflow(null);
		onEditWorkflow(editingWorkflow!._id);
	};

	const handleDeleteWorkflow = (workflowId: string) => {
		if (confirm("Are you sure you want to delete this workflow?")) {
			onDeleteWorkflow(workflowId);
		}
	};

	const getTriggerIcon = (trigger: string) => {
		switch (trigger) {
			case "appointment_completed": return Calendar;
			case "appointment_scheduled": return Calendar;
			case "client_added": return Settings;
			case "follow_up_due": return Clock;
			case "birthday": return Settings;
			default: return Zap;
		}
	};

	const getTriggerLabel = (trigger: string) => {
		switch (trigger) {
			case "appointment_completed": return "Appointment Completed";
			case "appointment_scheduled": return "Appointment Scheduled";
			case "client_added": return "New Client Added";
			case "follow_up_due": return "Follow-up Due";
			case "birthday": return "Client Birthday";
			default: return trigger;
		}
	};

	const getStepIcon = (stepType: string) => {
		switch (stepType) {
			case "delay": return Clock;
			case "send_message": return MessageSquare;
			case "send_email": return Mail;
			case "add_tag": return Settings;
			case "create_appointment": return Calendar;
			default: return Zap;
		}
	};

	if (showVisualEditor) {
		return (
			<div className="fixed inset-0 z-50 bg-white">
				<div className="flex items-center justify-between p-4 border-b">
					<h2 className="text-xl font-bold gradient-text">Visual Workflow Editor</h2>
					<div className="flex space-x-2">
						<Button variant="outline" onClick={() => setShowVisualEditor(false)}>
							Cancel
						</Button>
						<Button onClick={() => {
							// Save workflow logic here
							setShowVisualEditor(false);
						}}>
							Save Workflow
						</Button>
					</div>
				</div>
				<VisualWorkflowEditor
					workflow={editingWorkflow}
					onSave={handleAddWorkflow}
					onCancel={() => setShowVisualEditor(false)}
				/>
			</div>
		);
	}

	if (showAddForm) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold gradient-text">Add New Workflow</h2>
					<Button variant="outline" onClick={() => setShowAddForm(false)}>
						Cancel
					</Button>
				</div>
				<WorkflowForm
					onSubmit={handleAddWorkflow}
					onCancel={() => setShowAddForm(false)}
				/>
			</div>
		);
	}

	if (editingWorkflow) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold gradient-text">Edit Workflow</h2>
					<Button variant="outline" onClick={() => setEditingWorkflow(null)}>
						Cancel
					</Button>
				</div>
				<WorkflowForm
					onSubmit={handleEditWorkflow}
					onCancel={() => setEditingWorkflow(null)}
					initialData={editingWorkflow}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold gradient-text">Workflows</h2>
					<p className="text-muted-foreground">
						Automate your practice with Zapier-like workflows ({filteredWorkflows.length} workflows)
					</p>
				</div>
				<div className="flex space-x-2">
					<Button 
						onClick={() => setShowVisualEditor(true)} 
						variant="outline"
						className="border-pink-200 text-pink-700 hover:bg-pink-50"
					>
						<Zap className="w-4 h-4 mr-2" />
						Visual Editor
					</Button>
					<Button onClick={() => setShowAddForm(true)} className="bg-gradient-to-r from-pink-500 to-purple-600">
						<Plus className="w-4 h-4 mr-2" />
						Add Workflow
					</Button>
				</div>
			</div>

			{/* Search */}
			<Card>
				<CardContent className="pt-6">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
						<Input
							placeholder="Search workflows..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Workflow Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{filteredWorkflows.map((workflow) => {
					const TriggerIcon = getTriggerIcon(workflow.trigger);
					
					return (
						<Card key={workflow._id} className="hover:shadow-lg transition-shadow">
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between">
									<div className="flex items-center space-x-3">
										<Avatar className="w-12 h-12">
											<AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
												<Zap className="h-6 w-6" />
											</AvatarFallback>
										</Avatar>
										<div>
											<CardTitle className="text-lg">{workflow.name}</CardTitle>
											<CardDescription>
												{workflow.description || "No description"}
											</CardDescription>
										</div>
									</div>
									<div className="flex items-center space-x-1">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => onToggleWorkflow(workflow._id)}
											title={workflow.enabled ? "Disable" : "Enable"}
										>
											{workflow.enabled ? (
												<Play className="h-4 w-4 text-green-600" />
											) : (
												<Pause className="h-4 w-4 text-gray-400" />
											)}
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => setEditingWorkflow(workflow)}
											title="Edit"
										>
											<Edit className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleDeleteWorkflow(workflow._id)}
											title="Delete"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-3">
								{/* Trigger */}
								<div className="flex items-center space-x-2 text-sm">
									<TriggerIcon className="h-4 w-4 text-muted-foreground" />
									<span>Triggers on: {getTriggerLabel(workflow.trigger)}</span>
								</div>

								{/* Steps */}
								<div className="space-y-2">
									<div className="text-xs font-medium text-muted-foreground">Steps:</div>
									<div className="flex flex-wrap gap-1">
										{workflow.steps.slice(0, 3).map((step, index) => {
											const StepIcon = getStepIcon(step.type);
											return (
												<Badge key={index} variant="secondary" className="text-xs gap-1">
													<StepIcon className="h-3 w-3" />
													{step.type.replace('_', ' ')}
												</Badge>
											);
										})}
										{workflow.steps.length > 3 && (
											<Badge variant="outline" className="text-xs">
												+{workflow.steps.length - 3} more
											</Badge>
										)}
									</div>
								</div>

								{/* Stats */}
								<div className="flex items-center justify-between text-xs text-muted-foreground">
									<div className="flex items-center space-x-2">
										<span>Runs: {workflow.runCount}</span>
										{workflow.lastRun && (
											<span>• Last: {new Date(workflow.lastRun).toLocaleDateString()}</span>
										)}
									</div>
									<Badge variant={workflow.enabled ? "default" : "secondary"}>
										{workflow.enabled ? "Active" : "Inactive"}
									</Badge>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Empty State */}
			{filteredWorkflows.length === 0 && (
				<Card className="text-center py-12">
					<CardContent>
						<div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
							<Zap className="w-8 h-8 text-gray-400" />
						</div>
						<h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
						<p className="text-gray-500 mb-4">
							{searchTerm 
								? "Try adjusting your search criteria"
								: "Get started by creating your first automated workflow"
							}
						</p>
						{!searchTerm && (
							<Button onClick={() => setShowAddForm(true)}>
								<Plus className="w-4 h-4 mr-2" />
								Create Your First Workflow
							</Button>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
} 