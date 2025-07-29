import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useWorkflows(orgId: string | null) {
  // For debugging, always return all workflows
  const allWorkflows = useQuery(api.workflows.getAllWorkflows);

  // Return all workflows for now
  return allWorkflows;
}
