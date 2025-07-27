"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { 
	Calendar,
	Image as ImageIcon,
	MessageSquare,
	FileText,
	Tag,
	Plus,
	Edit,
	Trash2,
	Clock,
	CheckCircle,
	AlertCircle,
	Star
} from "lucide-react";

interface ClientTimelineProps {
	orgId: any;
	clientId?: string;
}

interface TimelineEvent {
	id: string;
	type: "appointment" | "photo" | "note" | "message" | "milestone" | "treatment";
	title: string;
	description: string;
	date: Date;
	status?: "completed" | "scheduled" | "cancelled" | "pending";
	metadata?: any;
}

// Mock data for demonstration
const mockTimelineEvents: TimelineEvent[] = [
	{
		id: "1",
		type: "appointment",
		title: "Initial Consultation",
		description: "First visit with Dr. Smith to discuss treatment options",
		date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
		status: "completed",
		metadata: { provider: "Dr. Smith", duration: "60 min" }
	},
	{
		id: "2",
		type: "photo",
		title: "Before Photos Taken",
		description: "Initial photos for treatment planning",
		date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
		status: "completed",
		metadata: { photoCount: 8, tags: ["before", "face"] }
	},
	{
		id: "3",
		type: "treatment",
		title: "Botox Treatment",
		description: "Botox injections for forehead and crow's feet",
		date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
		status: "completed",
		metadata: { provider: "Dr. Smith", units: 25, areas: ["forehead", "crow's feet"] }
	},
	{
		id: "4",
		type: "message",
		title: "Follow-up SMS Sent",
		description: "Automated follow-up message sent to client",
		date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), // 18 days ago
		status: "completed",
		metadata: { type: "sms", template: "follow_up" }
	},
	{
		id: "5",
		type: "note",
		title: "Client Feedback",
		description: "Client reported feeling great, no side effects",
		date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
		status: "completed",
		metadata: { author: "Dr. Smith", category: "feedback" }
	},
	{
		id: "6",
		type: "milestone",
		title: "2-Week Check-in",
		description: "Scheduled follow-up appointment",
		date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
		status: "completed",
		metadata: { milestone: "2-week", type: "check-in" }
	},
	{
		id: "7",
		type: "photo",
		title: "Progress Photos",
		description: "2-week progress photos taken",
		date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
		status: "completed",
		metadata: { photoCount: 6, tags: ["progress", "2-week"] }
	},
	{
		id: "8",
		type: "appointment",
		title: "Touch-up Appointment",
		description: "Follow-up for potential touch-ups",
		date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
		status: "scheduled",
		metadata: { provider: "Dr. Smith", duration: "30 min" }
	}
];

