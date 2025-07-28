"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
	Users, 
	Calendar, 
	Image, 
	MessageSquare, 
	Workflow, 
	Settings,
	Menu,
	X,
	FileText,
	Share2,
	BarChart3,
	UserPlus,
	Bell,
	CreditCard,
	Database,
	Sparkles,
	Heart,
	Camera,
	Mail,
	Phone,
	Zap,
	TrendingUp,
	Shield,
	Palette
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarProps {
	isOpen: boolean;
	onToggle: () => void;
}

const menuItems = [
	{
		id: "dashboard",
		label: "Dashboard",
		icon: Sparkles,
		href: "/",
		description: "Overview & insights"
	},
	{
		id: "clients",
		label: "Clients",
		icon: Heart,
		href: "/clients",
		description: "Patient management"
	},
	{
		id: "appointments",
		label: "Appointments",
		icon: Calendar,
		href: "/appointments",
		description: "Schedule & bookings"
	},
	{
		id: "gallery",
		label: "Photo Gallery",
		icon: Camera,
		href: "/gallery",
		description: "Before & after photos"
	},
	{
		id: "templates",
		label: "Templates",
		icon: FileText,
		href: "/templates",
		description: "Message templates",
		children: [
			{ id: "sms-templates", label: "SMS Templates", icon: Phone, href: "/templates/sms" },
			{ id: "email-templates", label: "Email Templates", icon: Mail, href: "/templates/email" },
		],
	},
	{
		id: "workflows",
		label: "Workflows",
		icon: Zap,
		href: "/workflows",
		description: "Automation & triggers"
	},
	{
		id: "social",
		label: "Social Media",
		icon: Share2,
		href: "/social",
		description: "Content scheduling"
	},
	{
		id: "messaging",
		label: "Messaging",
		icon: MessageSquare,
		href: "/messaging",
		description: "Client communication"
	},
	{
		id: "analytics",
		label: "Analytics",
		icon: BarChart3,
		href: "/analytics",
		description: "Performance insights"
	},
	{
		id: "team",
		label: "Team",
		icon: Users,
		href: "/team",
		description: "Staff management"
	},
	{
		id: "billing",
		label: "Billing",
		icon: CreditCard,
		href: "/billing",
		description: "Subscriptions & usage"
	},
	{
		id: "settings",
		label: "Settings",
		icon: Settings,
		href: "/settings",
		description: "Data & preferences"
	},
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
	const router = useRouter();
	const pathname = usePathname();
	const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

	const toggleExpanded = (itemId: string) => {
		const newExpanded = new Set(expandedItems);
		if (newExpanded.has(itemId)) {
			newExpanded.delete(itemId);
		} else {
			newExpanded.add(itemId);
		}
		setExpandedItems(newExpanded);
	};

	const handleNavigation = (href: string) => {
		router.push(href);
		// Close mobile sidebar after navigation
		if (isOpen) {
			onToggle();
		}
	};

	const isActive = (href: string) => {
		if (href === "/") {
			return pathname === "/";
		}
		return pathname.startsWith(href);
	};

	return (
		<>
			{/* Mobile overlay */}
			{isOpen && (
				<div 
					className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
					onClick={onToggle}
				/>
			)}

			{/* Sidebar */}
			<div 
				data-testid="sidebar"
				className={cn(
					"fixed left-0 top-0 z-40 h-full w-80 bg-gradient-to-b from-white via-pink-50/30 to-rose-50/50 border-r border-pink-100/50 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:translate-x-0",
					isOpen ? "translate-x-0" : "-translate-x-full"
				)}
			>
				<div className="flex h-full flex-col">
					{/* Header */}
					<div className="flex items-center justify-between p-6 border-b border-pink-100/50">
						<div className="flex items-center space-x-3">
							<div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center">
								<Sparkles className="w-6 h-6 text-white" />
							</div>
							<div>
								<h1 className="text-xl font-bold gradient-text">Honey Rae</h1>
								<p className="text-xs text-muted-foreground">Aesthetics Platform</p>
							</div>
						</div>
						<Button
							variant="ghost"
							size="icon"
							onClick={onToggle}
							className="lg:hidden"
							data-testid="mobile-menu-button"
						>
							<X className="w-5 h-5" />
						</Button>
					</div>

					{/* Navigation */}
					<nav className="flex-1 p-4 space-y-2 overflow-y-auto">
						{menuItems.map((item) => (
							<div key={item.id}>
								<button
									data-testid={`sidebar-item-${item.id}`}
									onClick={() => {
										if (item.children) {
											toggleExpanded(item.id);
										} else {
											handleNavigation(item.href);
										}
									}}
									className={cn(
										"w-full flex items-center justify-between p-3 rounded-xl text-left transition-all duration-200 group hover:bg-pink-50/50 hover:shadow-sm",
										isActive(item.href) && "bg-gradient-to-r from-pink-100/50 to-rose-100/50 shadow-sm border border-pink-200/50"
									)}
								>
									<div className="flex items-center space-x-3">
										<div className={cn(
											"w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
											isActive(item.href)
												? "bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-lg" 
												: "bg-white/50 text-muted-foreground group-hover:bg-pink-100/50 group-hover:text-pink-600"
										)}>
											<item.icon className="w-5 h-5" />
										</div>
										<div>
											<div className="font-medium text-sm">{item.label}</div>
											<div className="text-xs text-muted-foreground">{item.description}</div>
										</div>
									</div>
									{item.children && (
										<div className={cn(
											"w-5 h-5 transition-transform duration-200",
											expandedItems.has(item.id) && "rotate-180"
										)}>
											<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
											</svg>
										</div>
									)}
								</button>

								{/* Submenu */}
								{item.children && expandedItems.has(item.id) && (
									<div className="ml-4 mt-2 space-y-1">
										{item.children.map((child) => (
											<button
												key={child.id}
												onClick={() => handleNavigation(child.href)}
												className={cn(
													"w-full flex items-center space-x-3 p-2 rounded-lg text-left transition-all duration-200 group hover:bg-pink-50/30",
													isActive(child.href) && "bg-pink-100/30"
												)}
											>
												<child.icon className="w-4 h-4 text-muted-foreground group-hover:text-pink-600" />
												<span className="text-sm text-muted-foreground group-hover:text-foreground">{child.label}</span>
											</button>
										))}
									</div>
								)}
							</div>
						))}
					</nav>

					{/* Footer */}
					<div className="p-4 border-t border-pink-100/50">
						<div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4">
							<div className="flex items-center space-x-3 mb-3">
								<div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-500 rounded-lg flex items-center justify-center">
									<Sparkles className="w-4 h-4 text-white" />
								</div>
								<div>
									<div className="text-sm font-medium">Honey Rae Clinic</div>
									<div className="text-xs text-muted-foreground">Premium Plan</div>
								</div>
							</div>
							<Badge className="bg-green-100 text-green-700 hover:bg-green-200">Active</Badge>
						</div>
					</div>
				</div>
			</div>
		</>
	);
} 