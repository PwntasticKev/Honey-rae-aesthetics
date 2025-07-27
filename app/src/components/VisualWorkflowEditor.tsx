"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
	Zap, 
	Clock, 
	MessageSquare, 
	Mail, 
	Calendar,
	Plus,
	X,
	Settings,
	Play,
	ArrowRight,
	ArrowDown,
	CheckCircle,
	AlertCircle,
	User,
	Tag,
	Database,
	ChevronDown,
	ChevronRight,
	Move,
	GripVertical,
	Minus,
	Maximize2,
	ZoomIn,
	ZoomOut,
	MoreHorizontal,
	Phone,
	Star,
	FileText,
	Target,
	Heart,
	Shield,
	TrendingUp
} from "lucide-react";

interface WorkflowStep {
	id: string;
	type: 'trigger' | 'condition' | 'action' | 'delay';
	subType?: string;
	config: any;
	order: number;
}

interface Workflow {
	id: string;
	name: string;
	description: string;
	steps: WorkflowStep[];
	enabled: boolean;
}

interface FormWorkflowEditorProps {
	workflow: Workflow | null;
	onSave: (workflow: Workflow) => void;
	onCancel: () => void;
}

const stepTypes = {
	trigger: [
		{ id: 'appointment_completed', label: 'Appointment Completed', icon: CheckCircle, color: 'bg-blue-500' },
		{ id: 'appointment_scheduled', label: 'Appointment Scheduled', icon: Calendar, color: 'bg-green-500' },
		{ id: 'client_added', label: 'New Client Added', icon: User, color: 'bg-purple-500' },
		{ id: 'follow_up_due', label: 'Follow-up Due', icon: Clock, color: 'bg-orange-500' },
	],
	condition: [
		{ id: 'if', label: 'If Statement', icon: AlertCircle, color: 'bg-yellow-500' },
		{ id: 'wait', label: 'Wait/Delay', icon: Clock, color: 'bg-gray-500' },
	],
	action: [
		{ id: 'send_sms', label: 'Send SMS', icon: MessageSquare, color: 'bg-green-500' },
		{ id: 'send_email', label: 'Send Email', icon: Mail, color: 'bg-blue-500' },
		{ id: 'add_tag', label: 'Add Tag', icon: Tag, color: 'bg-purple-500' },
		{ id: 'create_appointment', label: 'Schedule Appointment', icon: Calendar, color: 'bg-orange-500' },
	],
};

