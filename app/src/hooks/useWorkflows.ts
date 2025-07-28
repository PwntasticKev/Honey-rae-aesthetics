import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useWorkflows(orgId: string | null) {
	// Always call getAllWorkflows
	const allWorkflows = useQuery(api.workflows.getAllWorkflows);
	
	// Only call getByOrg if we have a valid orgId
	const orgWorkflows = useQuery(
		api.workflows.getByOrg, 
		orgId && orgId !== "orgs:placeholder" ? { orgId: orgId as any } : "skip"
	);
	
	// Return org-specific workflows if orgId exists and is valid, otherwise return all workflows
	return orgId && orgId !== "orgs:placeholder" ? orgWorkflows : allWorkflows;
} 