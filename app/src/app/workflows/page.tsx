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

export default function WorkflowsPage() {
	const router = useRouter();
	const { user, logout } = useAuth();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [orgId, setOrgId] = useState<string | null>(null);
	const createWorkflow = useMutation(api.workflows.create);
	const updateWorkflow = useMutation(api.workflows.update);
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
		// TODO: Implement add workflow functionality
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
		} catch (error) {
			console.error("Error creating test workflow:", error);
		}
	};

	const handleToggleWorkflow = async (id: string, enabled: boolean) => {
		try {
			await updateWorkflow({
				id: id as any,
				isActive: !enabled,
			});
			console.log("Toggled workflow:", id, "to", !enabled);
		} catch (error) {
			console.error("Error toggling workflow:", error);
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

	return (
		<div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
			{/* Sidebar */}
			<Sidebar
				isOpen={sidebarOpen}
				onToggle={() => setSidebarOpen(!sidebarOpen)}
			/>

			{/* Main Content */}
			<div className="flex-1 flex flex-col lg:ml-80 relative">
				{/* Header */}
				<header className="glass border-b border-pink-100/50 backdrop-blur-xl">
					<div className="flex items-center justify-between px-6 h-16">
						<div className="flex items-center">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setSidebarOpen(true)}
								className="lg:hidden z-10"
								data-testid="mobile-menu-button"
							>
								<Menu className="h-5 w-5" />
							</Button>
							<h1 className="text-xl font-bold gradient-text ml-2 lg:ml-0">
								Honey Rae Aesthetics
							</h1>
						</div>
						
						<div className="flex items-center space-x-4">
							{/* Search */}
							<div className="relative hidden md:block">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
								<Input
									type="text"
									placeholder="Search clients, appointments..."
									className="pl-10 pr-4 w-64 bg-white/50 border-pink-200/50 focus:border-pink-300"
								/>
							</div>
							
							{/* Notifications */}
							<Button variant="ghost" size="icon" className="relative">
								<Bell className="h-5 w-5" />
								<Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-pink-500">
									3
								</Badge>
							</Button>
							
							{/* User Menu */}
							<div className="flex items-center space-x-2">
								<Avatar className="w-10 h-10">
									<AvatarImage src="/avatar.jpg" />
									<AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white">
										{user?.email?.charAt(0).toUpperCase() || "A"}
									</AvatarFallback>
								</Avatar>
								<Button
									variant="ghost"
									size="icon"
									onClick={logout}
									title="Logout"
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