import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useWorkflows(orgId: string | null) {
	// For debugging, always return all workflows
	const allWorkflows = useQuery(api.workflows.getAllWorkflows);
	
	console.log('=== USE WORKFLOWS DEBUG ===');
	console.log('orgId:', orgId);
	console.log('allWorkflows:', allWorkflows);
	console.log('allWorkflows type:', typeof allWorkflows);
	console.log('allWorkflows length:', allWorkflows?.length);
	if (allWorkflows) {
		console.log('First workflow:', allWorkflows[0]);
	}
	console.log('==========================');
	
	// Return all workflows for now
	return allWorkflows;
} 