"use client";

import { useState, useEffect } from "react";
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
	X,
	ExternalLink,
	RefreshCw,
	AlertTriangle,
	CheckCircle,
	Clock,
	Star,
	BarChart3,
	Lock,
	Unlock,
	QrCode,
	Copy,
	Download,
	Upload as UploadIcon
} from "lucide-react";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { GlobalSearch } from "@/components/GlobalSearch";

interface OrganizationProfile {
	id: string;
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
	domain?: string;
	qrKey?: string;
	stripe_customer_id?: string;
	limits: {
		clients: number;
		storage_gb: number;
		messages_per_month: number;
		workflows: number;
	};
	settings: {
		notifications: {
			email: boolean;
			sms: boolean;
			push: boolean;
			inApp: boolean;
		};
		privacy: {
			hipaa_compliant: boolean;
			data_retention_days: number;
		};
		branding: {
			primary_color: string;
			secondary_color: string;
			logo_url?: string;
		};
	};
}

interface ApiIntegration {
	id: string;
	name: string;
	description: string;
	status: 'connected' | 'disconnected' | 'error' | 'pending';
	icon: string;
	lastSync?: Date;
	settings?: Record<string, any>;
	apiKey?: string;
	webhookUrl?: string;
}

export default function OrgProfilePage() {
	const { user, logout } = useAuth();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [activeTab, setActiveTab] = useState('general');
	const [isLoading, setIsLoading] = useState(false);

	const [orgProfile, setOrgProfile] = useState<OrganizationProfile>({
		id: "org_1",
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
		established: "2020",
		domain: "honeyrae",
		qrKey: "honeyrae-qr-123",
		stripe_customer_id: "cus_123456789",
		limits: {
			clients: 1000,
			storage_gb: 50,
			messages_per_month: 10000,
			workflows: 50
		},
		settings: {
			notifications: {
				email: true,
				sms: true,
				push: false,
				inApp: true
			},
			privacy: {
				hipaa_compliant: true,
				data_retention_days: 2555
			},
			branding: {
				primary_color: "#FF6B35",
				secondary_color: "#F7931E",
				logo_url: "/logo.png"
			}
		}
	});

	const [apiIntegrations, setApiIntegrations] = useState<ApiIntegration[]>([
		{
			id: "google-calendar",
			name: "Google Calendar",
			description: "Sync appointments and events",
			status: "connected",
			icon: "📅",
			lastSync: new Date(Date.now() - 3600000),
			apiKey: "AIzaSy...",
			webhookUrl: "https://honeyrae.com/webhooks/google-calendar"
		},
		{
			id: "stripe",
			name: "Stripe",
			description: "Payment processing and billing",
			status: "connected",
			icon: "💳",
			lastSync: new Date(Date.now() - 7200000),
			apiKey: "sk_live_...",
			webhookUrl: "https://honeyrae.com/webhooks/stripe"
		},
		{
			id: "aws-s3",
			name: "AWS S3",
			description: "File storage and media hosting",
			status: "connected",
			icon: "☁️",
			lastSync: new Date(Date.now() - 86400000),
			apiKey: "AKIA...",
			webhookUrl: "https://honeyrae.com/webhooks/aws-s3"
		},
		{
			id: "twilio",
			name: "Twilio",
			description: "SMS messaging service",
			status: "connected",
			icon: "📱",
			lastSync: new Date(Date.now() - 1800000),
			apiKey: "AC...",
			webhookUrl: "https://honeyrae.com/webhooks/twilio"
		},
		{
			id: "sendgrid",
			name: "SendGrid",
			description: "Email delivery service",
			status: "connected",
			icon: "📧",
			lastSync: new Date(Date.now() - 900000),
			apiKey: "SG...",
			webhookUrl: "https://honeyrae.com/webhooks/sendgrid"
		},
		{
			id: "instagram",
			name: "Instagram",
			description: "Social media posting",
			status: "pending",
			icon: "📸",
			apiKey: "",
			webhookUrl: ""
		}
	]);

	const handleSaveSettings = async () => {
		setIsLoading(true);
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));
			setIsEditing(false);
			// Show success notification
		} catch (error) {
			console.error('Failed to save settings:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleConnectIntegration = async (integrationId: string) => {
		setIsLoading(true);
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 2000));
			setApiIntegrations(prev => 
				prev.map(integration => 
					integration.id === integrationId 
						? { ...integration, status: 'connected' as const }
						: integration
				)
			);
		} catch (error) {
			console.error('Failed to connect integration:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDisconnectIntegration = async (integrationId: string) => {
		setIsLoading(true);
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));
			setApiIntegrations(prev => 
				prev.map(integration => 
					integration.id === integrationId 
						? { ...integration, status: 'disconnected' as const }
						: integration
				)
			);
		} catch (error) {
			console.error('Failed to disconnect integration:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'connected':
				return 'bg-green-100 text-green-800';
			case 'disconnected':
				return 'bg-gray-100 text-gray-800';
			case 'error':
				return 'bg-red-100 text-red-800';
			case 'pending':
				return 'bg-yellow-100 text-yellow-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'connected':
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case 'disconnected':
				return <X className="h-4 w-4 text-gray-500" />;
			case 'error':
				return <AlertTriangle className="h-4 w-4 text-red-500" />;
			case 'pending':
				return <Clock className="h-4 w-4 text-yellow-500" />;
			default:
				return <X className="h-4 w-4 text-gray-500" />;
		}
	};

	const tabs = [
		{ id: 'general', label: 'General', icon: Building },
		{ id: 'integrations', label: 'API Integrations', icon: Link },
		{ id: 'billing', label: 'Billing & Limits', icon: CreditCard },
		{ id: 'notifications', label: 'Notifications', icon: Bell },
		{ id: 'privacy', label: 'Privacy & Security', icon: Shield },
		{ id: 'branding', label: 'Branding', icon: Palette },
		{ id: 'advanced', label: 'Advanced', icon: Settings }
	];

	return (
		<div className="flex h-screen bg-gray-50">
			<Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
			
			<div className="flex-1 flex flex-col overflow-hidden">
				{/* Header */}
				<header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setSidebarOpen(!sidebarOpen)}
								className="lg:hidden"
							>
								<Menu className="h-5 w-5" />
							</Button>
							<div>
								<h1 className="text-2xl font-bold text-gray-900">Organization Profile</h1>
								<p className="text-sm text-gray-600">Manage your organization settings and integrations</p>
							</div>
						</div>
						
						<div className="flex items-center space-x-4">
							<GlobalSearch className="hidden md:block" />
							<NotificationDropdown />
							<div className="flex items-center space-x-2">
								<Avatar className="h-8 w-8">
									<AvatarImage src="/avatar.jpg" />
									<AvatarFallback>HR</AvatarFallback>
								</Avatar>
								<div className="hidden md:block">
									<p className="text-sm font-medium text-gray-900">Dr. Rae</p>
									<p className="text-xs text-gray-500">Admin</p>
								</div>
							</div>
						</div>
					</div>
				</header>

				{/* Main Content */}
				<main className="flex-1 overflow-y-auto p-6">
					<div className="max-w-7xl mx-auto">
						{/* Tab Navigation */}
						<div className="mb-6">
							<nav className="flex space-x-8 border-b border-gray-200">
								{tabs.map((tab) => {
									const Icon = tab.icon;
									return (
										<button
											key={tab.id}
											onClick={() => setActiveTab(tab.id)}
											className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
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

						{/* Tab Content */}
						<div className="space-y-6">
							{/* General Settings */}
							{activeTab === 'general' && (
								<div className="space-y-6">
									<Card>
										<CardHeader>
											<CardTitle className="flex items-center space-x-2">
												<Building className="h-5 w-5" />
												<span>Organization Information</span>
											</CardTitle>
											<CardDescription>
												Basic information about your organization
											</CardDescription>
										</CardHeader>
										<CardContent className="space-y-4">
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-1">
														Organization Name
													</label>
													<Input
														value={orgProfile.name}
														onChange={(e) => setOrgProfile(prev => ({ ...prev, name: e.target.value }))}
														disabled={!isEditing}
													/>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-1">
														Email
													</label>
													<Input
														type="email"
														value={orgProfile.email}
														onChange={(e) => setOrgProfile(prev => ({ ...prev, email: e.target.value }))}
														disabled={!isEditing}
													/>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-1">
														Phone
													</label>
													<Input
														value={orgProfile.phone}
														onChange={(e) => setOrgProfile(prev => ({ ...prev, phone: e.target.value }))}
														disabled={!isEditing}
													/>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-1">
														Website
													</label>
													<Input
														value={orgProfile.website}
														onChange={(e) => setOrgProfile(prev => ({ ...prev, website: e.target.value }))}
														disabled={!isEditing}
													/>
												</div>
												<div className="md:col-span-2">
													<label className="block text-sm font-medium text-gray-700 mb-1">
														Address
													</label>
													<Input
														value={orgProfile.address}
														onChange={(e) => setOrgProfile(prev => ({ ...prev, address: e.target.value }))}
														disabled={!isEditing}
													/>
												</div>
												<div className="md:col-span-2">
													<label className="block text-sm font-medium text-gray-700 mb-1">
														Description
													</label>
													<Textarea
														value={orgProfile.description}
														onChange={(e) => setOrgProfile(prev => ({ ...prev, description: e.target.value }))}
														disabled={!isEditing}
														rows={3}
													/>
												</div>
											</div>
										</CardContent>
									</Card>

									<Card>
										<CardHeader>
											<CardTitle className="flex items-center space-x-2">
												<Globe className="h-5 w-5" />
												<span>Domain & Branding</span>
											</CardTitle>
											<CardDescription>
												Custom domain and branding settings
											</CardDescription>
										</CardHeader>
										<CardContent className="space-y-4">
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-1">
														Custom Domain
													</label>
													<div className="flex space-x-2">
														<Input
															value={orgProfile.domain}
															onChange={(e) => setOrgProfile(prev => ({ ...prev, domain: e.target.value }))}
															disabled={!isEditing}
															placeholder="your-domain"
														/>
														<span className="flex items-center text-gray-500">.honeyrae.com</span>
													</div>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-1">
														QR Code Key
													</label>
													<div className="flex space-x-2">
														<Input
															value={orgProfile.qrKey}
															onChange={(e) => setOrgProfile(prev => ({ ...prev, qrKey: e.target.value }))}
															disabled={!isEditing}
														/>
														<Button variant="outline" size="sm">
															<QrCode className="h-4 w-4" />
														</Button>
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								</div>
							)}

							{/* API Integrations */}
							{activeTab === 'integrations' && (
								<div className="space-y-6">
									<Card>
										<CardHeader>
											<CardTitle className="flex items-center space-x-2">
												<Link className="h-5 w-5" />
												<span>API Integrations</span>
											</CardTitle>
											<CardDescription>
												Connect third-party services to enhance your workflow
											</CardDescription>
										</CardHeader>
										<CardContent>
											<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
												{apiIntegrations.map((integration) => (
													<Card key={integration.id} className="relative">
														<CardContent className="p-4">
															<div className="flex items-start justify-between">
																<div className="flex items-center space-x-3">
																	<span className="text-2xl">{integration.icon}</span>
																	<div>
																		<h3 className="font-medium text-gray-900">{integration.name}</h3>
																		<p className="text-sm text-gray-600">{integration.description}</p>
																	</div>
																</div>
																<Badge className={getStatusColor(integration.status)}>
																	{getStatusIcon(integration.status)}
																	<span className="ml-1">{integration.status}</span>
																</Badge>
															</div>
															
															{integration.lastSync && (
																<div className="mt-3 text-xs text-gray-500">
																	Last sync: {integration.lastSync.toLocaleString()}
																</div>
															)}
															
															<div className="mt-4 flex space-x-2">
																{integration.status === 'connected' ? (
																	<>
																		<Button
																			variant="outline"
																			size="sm"
																			onClick={() => handleDisconnectIntegration(integration.id)}
																			disabled={isLoading}
																		>
																			<RefreshCw className="h-4 w-4 mr-1" />
																			Sync
																		</Button>
																		<Button
																			variant="outline"
																			size="sm"
																			onClick={() => handleDisconnectIntegration(integration.id)}
																			disabled={isLoading}
																		>
																			<X className="h-4 w-4 mr-1" />
																			Disconnect
																		</Button>
																	</>
																) : (
																	<Button
																		variant="outline"
																		size="sm"
																		onClick={() => handleConnectIntegration(integration.id)}
																		disabled={isLoading}
																	>
																		<Link className="h-4 w-4 mr-1" />
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

							{/* Billing & Limits */}
							{activeTab === 'billing' && (
								<div className="space-y-6">
									<Card>
										<CardHeader>
											<CardTitle className="flex items-center space-x-2">
												<CreditCard className="h-5 w-5" />
												<span>Billing & Usage</span>
											</CardTitle>
											<CardDescription>
												Monitor your usage and billing information
											</CardDescription>
										</CardHeader>
										<CardContent>
											<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
												<div className="p-4 border rounded-lg">
													<div className="flex items-center space-x-2">
														<Users className="h-5 w-5 text-blue-500" />
														<span className="text-sm font-medium text-gray-700">Clients</span>
													</div>
													<div className="mt-2">
														<span className="text-2xl font-bold text-gray-900">247</span>
														<span className="text-sm text-gray-500">/ {orgProfile.limits.clients}</span>
													</div>
													<div className="mt-2 w-full bg-gray-200 rounded-full h-2">
														<div className="bg-blue-500 h-2 rounded-full" style={{ width: '24.7%' }}></div>
													</div>
												</div>
												
												<div className="p-4 border rounded-lg">
													<div className="flex items-center space-x-2">
														<Database className="h-5 w-5 text-green-500" />
														<span className="text-sm font-medium text-gray-700">Storage</span>
													</div>
													<div className="mt-2">
														<span className="text-2xl font-bold text-gray-900">12.5 GB</span>
														<span className="text-sm text-gray-500">/ {orgProfile.limits.storage_gb} GB</span>
													</div>
													<div className="mt-2 w-full bg-gray-200 rounded-full h-2">
														<div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }}></div>
													</div>
												</div>
												
												<div className="p-4 border rounded-lg">
													<div className="flex items-center space-x-2">
														<MessageSquare className="h-5 w-5 text-purple-500" />
														<span className="text-sm font-medium text-gray-700">Messages</span>
													</div>
													<div className="mt-2">
														<span className="text-2xl font-bold text-gray-900">3,247</span>
														<span className="text-sm text-gray-500">/ {orgProfile.limits.messages_per_month}</span>
													</div>
													<div className="mt-2 w-full bg-gray-200 rounded-full h-2">
														<div className="bg-purple-500 h-2 rounded-full" style={{ width: '32.5%' }}></div>
													</div>
												</div>
												
												<div className="p-4 border rounded-lg">
													<div className="flex items-center space-x-2">
														<Zap className="h-5 w-5 text-orange-500" />
														<span className="text-sm font-medium text-gray-700">Workflows</span>
													</div>
													<div className="mt-2">
														<span className="text-2xl font-bold text-gray-900">12</span>
														<span className="text-sm text-gray-500">/ {orgProfile.limits.workflows}</span>
													</div>
													<div className="mt-2 w-full bg-gray-200 rounded-full h-2">
														<div className="bg-orange-500 h-2 rounded-full" style={{ width: '24%' }}></div>
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								</div>
							)}

							{/* Notifications Settings */}
							{activeTab === 'notifications' && (
								<div className="space-y-6">
									<Card>
										<CardHeader>
											<CardTitle className="flex items-center space-x-2">
												<Bell className="h-5 w-5" />
												<span>Notification Preferences</span>
											</CardTitle>
											<CardDescription>
												Configure how you receive notifications
											</CardDescription>
										</CardHeader>
										<CardContent>
											<div className="space-y-4">
												{Object.entries(orgProfile.settings.notifications).map(([key, value]) => (
													<div key={key} className="flex items-center justify-between p-3 border rounded-lg">
														<div>
															<h3 className="font-medium text-gray-900 capitalize">
																{key.replace('_', ' ')}
															</h3>
															<p className="text-sm text-gray-600">
																Receive notifications via {key}
															</p>
														</div>
														<Button
															variant={value ? "default" : "outline"}
															size="sm"
															onClick={() => setOrgProfile(prev => ({
																...prev,
																settings: {
																	...prev.settings,
																	notifications: {
																		...prev.settings.notifications,
																		[key]: !value
																	}
																}
															}))}
														>
															{value ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
														</Button>
													</div>
												))}
											</div>
										</CardContent>
									</Card>
								</div>
							)}

							{/* Privacy & Security */}
							{activeTab === 'privacy' && (
								<div className="space-y-6">
									<Card>
										<CardHeader>
											<CardTitle className="flex items-center space-x-2">
												<Shield className="h-5 w-5" />
												<span>Privacy & Security</span>
											</CardTitle>
											<CardDescription>
												Manage your privacy and security settings
											</CardDescription>
										</CardHeader>
										<CardContent>
											<div className="space-y-4">
												<div className="flex items-center justify-between p-3 border rounded-lg">
													<div>
														<h3 className="font-medium text-gray-900">HIPAA Compliance</h3>
														<p className="text-sm text-gray-600">
															Enable HIPAA-compliant data handling
														</p>
													</div>
													<Button
														variant={orgProfile.settings.privacy.hipaa_compliant ? "default" : "outline"}
														size="sm"
														onClick={() => setOrgProfile(prev => ({
															...prev,
															settings: {
																...prev.settings,
																privacy: {
																	...prev.settings.privacy,
																	hipaa_compliant: !prev.settings.privacy.hipaa_compliant
																}
															}
														}))}
													>
														{orgProfile.settings.privacy.hipaa_compliant ? 
															<Check className="h-4 w-4" /> : 
															<X className="h-4 w-4" />
														}
													</Button>
												</div>
												
												<div className="p-3 border rounded-lg">
													<h3 className="font-medium text-gray-900">Data Retention</h3>
													<p className="text-sm text-gray-600 mb-2">
														How long to keep client data (days)
													</p>
													<Input
														type="number"
														value={orgProfile.settings.privacy.data_retention_days}
														onChange={(e) => setOrgProfile(prev => ({
															...prev,
															settings: {
																...prev.settings,
																privacy: {
																	...prev.settings.privacy,
																	data_retention_days: parseInt(e.target.value)
																}
															}
														}))}
														className="w-32"
													/>
												</div>
											</div>
										</CardContent>
									</Card>
								</div>
							)}

							{/* Branding */}
							{activeTab === 'branding' && (
								<div className="space-y-6">
									<Card>
										<CardHeader>
											<CardTitle className="flex items-center space-x-2">
												<Palette className="h-5 w-5" />
												<span>Branding & Appearance</span>
											</CardTitle>
											<CardDescription>
												Customize your organization's appearance
											</CardDescription>
										</CardHeader>
										<CardContent>
											<div className="space-y-4">
												<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1">
															Primary Color
														</label>
														<div className="flex space-x-2">
															<Input
																type="color"
																value={orgProfile.settings.branding.primary_color}
																onChange={(e) => setOrgProfile(prev => ({
																	...prev,
																	settings: {
																		...prev.settings,
																		branding: {
																			...prev.settings.branding,
																			primary_color: e.target.value
																		}
																	}
																}))}
																className="w-16 h-10"
															/>
															<Input
																value={orgProfile.settings.branding.primary_color}
																onChange={(e) => setOrgProfile(prev => ({
																	...prev,
																	settings: {
																		...prev.settings,
																		branding: {
																			...prev.settings.branding,
																			primary_color: e.target.value
																		}
																	}
																}))}
															/>
														</div>
													</div>
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1">
															Secondary Color
														</label>
														<div className="flex space-x-2">
															<Input
																type="color"
																value={orgProfile.settings.branding.secondary_color}
																onChange={(e) => setOrgProfile(prev => ({
																	...prev,
																	settings: {
																		...prev.settings,
																		branding: {
																			...prev.settings.branding,
																			secondary_color: e.target.value
																		}
																	}
																}))}
																className="w-16 h-10"
															/>
															<Input
																value={orgProfile.settings.branding.secondary_color}
																onChange={(e) => setOrgProfile(prev => ({
																	...prev,
																	settings: {
																		...prev.settings,
																		branding: {
																			...prev.settings.branding,
																			secondary_color: e.target.value
																		}
																	}
																}))}
															/>
														</div>
													</div>
												</div>
												
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-1">
														Logo
													</label>
													<div className="flex items-center space-x-4">
														<Avatar className="h-16 w-16">
															<AvatarImage src={orgProfile.settings.branding.logo_url} />
															<AvatarFallback>HR</AvatarFallback>
														</Avatar>
														<div className="flex space-x-2">
															<Button variant="outline" size="sm">
																<UploadIcon className="h-4 w-4 mr-1" />
																Upload
															</Button>
															<Button variant="outline" size="sm">
																<Trash2 className="h-4 w-4 mr-1" />
																Remove
															</Button>
														</div>
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								</div>
							)}

							{/* Advanced Settings */}
							{activeTab === 'advanced' && (
								<div className="space-y-6">
									<Card>
										<CardHeader>
											<CardTitle className="flex items-center space-x-2">
												<Settings className="h-5 w-5" />
												<span>Advanced Settings</span>
											</CardTitle>
											<CardDescription>
												Advanced configuration options
											</CardDescription>
										</CardHeader>
										<CardContent>
											<div className="space-y-4">
												<div className="p-3 border rounded-lg">
													<h3 className="font-medium text-gray-900">Export Data</h3>
													<p className="text-sm text-gray-600 mb-2">
														Download all your organization data
													</p>
													<Button variant="outline" size="sm">
														<Download className="h-4 w-4 mr-1" />
														Export Data
													</Button>
												</div>
												
												<div className="p-3 border rounded-lg">
													<h3 className="font-medium text-gray-900">API Keys</h3>
													<p className="text-sm text-gray-600 mb-2">
														Manage API keys for integrations
													</p>
													<Button variant="outline" size="sm">
														<Key className="h-4 w-4 mr-1" />
														Manage Keys
													</Button>
												</div>
												
												<div className="p-3 border rounded-lg">
													<h3 className="font-medium text-gray-900 text-red-600">Danger Zone</h3>
													<p className="text-sm text-gray-600 mb-2">
														Permanently delete your organization
													</p>
													<Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">
														<Trash2 className="h-4 w-4 mr-1" />
														Delete Organization
													</Button>
												</div>
											</div>
										</CardContent>
									</Card>
								</div>
							)}
						</div>

						{/* Action Buttons */}
						<div className="mt-6 flex justify-end space-x-4">
							{isEditing ? (
								<>
									<Button
										variant="outline"
										onClick={() => setIsEditing(false)}
										disabled={isLoading}
									>
										Cancel
									</Button>
									<Button
										onClick={handleSaveSettings}
										disabled={isLoading}
									>
										{isLoading ? (
											<>
												<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
												Saving...
											</>
										) : (
											<>
												<Save className="h-4 w-4 mr-2" />
												Save Changes
											</>
										)}
									</Button>
								</>
							) : (
								<Button
									onClick={() => setIsEditing(true)}
								>
									<Edit className="h-4 w-4 mr-2" />
									Edit Settings
								</Button>
							)}
						</div>
					</div>
				</main>
			</div>
		</div>
	);
} 