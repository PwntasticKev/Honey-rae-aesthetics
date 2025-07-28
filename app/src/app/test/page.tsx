"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClientList } from "@/components/ClientList";
import { AppointmentList } from "@/components/AppointmentList";
import { WorkflowList } from "@/components/WorkflowList";

// Mock data for clients and workflows (updated with more details)
const mockClients = [
	{
		_id: "1",
		fullName: "Sarah Johnson",
		email: "sarah.johnson@email.com",
		phones: ["+1 (555) 123-4567"],
		gender: "female",
		dateOfBirth: "1990-05-15",
		address: "123 Main St, City, State 12345",
		referralSource: "Google Search",
		tags: ["VIP", "Regular"],
		clientPortalStatus: "active",
		createdAt: Date.now() - 86400000 * 30,
		notes: "Prefers morning appointments"
	},
	{
		_id: "2",
		fullName: "Michael Chen",
		email: "michael.chen@email.com",
		phones: ["+1 (555) 987-6543"],
		gender: "male",
		dateOfBirth: "1985-08-22",
		address: "456 Oak Ave, City, State 12345",
		referralSource: "Referral",
		tags: ["New Client"],
		clientPortalStatus: "pending",
		createdAt: Date.now() - 86400000 * 7,
		notes: "Interested in consultation"
	},
	{
		_id: "3",
		fullName: "Emily Rodriguez",
		email: "emily.rodriguez@email.com",
		phones: ["+1 (555) 456-7890"],
		gender: "female",
		dateOfBirth: "1992-12-10",
		address: "789 Pine St, City, State 12345",
		referralSource: "Social Media",
		tags: ["VIP", "Returning"],
		clientPortalStatus: "active",
		createdAt: Date.now() - 86400000 * 60,
		notes: "Loves the results!"
	}
];

const mockWorkflows = [
	{
		_id: "1",
		name: "Appointment Follow-up",
		description: "Automated follow-up after appointments",
		trigger: "appointment_completed",
		enabled: true,
		steps: [
			{ type: "send_sms", config: { message: "Thank you for your appointment!" } },
			{ type: "delay", config: { minutes: 1440 } },
			{ type: "send_email", config: { subject: "How was your experience?", message: "We'd love to hear about your experience!" } }
		],
		createdAt: 1752798400000, // Static timestamp
		lastRun: 1753489600000, // Static timestamp
		runCount: 15
	},
	{
		_id: "2",
		name: "New Client Welcome",
		description: "Welcome sequence for new clients",
		trigger: "client_added",
		enabled: true,
		steps: [
			{ type: "send_email", config: { subject: "Welcome!", message: "Welcome to our practice!" } },
			{ type: "add_tag", config: { tag: "new_client" } },
			{ type: "send_sms", config: { message: "We're excited to have you as a client!" } }
		],
		createdAt: 1753230400000, // Static timestamp
		lastRun: 1753576000000, // Static timestamp
		runCount: 8
	},
	{
		_id: "3",
		name: "Birthday Reminder",
		description: "Send birthday wishes to clients",
		trigger: "birthday",
		enabled: false,
		steps: [
			{ type: "send_sms", config: { message: "Happy Birthday! 🎉" } },
			{ type: "send_email", config: { subject: "Happy Birthday!", message: "Wishing you a wonderful birthday!" } }
		],
		createdAt: 1752366400000, // Static timestamp
		runCount: 0
	}
];

