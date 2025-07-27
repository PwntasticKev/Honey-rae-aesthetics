"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
	Menu, 
	Search, 
	Bell, 
	Heart, 
	Calendar, 
	MessageSquare, 
	Camera, 
	Zap, 
	Activity, 
	UserPlus, 
	Workflow,
	Sparkles,
	LogOut,
	Users,
	Share2,
	BarChart3,
	CreditCard,
	Settings,
	FileText
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { ClientList } from "@/components/ClientList";
import { WorkflowList } from "@/components/WorkflowList";
import { AppointmentList } from "@/components/AppointmentList";
import { PhotoGallery } from "@/components/PhotoGallery";
import { TemplateList } from "@/components/TemplateList";
import { SocialMediaManager } from "@/components/SocialMediaManager";
import { MessagingCenter } from "@/components/MessagingCenter";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { TeamManager } from "@/components/TeamManager";
import { BillingManager } from "@/components/BillingManager";
import { DataManager } from "@/components/DataManager";

export default function Dashboard() {
	const { user, isAuthenticated, isLoading, logout } = useAuth();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [activeTab, setActiveTab] = useState("dashboard");

	// Mock data for testing
	const [clients, setClients] = useState([
		{ 
			_id: "1", 
			fullName: "Sarah Johnson", 
			email: "sarah@example.com", 
			phones: ["+15551234567"],
			gender: "female",
			tags: ["VIP", "returning"],
			referralSource: "Instagram",
			clientPortalStatus: "active",
			createdAt: Date.now() - 86400000 * 30
		},
		{ 
			_id: "2", 
			fullName: "Michael Chen", 
			email: "michael@example.com", 
			phones: ["+15559876543"],
			gender: "male",
			tags: ["consultation"],
			referralSource: "Referral",
			clientPortalStatus: "pending",
			createdAt: Date.now() - 86400000 * 7
		},
	]);
	const appointments = [
		{ _id: "1", dateTime: Date.now(), type: "Consultation", provider: "Dr. Rae" },
		{ _id: "2", dateTime: Date.now() + 86400000, type: "Treatment", provider: "Dr. Rae" },
	];
	const files = [
		{ _id: "1", filename: "before1.jpg", tag: "before" },
		{ _id: "2", filename: "after1.jpg", tag: "after" },
	];
	const messages = [
		{ _id: "1", content: "Welcome message", status: "sent" },
		{ _id: "2", content: "Follow-up reminder", status: "sent" },
	];
	
	// Mock workflow data
	const [workflows, setWorkflows] = useState([
		{
			_id: "1",
			name: "Google Review Request",
			description: "Send a Google review request 15 minutes after appointment completion",
			trigger: "appointment_completed",
			enabled: true,
			steps: [
				{
					id: "1",
					type: "delay",
					config: { delayMinutes: 15 },
				},
				{
					id: "2",
					type: "send_message",
					config: {
						channel: "sms",
						message: "Hi {{first_name}}, thank you for your appointment today! We'd love if you could leave us a Google review. It really helps our practice grow. Thank you!",
					},
				},
			],
			createdAt: Date.now() - 86400000 * 7,
			lastRun: Date.now() - 3600000,
			runCount: 12,
		},
		{
			_id: "2",
			name: "New Client Welcome",
			description: "Welcome new clients with a series of messages",
			trigger: "client_added",
			enabled: true,
			steps: [
				{
					id: "1",
					type: "send_message",
					config: {
						channel: "sms",
						message: "Welcome {{first_name}}! Thank you for choosing Honey Rae Aesthetics. We're excited to help you on your beauty journey!",
					},
				},
				{
					id: "2",
					type: "delay",
					config: { delayMinutes: 60 },
				},
				{
					id: "3",
					type: "send_message",
					config: {
						channel: "email",
						message: "Hi {{first_name}}, here's your welcome packet with everything you need to know about your upcoming appointment.",
					},
				},
			],
			createdAt: Date.now() - 86400000 * 14,
			lastRun: Date.now() - 7200000,
			runCount: 8,
		},
	]);

	// Calculate today's appointments
	const today = new Date();
	const todayAppointments = appointments.filter(apt => {
		const aptDate = new Date(apt.dateTime);
		return aptDate.toDateString() === today.toDateString();
	});
	const upcomingAppointments = appointments.filter(apt => {
		const aptDate = new Date(apt.dateTime);
		return aptDate > today;
	});

	// Client handlers
	const handleAddClient = () => {
		console.log("Add client");
	};

	const handleEditClient = (clientId: string) => {
		console.log("Edit client:", clientId);
	};

	const handleDeleteClient = (clientId: string) => {
		console.log("Delete client:", clientId);
	};

	// Workflow handlers
	const handleAddWorkflow = () => {
		console.log("Add workflow");
	};

	const handleEditWorkflow = (workflowId: string) => {
		console.log("Edit workflow:", workflowId);
	};

	const handleDeleteWorkflow = (workflowId: string) => {
		console.log("Delete workflow:", workflowId);
	};

	const handleToggleWorkflow = (workflowId: string) => {
		console.log("Toggle workflow:", workflowId);
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
					<p className="text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
				<div className="text-center">
					<p className="text-muted-foreground">Please log in to continue.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
			{/* Sidebar */}
			<Sidebar
				isOpen={sidebarOpen}
				onToggle={() => setSidebarOpen(!sidebarOpen)}
				activeTab={activeTab}
				onTabChange={setActiveTab}
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
				<main className="flex-1 p-6 space-y-6">
					{/* Dashboard */}
					{activeTab === "dashboard" && (
						<div className="space-y-6">
							{/* Welcome Section */}
							<div className="glass rounded-2xl p-6">
								<div className="flex items-center justify-between">
									<div>
										<h2 className="text-2xl font-bold gradient-text mb-2">Welcome back, Dr. Rae! ✨</h2>
										<p className="text-muted-foreground">Here's what's happening with your practice today.</p>
									</div>
									<div className="text-right">
										<p className="text-sm text-muted-foreground">Today</p>
										<p className="text-2xl font-bold text-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
									</div>
								</div>
							</div>

							{/* Quick Stats */}
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
								<Card className="glass border-pink-200/50 hover:shadow-lg transition-all duration-300">
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">Total Clients</CardTitle>
										<Heart className="h-4 w-4 text-pink-500" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold gradient-text">{clients.length}</div>
										<p className="text-xs text-muted-foreground">
											+12% from last month
										</p>
									</CardContent>
								</Card>
								
								<Card className="glass border-pink-200/50 hover:shadow-lg transition-all duration-300">
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
										<Calendar className="h-4 w-4 text-rose-500" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold gradient-text">{todayAppointments.length}</div>
										<p className="text-xs text-muted-foreground">
											{upcomingAppointments.length} upcoming
										</p>
									</CardContent>
								</Card>
								
								<Card className="glass border-pink-200/50 hover:shadow-lg transition-all duration-300">
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
										<MessageSquare className="h-4 w-4 text-purple-500" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold gradient-text">{messages.length}</div>
										<p className="text-xs text-muted-foreground">
											+8% from last week
										</p>
									</CardContent>
								</Card>
								
								<Card className="glass border-pink-200/50 hover:shadow-lg transition-all duration-300">
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
										<Zap className="h-4 w-4 text-yellow-500" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold gradient-text">{workflows.filter(w => w.enabled).length}</div>
										<p className="text-xs text-muted-foreground">
											{workflows.reduce((total, w) => total + w.runCount, 0)} total runs
										</p>
									</CardContent>
								</Card>
								
								<Card className="glass border-pink-200/50 hover:shadow-lg transition-all duration-300">
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">Photos Uploaded</CardTitle>
										<Camera className="h-4 w-4 text-orange-500" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold gradient-text">{files.length}</div>
										<p className="text-xs text-muted-foreground">
											+5 new this week
										</p>
									</CardContent>
								</Card>
							</div>

							{/* Quick Actions & Recent Activity */}
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								{/* Quick Actions */}
								<Card className="glass border-pink-200/50">
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Zap className="h-5 w-5 text-pink-500" />
											Quick Actions
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3">
										<Button 
											className="w-full justify-start bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
										>
											<UserPlus className="w-4 h-4 mr-2" />
											Add New Client
										</Button>
										<Button 
											variant="outline"
											className="w-full justify-start border-pink-200 text-pink-700 hover:bg-pink-50"
										>
											<Calendar className="w-4 h-4 mr-2" />
											Schedule Appointment
										</Button>
										<Button 
											variant="outline"
											className="w-full justify-start border-pink-200 text-pink-700 hover:bg-pink-50"
										>
											<Workflow className="w-4 h-4 mr-2" />
											Create Workflow
										</Button>
									</CardContent>
								</Card>

								{/* Recent Activity */}
								<Card className="glass border-pink-200/50">
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Activity className="h-5 w-5 text-pink-500" />
											Recent Activity
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											<div className="flex items-center space-x-3">
												<div className="w-2 h-2 bg-pink-500 rounded-full"></div>
												<div className="flex-1">
													<p className="text-sm font-medium">New client added</p>
													<p className="text-xs text-muted-foreground">Sarah Johnson • 2 hours ago</p>
												</div>
											</div>
											<div className="flex items-center space-x-3">
												<div className="w-2 h-2 bg-rose-500 rounded-full"></div>
												<div className="flex-1">
													<p className="text-sm font-medium">Appointment scheduled</p>
													<p className="text-xs text-muted-foreground">Michael Chen • 4 hours ago</p>
												</div>
											</div>
											<div className="flex items-center space-x-3">
												<div className="w-2 h-2 bg-purple-500 rounded-full"></div>
												<div className="flex-1">
													<p className="text-sm font-medium">Message sent</p>
													<p className="text-xs text-muted-foreground">Welcome message • 6 hours ago</p>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>
						</div>
					)}

					{/* Clients */}
					{activeTab === "clients" && (
						<ClientList
							clients={clients}
							onAddClient={handleAddClient}
							onEditClient={handleEditClient}
							onDeleteClient={handleDeleteClient}
						/>
					)}

					{/* Appointments */}
					{activeTab === "appointments" && (
						<AppointmentList 
							orgId="org1"
							onAddAppointment={() => console.log("Add appointment")}
							onEditAppointment={(id) => console.log("Edit appointment:", id)}
							onDeleteAppointment={(id) => console.log("Delete appointment:", id)}
						/>
					)}

					{/* Photo Gallery */}
					{activeTab === "gallery" && (
						<PhotoGallery orgId="org1" />
					)}

					{/* Templates */}
					{activeTab === "templates" && (
						<TemplateList 
							orgId="org1"
							type="sms"
							onAddTemplate={() => console.log("Add template")}
							onEditTemplate={(id) => console.log("Edit template:", id)}
							onDeleteTemplate={(id) => console.log("Delete template:", id)}
						/>
					)}

					{/* Workflows */}
					{activeTab === "workflows" && (
						<WorkflowList
							workflows={workflows}
							onAddWorkflow={handleAddWorkflow}
							onEditWorkflow={handleEditWorkflow}
							onDeleteWorkflow={handleDeleteWorkflow}
							onToggleWorkflow={handleToggleWorkflow}
						/>
					)}

					{/* Social Media */}
					{activeTab === "social" && (
						<SocialMediaManager 
							onCreatePost={() => console.log("Create post")}
							onEditPost={(id) => console.log("Edit post:", id)}
							onDeletePost={(id) => console.log("Delete post:", id)}
						/>
					)}

					{/* Messaging */}
					{activeTab === "messaging" && (
						<MessagingCenter orgId="org1" />
					)}

					{/* Analytics */}
					{activeTab === "analytics" && (
						<AnalyticsDashboard orgId="org1" />
					)}

					{/* Team */}
					{activeTab === "team" && (
						<TeamManager orgId="org1" />
					)}

					{/* Billing */}
					{activeTab === "billing" && (
						<BillingManager orgId="org1" />
					)}

					{/* Settings */}
					{activeTab === "settings" && (
						<DataManager orgId="org1" />
					)}
				</main>
			</div>
		</div>
	);
}
