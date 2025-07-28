"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

interface NavigationProps {
	clientsCount?: number;
	appointmentsCount?: number;
	workflowsCount?: number;
}

export function Navigation({ clientsCount = 0, appointmentsCount = 0, workflowsCount = 0 }: NavigationProps) {
	const pathname = usePathname();

	const tabs = [
		{ id: 'clients', label: 'Clients', count: clientsCount, path: '/clients' },
		{ id: 'appointments', label: 'Appointments', count: appointmentsCount, path: '/appointments' },
		{ id: 'workflows', label: 'Workflows', count: workflowsCount, path: '/workflows' }
	];

	const getActiveTab = () => {
		if (pathname === '/clients') return 'clients';
		if (pathname === '/appointments') return 'appointments';
		if (pathname === '/workflows') return 'workflows';
		return 'workflows'; // default
	};

	const activeTab = getActiveTab();

	return (
		<div className="border-b border-gray-200 mb-6">
			<nav className="-mb-px flex space-x-8">
				{tabs.map((tab) => (
					<Link
						key={tab.id}
						href={tab.path}
						className={`py-2 px-1 border-b-2 font-medium text-sm ${
							activeTab === tab.id
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
						}`}
					>
						{tab.label} ({tab.count})
					</Link>
				))}
			</nav>
		</div>
	);
} 