export default function TestPage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Get active tab from URL or default to 'clients'
	const activeTab = searchParams.get('tab') || 'clients';

	// Update URL when tab changes
	const handleTabChange = (tab: string) => {
		router.push(`/test?tab=${tab}`);
	};

	// Handle workflow actions
	const handleAddClient = () => {
		console.log("Add client clicked");
	};

	const handleEditClient = (id: string) => {
		console.log("Edit client:", id);
	};

	const handleDeleteClient = (id: string) => {
		console.log("Delete client:", id);
	};

	const handleAddAppointment = () => {
		console.log("Add appointment clicked");
	};

	const handleEditAppointment = (id: string) => {
		console.log("Edit appointment:", id);
	};

	const handleDeleteAppointment = (id: string) => {
		console.log("Delete appointment:", id);
	};

	const handleAddWorkflow = () => {
		// Navigate to the workflow editor page
		router.push('/workflow-editor');
	};

	const handleEditWorkflow = (id: string) => {
		// Navigate to the workflow editor page with the workflow ID
		router.push(`/workflow-editor?id=${id}`);
	};

	const handleDeleteWorkflow = (id: string) => {
		console.log("Delete workflow:", id);
	};

	const handleToggleWorkflow = (id: string, enabled: boolean) => {
		console.log(`Toggle workflow ${id}: ${enabled}`);
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto py-8 px-4">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Data Table & Workflow Demo</h1>
					<p className="text-gray-600">
						Demonstrating the new table-based data components with toggle between table and card views,
						plus enhanced workflow editor with drag-and-drop functionality.
					</p>
				</div>

				{/* Navigation Tabs */}
				<div className="mb-6">
					<div className="border-b border-gray-200">
						<nav className="-mb-px flex space-x-8">
							{[
								{ id: 'clients', label: 'Clients', count: mockClients.length },
								{ id: 'appointments', label: 'Appointments', count: 2 },
								{ id: 'workflows', label: 'Workflows', count: mockWorkflows.length },
							].map((tab) => (
								<button
									key={tab.id}
									onClick={() => handleTabChange(tab.id)}
									className={`py-2 px-1 border-b-2 font-medium text-sm ${
										activeTab === tab.id
											? 'border-pink-500 text-pink-600'
											: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
									}`}
								>
									{tab.label}
									<span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
										{tab.count}
									</span>
								</button>
							))}
						</nav>
					</div>
				</div>

				{/* Content */}
				<div className="bg-white rounded-lg shadow">
					{activeTab === 'clients' && (
						<div className="p-6">
							<ClientList
								clients={mockClients}
								onAddClient={handleAddClient}
								onEditClient={handleEditClient}
								onDeleteClient={handleDeleteClient}
							/>
						</div>
					)}

					{activeTab === 'appointments' && (
						<div className="p-6">
							<AppointmentList
								orgId="test-org"
								onAddAppointment={handleAddAppointment}
								onEditAppointment={handleEditAppointment}
								onDeleteAppointment={handleDeleteAppointment}
							/>
						</div>
					)}

					{activeTab === 'workflows' && (
						<div className="p-6">
							{/* Debug: Show raw data */}
							<div className="mb-4 p-4 bg-gray-100 rounded">
								<h3 className="font-bold">Debug - Raw Workflow Data:</h3>
								<pre className="text-xs">{JSON.stringify(mockWorkflows, null, 2)}</pre>
							</div>
							
							<WorkflowList
								workflows={mockWorkflows}
								onAddWorkflow={handleAddWorkflow}
								onEditWorkflow={handleEditWorkflow}
								onDeleteWorkflow={handleDeleteWorkflow}
								onToggleWorkflow={handleToggleWorkflow}
							/>
						</div>
					)}
				</div>

				{/* Workflow Editor Demo */}
				<div className="mt-8 bg-white rounded-lg shadow p-6">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h2 className="text-xl font-semibold text-gray-900">Workflow Editor Demo</h2>
							<p className="text-gray-600">
								Test the enhanced drag-and-drop workflow editor with better node positioning and insertion capabilities.
							</p>
						</div>
						<button
							onClick={() => router.push('/workflow-editor')}
							className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
						>
							Open Workflow Editor
						</button>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
						<div className="p-4 bg-blue-50 rounded-lg">
							<h3 className="font-medium text-blue-900 mb-2">Enhanced Features</h3>
							<ul className="space-y-1 text-blue-700">
								<li>• Click-to-edit nodes</li>
								<li>• Right-side configuration panel</li>
								<li>• Default trigger on creation</li>
								<li>• Full-page editor (not modal)</li>
							</ul>
						</div>
						<div className="p-4 bg-green-50 rounded-lg">
							<h3 className="font-medium text-green-900 mb-2">Table Views</h3>
							<ul className="space-y-1 text-green-700">
								<li>• Toggle between table/card</li>
								<li>• Sortable columns</li>
								<li>• Search functionality</li>
								<li>• Responsive design</li>
							</ul>
						</div>
						<div className="p-4 bg-purple-50 rounded-lg">
							<h3 className="font-medium text-purple-900 mb-2">Data Management</h3>
							<ul className="space-y-1 text-purple-700">
								<li>• Consistent UI patterns</li>
								<li>• Reusable components</li>
								<li>• TypeScript support</li>
								<li>• Accessibility features</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
} 