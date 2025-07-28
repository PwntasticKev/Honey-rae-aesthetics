"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ClientList } from "@/components/ClientList";
import { AppointmentList } from "@/components/AppointmentList";
import { WorkflowList } from "@/components/WorkflowList";

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

const mockAppointments = [
	{
		_id: "1",
		clientName: "Sarah Johnson",
		service: "Facial Treatment",
		date: "2024-01-20",
		time: "10:00 AM",
		status: "confirmed",
		duration: 60,
		price: 150
	},
	{
		_id: "2",
		clientName: "Michael Chen",
		service: "Chemical Peel",
		date: "2024-01-22",
		time: "2:00 PM",
		status: "pending",
		duration: 90,
		price: 200
	},
	{
		_id: "3",
		clientName: "Emily Rodriguez",
		service: "Microdermabrasion",
		date: "2024-01-25",
		time: "11:30 AM",
		status: "confirmed",
		duration: 45,
		price: 120
	}
];

const mockWorkflows = [
	{
		_id: "1",
		name: "Appointment Follow-up",
		description: "Automated follow-up after appointments",
		trigger: "appointment_completed",
		enabled: true,
		steps: [{ type: "send_message", config: {} }, { type: "delay", config: {} }, { type: "add_tag", config: {} }],
		createdAt: 1752798400000,
		lastRun: 1753489600000,
		runCount: 15
	},
	{
		_id: "2",
		name: "New Client Welcome",
		description: "Welcome sequence for new clients",
		trigger: "client_added",
		enabled: true,
		steps: [{ type: "send_message", config: {} }, { type: "delay", config: {} }, { type: "add_tag", config: {} }],
		createdAt: 1753230400000,
		lastRun: 1753576000000,
		runCount: 8
	},
	{
		_id: "3",
		name: "Birthday Reminder",
		description: "Send birthday wishes to clients",
		trigger: "birthday",
		enabled: false,
		steps: [{ type: "send_message", config: {} }, { type: "add_tag", config: {} }],
		createdAt: 1752366400000,
		runCount: 0
	}
];

export default function TestPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'clients');

	const handleTabChange = (tab: string) => {
		setActiveTab(tab);
		router.push(`/test?tab=${tab}`);
	};

	const handleAddWorkflow = () => {
		router.push('/workflow-editor');
	};

	const handleEditWorkflow = (id: string) => {
		router.push(`/workflow-editor?id=${id}`);
	};

	const handleDeleteWorkflow = (id: string) => {
		console.log('Delete workflow:', id);
	};

	const handleToggleWorkflow = (id: string, enabled: boolean) => {
		console.log('Toggle workflow:', id, enabled);
	};

	const tabs = [
		{ id: 'clients', label: 'Clients', count: mockClients.length },
		{ id: 'appointments', label: 'Appointments', count: mockAppointments.length },
		{ id: 'workflows', label: 'Workflows', count: mockWorkflows.length }
	];

	return (
		<div className="min-h-screen bg-gray-100 p-8">
			<div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
				<h1 className="text-3xl font-bold text-gray-900 mb-6">Honey Rae Platform</h1>
				
				{/* Tabs */}
				<div className="border-b border-gray-200 mb-6">
					<nav className="-mb-px flex space-x-8">
						{tabs.map((tab) => (
							<button
								key={tab.id}
								onClick={() => handleTabChange(tab.id)}
								className={`py-2 px-1 border-b-2 font-medium text-sm ${
									activeTab === tab.id
										? 'border-blue-500 text-blue-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								}`}
							>
								{tab.label} ({tab.count})
							</button>
						))}
					</nav>
				</div>

				{/* Content */}
				{activeTab === 'clients' && (
					<ClientList
						clients={mockClients}
						onAddClient={() => console.log('Add client')}
						onEditClient={(id) => console.log('Edit client:', id)}
						onDeleteClient={(id) => console.log('Delete client:', id)}
					/>
				)}

				{activeTab === 'appointments' && (
					<AppointmentList
						orgId="test-org"
						onAddAppointment={() => console.log('Add appointment')}
						onEditAppointment={(id) => console.log('Edit appointment:', id)}
						onDeleteAppointment={(id) => console.log('Delete appointment:', id)}
					/>
				)}

				{activeTab === 'workflows' && (
					<WorkflowList
						workflows={mockWorkflows}
						onAddWorkflow={handleAddWorkflow}
						onEditWorkflow={handleEditWorkflow}
						onDeleteWorkflow={handleDeleteWorkflow}
						onToggleWorkflow={handleToggleWorkflow}
					/>
				)}
			</div>
		</div>
	);
} 