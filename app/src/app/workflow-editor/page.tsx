"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VisualWorkflowEditor } from "@/components/VisualWorkflowEditor";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";

export default function WorkflowEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowId = searchParams.get("id");
  const createWorkflow = useMutation(api.workflows.create);
  const updateWorkflow = useMutation(api.workflows.update);
  const createDemoOrg = useMutation(api.orgs.createDemoOrg);
  const { toast } = useToast();

  // Fetch real workflow data if we have a valid Convex ID
  const isValidConvexId = workflowId && workflowId.startsWith("workflows:");
  const realWorkflow = isValidConvexId
    ? useQuery(api.workflows.get, { id: workflowId as any })
    : undefined;

  // Mock workflow data - only use for non-Convex IDs
  const mockWorkflow =
    workflowId && !workflowId.startsWith("workflows:")
      ? {
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
              connections: [],
            },
            {
              id: "delay_1",
              type: "delay",
              position: { x: 500, y: 100 },
              width: 200,
              height: 80,
              config: { minutes: 1440 },
              connections: [],
            },
            {
              id: "sms_1",
              type: "send_sms",
              position: { x: 750, y: 100 },
              width: 200,
              height: 80,
              config: { message: "Thank you for your appointment!" },
              connections: [],
            },
          ],
          connections: [
            {
              id: "conn_1",
              from: "trigger_1",
              to: "delay_1",
              fromPort: "output",
              toPort: "input",
            },
            {
              id: "conn_2",
              from: "delay_1",
              to: "sms_1",
              fromPort: "output",
              toPort: "input",
            },
          ],
        }
      : undefined;

  const handleSave = async (workflow: any) => {
    try {
      console.log("Saving workflow:", workflow);
      console.log("Current workflowId from URL:", workflowId);
      console.log(
        "Is valid Convex ID:",
        workflowId && workflowId.startsWith("workflows:"),
      );

      // Create demo org if needed
      const orgId = await createDemoOrg();
      console.log("Using org ID:", orgId);

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

      console.log("Saving workflow data:", workflowData);

      // Check if workflowId is a valid Convex ID (should start with "workflows:")
      const isValidConvexId = workflowId && workflowId.startsWith("workflows:");

      if (isValidConvexId) {
        // Update existing workflow
        console.log("Updating existing workflow with ID:", workflowId);
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
        // Don't redirect, stay on the edit page
        return;
      } else {
        // Create new workflow
        console.log("Creating new workflow with data:", workflowData);
        const newWorkflowId = await createWorkflow({
          orgId: workflowData.orgId,
          name: workflowData.name,
          description: workflowData.description,
          trigger: workflowData.trigger,
          actions: workflowData.actions,
          conditions: workflowData.conditions,
          isActive: workflowData.isActive,
        });

        console.log("Created workflow with ID:", newWorkflowId);

        toast({
          title: "Success!",
          description: "Workflow saved successfully!",
          variant: "success",
        });
        // Navigate to edit the newly created workflow
        router.push(`/workflow-editor?id=${newWorkflowId}`);
        return; // Exit early to prevent the redirect below
      }
    } catch (error) {
      console.error("Error saving workflow:", error);
      toast({
        title: "Error",
        description: `Failed to save workflow: ${error}`,
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    router.push("/workflows");
  };

  // Transform real workflow data to match expected format
  const transformedRealWorkflow = realWorkflow
    ? {
        id: realWorkflow._id,
        name: realWorkflow.name,
        description: realWorkflow.description || "",
        enabled: realWorkflow.isActive || false,
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

  console.log("Real workflow data:", realWorkflow);
  console.log("Transformed workflow:", transformedRealWorkflow);

  // Use transformed real workflow data if available, otherwise use appropriate fallback
  let workflowToEdit;

  if (isValidConvexId) {
    // For valid Convex IDs, always use real workflow data (even if loading)
    workflowToEdit = transformedRealWorkflow || {
      id: workflowId,
      name: "Loading...",
      description: "",
      enabled: false,
      blocks: [],
      connections: [],
    };
  } else if (mockWorkflow) {
    // For non-Convex IDs, use mock data
    workflowToEdit = mockWorkflow;
  } else {
    // For new workflows, use default data
    workflowToEdit = {
      id: workflowId || "new",
      name: "New Workflow",
      description: "",
      enabled: false,
      blocks: [],
      connections: [],
    };
  }

  // If we're loading a real workflow but don't have the data yet, show loading
  if (isValidConvexId && !realWorkflow) {
    console.log("Loading real workflow data...");
  }

  console.log("=== WORKFLOW DEBUG ===");
  console.log("workflowId from URL:", workflowId);
  console.log(
    "isValidConvexId:",
    workflowId && workflowId.startsWith("workflows:"),
  );
  console.log("realWorkflow from query:", realWorkflow);
  console.log("transformedRealWorkflow:", transformedRealWorkflow);
  console.log("mockWorkflow:", mockWorkflow);
  console.log("workflowToEdit:", workflowToEdit);
  console.log("=====================");

  console.log("Workflow to edit:", workflowToEdit);
  console.log("Workflow ID from URL:", workflowId);
  console.log("Real workflow data:", realWorkflow);
  console.log("Transformed workflow:", transformedRealWorkflow);

  return (
    <VisualWorkflowEditor
      workflow={workflowToEdit}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
