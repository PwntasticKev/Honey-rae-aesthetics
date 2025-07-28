"use client";

import React, { useState } from "react";
import { ExecutionLogs } from "@/components/ExecutionLogs";
import { EnrollmentHistory } from "@/components/EnrollmentHistory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
	Activity, 
	Users, 
	Zap, 
	CheckCircle, 
	XCircle, 
	Clock, 
	Play,
	Pause,
	Square
} from "lucide-react";

// Mock data for testing
const mockExecutionLogs = [
	{
		_id: "1",
		client: {
			fullName: "Sarah Johnson",
			email: "sarah.johnson@email.com",
			phones: ["+1 (555) 123-4567"]
		},
		action: "send_sms",
		status: "executed" as const,
		executedAt: Date.now() - 86400000 * 2,
		message: "SMS sent successfully to Sarah Johnson",
		stepId: "send_followup_sms",
		workflowName: "Appointment Follow-up"
	},
	{
		_id: "2",
		client: {
			fullName: "Michael Chen",
			email: "michael.chen@email.com",
			phones: ["+1 (555) 234-5678"]
		},
		action: "send_email",
		status: "executed" as const,
		executedAt: Date.now() - 86400000 * 1,
		message: "Email sent successfully to Michael Chen",
		stepId: "send_review_email",
		workflowName: "New Client Welcome"
	},
	{
		_id: "3",
		client: {
			fullName: "Emily Rodriguez",
			email: "emily.rodriguez@email.com",
			phones: ["+1 (555) 345-6789"]
		},
		action: "add_tag",
		status: "executed" as const,
		executedAt: Date.now() - 86400000 * 3,
		message: "Tag 'followed_up' added to Emily Rodriguez",
		stepId: "add_followup_tag",
		workflowName: "Birthday Reminder"
	},
	{
		_id: "4",
		client: {
			fullName: "David Kim",
			email: "david.kim@email.com",
			phones: ["+1 (555) 456-7890"]
		},
		action: "send_sms",
		status: "failed" as const,
		executedAt: Date.now() - 86400000 * 4,
		message: "Failed to send SMS: Invalid phone number",
		stepId: "send_welcome_sms",
		workflowName: "New Client Welcome"
	},
	{
		_id: "5",
		client: {
			fullName: "Lisa Wang",
			email: "lisa.wang@email.com",
			phones: ["+1 (555) 567-8901"]
		},
		action: "wait",
		status: "waiting" as const,
		executedAt: Date.now() - 86400000 * 6,
		message: "Waiting 24 hours before next step",
		stepId: "delay_before_followup",
		workflowName: "Appointment Follow-up"
	}
];

const mockEnrollmentHistory = [
	{
		_id: "1",
		client: {
			fullName: "Sarah Johnson",
			email: "sarah.johnson@email.com",
			phones: ["+1 (555) 123-4567"]
		},
		workflow: {
			name: "Appointment Follow-up",
			description: "Automated follow-up after appointments"
		},
		enrollmentReason: "appointment_completed",
		enrolledAt: Date.now() - 86400000 * 5,
		currentStep: "send_followup_sms",
		currentStatus: "active" as const,
		nextExecutionAt: Date.now() + 86400000 * 2,
		progress: 60,
		stepsCompleted: 3,
		totalSteps: 5
	},
	{
		_id: "2",
		client: {
			fullName: "Michael Chen",
			email: "michael.chen@email.com",
			phones: ["+1 (555) 234-5678"]
		},
		workflow: {
			name: "New Client Welcome",
			description: "Welcome sequence for new clients"
		},
		enrollmentReason: "client_added",
		enrolledAt: Date.now() - 86400000 * 3,
		currentStep: "send_welcome_email",
		currentStatus: "completed" as const,
		completedAt: Date.now() - 86400000 * 1,
		progress: 100,
		stepsCompleted: 4,
		totalSteps: 4
	},
	{
		_id: "3",
		client: {
			fullName: "Emily Rodriguez",
			email: "emily.rodriguez@email.com",
			phones: ["+1 (555) 345-6789"]
		},
		workflow: {
			name: "Birthday Reminder",
			description: "Send birthday wishes to clients"
		},
		enrollmentReason: "birthday",
		enrolledAt: Date.now() - 86400000 * 1,
		currentStep: "send_birthday_sms",
		currentStatus: "paused" as const,
		nextExecutionAt: Date.now() + 86400000 * 2,
		progress: 25,
		stepsCompleted: 1,
		totalSteps: 4
	},
	{
		_id: "4",
		client: {
			fullName: "David Kim",
			email: "david.kim@email.com",
			phones: ["+1 (555) 456-7890"]
		},
		workflow: {
			name: "Appointment Follow-up",
			description: "Automated follow-up after appointments"
		},
		enrollmentReason: "appointment_completed",
		enrolledAt: Date.now() - 86400000 * 2,
		currentStep: "send_review_request",
		currentStatus: "active" as const,
		nextExecutionAt: Date.now() + 86400000 * 1,
		progress: 80,
		stepsCompleted: 4,
		totalSteps: 5
	},
	{
		_id: "5",
		client: {
			fullName: "Lisa Wang",
			email: "lisa.wang@email.com",
			phones: ["+1 (555) 567-8901"]
		},
		workflow: {
			name: "New Client Welcome",
			description: "Welcome sequence for new clients"
		},
		enrollmentReason: "client_added",
		enrolledAt: Date.now() - 86400000 * 7,
		currentStep: "send_onboarding_email",
		currentStatus: "cancelled" as const,
		completedAt: Date.now() - 86400000 * 3,
		progress: 50,
		stepsCompleted: 2,
		totalSteps: 4
	}
];

