"use client";

import { useState } from "react";
import { MultiCalendar } from "@/components/MultiCalendar";
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

export default function AppointmentsPage() {
	const { user, logout } = useAuth();
	const [sidebarOpen, setSidebarOpen] = useState(false);

	const handleAddAppointment = () => {
		console.log('Add appointment clicked');
		// TODO: Implement add appointment functionality
	};

	const handleEditAppointment = (appointmentId: string) => {
		console.log('Edit appointment clicked:', appointmentId);
		// TODO: Implement edit appointment functionality
	};

	const handleDeleteAppointment = (appointmentId: string) => {
		console.log('Delete appointment clicked:', appointmentId);
		// TODO: Implement delete appointment functionality
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
								<h1 className="text-xl font-bold text-gray-900">Appointments</h1>
								<p className="text-sm text-gray-600">Multi-calendar scheduling with Google sync</p>
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
						<MultiCalendar 
							orgId="demo-org"
							onAddAppointment={handleAddAppointment}
							onEditAppointment={handleEditAppointment}
							onDeleteAppointment={handleDeleteAppointment}
						/>
					</div>
				</main>
			</div>
		</div>
	);
} 