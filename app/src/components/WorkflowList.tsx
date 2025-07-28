"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTable } from "@/components/ui/data-table";
import {
	Plus,
	Zap,
	Play,
	Pause,
	Clock,
	MessageSquare,
	Mail,
	Calendar,
	Settings,
	Edit3
} from "lucide-react";
import { WorkflowForm } from "./WorkflowForm";

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
	onEditWorkflow: (id: string) => void;
	onDeleteWorkflow: (id: string) => void;
	onToggleWorkflow: (id: string, enabled: boolean) => void;
}

const getWorkflowIcon = (trigger: string) => {
	switch (trigger) {
		case 'appointment_completed':
			return Calendar;
		case 'client_added':
			return MessageSquare;
		case 'birthday':
			return Clock;
		default:
			return Zap;
	}
};

const getWorkflowStatus = (enabled: boolean) => {
	return enabled ? 'active' : 'inactive';
};

const getWorkflowStatusColor = (enabled: boolean) => {
	return enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
};

export function WorkflowList({ workflows, onAddWorkflow, onEditWorkflow, onDeleteWorkflow, onToggleWorkflow }: WorkflowListProps) {
	const router = useRouter();
	const [filteredWorkflows, setFilteredWorkflows] = useState<Workflow[]>(workflows);
	const [showAddForm, setShowAddForm] = useState(false);
	const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

	// Debug logging
	console.log('WorkflowList received workflows:', workflows);

	const handleSearch = (query: string) => {
		const filtered = workflows.filter(workflow =>
			workflow.name.toLowerCase().includes(query.toLowerCase()) ||
			workflow.description.toLowerCase().includes(query.toLowerCase()) ||
			workflow.trigger.toLowerCase().includes(query.toLowerCase())
		);
		setFilteredWorkflows(filtered);
	};

	const handleAddWorkflow = () => {
		// Navigate to the workflow editor page
		router.push('/workflow-editor');
	};

	const handleEditWorkflow = (id: string) => {
		// Navigate to the workflow editor page with the workflow ID
		router.push(`/workflow-editor?id=${id}`);
	};

	const handleDeleteWorkflow = (id: string) => {
		onDeleteWorkflow(id);
	};

	const handleViewWorkflow = (id: string) => {
		// Navigate to the workflow editor page with the workflow ID
		router.push(`/workflow-editor?id=${id}`);
	};

	if (showAddForm) {
		return (
			<WorkflowForm
				onSubmit={(workflow) => {
					console.log("New workflow:", workflow);
					setShowAddForm(false);
				}}
				onCancel={() => setShowAddForm(false)}
			/>
		);
	}

	if (editingWorkflow) {
		return (
			<WorkflowForm
				onSubmit={(workflow) => {
					console.log("Updated workflow:", workflow);
					setEditingWorkflow(null);
				}}
				onCancel={() => setEditingWorkflow(null)}
			/>
		);
	}

	const columns = [
		{
			key: "name",
			label: "Name",
			render: (workflow: Workflow) => {
				if (!workflow) return <div>No workflow data</div>;
				return (
					<div className="flex items-center space-x-3">
						<div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-blue-100`}>
							{React.createElement(getWorkflowIcon(workflow.trigger || ''), { className: "w-4 h-4 text-blue-600" })}
						</div>
						<div>
							<div className="font-medium text-gray-900">{workflow.name || 'Unnamed Workflow'}</div>
							<div className="text-sm text-gray-500">{workflow.description || 'No description'}</div>
						</div>
					</div>
				);
			},
		},
		{
			key: "trigger",
			label: "Trigger",
			render: (workflow: Workflow) => {
				if (!workflow) return <div>No trigger</div>;
				return (
					<div className="text-sm text-gray-900 capitalize">
						{workflow.trigger?.replace(/_/g, ' ') || 'Unknown trigger'}
					</div>
				);
			},
		},
		{
			key: "status",
			label: "Status",
			render: (workflow: Workflow) => {
				if (!workflow) return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
				return (
					<Badge className={getWorkflowStatusColor(workflow.enabled || false)}>
						{getWorkflowStatus(workflow.enabled || false)}
					</Badge>
				);
			},
		},
		{
			key: "stats",
			label: "Stats",
			render: (workflow: Workflow) => {
				if (!workflow) return <div className="text-sm text-gray-500">No stats</div>;
				return (
					<div className="text-sm text-gray-500">
						{workflow.runCount || 0} runs
						{workflow.lastRun && (
							<div>Last: {new Date(workflow.lastRun).toLocaleDateString()}</div>
						)}
					</div>
				);
			},
		},
		{
			key: "actions",
			label: "Actions",
			render: (workflow: Workflow) => {
				if (!workflow) return <div>No actions</div>;
				return (
					<div className="flex items-center space-x-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => onToggleWorkflow(workflow._id, !(workflow.enabled || false))}
						>
							{workflow.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleEditWorkflow(workflow._id)}
							data-testid="edit-workflow"
						>
							<Edit3 className="w-4 h-4" />
						</Button>
					</div>
				);
			},
		},
	];

	return (
		<DataTable
			data={filteredWorkflows}
			columns={columns}
			title="Workflows"
			description={`Automate your practice with Zapier-like workflows (${filteredWorkflows.length} workflows)`}
			searchPlaceholder="Search workflows..."
			onSearch={handleSearch}
			onEdit={handleEditWorkflow}
			onDelete={handleDeleteWorkflow}
			onView={handleViewWorkflow}
			actions={
				<div className="flex space-x-2">
					<Button
						onClick={handleAddWorkflow}
						className="bg-gradient-to-r from-pink-500 to-purple-600"
						data-testid="add-workflow-button"
					>
						<Plus className="w-4 h-4 mr-2" />
						Add Workflow
					</Button>
				</div>
			}
			data-testid="workflow-list"
		/>
	);
} 