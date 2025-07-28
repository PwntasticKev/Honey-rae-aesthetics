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
	MessageSquare,
	Mail,
	Tag,
	Zap
} from "lucide-react";

interface Client {
	fullName: string;
	email: string;
	phones: string[];
}

interface ExecutionLog {
	_id: string;
	client: Client;
	action: string;
	status: "executed" | "failed" | "waiting" | "cancelled";
	executedAt: number;
	message: string;
	stepId: string;
	workflowName?: string;
	enrollmentId?: string;
}

interface ExecutionLogsProps {
	logs: ExecutionLog[];
	onRefresh: () => void;
}

const actionIcons = {
	send_sms: MessageSquare,
	send_email: Mail,
	add_tag: Tag,
	wait: Clock,
	trigger: Zap,
};

const statusColors = {
	executed: "bg-green-100 text-green-800",
	failed: "bg-red-100 text-red-800",
	waiting: "bg-yellow-100 text-yellow-800",
	cancelled: "bg-gray-100 text-gray-800",
};

const statusIcons = {
	executed: CheckCircle,
	failed: XCircle,
	waiting: Clock,
	cancelled: XCircle,
};

export function ExecutionLogs({ logs, onRefresh }: ExecutionLogsProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [actionFilter, setActionFilter] = useState<string>("all");

	const filteredLogs = useMemo(() => {
		return logs.filter((log) => {
			const matchesSearch = 
				log.client.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				log.client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
				log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
				log.stepId.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesStatus = statusFilter === "all" || log.status === statusFilter;
			const matchesAction = actionFilter === "all" || log.action === actionFilter;

			return matchesSearch && matchesStatus && matchesAction;
		});
	}, [logs, searchQuery, statusFilter, actionFilter]);

	const formatDate = (timestamp: number) => {
		return new Date(timestamp).toLocaleString();
	};

	const getActionLabel = (action: string) => {
		const labels: Record<string, string> = {
			send_sms: "Send SMS",
			send_email: "Send Email",
			add_tag: "Add Tag",
			wait: "Wait",
			trigger: "Trigger",
		};
		return labels[action] || action;
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold tracking-tight">Execution Logs</h2>
					<p className="text-muted-foreground">
						Track workflow executions and client interactions
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
								placeholder="Search clients, messages, steps..."
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
								<SelectItem value="executed">Executed</SelectItem>
								<SelectItem value="failed">Failed</SelectItem>
								<SelectItem value="waiting">Waiting</SelectItem>
								<SelectItem value="cancelled">Cancelled</SelectItem>
							</SelectContent>
						</Select>
						<Select value={actionFilter} onValueChange={setActionFilter}>
							<SelectTrigger>
								<SelectValue placeholder="Filter by action" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Actions</SelectItem>
								<SelectItem value="send_sms">Send SMS</SelectItem>
								<SelectItem value="send_email">Send Email</SelectItem>
								<SelectItem value="add_tag">Add Tag</SelectItem>
								<SelectItem value="wait">Wait</SelectItem>
								<SelectItem value="trigger">Trigger</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Logs */}
			<div className="space-y-4">
				{filteredLogs.length === 0 ? (
					<Card>
						<CardContent className="flex flex-col items-center justify-center py-12">
							<AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
							<h3 className="text-lg font-semibold text-gray-900 mb-2">No logs found</h3>
							<p className="text-gray-600 text-center">
								{searchQuery || statusFilter !== "all" || actionFilter !== "all"
									? "Try adjusting your filters or search terms"
									: "Execution logs will appear here when workflows run"}
							</p>
						</CardContent>
					</Card>
				) : (
					filteredLogs.map((log) => {
						const ActionIcon = actionIcons[log.action as keyof typeof actionIcons] || Zap;
						const StatusIcon = statusIcons[log.status];
						
						return (
							<Card key={log._id} className="hover:shadow-md transition-shadow">
								<CardContent className="p-6">
									<div className="flex items-start justify-between">
										<div className="flex items-start space-x-4 flex-1">
											<Avatar className="w-10 h-10">
												<AvatarImage src={`/api/avatar/${log.client.fullName.length}`} />
												<AvatarFallback>
													{log.client.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
												</AvatarFallback>
											</Avatar>
											
											<div className="flex-1 min-w-0">
												<div className="flex items-center space-x-2 mb-2">
													<h4 className="font-semibold text-sm">{log.client.fullName}</h4>
													<Badge variant="outline" className="text-xs">
														{log.client.email}
													</Badge>
												</div>
												
												<div className="flex items-center space-x-2 mb-2">
													<ActionIcon className="w-4 h-4 text-blue-500" />
													<span className="text-sm font-medium">
														{getActionLabel(log.action)}
													</span>
													<Badge className={`text-xs ${statusColors[log.status]}`}>
														<StatusIcon className="w-3 h-3 mr-1" />
														{log.status}
													</Badge>
												</div>
												
												<p className="text-sm text-gray-600 mb-2">{log.message}</p>
												
												<div className="flex items-center space-x-4 text-xs text-gray-500">
													<span>Step: {log.stepId}</span>
													<span>•</span>
													<span>{formatDate(log.executedAt)}</span>
													{log.workflowName && (
														<>
															<span>•</span>
															<span>Workflow: {log.workflowName}</span>
														</>
													)}
												</div>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						);
					})
				)}
			</div>

			{/* Summary */}
			{filteredLogs.length > 0 && (
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between text-sm text-gray-600">
							<span>Showing {filteredLogs.length} of {logs.length} logs</span>
							<div className="flex items-center space-x-4">
								<span>Executed: {filteredLogs.filter(l => l.status === 'executed').length}</span>
								<span>Failed: {filteredLogs.filter(l => l.status === 'failed').length}</span>
								<span>Waiting: {filteredLogs.filter(l => l.status === 'waiting').length}</span>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
} 