export default function TestExecutionLogsPage() {
	const [activeTab, setActiveTab] = useState("execution-logs");

	const handleRefreshLogs = () => {
		console.log("Refreshing execution logs...");
		// In real app, this would fetch fresh data from Convex
	};

	const handleRefreshEnrollments = () => {
		console.log("Refreshing enrollment history...");
		// In real app, this would fetch fresh data from Convex
	};

	return (
		<div className="container mx-auto py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight mb-2">Execution Logs & Enrollment History Test</h1>
				<p className="text-muted-foreground">
					Test the execution logs and enrollment history functionality with mock data
				</p>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center space-x-2">
							<Activity className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm font-medium">Total Executions</span>
						</div>
						<div className="text-2xl font-bold">{mockExecutionLogs.length}</div>
						<p className="text-xs text-muted-foreground">Last 30 days</p>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center space-x-2">
							<CheckCircle className="h-4 w-4 text-green-600" />
							<span className="text-sm font-medium">Successful</span>
						</div>
						<div className="text-2xl font-bold">
							{mockExecutionLogs.filter(log => log.status === "executed").length}
						</div>
						<p className="text-xs text-muted-foreground">Executed successfully</p>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center space-x-2">
							<Users className="h-4 w-4 text-blue-600" />
							<span className="text-sm font-medium">Active Enrollments</span>
						</div>
						<div className="text-2xl font-bold">
							{mockEnrollmentHistory.filter(e => e.currentStatus === "active").length}
						</div>
						<p className="text-xs text-muted-foreground">Currently running</p>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center space-x-2">
							<Zap className="h-4 w-4 text-yellow-600" />
							<span className="text-sm font-medium">Workflows</span>
						</div>
						<div className="text-2xl font-bold">
							{new Set(mockEnrollmentHistory.map(e => e.workflow.name)).size}
						</div>
						<p className="text-xs text-muted-foreground">Active workflows</p>
					</CardContent>
				</Card>
			</div>

			{/* Main Content */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="execution-logs" className="flex items-center space-x-2">
						<Activity className="h-4 w-4" />
						<span>Execution Logs</span>
					</TabsTrigger>
					<TabsTrigger value="enrollment-history" className="flex items-center space-x-2">
						<Users className="h-4 w-4" />
						<span>Enrollment History</span>
					</TabsTrigger>
				</TabsList>

				<TabsContent value="execution-logs" className="space-y-6">
					<ExecutionLogs
						logs={mockExecutionLogs}
						onRefresh={handleRefreshLogs}
					/>
				</TabsContent>

				<TabsContent value="enrollment-history" className="space-y-6">
					<EnrollmentHistory
						enrollments={mockEnrollmentHistory}
						onRefresh={handleRefreshEnrollments}
					/>
				</TabsContent>
			</Tabs>

			{/* Test Actions */}
			<Card className="mt-8">
				<CardHeader>
					<CardTitle>Test Actions</CardTitle>
					<CardDescription>
						Test the functionality with mock data
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-4">
						<Button onClick={handleRefreshLogs} variant="outline">
							<Activity className="h-4 w-4 mr-2" />
							Refresh Execution Logs
						</Button>
						<Button onClick={handleRefreshEnrollments} variant="outline">
							<Users className="h-4 w-4 mr-2" />
							Refresh Enrollment History
						</Button>
						<Button variant="outline">
							<Zap className="h-4 w-4 mr-2" />
							Create Test Workflow
						</Button>
						<Button variant="outline">
							<CheckCircle className="h-4 w-4 mr-2" />
							Simulate Execution
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
} 