export function VisualWorkflowEditor({ workflow, onSave, onCancel }: FormWorkflowEditorProps) {
	const [workflowData, setWorkflowData] = useState<Workflow>(workflow || {
		id: `workflow_${Date.now()}`,
		name: 'Follow-up for new clients',
		description: 'Automated follow-up workflow for new clients',
		steps: [],
		enabled: true
	});

	const addStep = useCallback((type: string, subType: string) => {
		const newStep: WorkflowStep = {
			id: `${type}_${Date.now()}`,
			type: type as any,
			subType,
			config: {},
			order: workflowData.steps.length,
		};
		setWorkflowData(prev => ({
			...prev,
			steps: [...prev.steps, newStep]
		}));
	}, [workflowData.steps.length]);

	const updateStep = useCallback((stepId: string, updates: Partial<WorkflowStep>) => {
		setWorkflowData(prev => ({
			...prev,
			steps: prev.steps.map(step => 
				step.id === stepId ? { ...step, ...updates } : step
			)
		}));
	}, []);

	const deleteStep = useCallback((stepId: string) => {
		setWorkflowData(prev => ({
			...prev,
			steps: prev.steps.filter(step => step.id !== stepId)
		}));
	}, []);

	const renderStepConfig = (step: WorkflowStep) => {
		const stepType = stepTypes[step.type as keyof typeof stepTypes];
		const stepConfig = stepType?.find(s => s.id === step.subType);
		const Icon = stepConfig?.icon || Settings;

		return (
			<Card key={step.id} className="mb-4">
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3">
							<div className={`w-8 h-8 rounded-full ${stepConfig?.color} flex items-center justify-center`}>
								<Icon className="h-4 w-4 text-white" />
							</div>
							<div>
								<CardTitle className="text-sm">{stepConfig?.label || step.type}</CardTitle>
								<CardDescription className="text-xs">
									Step {step.order + 1}
								</CardDescription>
							</div>
						</div>
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
							onClick={() => deleteStep(step.id)}
						>
							<X className="h-3 w-3" />
						</Button>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{step.subType === 'send_sms' && (
						<>
							<div className="space-y-2">
								<Label>Message Template</Label>
								<Textarea
									value={step.config.message || ''}
									onChange={(e) => updateStep(step.id, { 
										config: { ...step.config, message: e.target.value } 
									})}
									placeholder="Enter your SMS message template..."
									rows={3}
								/>
							</div>
							<div className="space-y-2">
								<Label>Send After (minutes)</Label>
								<Input
									type="number"
									value={step.config.delayMinutes || 15}
									onChange={(e) => updateStep(step.id, { 
										config: { ...step.config, delayMinutes: parseInt(e.target.value) } 
									})}
									min="1"
									max="1440"
								/>
							</div>
						</>
					)}
					
					{step.subType === 'send_email' && (
						<>
							<div className="space-y-2">
								<Label>Subject</Label>
								<Input
									value={step.config.subject || ''}
									onChange={(e) => updateStep(step.id, { 
										config: { ...step.config, subject: e.target.value } 
									})}
									placeholder="Email subject"
								/>
							</div>
							<div className="space-y-2">
								<Label>Message Template</Label>
								<Textarea
									value={step.config.message || ''}
									onChange={(e) => updateStep(step.id, { 
										config: { ...step.config, message: e.target.value } 
									})}
									placeholder="Enter your email message template..."
									rows={3}
								/>
							</div>
						</>
					)}
					
					{step.subType === 'wait' && (
						<div className="space-y-2">
							<Label>Delay (minutes)</Label>
							<Input
								type="number"
								value={step.config.delayMinutes || 15}
								onChange={(e) => updateStep(step.id, { 
									config: { ...step.config, delayMinutes: parseInt(e.target.value) } 
								})}
								min="1"
								max="1440"
							/>
						</div>
					)}
					
					{step.subType === 'add_tag' && (
						<div className="space-y-2">
							<Label>Tag to Add</Label>
							<Input
								value={step.config.tag || ''}
								onChange={(e) => updateStep(step.id, { 
									config: { ...step.config, tag: e.target.value } 
								})}
								placeholder="Enter tag name"
							/>
						</div>
					)}
					
					{step.subType === 'if' && (
						<div className="space-y-2">
							<Label>Condition</Label>
							<Select
								value={step.config.condition || 'has_appointment'}
								onValueChange={(value) => updateStep(step.id, { 
									config: { ...step.config, condition: value } 
								})}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="has_appointment">Has Appointment</SelectItem>
									<SelectItem value="is_vip">Is VIP Client</SelectItem>
									<SelectItem value="has_review">Has Left Review</SelectItem>
								</SelectContent>
							</Select>
						</div>
					)}
				</CardContent>
			</Card>
		);
	};

	return (
		<div className="flex h-screen bg-gray-50">
			{/* Left Panel - Step Types */}
			<div className="w-80 bg-white border-r border-gray-200 p-6 space-y-6">
				<div>
					<h3 className="text-lg font-semibold text-gray-900 mb-4">Add Workflow Steps</h3>
					
					{/* Triggers */}
					<div className="space-y-3">
						<div className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
							<Zap className="h-4 w-4" />
							<span>Triggers</span>
						</div>
						<div className="space-y-2">
							{stepTypes.trigger.map((trigger) => (
								<div
									key={trigger.id}
									className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
									onClick={() => addStep('trigger', trigger.id)}
								>
									<div className={`w-3 h-3 rounded-full ${trigger.color}`} />
									<span className="text-sm font-medium text-gray-700">{trigger.label}</span>
								</div>
							))}
						</div>
					</div>
					
					{/* Conditions */}
					<div className="space-y-3">
						<div className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
							<AlertCircle className="h-4 w-4" />
							<span>Conditions</span>
						</div>
						<div className="space-y-2">
							{stepTypes.condition.map((condition) => (
								<div
									key={condition.id}
									className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
									onClick={() => addStep('condition', condition.id)}
								>
									<div className={`w-3 h-3 rounded-full ${condition.color}`} />
									<span className="text-sm font-medium text-gray-700">{condition.label}</span>
								</div>
							))}
						</div>
					</div>
					
					{/* Actions */}
					<div className="space-y-3">
						<div className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
							<Play className="h-4 w-4" />
							<span>Actions</span>
						</div>
						<div className="space-y-2">
							{stepTypes.action.map((action) => (
								<div
									key={action.id}
									className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
									onClick={() => addStep('action', action.id)}
								>
									<div className={`w-3 h-3 rounded-full ${action.color}`} />
									<span className="text-sm font-medium text-gray-700">{action.label}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Right Panel - Workflow Configuration */}
			<div className="flex-1 flex flex-col">
				{/* Header */}
				<div className="bg-white border-b border-gray-200 p-6">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-xl font-semibold text-gray-900">Workflow Configuration</h2>
							<p className="text-sm text-gray-600">Configure your workflow steps and settings</p>
						</div>
						<Button variant="outline" onClick={onCancel}>
							Cancel
						</Button>
					</div>
				</div>

				{/* Workflow Details */}
				<div className="p-6 space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Workflow Details</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label>Workflow Name</Label>
								<Input
									value={workflowData.name}
									onChange={(e) => setWorkflowData(prev => ({ ...prev, name: e.target.value }))}
									placeholder="Enter workflow name"
								/>
							</div>
							<div className="space-y-2">
								<Label>Description</Label>
								<Textarea
									value={workflowData.description}
									onChange={(e) => setWorkflowData(prev => ({ ...prev, description: e.target.value }))}
									placeholder="Enter workflow description"
									rows={2}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Workflow Steps */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold text-gray-900">Workflow Steps</h3>
							<Button 
								onClick={() => addStep('action', 'send_sms')}
								className="bg-gradient-to-r from-pink-500 to-purple-600"
							>
								<Plus className="w-4 h-4 mr-2" />
								Add Step
							</Button>
						</div>

						{workflowData.steps.length === 0 ? (
							<Card className="border-dashed border-2 border-gray-300">
								<CardContent className="text-center py-12">
									<Zap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
									<p className="text-gray-500">No steps added yet. Click "Add Step" to get started.</p>
								</CardContent>
							</Card>
						) : (
							<div className="space-y-4">
								{workflowData.steps.map(renderStepConfig)}
							</div>
						)}
					</div>

					{/* Save Button */}
					<div className="flex justify-end space-x-3 pt-6">
						<Button variant="outline" onClick={onCancel}>
							Cancel
						</Button>
						<Button 
							onClick={() => onSave(workflowData)}
							className="bg-gradient-to-r from-pink-500 to-purple-600"
						>
							Save Workflow
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
} 