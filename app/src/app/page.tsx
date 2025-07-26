"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
	Users, 
	Calendar, 
	Image, 
	MessageSquare, 
	Settings, 
	BarChart3,
	Plus,
	Search,
	Bell,
	X
} from "lucide-react";
import { ClientForm } from "@/components/ClientForm";
import { ClientList } from "@/components/ClientList";
import { AppointmentForm } from "@/components/AppointmentForm";
import { AppointmentList } from "@/components/AppointmentList";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
	const [activeTab, setActiveTab] = useState("clients");
	const [showClientModal, setShowClientModal] = useState(false);
	const [editingClient, setEditingClient] = useState<any>(null);
	const [showAppointmentModal, setShowAppointmentModal] = useState(false);
	const [editingAppointment, setEditingAppointment] = useState<any>(null);

	// For demo purposes, we'll use a hardcoded org ID
	// In a real app, this would come from authentication
	// You can get the actual org ID from the setup page
	const demoOrgId = "demo-org-id";
	
	// Check if we have any orgs in the database
	const orgs = useQuery(api.orgs.list) || [];
	const currentOrgId = orgs.length > 0 ? orgs[0]._id : null;

	const createClient = useMutation(api.clients.create);
	const updateClient = useMutation(api.clients.update);
	const deleteClient = useMutation(api.clients.remove);
	const createAppointment = useMutation(api.appointments.create);
	const updateAppointment = useMutation(api.appointments.update);
	const deleteAppointment = useMutation(api.appointments.remove);

	// Fetch data - always call hooks but handle empty results
	const clients = useQuery(api.clients.getByOrg, { orgId: currentOrgId || "demo-org-id" as any }) || [];
	const appointments = useQuery(api.appointments.getByOrg, { orgId: currentOrgId || "demo-org-id" as any }) || [];
	const files = useQuery(api.files.getByOrg, { orgId: currentOrgId || "demo-org-id" as any }) || [];
	const messages = useQuery(api.messages.getByOrg, { orgId: currentOrgId || "demo-org-id" as any }) || [];

	const tabs = [
		{ id: "clients", label: "Clients", icon: Users },
		{ id: "appointments", label: "Appointments", icon: Calendar },
		{ id: "gallery", label: "Gallery", icon: Image },
		{ id: "messaging", label: "Messaging", icon: MessageSquare },
		{ id: "workflows", label: "Workflows", icon: BarChart3 },
		{ id: "settings", label: "Settings", icon: Settings },
	];

	const handleAddClient = () => {
		setEditingClient(null);
		setShowClientModal(true);
	};

	const handleEditClient = (clientId: string) => {
		const client = clients.find(c => c._id === clientId);
		setEditingClient(client);
		setShowClientModal(true);
	};

	const handleDeleteClient = async (clientId: string) => {
		if (confirm("Are you sure you want to delete this client?")) {
			await deleteClient({ id: clientId as any });
		}
	};

	const handleAddAppointment = () => {
		setEditingAppointment(null);
		setShowAppointmentModal(true);
	};

	const handleEditAppointment = (appointmentId: string) => {
		const appointment = appointments.find(a => a._id === appointmentId);
		setEditingAppointment(appointment);
		setShowAppointmentModal(true);
	};

	const handleDeleteAppointment = async (appointmentId: string) => {
		if (confirm("Are you sure you want to delete this appointment?")) {
			await deleteAppointment({ id: appointmentId as any });
		}
	};

	const handleAppointmentSubmit = async (data: any) => {
		try {
			if (editingAppointment) {
				await updateAppointment({
					id: editingAppointment._id,
					...data,
				});
			} else {
				if (!currentOrgId) {
					alert("Please setup demo data first by visiting /setup");
					return;
				}
				await createAppointment({
					orgId: currentOrgId,
					...data,
					dateTime: new Date(data.dateTime).getTime(),
				});
			}
			setShowAppointmentModal(false);
			setEditingAppointment(null);
		} catch (error) {
			console.error("Error saving appointment:", error);
			alert("Error saving appointment. Please try again.");
		}
	};

	const handleAppointmentCancel = () => {
		setShowAppointmentModal(false);
		setEditingAppointment(null);
	};

	const handleClientSubmit = async (data: any) => {
		try {
			if (editingClient) {
				await updateClient({
					id: editingClient._id,
					...data,
				});
			} else {
				if (!currentOrgId) {
					alert("Please setup demo data first by visiting /setup");
					return;
				}
				await createClient({
					orgId: currentOrgId,
					...data,
				});
			}
			setShowClientModal(false);
			setEditingClient(null);
		} catch (error) {
			console.error("Error saving client:", error);
			alert("Error saving client. Please try again.");
		}
	};

	const handleClientCancel = () => {
		setShowClientModal(false);
		setEditingClient(null);
	};

	// Calculate stats
	const today = new Date();
	const todayAppointments = appointments.filter(apt => {
		const aptDate = new Date(apt.dateTime);
		return aptDate.toDateString() === today.toDateString();
	});

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center">
							<h1 className="text-xl font-semibold text-gray-900">
								Honey Rae Aesthetics
							</h1>
						</div>
						<div className="flex items-center space-x-4">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
								<input
									type="text"
									placeholder="Search clients, appointments..."
									className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>
							<button className="p-2 text-gray-400 hover:text-gray-600">
								<Bell className="h-5 w-5" />
							</button>
							<div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
								<span className="text-white text-sm font-medium">KR</span>
							</div>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Quick Stats */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
					<div className="bg-white rounded-lg shadow p-6">
						<div className="flex items-center">
							<div className="p-2 bg-blue-100 rounded-lg">
								<Users className="h-6 w-6 text-blue-600" />
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600">Total Clients</p>
								<p className="text-2xl font-semibold text-gray-900">{clients.length}</p>
							</div>
						</div>
					</div>
					<div className="bg-white rounded-lg shadow p-6">
						<div className="flex items-center">
							<div className="p-2 bg-green-100 rounded-lg">
								<Calendar className="h-6 w-6 text-green-600" />
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600">Today's Appointments</p>
								<p className="text-2xl font-semibold text-gray-900">{todayAppointments.length}</p>
							</div>
						</div>
					</div>
					<div className="bg-white rounded-lg shadow p-6">
						<div className="flex items-center">
							<div className="p-2 bg-purple-100 rounded-lg">
								<MessageSquare className="h-6 w-6 text-purple-600" />
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600">Messages Sent</p>
								<p className="text-2xl font-semibold text-gray-900">{messages.length}</p>
							</div>
						</div>
					</div>
					<div className="bg-white rounded-lg shadow p-6">
						<div className="flex items-center">
							<div className="p-2 bg-orange-100 rounded-lg">
								<Image className="h-6 w-6 text-orange-600" />
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600">Photos Uploaded</p>
								<p className="text-2xl font-semibold text-gray-900">{files.length}</p>
							</div>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className="bg-white rounded-lg shadow">
					{/* Tab Navigation */}
					<div className="border-b border-gray-200">
						<nav className="-mb-px flex space-x-8 px-6">
							{tabs.map((tab) => {
								const Icon = tab.icon;
								return (
																<button
								key={tab.id}
								data-testid={`${tab.id}-tab`}
								onClick={() => setActiveTab(tab.id)}
								className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
									activeTab === tab.id
										? "border-blue-500 text-blue-600"
										: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
					<div className="p-6">
						{activeTab === "clients" && (
							currentOrgId ? (
								<ClientList
									orgId={currentOrgId}
									onAddClient={handleAddClient}
									onEditClient={handleEditClient}
									onDeleteClient={handleDeleteClient}
								/>
							) : (
								<div className="bg-gray-50 rounded-lg p-8 text-center">
									<h3 className="text-lg font-medium text-gray-900 mb-2">
										No organization found
									</h3>
									<p className="text-gray-500 mb-4">
										Please setup demo data first by visiting the setup page.
									</p>
									<Button onClick={() => window.location.href = '/setup'}>
										Setup Demo Data
									</Button>
								</div>
							)
						)}

						{activeTab === "appointments" && (
							currentOrgId ? (
								<AppointmentList
									orgId={currentOrgId}
									onAddAppointment={handleAddAppointment}
									onEditAppointment={handleEditAppointment}
									onDeleteAppointment={handleDeleteAppointment}
								/>
							) : (
								<div className="bg-gray-50 rounded-lg p-8 text-center">
									<h3 className="text-lg font-medium text-gray-900 mb-2">
										No organization found
									</h3>
									<p className="text-gray-500 mb-4">
										Please setup demo data first by visiting the setup page.
									</p>
									<Button onClick={() => window.location.href = '/setup'}>
										Setup Demo Data
									</Button>
								</div>
							)
						)}

						{activeTab === "gallery" && (
							<div>
								<div className="flex justify-between items-center mb-6">
									<h2 className="text-lg font-medium text-gray-900">Photo Gallery</h2>
									<Button className="flex items-center space-x-2">
										<Plus className="h-4 w-4" />
										<span>Upload Photos</span>
									</Button>
								</div>
								<div className="bg-gray-50 rounded-lg p-8 text-center">
									<Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
									<h3 className="text-lg font-medium text-gray-900 mb-2">
										No photos uploaded
									</h3>
									<p className="text-gray-500 mb-4">
										Upload before and after photos to track client progress.
									</p>
									<Button>
										Upload Photos
									</Button>
								</div>
							</div>
						)}

						{activeTab === "messaging" && (
							<div>
								<div className="flex justify-between items-center mb-6">
									<h2 className="text-lg font-medium text-gray-900">Messaging</h2>
									<Button className="flex items-center space-x-2">
										<Plus className="h-4 w-4" />
										<span>Send Message</span>
									</Button>
								</div>
								<div className="bg-gray-50 rounded-lg p-8 text-center">
									<MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
									<h3 className="text-lg font-medium text-gray-900 mb-2">
										No messages sent
									</h3>
									<p className="text-gray-500 mb-4">
										Start communicating with your clients via SMS or email.
									</p>
									<Button>
										Send Message
									</Button>
								</div>
							</div>
						)}

						{activeTab === "workflows" && (
							<div>
								<div className="flex justify-between items-center mb-6">
									<h2 className="text-lg font-medium text-gray-900">Workflows</h2>
									<Button className="flex items-center space-x-2">
										<Plus className="h-4 w-4" />
										<span>Create Workflow</span>
									</Button>
								</div>
								<div className="bg-gray-50 rounded-lg p-8 text-center">
									<BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
									<h3 className="text-lg font-medium text-gray-900 mb-2">
										No workflows created
									</h3>
									<p className="text-gray-500 mb-4">
										Automate your client communication with custom workflows.
									</p>
									<Button>
										Create Workflow
									</Button>
								</div>
							</div>
						)}

						{activeTab === "settings" && (
							<div>
								<h2 className="text-lg font-medium text-gray-900 mb-6">Settings</h2>
								<div className="space-y-6">
									<div className="border border-gray-200 rounded-lg p-4">
										<h3 className="text-md font-medium text-gray-900 mb-2">
											Organization Settings
										</h3>
										<p className="text-gray-500 text-sm">
											Manage your clinic's information, branding, and preferences.
										</p>
									</div>
									<div className="border border-gray-200 rounded-lg p-4">
										<h3 className="text-md font-medium text-gray-900 mb-2">
											Team Management
										</h3>
										<p className="text-gray-500 text-sm">
											Invite team members and manage their roles and permissions.
										</p>
									</div>
									<div className="border border-gray-200 rounded-lg p-4">
										<h3 className="text-md font-medium text-gray-900 mb-2">
											Integrations
										</h3>
										<p className="text-gray-500 text-sm">
											Connect with Google Calendar, Stripe, and other services.
										</p>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Client Modal */}
			{showClientModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
						<div className="flex justify-between items-center p-6 border-b">
							<h2 className="text-xl font-semibold text-gray-900">
								{editingClient ? "Edit Client" : "Add New Client"}
							</h2>
							<button
								onClick={handleClientCancel}
								className="text-gray-400 hover:text-gray-600"
							>
								<X className="h-6 w-6" />
							</button>
						</div>
						<div className="p-6">
							<ClientForm
								onSubmit={handleClientSubmit}
								onCancel={handleClientCancel}
								initialData={editingClient}
							/>
						</div>
					</div>
				</div>
			)}

			{/* Appointment Modal */}
			{showAppointmentModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
						<div className="flex justify-between items-center p-6 border-b">
							<h2 className="text-xl font-semibold text-gray-900">
								{editingAppointment ? "Edit Appointment" : "Schedule New Appointment"}
							</h2>
							<button
								onClick={handleAppointmentCancel}
								className="text-gray-400 hover:text-gray-600"
							>
								<X className="h-6 w-6" />
							</button>
						</div>
						<div className="p-6">
							<AppointmentForm
								orgId={demoOrgId}
								onSubmit={handleAppointmentSubmit}
								onCancel={handleAppointmentCancel}
								initialData={editingAppointment}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
