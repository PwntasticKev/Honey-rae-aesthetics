"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VisualWorkflowEditor } from "@/components/VisualWorkflowEditor";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { useEnvironment } from "@/contexts/EnvironmentContext";

export default function WorkflowEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowId = searchParams.get("id");
  const createWorkflow = useMutation(api.workflows.create);
  const updateWorkflow = useMutation(api.workflows.update);
  const createDemoOrg = useMutation(api.orgs.createDemoOrg);
  const { toast } = useToast();
  const { environment } = useEnvironment();

  // Fetch real workflow data if we have a valid Convex ID
  const isValidConvexId = workflowId && workflowId.startsWith("workflows:");
  const realWorkflow = isValidConvexId
    ? useQuery(api.workflows.get, { id: workflowId as any })
    : undefined;

  const handleSave = async (workflow: any) => {
    try {
      // Create demo org if needed
      const orgId = await createDemoOrg();

      // Convert workflow data to match Convex schema
      const workflowData = {
        orgId: orgId,
        name: workflow.name,
        description: workflow.description,
        trigger: "manual" as const, // Default trigger
        conditions: [], // Convert from workflow.blocks if needed
        actions: workflow.blocks
          .filter((block: any) => block.type !== "trigger") // Filter out trigger nodes
          .map((block: any, index: number) => {
            // Map workflow editor node types to Convex action types
            let actionType: string;
            switch (block.type) {
              case "send_sms":
                actionType = "send_sms";
                break;
              case "send_email":
                actionType = "send_email";
                break;
              case "delay":
                actionType = "delay";
                break;
              case "add_tag":
                actionType = "tag";
                break;
              case "if":
                actionType = "conditional";
                break;
              default:
                actionType = "send_sms"; // Default fallback
                break;
            }

            return {
              type: actionType,
              config: block.config || {},
              order: index,
            };
          }),
        isActive: workflow.enabled,
      };

      // Check if we're editing an existing workflow
      const isEditingRealWorkflow = isValidConvexId && realWorkflow;

      if (isEditingRealWorkflow) {
        // Update existing real Convex workflow
        await updateWorkflow({
          id: workflowId as any,
          name: workflowData.name,
          description: workflowData.description,
          trigger: workflowData.trigger,
          isActive: workflowData.isActive,
          actions: workflowData.actions,
          conditions: workflowData.conditions,
        });

        toast({
          title: "Success!",
          description: "Workflow updated successfully!",
          variant: "success",
        });
        return;
      } else {
        // Create new Convex workflow
        const newWorkflowId = await createWorkflow(workflowData);
        toast({
          title: "Success!",
          description: "Workflow created successfully!",
          variant: "success",
        });
        // Redirect to the new workflow's page to allow further edits
        router.push(`/workflow-editor?id=${newWorkflowId}`);
      }
    } catch (error) {
      console.error("Error saving workflow:", error);
      toast({
        title: "Error!",
        description: `Failed to save workflow: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    router.push("/workflows");
  };

  // Transform real workflow data to match the editor format
  const transformedRealWorkflow = realWorkflow
    ? {
        id: realWorkflow._id,
        name: realWorkflow.name,
        description: realWorkflow.description || "",
        enabled: realWorkflow.isActive,
        blocks:
          realWorkflow.actions?.map((action: any, index: number) => ({
            id: `action_${index}`,
            type: action.type,
            position: { x: 250 + index * 250, y: 100 },
            width: 200,
            height: 80,
            config: action.config || {},
            connections: [],
          })) || [],
        connections: [],
      }
    : undefined;

  // Determine which workflow to edit
  let workflowToEdit;

  console.log("=== WORKFLOW LOADING DEBUG ===");
  console.log("workflowId:", workflowId);
  console.log("isValidConvexId:", isValidConvexId);
  console.log("realWorkflow:", realWorkflow);
  console.log("transformedRealWorkflow:", transformedRealWorkflow);

  if (isValidConvexId && realWorkflow) {
    // For valid Convex IDs with real data, use the real workflow
    workflowToEdit = transformedRealWorkflow;
    console.log("Using real workflow data");
  } else if (isValidConvexId) {
    // For valid Convex IDs but no data yet, show loading state
    workflowToEdit = {
      id: workflowId,
      name: "Loading...",
      description: "Loading workflow data...",
      enabled: false,
      blocks: [],
      connections: [],
    };
    console.log("Showing loading state");
  } else {
    // For new workflows or invalid IDs, show new workflow
    workflowToEdit = {
      id: workflowId || "new",
      name: "New Workflow",
      description: "",
      enabled: false,
      blocks: [],
      connections: [],
    };
    console.log("Creating new workflow");
  }

  console.log("Final workflowToEdit:", workflowToEdit);

  return (
    <div className="min-h-screen bg-gray-50">
      <VisualWorkflowEditor
        workflow={workflowToEdit}
        onSave={handleSave}
        onCancel={handleCancel}
        environment={environment}
      />
    </div>
  );
}
