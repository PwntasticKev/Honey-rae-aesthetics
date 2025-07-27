"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
	Settings, 
	Database, 
	Download, 
	Upload, 
	Trash2,
	Save,
	AlertTriangle,
	CheckCircle,
	Clock
} from "lucide-react";

interface DataManagerProps {
	orgId: string;
}

export function DataManager({ orgId }: DataManagerProps) {
	const [backupStatus, setBackupStatus] = useState("completed");
	const [lastBackup, setLastBackup] = useState(Date.now() - 86400000 * 2);

	// Mock data
	const settings = {
		practiceName: "Honey Rae Aesthetics",
		email: "info@honeyrae.com",
		phone: "+15551234567",
		address: "123 Beauty Lane, Los Angeles, CA 90210",
		timezone: "America/Los_Angeles",
		currency: "USD",
		notifications: {
			email: true,
			sms: true,
			push: false
		}
	};

	const dataStats = {
		clients: 156,
		appointments: 234,
		messages: 567,
		photos: 89,
		workflows: 12,
		templates: 8
	};

	const handleBackup = () => {
		setBackupStatus("in-progress");
		setTimeout(() => {
			setBackupStatus("completed");
			setLastBackup(Date.now());
		}, 3000);
	};

	const getBackupStatusColor = (status: string) => {
		switch (status) {
			case "completed":
				return "bg-green-100 text-green-800";
			case "in-progress":
				return "bg-blue-100 text-blue-800";
			case "failed":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getBackupStatusIcon = (status: string) => {
		switch (status) {
			case "completed":
				return <CheckCircle className="h-4 w-4" />;
			case "in-progress":
				return <Clock className="h-4 w-4" />;
			case "failed":
				return <AlertTriangle className="h-4 w-4" />;
			default:
				return <Clock className="h-4 w-4" />;
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold gradient-text">Settings</h2>
					<p className="text-muted-foreground">
						Manage your practice settings and data
					</p>
				</div>
				<Button className="bg-gradient-to-r from-pink-500 to-purple-600">
					<Save className="w-4 h-4 mr-2" />
					Save Changes
				</Button>
			</div>

			{/* Practice Information */}
			<Card className="glass border-pink-200/50">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Settings className="h-5 w-5 text-pink-500" />
						Practice Information
					</CardTitle>
					<CardDescription>
						Update your practice details and contact information
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Practice Name
							</label>
							<Input 
								value={settings.practiceName}
								onChange={() => {}}
								placeholder="Enter practice name"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Email
							</label>
							<Input 
								value={settings.email}
								onChange={() => {}}
								placeholder="Enter email address"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Phone
							</label>
							<Input 
								value={settings.phone}
								onChange={() => {}}
								placeholder="Enter phone number"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Address
							</label>
							<Input 
								value={settings.address}
								onChange={() => {}}
								placeholder="Enter address"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Data Management */}
			<Card className="glass border-pink-200/50">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Database className="h-5 w-5 text-pink-500" />
						Data Management
					</CardTitle>
					<CardDescription>
						Manage your data and backup settings
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Data Statistics */}
						<div>
							<h4 className="font-medium mb-4">Data Statistics</h4>
							<div className="space-y-3">
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">Clients</span>
									<span className="font-medium">{dataStats.clients}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">Appointments</span>
									<span className="font-medium">{dataStats.appointments}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">Messages</span>
									<span className="font-medium">{dataStats.messages}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">Photos</span>
									<span className="font-medium">{dataStats.photos}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">Workflows</span>
									<span className="font-medium">{dataStats.workflows}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">Templates</span>
									<span className="font-medium">{dataStats.templates}</span>
								</div>
							</div>
						</div>

						{/* Backup Management */}
						<div>
							<h4 className="font-medium mb-4">Backup & Export</h4>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium">Last Backup</p>
										<p className="text-xs text-gray-500">
											{new Date(lastBackup).toLocaleDateString()}
										</p>
									</div>
									<Badge className={getBackupStatusColor(backupStatus)}>
										{getBackupStatusIcon(backupStatus)}
										<span className="ml-1">{backupStatus}</span>
									</Badge>
								</div>
								
								<div className="space-y-2">
									<Button 
										onClick={handleBackup}
										disabled={backupStatus === "in-progress"}
										className="w-full"
									>
										<Database className="w-4 h-4 mr-2" />
										Create Backup
									</Button>
									
									<Button variant="outline" className="w-full">
										<Download className="w-4 h-4 mr-2" />
										Export Data
									</Button>
									
									<Button variant="outline" className="w-full">
										<Upload className="w-4 h-4 mr-2" />
										Import Data
									</Button>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Preferences */}
			<Card className="glass border-pink-200/50">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Settings className="h-5 w-5 text-pink-500" />
						Preferences
					</CardTitle>
					<CardDescription>
						Configure your notification and display preferences
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<h4 className="font-medium mb-4">Notifications</h4>
							<div className="space-y-3">
								<label className="flex items-center">
									<input 
										type="checkbox" 
										checked={settings.notifications.email}
										onChange={() => {}}
										className="mr-2"
									/>
									<span className="text-sm">Email notifications</span>
								</label>
								<label className="flex items-center">
									<input 
										type="checkbox" 
										checked={settings.notifications.sms}
										onChange={() => {}}
										className="mr-2"
									/>
									<span className="text-sm">SMS notifications</span>
								</label>
								<label className="flex items-center">
									<input 
										type="checkbox" 
										checked={settings.notifications.push}
										onChange={() => {}}
										className="mr-2"
									/>
									<span className="text-sm">Push notifications</span>
								</label>
							</div>
						</div>

						<div>
							<h4 className="font-medium mb-4">Display Settings</h4>
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Timezone
									</label>
									<select 
										value={settings.timezone}
										onChange={() => {}}
										className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
									>
										<option value="America/Los_Angeles">Pacific Time</option>
										<option value="America/New_York">Eastern Time</option>
										<option value="America/Chicago">Central Time</option>
										<option value="America/Denver">Mountain Time</option>
									</select>
								</div>
								
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Currency
									</label>
									<select 
										value={settings.currency}
										onChange={() => {}}
										className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
									>
										<option value="USD">USD ($)</option>
										<option value="EUR">EUR (€)</option>
										<option value="GBP">GBP (£)</option>
										<option value="CAD">CAD ($)</option>
									</select>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Danger Zone */}
			<Card className="glass border-red-200/50 bg-red-50/50">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-red-800">
						<AlertTriangle className="h-5 w-5 text-red-600" />
						Danger Zone
					</CardTitle>
					<CardDescription className="text-red-700">
						Irreversible actions - proceed with caution
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-white">
							<div>
								<h4 className="font-medium text-red-800">Delete All Data</h4>
								<p className="text-sm text-red-600">
									Permanently delete all client data, appointments, and settings
								</p>
							</div>
							<Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
								<Trash2 className="w-4 h-4 mr-2" />
								Delete All
							</Button>
						</div>
						
						<div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-white">
							<div>
								<h4 className="font-medium text-red-800">Reset Settings</h4>
								<p className="text-sm text-red-600">
									Reset all settings to default values
								</p>
							</div>
							<Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
								<Settings className="w-4 h-4 mr-2" />
								Reset
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
} 