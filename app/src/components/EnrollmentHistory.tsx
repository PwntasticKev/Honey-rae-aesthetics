"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
	RefreshCw, 
	Search, 
	Filter, 
	CheckCircle, 
	XCircle, 
	Clock, 
	AlertCircle,
	Play,
	Pause,
	Square,
	Users,
	Zap,
	Calendar,
	MapPin
} from "lucide-react";

interface Client {
	fullName: string;
	email: string;
	phones: string[];
}

interface Workflow {
	name: string;
	description: string;
}

interface EnrollmentHistoryItem {
	_id: string;
	client: Client;
	workflow: Workflow;
	enrollmentReason: string;
	enrolledAt: number;
	currentStep?: string;
	currentStatus: "active" | "paused" | "completed" | "cancelled";
	nextExecutionAt?: number;
	completedAt?: number;
	progress: number; // 0-100
	stepsCompleted: number;
	totalSteps: number;
}

interface EnrollmentHistoryProps {
	enrollments: EnrollmentHistoryItem[];
	onRefresh: () => void;
}

const statusColors = {
	active: "bg-green-100 text-green-800",
	paused: "bg-yellow-100 text-yellow-800",
	completed: "bg-blue-100 text-blue-800",
	cancelled: "bg-red-100 text-red-800",
};

const statusIcons = {
	active: Play,
	paused: Pause,
	completed: CheckCircle,
	cancelled: XCircle,
};

const reasonLabels: Record<string, string> = {
	appointment_completed: "Appointment Completed",
	client_added: "Client Added",
	birthday: "Birthday",
	manual: "Manual Enrollment",
	trigger: "Trigger Event",
};

