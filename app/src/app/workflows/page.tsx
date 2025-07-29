"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { WorkflowList } from "@/components/WorkflowList";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useWorkflows } from "@/hooks/useWorkflows";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
	Menu, 
	Search, 
	Bell, 
	LogOut
} from "lucide-react";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { GlobalSearch } from "@/components/GlobalSearch";

export default function WorkflowsPage() {
	const router = useRouter();
	const { user, logout } = useAuth();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [orgId, setOrgId] = useState<string | null>(null);
	const createWorkflow = useMutation(api.workflows.create);
	const updateWorkflow = useMutation(api.workflows.update);
	const toggleActive = useMutation(api.workflows.toggleActive);
	const createDemoOrg = useMutation(api.orgs.createDemoOrg);
	const firstOrg = useQuery(api.orgs.list);
	const realWorkflows = useWorkflows(orgId);

	useEffect(() => {
		if (firstOrg && firstOrg.length > 0) {
			setOrgId(firstOrg[0]._id);
		} else if (!orgId) {
			// Create demo org if none exists
			createDemoOrg().then((newOrgId) => {
				console.log('Created demo org:', newOrgId);
				setOrgId(newOrgId);
			}).catch((error) => {
				console.error('Error creating demo org:', error);
			});
		}
	}, [firstOrg, orgId, createDemoOrg]);

	const handleAddWorkflow = () => {
		console.log("Add workflow");
		router.push('/workflow-editor');
	};

	const handleEditWorkflow = (id: string) => {
		console.log("Edit workflow:", id);
		router.push(`/workflow-editor?id=${id}`);
	};

	const handleDeleteWorkflow = (id: string) => {
		console.log("Delete workflow:", id);
		// TODO: Implement delete workflow functionality
	};

	const createTestWorkflow = async () => {
		try {
			console.log('Creating test workflow with orgId:', orgId);
			const newWorkflowId = await createWorkflow({
				orgId: orgId as any,
				name: "Test Workflow",
				description: "A test workflow for development",
				trigger: "manual",
				conditions: [],
				actions: [
					{
						type: "send_sms",
						config: {
							message: "Test message from workflow",
						},
						order: 0,
					},
				],
				isActive: true,
			});
			console.log("Created test workflow:", newWorkflowId);
			alert('Test workflow created successfully!');
		} catch (error) {
			console.error("Error creating test workflow:", error);
			alert(`Error creating test workflow: ${error}`);
		}
	};

	const handleToggleWorkflow = async (id: string, enabled: boolean) => {
		try {
			console.log('Toggling workflow:', id, 'to enabled:', enabled);
			await toggleActive({ id: id as any });
			console.log("Workflow toggled successfully");
		} catch (error) {
			console.error("Error toggling workflow:", error);
			alert(`Error toggling workflow: ${error}`);
		}
	};

	const transformedWorkflows = realWorkflows?.map(workflow => ({
		_id: workflow._id,
		name: workflow.name,
		description: workflow.description,
		trigger: workflow.trigger,
		enabled: workflow.isActive || false,
		steps: workflow.actions || [],
		createdAt: workflow._creationTime,
		lastRun: workflow.updatedAt || workflow._creationTime,
		runCount: 0, // TODO: Add run count tracking
	})) || [];

	// Debug logging
	console.log('=== WORKFLOWS PAGE DEBUG ===');
	console.log('realWorkflows from Convex:', realWorkflows);
	console.log('transformedWorkflows:', transformedWorkflows);
	console.log('orgId:', orgId);
	console.log('firstOrg:', firstOrg);
	console.log('================================');

	return (
		<div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
			{/* Sidebar */}
			<Sidebar
				isOpen={sidebarOpen}
				onToggle={() => setSidebarOpen(!sidebarOpen)}
			/>

			{/* Main Content */}
			<div className="flex-1 flex flex-col lg:ml-64 relative">
				{/* Header */}
				<header className="bg-white border-b border-gray-200 shadow-sm">
					<div className="flex items-center justify-between px-6 h-16">
						<div className="flex items-center space-x-6">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setSidebarOpen(true)}
								className="lg:hidden z-10"
								data-testid="mobile-menu-button"
							>
								<Menu className="h-5 w-5" />
							</Button>
							
							{/* Page Title and Greeting */}
							<div>
								<h1 className="text-xl font-bold text-gray-900">Workflows</h1>
								<p className="text-sm text-gray-600">Manage your automation workflows</p>
							</div>
						</div>
						
						<div className="flex items-center space-x-4">
							{/* Search */}
							<div className="hidden md:block">
								<GlobalSearch />
							</div>
							
							{/* Notifications */}
							<NotificationDropdown />
							
							{/* User Menu */}
							<div className="flex items-center space-x-3">
								<Avatar className="w-8 h-8">
									<AvatarImage src="/avatar.jpg" />
									<AvatarFallback className="bg-orange-500 text-white">
										{user?.email?.charAt(0).toUpperCase() || "A"}
									</AvatarFallback>
								</Avatar>
								<div className="hidden md:block">
									<p className="text-sm font-medium text-gray-900">Dr. Rae</p>
									<p className="text-xs text-gray-500">Admin</p>
								</div>
								<Button
									variant="ghost"
									size="icon"
									onClick={logout}
									title="Logout"
									className="text-gray-600 hover:text-gray-900"
								>
									<LogOut className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>
				</header>

				{/* Page Content */}
				<main className="flex-1 p-6">
					<div className="max-w-7xl mx-auto">
						<h1 className="text-3xl font-bold text-gray-900 mb-6">Workflow Management</h1>
						<div className="mb-4">
							<Button onClick={createTestWorkflow} className="mb-4">
								Create Test Workflow
							</Button>
							<Button 
								onClick={async () => {
									try {
										console.log('Creating simple test workflow...');
										const newWorkflowId = await createWorkflow({
											orgId: orgId as any,
											name: "Simple Test Workflow",
											description: "A simple test workflow",
											trigger: "manual",
											conditions: [],
											actions: [
												{
													type: "send_sms",
													config: { message: "Hello from simple test!" },
													order: 0,
												},
											],
											isActive: true,
										});
										console.log('Created simple test workflow:', newWorkflowId);
										alert('Simple test workflow created!');
									} catch (error) {
										console.error('Error creating simple test workflow:', error);
										alert(`Error: ${error}`);
									}
								}}
								variant="outline"
								className="ml-2"
							>
								Create Simple Test
							</Button>
							<Button 
								onClick={() => {
									console.log('Refreshing workflows...');
									window.location.reload();
								}}
								variant="outline"
								className="ml-2"
							>
								Refresh Data
							</Button>
						</div>
						<div className="mb-4 p-4 bg-gray-100 rounded">
							<h3 className="font-bold mb-2">Debug - Real Workflows from Convex:</h3>
							<pre className="text-xs overflow-auto">
								{JSON.stringify(transformedWorkflows, null, 2)}
							</pre>
						</div>
						<WorkflowList 
							workflows={transformedWorkflows}
							onAddWorkflow={handleAddWorkflow}
							onEditWorkflow={handleEditWorkflow}
							onDeleteWorkflow={handleDeleteWorkflow}
							onToggleWorkflow={handleToggleWorkflow}
						/>
					</div>
				</main>
			</div>
		</div>
	);
} 