"use client";

import { useState } from "react";
import { ClientList } from "@/components/ClientList";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
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

// Mock data
const mockClients = [
	{
		_id: "1",
		fullName: "Sarah Johnson",
		email: "sarah.johnson@email.com",
		phones: ["+1 (555) 123-4567"],
		gender: "female",
		tags: ["VIP", "Regular"],
		referralSource: "Google Search",
		clientPortalStatus: "active",
		createdAt: Date.now() - 86400000 * 30
	},
	{
		_id: "2",
		fullName: "Michael Chen",
		email: "michael.chen@email.com",
		phones: ["+1 (555) 234-5678"],
		gender: "male",
		tags: ["New Client"],
		referralSource: "Referral",
		clientPortalStatus: "active",
		createdAt: Date.now() - 86400000 * 7
	},
	{
		_id: "3",
		fullName: "Emily Rodriguez",
		email: "emily.rodriguez@email.com",
		phones: ["+1 (555) 345-6789"],
		gender: "female",
		tags: ["VIP", "Returning"],
		referralSource: "Social Media",
		clientPortalStatus: "inactive",
		createdAt: Date.now() - 86400000 * 60
	}
];

export default function ClientsPage() {
	const { user, logout } = useAuth();
	const [sidebarOpen, setSidebarOpen] = useState(false);

	const handleAddClient = () => {
		console.log('Add client clicked');
		// TODO: Implement add client functionality
	};

	const handleEditClient = (clientId: string) => {
		console.log('Edit client clicked:', clientId);
		// TODO: Implement edit client functionality
	};

	const handleDeleteClient = (clientId: string) => {
		console.log('Delete client clicked:', clientId);
		// TODO: Implement delete client functionality
	};

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
								<h1 className="text-xl font-bold text-gray-900">Clients</h1>
								<p className="text-sm text-gray-600">Manage your patient database</p>
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
						<h1 className="text-3xl font-bold text-gray-900 mb-6">Client Management</h1>
						<ClientList 
							clients={mockClients} 
							onAddClient={handleAddClient}
							onEditClient={handleEditClient}
							onDeleteClient={handleDeleteClient}
						/>
					</div>
				</main>
			</div>
		</div>
	);
} 