export function ClientTimeline({ orgId, clientId }: ClientTimelineProps) {
	const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
	const [showAddEvent, setShowAddEvent] = useState(false);
	const [filterType, setFilterType] = useState<string>("all");

	const appointments = useQuery(api.appointments.getByOrg, { orgId: orgId || "demo-org-id" as any }) || [];
	const messages = useQuery(api.messages.getByOrg, { orgId: orgId || "demo-org-id" as any }) || [];
	const notes = useQuery(api.notes.getByOrg, { orgId: orgId || "demo-org-id" as any }) || [];
	
	const timelineEvents = mockTimelineEvents; // Using mock data for now

	const filteredEvents = timelineEvents.filter(event => 
		filterType === "all" || event.type === filterType
	);

	const getEventIcon = (type: string) => {
		switch (type) {
			case "appointment":
				return <Calendar className="h-4 w-4" />;
			case "photo":
				return <ImageIcon className="h-4 w-4" />;
			case "message":
				return <MessageSquare className="h-4 w-4" />;
			case "note":
				return <FileText className="h-4 w-4" />;
			case "milestone":
				return <Star className="h-4 w-4" />;
			case "treatment":
				return <CheckCircle className="h-4 w-4" />;
			default:
				return <Tag className="h-4 w-4" />;
		}
	};

	const getEventColor = (type: string) => {
		switch (type) {
			case "appointment":
				return "bg-blue-100 text-blue-800 border-blue-200";
			case "photo":
				return "bg-green-100 text-green-800 border-green-200";
			case "message":
				return "bg-purple-100 text-purple-800 border-purple-200";
			case "note":
				return "bg-yellow-100 text-yellow-800 border-yellow-200";
			case "milestone":
				return "bg-pink-100 text-pink-800 border-pink-200";
			case "treatment":
				return "bg-indigo-100 text-indigo-800 border-indigo-200";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200";
		}
	};

	const getStatusColor = (status?: string) => {
		switch (status) {
			case "completed":
				return "bg-green-100 text-green-800";
			case "scheduled":
				return "bg-blue-100 text-blue-800";
			case "cancelled":
				return "bg-red-100 text-red-800";
			case "pending":
				return "bg-yellow-100 text-yellow-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const formatDate = (date: Date) => {
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - date.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		
		if (diffDays === 0) return "Today";
		if (diffDays === 1) return "Yesterday";
		if (diffDays < 7) return `${diffDays} days ago`;
		if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
		if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
		return `${Math.floor(diffDays / 365)} years ago`;
	};

	const isFuture = (date: Date) => {
		return date > new Date();
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
				<div>
					<h2 className="text-xl font-semibold text-gray-900">Client Timeline</h2>
					<p className="text-sm text-gray-500">
						Track your client's journey and treatment progress
					</p>
				</div>
				
				<div className="flex gap-2">
					<select
						value={filterType}
						onChange={(e) => setFilterType(e.target.value)}
						className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						<option value="all">All Events</option>
						<option value="appointment">Appointments</option>
						<option value="treatment">Treatments</option>
						<option value="photo">Photos</option>
						<option value="message">Messages</option>
						<option value="note">Notes</option>
						<option value="milestone">Milestones</option>
					</select>
					
					<Button 
						onClick={() => setShowAddEvent(true)}
						className="flex items-center space-x-2"
					>
						<Plus className="h-4 w-4" />
						<span>Add Event</span>
					</Button>
				</div>
			</div>

			{/* Timeline */}
			<div className="relative">
				{/* Timeline Line */}
				<div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
				
				{/* Events */}
				<div className="space-y-6">
					{filteredEvents.length === 0 ? (
						<div className="text-center py-12">
							<Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								No timeline events
							</h3>
							<p className="text-gray-500 mb-4">
								{timelineEvents.length === 0 
									? "Start building your client's timeline by adding events."
									: "Try adjusting your filter to see more events."
								}
							</p>
							{timelineEvents.length === 0 && (
								<Button onClick={() => setShowAddEvent(true)}>
									Add First Event
								</Button>
							)}
						</div>
					) : (
						filteredEvents.map((event, index) => (
							<div key={event.id} className="relative flex items-start space-x-4">
								{/* Timeline Dot */}
								<div className={`relative z-10 flex-shrink-0 w-16 h-16 rounded-full border-2 flex items-center justify-center ${getEventColor(event.type)}`}>
									{getEventIcon(event.type)}
								</div>
								
								{/* Event Content */}
								<div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<div className="flex items-center space-x-2 mb-1">
												<h3 className="text-sm font-medium text-gray-900">
													{event.title}
												</h3>
												{event.status && (
													<span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(event.status)}`}>
														{event.status}
													</span>
												)}
												{isFuture(event.date) && (
													<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
														<Clock className="h-3 w-3 mr-1" />
														Upcoming
													</span>
												)}
											</div>
											
											<p className="text-sm text-gray-600 mb-2">
												{event.description}
											</p>
											
											{/* Metadata */}
											{event.metadata && (
												<div className="flex flex-wrap gap-2 mb-2">
													{Object.entries(event.metadata).map(([key, value]) => (
														<span
															key={key}
															className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
														>
															{key}: {String(value)}
														</span>
													))}
												</div>
											)}
											
											<div className="flex items-center justify-between">
												<span className="text-xs text-gray-500">
													{formatDate(event.date)}
												</span>
												
												<div className="flex space-x-1">
													<button
														onClick={() => setSelectedEvent(event)}
														className="p-1 text-gray-400 hover:text-gray-600"
														title="View details"
													>
														<Edit className="h-3 w-3" />
													</button>
													<button
														onClick={() => {
															if (confirm("Are you sure you want to delete this event?")) {
																console.log("Delete event:", event.id);
															}
														}}
														className="p-1 text-gray-400 hover:text-red-600"
														title="Delete event"
													>
														<Trash2 className="h-3 w-3" />
													</button>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						))
					)}
				</div>
			</div>

			{/* Event Details Modal */}
			{selectedEvent && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
						<div className="flex justify-between items-center p-6 border-b">
							<div className="flex items-center space-x-3">
								<div className={`p-2 rounded-lg ${getEventColor(selectedEvent.type)}`}>
									{getEventIcon(selectedEvent.type)}
								</div>
								<div>
									<h2 className="text-xl font-semibold text-gray-900">
										{selectedEvent.title}
									</h2>
									<p className="text-sm text-gray-500">
										{selectedEvent.date.toLocaleDateString()}
									</p>
								</div>
							</div>
							<button
								onClick={() => setSelectedEvent(null)}
								className="text-gray-400 hover:text-gray-600"
							>
								×
							</button>
						</div>
						<div className="p-6">
							<div className="space-y-4">
								<div>
									<h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
									<p className="text-sm text-gray-900">{selectedEvent.description}</p>
								</div>
								
								{selectedEvent.status && (
									<div>
										<h3 className="text-sm font-medium text-gray-700 mb-1">Status</h3>
										<span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedEvent.status)}`}>
											{selectedEvent.status}
										</span>
									</div>
								)}
								
								{selectedEvent.metadata && (
									<div>
										<h3 className="text-sm font-medium text-gray-700 mb-2">Details</h3>
										<div className="grid grid-cols-2 gap-2">
											{Object.entries(selectedEvent.metadata).map(([key, value]) => (
												<div key={key} className="text-sm">
													<span className="font-medium text-gray-700">{key}:</span>
													<span className="text-gray-900 ml-1">{String(value)}</span>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Add Event Modal */}
			{showAddEvent && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
						<div className="flex justify-between items-center p-6 border-b">
							<h2 className="text-xl font-semibold text-gray-900">Add Timeline Event</h2>
							<button
								onClick={() => setShowAddEvent(false)}
								className="text-gray-400 hover:text-gray-600"
							>
								×
							</button>
						</div>
						<div className="p-6">
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Event Type
									</label>
									<select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
										<option value="appointment">Appointment</option>
										<option value="treatment">Treatment</option>
										<option value="photo">Photo</option>
										<option value="message">Message</option>
										<option value="note">Note</option>
										<option value="milestone">Milestone</option>
									</select>
								</div>
								
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Title
									</label>
									<input
										type="text"
										className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										placeholder="Enter event title"
									/>
								</div>
								
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Description
									</label>
									<textarea
										rows={3}
										className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										placeholder="Enter event description"
									/>
								</div>
								
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Date
									</label>
									<input
										type="datetime-local"
										className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									/>
								</div>
							</div>
							
							<div className="flex justify-end space-x-3 mt-6">
								<Button 
									type="button" 
									variant="outline" 
									onClick={() => setShowAddEvent(false)}
								>
									Cancel
								</Button>
								<Button onClick={() => {
									console.log("Add event");
									setShowAddEvent(false);
								}}>
									Add Event
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
} 