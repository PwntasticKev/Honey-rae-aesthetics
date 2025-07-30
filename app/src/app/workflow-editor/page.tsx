"use client";

import { useState, useCallback, useEffect } from "react";
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
  const isValidConvexId = workflowId && workflowId.length > 10;
  const realWorkflow = useQuery(
    api.workflows.get,
    isValidConvexId ? { id: workflowId as any } : "skip",
  );

  // Add debugging to understand the query state
  console.log("🔍 Workflow query state:", {
    workflowId,
    isValidConvexId,
    realWorkflow:
      realWorkflow && typeof realWorkflow !== "string"
        ? {
            id: realWorkflow._id,
            name: realWorkflow.name,
            blocks: realWorkflow.blocks?.length,
            actions: realWorkflow.actions?.length,
            isActive: realWorkflow.isActive,
            description: realWorkflow.description,
            fullBlocks: realWorkflow.blocks,
            fullActions: realWorkflow.actions,
          }
        : null,
  });

  // Add detailed logging of the actual workflow data
  if (realWorkflow && typeof realWorkflow !== "string") {
    console.log("🔍 Full realWorkflow data:", {
      _id: realWorkflow._id,
      name: realWorkflow.name,
      description: realWorkflow.description,
      blocks: realWorkflow.blocks,
      connections: realWorkflow.connections,
      actions: realWorkflow.actions,
      isActive: realWorkflow.isActive,
      createdAt: realWorkflow._creationTime,
      updatedAt: realWorkflow.updatedAt,
    });
  }

  // Add a refetch mechanism to ensure data is loaded after save
  const refetchWorkflow = useCallback(() => {
    if (isValidConvexId) {
      // Force a refetch of the workflow data
      console.log("🔍 Debug - Refetching workflow data");
    }
  }, [isValidConvexId]);

  // Add a function to fix workflows with "Loading..." names
  const fixLoadingWorkflow = async () => {
    if (
      realWorkflow &&
      typeof realWorkflow !== "string" &&
      realWorkflow.name === "Loading..."
    ) {
      console.log("🔍 Fixing workflow with Loading... name");
      try {
        await updateWorkflow({
          id: workflowId as any,
          name: "Untitled Workflow",
          description: "Workflow description",
          // Preserve existing blocks and connections
          blocks: realWorkflow.blocks,
          connections: realWorkflow.connections,
          actions: realWorkflow.actions,
          conditions: realWorkflow.conditions,
        });
        console.log("🔍 Workflow name fixed successfully");
      } catch (error) {
        console.error("🔍 Error fixing workflow name:", error);
      }
    }
  };

  // Call the fix function when realWorkflow loads
  useEffect(() => {
    if (realWorkflow && typeof realWorkflow !== "string") {
      fixLoadingWorkflow();
    }
  }, [realWorkflow]);

  const handleSave = async (workflow: any) => {
    try {
      // Create demo org if needed
      const orgId = await createDemoOrg();

      // Convert workflow data to match Convex schema
      const workflowData = {
        orgId: orgId,
        name:
          workflow.name === "Loading..." ? "Untitled Workflow" : workflow.name,
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
      const isEditingRealWorkflow =
        isValidConvexId && realWorkflow && typeof realWorkflow !== "string";

      console.log("🔍 Saving workflow:", {
        isEditing: isEditingRealWorkflow,
        blocks: workflow.blocks.length,
        connections: workflow.connections?.length || 0,
      });

      // Add detailed logging for the workflow data being saved
      console.log("🔍 Workflow data being saved:", {
        name: workflowData.name,
        description: workflowData.description,
        blocks: workflow.blocks,
        connections: workflow.connections,
        actions: workflowData.actions,
      });

      if (isEditingRealWorkflow) {
        // Filter out invalid connections with null port values
        const validConnections =
          workflow.connections?.filter((conn: any) => conn.from && conn.to) ||
          [];

        // Update existing real Convex workflow
        const updateData = {
          id: workflowId as any, // Use the original workflowId for update
          name: workflowData.name,
          description: workflowData.description,
          trigger: workflowData.trigger,
          isActive: workflowData.isActive,
          actions: workflowData.actions,
          conditions: workflowData.conditions,
          blocks: workflow.blocks, // Save visual blocks data
          connections: validConnections, // Save only valid connections
        };

        console.log("🔍 Update data being sent:", updateData);

        await updateWorkflow(updateData);

        console.log("🔍 Workflow updated successfully");

        // Add a small delay to allow the data to refresh
        await new Promise((resolve) => setTimeout(resolve, 500));

        toast({
          title: "Success!",
          description: "Workflow updated successfully!",
          variant: "success",
        });
        // Don't redirect - stay on the same page
        return;
      } else if (isValidConvexId) {
        // We have a valid ID but no realWorkflow - this might be a loading state
        // Try to update anyway with the ID we have
        console.log(
          "🔍 Attempting to update with ID but no realWorkflow:",
          workflowId,
        );

        const validConnections =
          workflow.connections?.filter((conn: any) => conn.from && conn.to) ||
          [];

        await updateWorkflow({
          id: workflowId as any,
          name: workflowData.name,
          description: workflowData.description,
          trigger: workflowData.trigger,
          isActive: workflowData.isActive,
          actions: workflowData.actions,
          conditions: workflowData.conditions,
          blocks: workflow.blocks,
          connections: validConnections,
        });

        toast({
          title: "Success!",
          description: "Workflow updated successfully!",
          variant: "success",
        });
        return;
      } else {
        // Filter out invalid connections with null port values
        const validConnections =
          workflow.connections?.filter((conn: any) => conn.from && conn.to) ||
          [];

        console.log("🔍 Debug - Creating new workflow with:", {
          blocks: workflow.blocks,
          connections: validConnections,
        });

        // Create new Convex workflow
        const newWorkflowId = await createWorkflow({
          ...workflowData,
          blocks: workflow.blocks, // Save visual blocks data
          connections: validConnections, // Save only valid connections
        });
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
      throw error; // Re-throw so the VisualWorkflowEditor can handle it
    }
  };

  const handleCancel = () => {
    router.push("/workflows");
  };

  // Transform real workflow data for the visual editor
  const transformedRealWorkflow =
    realWorkflow && typeof realWorkflow !== "string"
      ? {
          id: realWorkflow._id,
          name: realWorkflow.name,
          description: realWorkflow.description || "",
          enabled: realWorkflow.isActive,
          blocks: (realWorkflow.blocks?.map((block: any) => ({
            id: block.id,
            type: block.type,
            position: block.position,
            width: block.width || 200,
            height: block.height || 80,
            config: block.config || {},
            connections: [],
          })) ||
            realWorkflow.actions?.map((action: any, index: number) => ({
              id: `action_${index}`,
              type: action.type,
              position: { x: 250 + index * 250, y: 100 },
              width: 200,
              height: 80,
              config: action.config || {},
              connections: [],
            })) ||
            []) as any[],
          connections: realWorkflow.connections || [],
        }
      : undefined;

  console.log("🔍 Transformed workflow:", {
    hasTransformed: !!transformedRealWorkflow,
    name: transformedRealWorkflow?.name,
    blocks: transformedRealWorkflow?.blocks?.length,
    connections: transformedRealWorkflow?.connections?.length,
    realWorkflowName:
      realWorkflow && typeof realWorkflow !== "string"
        ? realWorkflow.name
        : "N/A",
    realWorkflowBlocks:
      realWorkflow && typeof realWorkflow !== "string"
        ? realWorkflow.blocks?.length
        : "N/A",
    realWorkflowActions:
      realWorkflow && typeof realWorkflow !== "string"
        ? realWorkflow.actions?.length
        : "N/A",
    hasBlocks:
      realWorkflow && typeof realWorkflow !== "string"
        ? !!realWorkflow.blocks
        : false,
    hasActions:
      realWorkflow && typeof realWorkflow !== "string"
        ? !!realWorkflow.actions
        : false,
  });

  // Determine which workflow to edit
  let workflowToEdit;

  console.log("🔍 Workflow loading decision:", {
    isValidConvexId,
    realWorkflow: realWorkflow ? "exists" : "null",
    realWorkflowType: typeof realWorkflow,
    shouldUseRealWorkflow:
      isValidConvexId && realWorkflow && typeof realWorkflow !== "string",
    workflowId,
    realWorkflowId:
      realWorkflow && typeof realWorkflow !== "string"
        ? realWorkflow._id
        : "N/A",
    idsMatch:
      workflowId ===
      (realWorkflow && typeof realWorkflow !== "string"
        ? realWorkflow._id
        : null),
  });

  if (isValidConvexId && realWorkflow && typeof realWorkflow !== "string") {
    // For valid Convex IDs with real data, use the real workflow
    workflowToEdit = transformedRealWorkflow;
    console.log("🔍 Using real workflow data");
  } else if (
    isValidConvexId &&
    (!realWorkflow || typeof realWorkflow === "string")
  ) {
    // For valid Convex IDs but no data yet, show loading state
    workflowToEdit = {
      id: workflowId, // Preserve the original ID for the URL
      name: "Loading...",
      description: "Loading workflow data...",
      enabled: false,
      blocks: [],
      connections: [],
    };
    console.log("🔍 Using loading state");
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
    console.log("🔍 Using new workflow state");
  }

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
