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