"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
	Calendar, 
	Plus, 
	Settings, 
	RefreshCw, 
	ExternalLink,
	Clock,
	User,
	MapPin,
	Phone,
	Mail,
	PlusCircle
} from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { googleCalendarService, type CalendarProvider, type SyncResult } from "@/lib/googleCalendarService";
import React from "react"; // Added missing import for React

interface CalendarEvent {
	id: string;
	title: string;
	start: Date;
	end: Date;
	provider: string;
	clientName: string;
	clientEmail?: string;
	clientPhone?: string;
	type: string;
	status: "scheduled" | "completed" | "cancelled" | "no_show";
	googleEventId?: string;
	notes?: string;
}

interface MultiCalendarProps {
	orgId: string;
	onAddAppointment: () => void;
	onEditAppointment: (appointmentId: string) => void;
	onDeleteAppointment: (appointmentId: string) => void;
}

const PROVIDER_COLORS = [
	"bg-blue-500",
	"bg-green-500", 
	"bg-purple-500",
	"bg-orange-500",
	"bg-pink-500",
	"bg-indigo-500",
	"bg-teal-500",
	"bg-red-500"
];

export function MultiCalendar({ 
	orgId, 
	onAddAppointment, 
	onEditAppointment, 
	onDeleteAppointment 
}: MultiCalendarProps) {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [view, setView] = useState<"week" | "month">("week");
	const [providers, setProviders] = useState<CalendarProvider[]>([]);
	const [events, setEvents] = useState<CalendarEvent[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [syncStatus, setSyncStatus] = useState<string>("");
	const [showAddCalendarModal, setShowAddCalendarModal] = useState(false);

	// Check if any providers are connected
	const hasConnectedProviders = providers.some(provider => provider.isConnected);

	// Initialize Google Calendar service
	useEffect(() => {
		const initializeService = async () => {
			await googleCalendarService.initialize();
			const loadedProviders = googleCalendarService.getProviders();
			setProviders(loadedProviders);

			// Only load events if there are connected providers
			if (loadedProviders.some(p => p.isConnected)) {
				await loadEventsFromGoogleCalendar();
			}
		};

		initializeService();
	}, []);

	// Subscribe to sync events for real-time updates
	useEffect(() => {
		const unsubscribe = googleCalendarService.onSync(async () => {
			console.log('Calendar sync event received, reloading events...');
			await loadEventsFromGoogleCalendar();
		});

		return unsubscribe;
	}, []);

	// Load events from Google Calendar
	const loadEventsFromGoogleCalendar = async () => {
		try {
			const results = await googleCalendarService.syncAllProviders();
			const allEvents: CalendarEvent[] = [];
			
			// Convert Google Calendar events to our format
			results.forEach((result, index) => {
				if (result.success) {
					// In a real implementation, this would fetch actual events from Google Calendar
					// For now, we'll use mock events that simulate the sync
					const mockEvents: CalendarEvent[] = [
						{
							id: `event_${Date.now()}_${index}_1`,
							title: "Sarah Johnson - Consultation",
							start: new Date(Date.now() + 86400000),
							end: new Date(Date.now() + 86400000 + 3600000),
							provider: providers[index]?.name || "Provider",
							clientName: "Sarah Johnson",
							clientEmail: "sarah@email.com",
							clientPhone: "(555) 123-4567",
							type: "Consultation",
							status: "scheduled",
							notes: "First time visit",
							googleEventId: `google_event_1_${index}`
						},
						{
							id: `event_${Date.now()}_${index}_2`,
							title: "Michael Chen - Treatment",
							start: new Date(Date.now() + 172800000),
							end: new Date(Date.now() + 172800000 + 5400000),
							provider: providers[index]?.name || "Provider",
							clientName: "Michael Chen",
							clientEmail: "michael@email.com",
							clientPhone: "(555) 987-6543",
							type: "Treatment",
							status: "scheduled",
							notes: "Follow-up appointment",
							googleEventId: `google_event_2_${index}`
						}
					];
					allEvents.push(...mockEvents);
				}
			});
			
			setEvents(allEvents);
		} catch (error) {
			console.error("Failed to load events from Google Calendar:", error);
		}
	};

	// Continuous sync effect - sync every 2 minutes if there are connected providers
	useEffect(() => {
		if (!hasConnectedProviders) return;

		const syncInterval = setInterval(async () => {
			try {
				await handleSyncCalendars();
			} catch (error) {
				console.error("Auto-sync failed:", error);
			}
		}, 2 * 60 * 1000); // 2 minutes

		return () => clearInterval(syncInterval);
	}, [hasConnectedProviders]);

	// Real-time sync effect - sync when window gains focus
	useEffect(() => {
		if (!hasConnectedProviders) return;

		const handleFocus = async () => {
			try {
				await handleSyncCalendars();
			} catch (error) {
				console.error("Focus sync failed:", error);
			}
		};

		window.addEventListener('focus', handleFocus);
		return () => window.removeEventListener('focus', handleFocus);
	}, [hasConnectedProviders]);

	const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
	const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
	const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

	const getEventsForDay = (date: Date) => {
		return events.filter(event => isSameDay(event.start, date));
	};

	const getProviderColor = (providerName: string) => {
		const provider = providers.find(p => p.name === providerName);
		return provider?.color || "bg-gray-500";
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "completed":
				return "bg-green-100 text-green-800";
			case "cancelled":
				return "bg-red-100 text-red-800";
			case "no_show":
				return "bg-yellow-100 text-yellow-800";
			default:
				return "bg-blue-100 text-blue-800";
		}
	};

	const handleSyncCalendars = async () => {
		setIsLoading(true);
		setSyncStatus("Syncing calendars...");
		
		try {
			const results = await googleCalendarService.forceSyncAll();
			const totalEvents = results.reduce((sum, result) => 
				sum + result.eventsAdded + result.eventsUpdated, 0
			);
			
			// Reload events after sync
			await loadEventsFromGoogleCalendar();
			
			setSyncStatus(`Sync completed! ${totalEvents} events processed.`);
			
			// Update providers state
			setProviders(googleCalendarService.getProviders());
			
			// Clear status after 3 seconds
			setTimeout(() => setSyncStatus(""), 3000);
		} catch (error) {
			setSyncStatus("Sync failed. Please try again.");
			console.error("Sync error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleConnectProvider = async (providerId: string) => {
		const provider = providers.find(p => p.id === providerId);
		if (!provider) return;

		setIsLoading(true);
		try {
			const success = await googleCalendarService.connectProvider(
				providerId, 
				provider.email, 
				provider.name
			);
			
			if (success) {
				// Update providers state
				setProviders(googleCalendarService.getProviders());
				
				// Load events after connecting
				await loadEventsFromGoogleCalendar();
			}
		} catch (error) {
			console.error("Failed to connect provider:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDisconnectProvider = async (providerId: string) => {
		setIsLoading(true);
		try {
			const success = await googleCalendarService.disconnectProvider(providerId);
			
			if (success) {
				// Update providers state
				setProviders(googleCalendarService.getProviders());
				
				// Clear events if no providers are connected
				if (!googleCalendarService.getProviders().some(p => p.isConnected)) {
					setEvents([]);
				} else {
					// Reload events to remove disconnected provider's events
					await loadEventsFromGoogleCalendar();
				}
			}
		} catch (error) {
			console.error("Failed to disconnect provider:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleAddCalendar = () => {
		setShowAddCalendarModal(true);
	};

	const handleAddNewProvider = async (name: string, email: string) => {
		const newProvider: CalendarProvider = {
			id: Date.now().toString(),
			name,
			email,
			color: PROVIDER_COLORS[providers.length % PROVIDER_COLORS.length],
			isConnected: false,
			googleCalendarId: email
		};

		// Add to service
		googleCalendarService.addProvider(newProvider);
		
		// Update state
		setProviders(googleCalendarService.getProviders());
		setShowAddCalendarModal(false);
	};

	// If no calendars are added, show the add calendar view
	if (providers.length === 0) {
		return (
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-2xl font-bold text-gray-900">Multi-Calendar View</h2>
						<p className="text-gray-600">Connect your Google Calendars to get started</p>
					</div>
				</div>

				{/* Empty State */}
				<Card className="text-center py-12">
					<CardContent>
						<Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
						<h3 className="text-xl font-semibold text-gray-900 mb-2">No Calendars Connected</h3>
						<p className="text-gray-600 mb-6">
							Add your first Google Calendar to start managing appointments across multiple providers.
						</p>
						<Button
							onClick={handleAddCalendar}
							className="bg-gradient-to-r from-pink-500 to-purple-600"
						>
							<PlusCircle className="w-4 h-4 mr-2" />
							Add Calendar
						</Button>
					</CardContent>
				</Card>

				{/* Add Calendar Modal */}
				{showAddCalendarModal && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
						<Card className="w-96 relative">
							<CardHeader>
								<CardTitle>Add New Calendar</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Provider Name
										</label>
										<input
											type="text"
											placeholder="e.g., Kendra"
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
											id="provider-name"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Email Address
										</label>
										<input
											type="email"
											placeholder="e.g., kendra@honeyrae.com"
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
											id="provider-email"
										/>
									</div>
									<div className="flex space-x-2 pt-4">
										<Button
											variant="outline"
											onClick={() => setShowAddCalendarModal(false)}
											className="flex-1"
										>
											Cancel
										</Button>
										<Button
											onClick={() => {
												const name = (document.getElementById('provider-name') as HTMLInputElement)?.value;
												const email = (document.getElementById('provider-email') as HTMLInputElement)?.value;
												if (name && email) {
													handleAddNewProvider(name, email);
												}
											}}
											className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600"
										>
											Add Calendar
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				)}
			</div>
		);
	}

	// If no providers are connected, show the connect view
	if (!hasConnectedProviders) {
		return (
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-2xl font-bold text-gray-900">Multi-Calendar View</h2>
						<p className="text-gray-600">Connect your calendars to start syncing</p>
					</div>
					<div className="flex items-center space-x-3">
						<Button
							onClick={handleAddCalendar}
							variant="outline"
							className="flex items-center space-x-2"
						>
							<PlusCircle className="h-4 w-4" />
							Add Calendar
						</Button>
					</div>
				</div>

				{/* Provider Status Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{providers.map((provider) => (
						<Card key={provider.id} className="border-l-4 border-l-blue-500">
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-3">
										<Avatar className="w-10 h-10">
											<AvatarFallback className={provider.color}>
												{provider.name.charAt(0)}
											</AvatarFallback>
										</Avatar>
										<div>
											<CardTitle className="text-lg">{provider.name}</CardTitle>
											<p className="text-sm text-gray-600">{provider.email}</p>
										</div>
									</div>
									<Badge 
										variant={provider.isConnected ? "default" : "secondary"}
										className={provider.isConnected ? "bg-green-100 text-green-800" : ""}
									>
										{provider.isConnected ? "Connected" : "Disconnected"}
									</Badge>
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<div className="flex items-center justify-between text-sm">
										<span className="text-gray-600">Last Sync:</span>
										<span className="font-medium">
											{provider.lastSync ? format(provider.lastSync, "MMM dd, h:mm a") : "Never"}
										</span>
									</div>
									<div className="flex space-x-2">
										{provider.isConnected ? (
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleDisconnectProvider(provider.id)}
												disabled={isLoading}
												className="flex-1"
											>
												<Settings className="h-4 w-4 mr-1" />
												Disconnect
											</Button>
										) : (
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleConnectProvider(provider.id)}
												disabled={isLoading}
												className="flex-1"
											>
												<ExternalLink className="h-4 w-4 mr-1" />
												Connect
											</Button>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Add Calendar Modal */}
				{showAddCalendarModal && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
						<Card className="w-96 relative">
							<CardHeader>
								<CardTitle>Add New Calendar</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Provider Name
										</label>
										<input
											type="text"
											placeholder="e.g., Kendra"
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
											id="provider-name"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Email Address
										</label>
										<input
											type="email"
											placeholder="e.g., kendra@honeyrae.com"
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
											id="provider-email"
										/>
									</div>
									<div className="flex space-x-2 pt-4">
										<Button
											variant="outline"
											onClick={() => setShowAddCalendarModal(false)}
											className="flex-1"
										>
											Cancel
										</Button>
										<Button
											onClick={() => {
												const name = (document.getElementById('provider-name') as HTMLInputElement)?.value;
												const email = (document.getElementById('provider-email') as HTMLInputElement)?.value;
												if (name && email) {
													handleAddNewProvider(name, email);
												}
											}}
											className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600"
										>
											Add Calendar
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				)}
			</div>
		);
	}

	// Full calendar view - only shown when providers are connected
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">Multi-Calendar View</h2>
					<p className="text-gray-600">Manage appointments across all providers</p>
				</div>
				<div className="flex items-center space-x-3">
					{syncStatus && (
						<Badge variant="outline" className="text-sm">
							{syncStatus}
						</Badge>
					)}
					<Button
						variant="outline"
						onClick={handleSyncCalendars}
						disabled={isLoading}
						className="flex items-center space-x-2"
					>
						<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
						<span>{isLoading ? 'Syncing...' : 'Sync Calendars'}</span>
					</Button>
					<Button
						onClick={handleAddCalendar}
						variant="outline"
						className="flex items-center space-x-2"
					>
						<PlusCircle className="h-4 w-4" />
						Add Calendar
					</Button>
					<Button
						onClick={onAddAppointment}
						className="bg-gradient-to-r from-pink-500 to-purple-600"
					>
						<Plus className="w-4 h-4 mr-2" />
						Add Appointment
					</Button>
				</div>
			</div>

			{/* Provider Status Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{providers.map((provider) => (
					<Card key={provider.id} className="border-l-4 border-l-blue-500">
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<Avatar className="w-10 h-10">
										<AvatarFallback className={provider.color}>
											{provider.name.charAt(0)}
										</AvatarFallback>
									</Avatar>
									<div>
										<CardTitle className="text-lg">{provider.name}</CardTitle>
										<p className="text-sm text-gray-600">{provider.email}</p>
									</div>
								</div>
								<Badge 
									variant={provider.isConnected ? "default" : "secondary"}
									className={provider.isConnected ? "bg-green-100 text-green-800" : ""}
								>
									{provider.isConnected ? "Connected" : "Disconnected"}
								</Badge>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div className="flex items-center justify-between text-sm">
									<span className="text-gray-600">Last Sync:</span>
									<span className="font-medium">
										{provider.lastSync ? format(provider.lastSync, "MMM dd, h:mm a") : "Never"}
									</span>
								</div>
								<div className="flex space-x-2">
									{provider.isConnected ? (
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleDisconnectProvider(provider.id)}
											disabled={isLoading}
											className="flex-1"
										>
											<Settings className="h-4 w-4 mr-1" />
											Disconnect
										</Button>
									) : (
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleConnectProvider(provider.id)}
											disabled={isLoading}
											className="flex-1"
										>
											<ExternalLink className="h-4 w-4 mr-1" />
											Connect
										</Button>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Calendar View */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<h3 className="text-xl font-semibold">
								{format(currentDate, "MMMM yyyy")}
							</h3>
							<div className="flex space-x-1">
								<Button
									variant={view === "week" ? "default" : "outline"}
									size="sm"
									onClick={() => setView("week")}
								>
									Week
								</Button>
								<Button
									variant={view === "month" ? "default" : "outline"}
									size="sm"
									onClick={() => setView("month")}
								>
									Month
								</Button>
							</div>
						</div>
						<div className="flex items-center space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentDate(new Date())}
							>
								Today
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									const newDate = new Date(currentDate);
									newDate.setDate(newDate.getDate() - 7);
									setCurrentDate(newDate);
								}}
							>
								←
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									const newDate = new Date(currentDate);
									newDate.setDate(newDate.getDate() + 7);
									setCurrentDate(newDate);
								}}
							>
								→
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{/* Week View */}
					<div className="grid grid-cols-8 gap-1">
						{/* Time column */}
						<div className="p-2 border-b border-r border-gray-200 bg-gray-50">
							<div className="text-xs font-medium text-gray-500">Time</div>
						</div>
						
						{/* Day headers */}
						{weekDays.map((day) => (
							<div key={day.toISOString()} className="p-2 border-b border-gray-200 bg-gray-50">
								<div className="text-xs font-medium text-gray-500">
									{format(day, "EEE")}
								</div>
								<div className={`text-lg font-semibold ${
									isToday(day) ? "text-blue-600" : "text-gray-900"
								}`}>
									{format(day, "d")}
								</div>
							</div>
						))}

						{/* Time slots */}
						{Array.from({ length: 24 }, (_, hour) => (
							<React.Fragment key={`time-${hour}`}>
								<div className="p-1 border-r border-gray-200 text-xs text-gray-500 text-right pr-2">
									{format(new Date().setHours(hour, 0, 0, 0), "h a")}
								</div>
								{weekDays.map((day) => {
									const dayEvents = getEventsForDay(day);
									const hourEvents = dayEvents.filter(event => 
										event.start.getHours() === hour
									);
									
									return (
										<div key={`${day.toISOString()}-${hour}`} className="p-1 border-r border-gray-200 min-h-[60px] relative">
											{hourEvents.map((event) => (
												<div
													key={event.id}
													className={`absolute left-1 right-1 p-2 rounded text-xs cursor-pointer ${
														getProviderColor(event.provider)
													} text-white shadow-sm hover:shadow-md transition-shadow`}
													style={{
														top: `${(event.start.getMinutes() / 60) * 60}px`,
														height: `${Math.max(30, ((event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60)) * 60)}px`
													}}
													onClick={() => onEditAppointment(event.id)}
												>
													<div className="font-medium truncate">{event.clientName}</div>
													<div className="text-xs opacity-90">{event.type}</div>
													<div className="text-xs opacity-75">
														{format(event.start, "h:mm a")} - {format(event.end, "h:mm a")}
													</div>
												</div>
											))}
										</div>
									);
								})}
							</React.Fragment>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Today's Events */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center space-x-2">
						<Calendar className="h-5 w-5" />
						<span>Today's Appointments</span>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{getEventsForDay(new Date()).map((event) => (
							<div
								key={event.id}
								className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
								onClick={() => onEditAppointment(event.id)}
							>
								<div className={`w-4 h-4 rounded-full ${getProviderColor(event.provider)}`} />
								<div className="flex-1">
									<div className="flex items-center justify-between">
										<div>
											<h4 className="font-medium text-gray-900">{event.clientName}</h4>
											<p className="text-sm text-gray-600">{event.type}</p>
										</div>
										<Badge className={getStatusColor(event.status)}>
											{event.status}
										</Badge>
									</div>
									<div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
										<div className="flex items-center space-x-1">
											<Clock className="h-4 w-4" />
											<span>
												{format(event.start, "h:mm a")} - {format(event.end, "h:mm a")}
											</span>
										</div>
										<div className="flex items-center space-x-1">
											<User className="h-4 w-4" />
											<span>{event.provider}</span>
										</div>
										{event.clientPhone && (
											<div className="flex items-center space-x-1">
												<Phone className="h-4 w-4" />
												<span>{event.clientPhone}</span>
											</div>
										)}
										{event.clientEmail && (
											<div className="flex items-center space-x-1">
												<Mail className="h-4 w-4" />
												<span>{event.clientEmail}</span>
											</div>
										)}
									</div>
									{event.notes && (
										<p className="text-sm text-gray-600 mt-2">{event.notes}</p>
									)}
								</div>
							</div>
						))}
						{getEventsForDay(new Date()).length === 0 && (
							<div className="text-center py-8 text-gray-500">
								<Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
								<p>No appointments scheduled for today</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Add Calendar Modal */}
			{showAddCalendarModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
					<Card className="w-96 relative">
						<CardHeader>
							<CardTitle>Add New Calendar</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Provider Name
									</label>
									<input
										type="text"
										placeholder="e.g., Kendra"
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
										id="provider-name"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Email Address
									</label>
									<input
										type="email"
										placeholder="e.g., kendra@honeyrae.com"
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
										id="provider-email"
									/>
								</div>
								<div className="flex space-x-2 pt-4">
									<Button
										variant="outline"
										onClick={() => setShowAddCalendarModal(false)}
										className="flex-1"
									>
										Cancel
									</Button>
									<Button
										onClick={() => {
											const name = (document.getElementById('provider-name') as HTMLInputElement)?.value;
											const email = (document.getElementById('provider-email') as HTMLInputElement)?.value;
											if (name && email) {
												handleAddNewProvider(name, email);
											}
										}}
										className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600"
									>
										Add Calendar
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
} 