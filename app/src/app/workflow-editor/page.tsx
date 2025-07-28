"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VisualWorkflowEditor } from "@/components/VisualWorkflowEditor";

export default function WorkflowEditorPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const workflowId = searchParams.get('id');

	// Mock workflow data - in real app this would come from your backend
	const mockWorkflow = workflowId ? {
		id: workflowId,
		name: "Appointment Follow-up Workflow",
		description: "Automated follow-up after appointments",
		enabled: true,
		blocks: [
			{
				id: "trigger_1",
				type: "trigger",
				position: { x: 250, y: 100 },
				width: 200,
				height: 80,
				config: { event: "appointment_completed" },
				connections: []
			},
			{
				id: "delay_1",
				type: "delay",
				position: { x: 500, y: 100 },
				width: 200,
				height: 80,
				config: { minutes: 1440 },
				connections: []
			},
			{
				id: "sms_1",
				type: "send_sms",
				position: { x: 750, y: 100 },
				width: 200,
				height: 80,
				config: { message: "Thank you for your appointment!" },
				connections: []
			}
		],
		connections: [
			{
				id: "conn_1",
				from: "trigger_1",
				to: "delay_1",
				fromPort: "output",
				toPort: "input"
			},
			{
				id: "conn_2",
				from: "delay_1",
				to: "sms_1",
				fromPort: "output",
				toPort: "input"
			}
		]
	} : undefined;

	const handleSave = (workflow: any) => {
		console.log("Saving workflow:", workflow);
		// In real app, save to backend
		router.push('/test?tab=workflows');
	};

	const handleCancel = () => {
		router.push('/test?tab=workflows');
	};

	return (
		<VisualWorkflowEditor
			workflow={mockWorkflow}
			onSave={handleSave}
			onCancel={handleCancel}
		/>
	);
} 