export function EnrollmentHistory({ enrollments, onRefresh }: EnrollmentHistoryProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [workflowFilter, setWorkflowFilter] = useState<string>("all");

	const filteredEnrollments = useMemo(() => {
		return enrollments.filter((enrollment) => {
			const matchesSearch = 
				enrollment.client.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				enrollment.client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
				enrollment.workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				enrollment.enrollmentReason.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesStatus = statusFilter === "all" || enrollment.currentStatus === statusFilter;
			const matchesWorkflow = workflowFilter === "all" || enrollment.workflow.name === workflowFilter;

			return matchesSearch && matchesStatus && matchesWorkflow;
		});
	}, [enrollments, searchQuery, statusFilter, workflowFilter]);

	const formatDate = (timestamp: number) => {
		return new Date(timestamp).toLocaleString();
	};

	const getTimeAgo = (timestamp: number) => {
		const now = Date.now();
		const diff = now - timestamp;
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

		if (days > 0) return `${days}d ago`;
		if (hours > 0) return `${hours}h ago`;
		if (minutes > 0) return `${minutes}m ago`;
		return "Just now";
	};

	const getProgressColor = (progress: number) => {
		if (progress >= 80) return "bg-green-500";
		if (progress >= 50) return "bg-yellow-500";
		return "bg-blue-500";
	};

	const uniqueWorkflows = useMemo(() => {
		const workflows = enrollments.map(e => e.workflow.name);
		return [...new Set(workflows)];
	}, [enrollments]);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold tracking-tight">Enrollment History</h2>
					<p className="text-muted-foreground">
						Track clients enrolled in workflows and their progress
					</p>
				</div>
				<Button onClick={onRefresh} variant="outline" size="sm">
					<RefreshCw className="w-4 h-4 mr-2" />
					Refresh
				</Button>
			</div>

			{/* Filters */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Filter className="w-4 h-4" />
						Filters
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
							<Input
								placeholder="Search clients, workflows..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger>
								<SelectValue placeholder="Filter by status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Statuses</SelectItem>
								<SelectItem value="active">Active</SelectItem>
								<SelectItem value="paused">Paused</SelectItem>
								<SelectItem value="completed">Completed</SelectItem>
								<SelectItem value="cancelled">Cancelled</SelectItem>
							</SelectContent>
						</Select>
						<Select value={workflowFilter} onValueChange={setWorkflowFilter}>
							<SelectTrigger>
								<SelectValue placeholder="Filter by workflow" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Workflows</SelectItem>
								{uniqueWorkflows.map((workflow) => (
									<SelectItem key={workflow} value={workflow}>
										{workflow}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Enrollments */}
			<div className="space-y-4">
				{filteredEnrollments.length === 0 ? (
					<Card>
						<CardContent className="flex flex-col items-center justify-center py-12">
							<Users className="w-12 h-12 text-gray-400 mb-4" />
							<h3 className="text-lg font-semibold text-gray-900 mb-2">No enrollments found</h3>
							<p className="text-gray-600 text-center">
								{searchQuery || statusFilter !== "all" || workflowFilter !== "all"
									? "Try adjusting your filters or search terms"
									: "Enrollment history will appear here when clients are enrolled in workflows"}
							</p>
						</CardContent>
					</Card>
				) : (
					filteredEnrollments.map((enrollment) => {
						const StatusIcon = statusIcons[enrollment.currentStatus];
						
						return (
							<Card key={enrollment._id} className="hover:shadow-md transition-shadow">
								<CardContent className="p-6">
									<div className="flex items-start justify-between">
										<div className="flex items-start space-x-4 flex-1">
											<Avatar className="w-12 h-12">
												<AvatarImage src={`/api/avatar/${enrollment.client.fullName.length}`} />
												<AvatarFallback>
													{enrollment.client.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
												</AvatarFallback>
											</Avatar>
											
											<div className="flex-1 min-w-0">
												<div className="flex items-center space-x-2 mb-2">
													<h4 className="font-semibold text-sm">{enrollment.client.fullName}</h4>
													<Badge variant="outline" className="text-xs">
														{enrollment.client.email}
													</Badge>
												</div>
												
												<div className="flex items-center space-x-2 mb-3">
													<Zap className="w-4 h-4 text-blue-500" />
													<span className="text-sm font-medium">
														{enrollment.workflow.name}
													</span>
													<Badge className={`text-xs ${statusColors[enrollment.currentStatus]}`}>
														<StatusIcon className="w-3 h-3 mr-1" />
														{enrollment.currentStatus}
													</Badge>
												</div>
												
												{/* Progress Bar */}
												<div className="mb-3">
													<div className="flex items-center justify-between text-xs text-gray-500 mb-1">
														<span>Progress</span>
														<span>{enrollment.stepsCompleted}/{enrollment.totalSteps} steps</span>
													</div>
													<div className="w-full bg-gray-200 rounded-full h-2">
														<div 
															className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(enrollment.progress)}`}
															style={{ width: `${enrollment.progress}%` }}
														/>
													</div>
												</div>
												
												<div className="flex items-center space-x-4 text-xs text-gray-500">
													<div className="flex items-center space-x-1">
														<Calendar className="w-3 h-3" />
														<span>Enrolled {getTimeAgo(enrollment.enrolledAt)}</span>
													</div>
													<span>•</span>
													<div className="flex items-center space-x-1">
														<MapPin className="w-3 h-3" />
														<span>{reasonLabels[enrollment.enrollmentReason] || enrollment.enrollmentReason}</span>
													</div>
													{enrollment.currentStep && (
														<>
															<span>•</span>
															<span>Step: {enrollment.currentStep}</span>
														</>
													)}
													{enrollment.nextExecutionAt && enrollment.currentStatus === "active" && (
														<>
															<span>•</span>
															<span>Next: {getTimeAgo(enrollment.nextExecutionAt)}</span>
														</>
													)}
												</div>
											</div>
										</div>
										
										<div className="flex flex-col items-end space-y-2">
											<Badge variant="outline" className="text-xs">
												{enrollment.progress}% Complete
											</Badge>
											{enrollment.completedAt && (
												<div className="text-xs text-gray-500">
													Completed {formatDate(enrollment.completedAt)}
												</div>
											)}
										</div>
									</div>
								</CardContent>
							</Card>
						);
					})
				)}
			</div>

			{/* Summary */}
			{filteredEnrollments.length > 0 && (
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between text-sm text-gray-600">
							<span>Showing {filteredEnrollments.length} of {enrollments.length} enrollments</span>
							<div className="flex items-center space-x-4">
								<span>Active: {filteredEnrollments.filter(e => e.currentStatus === 'active').length}</span>
								<span>Completed: {filteredEnrollments.filter(e => e.currentStatus === 'completed').length}</span>
								<span>Paused: {filteredEnrollments.filter(e => e.currentStatus === 'paused').length}</span>
								<span>Cancelled: {filteredEnrollments.filter(e => e.currentStatus === 'cancelled').length}</span>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
} 