"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
	Menu, 
	Search, 
	Bell, 
	LogOut,
	Settings,
	Building,
	Users,
	CreditCard,
	Shield,
	Palette,
	Globe,
	Mail,
	Phone,
	MapPin,
	Calendar,
	Zap,
	MessageSquare,
	Camera,
	Database,
	Key,
	Link,
	Save,
	Edit,
	Upload,
	Trash2,
	Plus,
	Check,
	X
} from "lucide-react";
import { NotificationDropdown } from "@/components/NotificationDropdown";

interface OrganizationSettings {
	name: string;
	email: string;
	phone: string;
	address: string;
	website: string;
	timezone: string;
	currency: string;
	logo?: string;
	description: string;
	industry: string;
	employeeCount: string;
	established: string;
}

interface ApiIntegration {
	id: string;
	name: string;
	description: string;
	status: 'connected' | 'disconnected' | 'error';
	icon: string;
	lastSync?: Date;
	settings?: Record<string, any>;
}

export default function SettingsPage() {
	const { user, logout } = useAuth();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [activeTab, setActiveTab] = useState('profile');

	const [orgSettings, setOrgSettings] = useState<OrganizationSettings>({
		name: "Honey Rae Aesthetics",
		email: "info@honeyrae.com",
		phone: "+1 (555) 123-4567",
		address: "123 Beauty Lane, Los Angeles, CA 90210",
		website: "https://honeyrae.com",
		timezone: "America/Los_Angeles",
		currency: "USD",
		description: "Premium aesthetic services and treatments",
		industry: "Healthcare & Beauty",
		employeeCount: "5-10",
		established: "2020"
	});

	const [apiIntegrations, setApiIntegrations] = useState<ApiIntegration[]>([
		{
			id: "google-calendar",
			name: "Google Calendar",
			description: "Sync appointments and events",
			status: "connected",
			icon: "📅",
			lastSync: new Date(Date.now() - 3600000)
		},
		{
			id: "stripe",
			name: "Stripe",
			description: "Payment processing and billing",
			status: "connected",
			icon: "💳",
			lastSync: new Date(Date.now() - 7200000)
		},
		{
			id: "twilio",
			name: "Twilio",
			description: "SMS and voice messaging",
			status: "connected",
			icon: "📱",
			lastSync: new Date(Date.now() - 1800000)
		},
		{
			id: "aws-s3",
			name: "AWS S3",
			description: "File storage and media management",
			status: "connected",
			icon: "☁️",
			lastSync: new Date(Date.now() - 86400000)
		},
		{
			id: "mailchimp",
			name: "Mailchimp",
			description: "Email marketing campaigns",
			status: "disconnected",
			icon: "📧"
		},
		{
			id: "instagram",
			name: "Instagram",
			description: "Social media posting",
			status: "disconnected",
			icon: "📸"
		}
	]);

	const handleSaveSettings = () => {
		// In a real app, this would save to the backend
		console.log('Saving organization settings:', orgSettings);
		setIsEditing(false);
	};

	const handleConnectIntegration = (integrationId: string) => {
		setApiIntegrations(prev => 
			prev.map(integration => 
				integration.id === integrationId 
					? { ...integration, status: 'connected' as const, lastSync: new Date() }
					: integration
			)
		);
	};

	const handleDisconnectIntegration = (integrationId: string) => {
		setApiIntegrations(prev => 
			prev.map(integration => 
				integration.id === integrationId 
					? { ...integration, status: 'disconnected' as const, lastSync: undefined }
					: integration
			)
		);
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'connected':
				return 'bg-green-100 text-green-800';
			case 'disconnected':
				return 'bg-gray-100 text-gray-800';
			case 'error':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const tabs = [
		{ id: 'profile', label: 'Organization Profile', icon: Building },
		{ id: 'integrations', label: 'API Integrations', icon: Link },
		{ id: 'team', label: 'Team Management', icon: Users },
		{ id: 'billing', label: 'Billing & Plans', icon: CreditCard },
		{ id: 'security', label: 'Security', icon: Shield },
		{ id: 'notifications', label: 'Notifications', icon: Bell },
		{ id: 'appearance', label: 'Appearance', icon: Palette }
	];

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
								<h1 className="text-xl font-bold text-gray-900">Settings</h1>
								<p className="text-sm text-gray-600">Manage your organization and preferences</p>
							</div>
						</div>
						
						<div className="flex items-center space-x-4">
							{/* Search */}
							<div className="relative hidden md:block">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
								<Input
									type="text"
									placeholder="Search anything"
									className="pl-10 pr-4 w-64 bg-gray-50 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
								/>
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
						{/* Tab Navigation */}
						<div className="mb-6">
							<div className="border-b border-gray-200">
								<nav className="-mb-px flex space-x-8">
									{tabs.map((tab) => {
										const Icon = tab.icon;
										return (
											<button
												key={tab.id}
												onClick={() => setActiveTab(tab.id)}
												className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
													activeTab === tab.id
														? 'border-orange-500 text-orange-600'
														: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
												}`}
											>
												<Icon className="h-4 w-4" />
												<span>{tab.label}</span>
											</button>
										);
									})}
								</nav>
							</div>
						</div>

						{/* Tab Content */}
						{activeTab === 'profile' && (
							<div className="space-y-6">
								<Card>
									<CardHeader>
										<div className="flex items-center justify-between">
											<div>
												<CardTitle>Organization Profile</CardTitle>
												<CardDescription>
													Manage your organization's basic information and branding
												</CardDescription>
											</div>
											<Button
												variant={isEditing ? "outline" : "default"}
												onClick={() => setIsEditing(!isEditing)}
												className="flex items-center space-x-2"
											>
												{isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
												<span>{isEditing ? 'Cancel' : 'Edit'}</span>
											</Button>
										</div>
									</CardHeader>
									<CardContent>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											<div className="space-y-4">
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-1">
														Organization Name
													</label>
													<Input
														value={orgSettings.name}
														onChange={(e) => setOrgSettings(prev => ({ ...prev, name: e.target.value }))}
														disabled={!isEditing}
													/>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-1">
														Email Address
													</label>
													<Input
														type="email"
														value={orgSettings.email}
														onChange={(e) => setOrgSettings(prev => ({ ...prev, email: e.target.value }))}
														disabled={!isEditing}
													/>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-1">
														Phone Number
													</label>
													<Input
														value={orgSettings.phone}
														onChange={(e) => setOrgSettings(prev => ({ ...prev, phone: e.target.value }))}
														disabled={!isEditing}
													/>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-1">
														Website
													</label>
													<Input
														value={orgSettings.website}
														onChange={(e) => setOrgSettings(prev => ({ ...prev, website: e.target.value }))}
														disabled={!isEditing}
													/>
												</div>
											</div>
											<div className="space-y-4">
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-1">
														Address
													</label>
													<Textarea
														value={orgSettings.address}
														onChange={(e) => setOrgSettings(prev => ({ ...prev, address: e.target.value }))}
														disabled={!isEditing}
														rows={3}
													/>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-1">
														Description
													</label>
													<Textarea
														value={orgSettings.description}
														onChange={(e) => setOrgSettings(prev => ({ ...prev, description: e.target.value }))}
														disabled={!isEditing}
														rows={3}
													/>
												</div>
												<div className="grid grid-cols-2 gap-4">
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1">
															Timezone
														</label>
														<Input
															value={orgSettings.timezone}
															onChange={(e) => setOrgSettings(prev => ({ ...prev, timezone: e.target.value }))}
															disabled={!isEditing}
														/>
													</div>
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1">
															Currency
														</label>
														<Input
															value={orgSettings.currency}
															onChange={(e) => setOrgSettings(prev => ({ ...prev, currency: e.target.value }))}
															disabled={!isEditing}
														/>
													</div>
												</div>
											</div>
										</div>
										{isEditing && (
											<div className="mt-6 flex justify-end">
												<Button onClick={handleSaveSettings} className="flex items-center space-x-2">
													<Save className="h-4 w-4" />
													<span>Save Changes</span>
												</Button>
											</div>
										)}
									</CardContent>
								</Card>
							</div>
						)}

						{activeTab === 'integrations' && (
							<div className="space-y-6">
								<Card>
									<CardHeader>
										<CardTitle>API Integrations</CardTitle>
										<CardDescription>
											Connect and manage third-party services and APIs
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
											{apiIntegrations.map((integration) => (
												<Card key={integration.id} className="relative">
													<CardContent className="p-4">
														<div className="flex items-start justify-between">
															<div className="flex items-center space-x-3">
																<div className="text-2xl">{integration.icon}</div>
																<div>
																	<h4 className="font-medium text-gray-900">{integration.name}</h4>
																	<p className="text-sm text-gray-600">{integration.description}</p>
																	{integration.lastSync && (
																		<p className="text-xs text-gray-500 mt-1">
																			Last sync: {integration.lastSync.toLocaleDateString()}
																		</p>
																	)}
																</div>
															</div>
															<Badge className={getStatusColor(integration.status)}>
																{integration.status}
															</Badge>
														</div>
														<div className="mt-4 flex space-x-2">
															{integration.status === 'connected' ? (
																<Button
																	variant="outline"
																	size="sm"
																	onClick={() => handleDisconnectIntegration(integration.id)}
																	className="flex-1"
																>
																	Disconnect
																</Button>
															) : (
																<Button
																	variant="default"
																	size="sm"
																	onClick={() => handleConnectIntegration(integration.id)}
																	className="flex-1"
																>
																	Connect
																</Button>
															)}
															<Button variant="ghost" size="sm">
																<Settings className="h-4 w-4" />
															</Button>
														</div>
													</CardContent>
												</Card>
											))}
										</div>
									</CardContent>
								</Card>
							</div>
						)}

						{activeTab === 'team' && (
							<div className="space-y-6">
								<Card>
									<CardHeader>
										<CardTitle>Team Management</CardTitle>
										<CardDescription>
											Manage team members and their permissions
										</CardDescription>
									</CardHeader>
									<CardContent>
										<p className="text-gray-600">Team management features coming soon...</p>
									</CardContent>
								</Card>
							</div>
						)}

						{activeTab === 'billing' && (
							<div className="space-y-6">
								<Card>
									<CardHeader>
										<CardTitle>Billing & Plans</CardTitle>
										<CardDescription>
											Manage your subscription and billing information
										</CardDescription>
									</CardHeader>
									<CardContent>
										<p className="text-gray-600">Billing features coming soon...</p>
									</CardContent>
								</Card>
							</div>
						)}

						{activeTab === 'security' && (
							<div className="space-y-6">
								<Card>
									<CardHeader>
										<CardTitle>Security Settings</CardTitle>
										<CardDescription>
											Manage security settings and access controls
										</CardDescription>
									</CardHeader>
									<CardContent>
										<p className="text-gray-600">Security features coming soon...</p>
									</CardContent>
								</Card>
							</div>
						)}

						{activeTab === 'notifications' && (
							<div className="space-y-6">
								<Card>
									<CardHeader>
										<CardTitle>Notification Preferences</CardTitle>
										<CardDescription>
											Configure how you receive notifications
										</CardDescription>
									</CardHeader>
									<CardContent>
										<p className="text-gray-600">Notification settings coming soon...</p>
									</CardContent>
								</Card>
							</div>
						)}

						{activeTab === 'appearance' && (
							<div className="space-y-6">
								<Card>
									<CardHeader>
										<CardTitle>Appearance Settings</CardTitle>
										<CardDescription>
											Customize the look and feel of your application
										</CardDescription>
									</CardHeader>
									<CardContent>
										<p className="text-gray-600">Appearance settings coming soon...</p>
									</CardContent>
								</Card>
							</div>
						)}
					</div>
				</main>
			</div>
		</div>
	);
} 