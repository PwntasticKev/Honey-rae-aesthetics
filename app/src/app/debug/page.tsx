"use client";

import { DataTable } from "@/components/DataTable";

const testData = [
	{
		_id: "1",
		name: "Test Workflow",
		description: "Test Description",
		trigger: "appointment_completed",
		enabled: true,
		runCount: 5
	}
];

export default function DebugPage() {
	return (
		<div className="p-8">
			<h1 className="text-2xl font-bold mb-4">Debug Page</h1>
			
			<div className="mb-4 p-4 bg-gray-100 rounded">
				<h3 className="font-bold">Test Data:</h3>
				<pre className="text-xs">{JSON.stringify(testData, null, 2)}</pre>
			</div>
			
			<DataTable
				data={testData}
				columns={[
					{
						key: "name",
						label: "Name",
						render: (item: any) => <div>{item.name}</div>
					},
					{
						key: "enabled",
						label: "Enabled",
						render: (item: any) => <div>{item.enabled ? 'Yes' : 'No'}</div>
					}
				]}
				title="Test Table"
				description="Testing the DataTable component"
			/>
		</div>
	);
} 