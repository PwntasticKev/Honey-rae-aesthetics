"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ReactFlow, 
  ReactFlowProvider, 
  Node, 
  Edge, 
  addEdge, 
  Connection, 
  useNodesState, 
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
  NodeTypes
} from "@xyflow/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import "@xyflow/react/dist/style.css";
import { InferSelectModel } from "drizzle-orm";
import { workflows as workflowSchema } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { 
  Play, 
  Square, 
  Mail, 
  MessageSquare, 
  Clock, 
  GitBranch, 
  Zap,
  Plus
} from "lucide-react";
import { TriggerNode, ActionNode, DelayNode, ConditionNode } from "@/components/workflow-nodes";

type Workflow = InferSelectModel<typeof workflowSchema>;

async function fetchWorkflow(
  workflowId: string,
): Promise<{ workflow: Workflow }> {
  const res = await fetch(`/api/workflows/${workflowId}`);
  if (!res.ok) {
    throw new Error("Network response was not ok");
  }
  return res.json();
}

async function updateWorkflow({
  id,
  data,
}: {
  id: string;
  data: Partial<Workflow>;
}): Promise<Workflow> {
  const res = await fetch(`/api/workflows/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("Network response was not ok");
  }
  return res.json();
}

async function createWorkflow(data: {
  orgId: number;
  templateId?: string;
  name?: string;
  description?: string;
}): Promise<{ workflow: Workflow }> {
  const res = await fetch("/api/workflows", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("Network response was not ok");
  }
  return res.json();
}

interface EnhancedWorkflowEditorProps {
  workflowId?: string;
  orgId: number;
  templateId?: string; // Add templateId to props
}

export default function EnhancedWorkflowEditor({
  workflowId,
  orgId,
  templateId,
}: EnhancedWorkflowEditorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isCreatingFromTemplate, setIsCreatingFromTemplate] =
    useState(!!templateId);

  // Mutation for creating a workflow (used for templates)
  const createMutation = useMutation({
    mutationFn: createWorkflow,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workflows", orgId] });
      router.replace(`/workflow-editor?id=${data.workflow.id}`);
      setIsCreatingFromTemplate(false);
    },
    onError: () => {
      alert("Failed to create workflow from template.");
      router.push("/workflows");
    },
  });

  useEffect(() => {
    if (templateId) {
      createMutation.mutate({ orgId, templateId });
    }
  }, [templateId, orgId]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["workflow", workflowId],
    queryFn: () => fetchWorkflow(workflowId!),
    enabled: !!workflowId,
  });

  const mutation = useMutation({
    mutationFn: updateWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows", orgId] });
      queryClient.invalidateQueries({ queryKey: ["workflow", workflowId] });
      // Add a success toast here
    },
    onError: () => {
      // Add an error toast here
    },
  });

  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);

  // React Flow state - use useMemo to prevent recreating arrays on every render
  const initialNodes: Node[] = useMemo(() => [
    {
      id: 'start',
      type: 'trigger',
      position: { x: 250, y: 50 },
      data: { label: 'Workflow Start', trigger: 'appointment_completed', config: {} },
    },
    {
      id: 'action-1',
      type: 'action',
      position: { x: 250, y: 200 },
      data: { label: 'Send Welcome Email', action: 'send_email', config: { subject: 'Welcome!', message: 'Thank you for your visit!' } },
    },
    {
      id: 'delay-1',
      type: 'delay',
      position: { x: 250, y: 350 },
      data: { label: 'Wait 1 Day', config: { duration: 1, unit: 'days' } },
    },
  ], []);

  const initialEdges: Edge[] = useMemo(() => [
    { id: 'e1-2', source: 'start', target: 'action-1', animated: true },
    { id: 'e2-3', source: 'action-1', target: 'delay-1', animated: true },
  ], []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Handle node data changes from child components
  const handleNodeDataChange = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: newData } : node
      )
    );
  }, [setNodes]);

  // Define custom node types with callback
  const nodeTypes: NodeTypes = useMemo(() => ({
    trigger: (props: any) => <TriggerNode {...props} onNodeDataChange={handleNodeDataChange} />,
    action: (props: any) => <ActionNode {...props} onNodeDataChange={handleNodeDataChange} />,
    delay: (props: any) => <DelayNode {...props} onNodeDataChange={handleNodeDataChange} />,
    condition: (props: any) => <ConditionNode {...props} onNodeDataChange={handleNodeDataChange} />,
  }), [handleNodeDataChange]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  useEffect(() => {
    if (data?.workflow) {
      setWorkflowName(data.workflow.name || "New Workflow");
      setWorkflowDescription(data.workflow.description || "");
      setIsEnabled(data.workflow.enabled || false);
      
      // Load workflow nodes and edges - check both flowData and blocks/connections
      if (data.workflow.flowData) {
        try {
          const flowData = JSON.parse(data.workflow.flowData);
          if (flowData.nodes) setNodes(flowData.nodes);
          if (flowData.edges) setEdges(flowData.edges);
        } catch (e) {
          console.error('Failed to parse flow data:', e);
        }
      } else if (data.workflow.blocks || data.workflow.connections) {
        // Convert from database format to React Flow format
        const convertedNodes = convertBlocksToNodes(data.workflow.blocks || []);
        const convertedEdges = convertConnectionsToEdges(data.workflow.connections || []);
        setNodes(convertedNodes);
        setEdges(convertedEdges);
      }
    } else if (!workflowId) {
      // New workflow - set initial data and nodes
      setWorkflowName("New Workflow");
      setWorkflowDescription("");
      setIsEnabled(true);
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, [data, workflowId, setNodes, setEdges]);

  const handleSave = () => {
    if (!workflowId) return;
    const flowData = {
      nodes,
      edges,
    };
    
    mutation.mutate({
      id: workflowId,
      data: {
        name: workflowName,
        description: workflowDescription,
        enabled: isEnabled,
        flowData: JSON.stringify(flowData),
      },
    });
  };

  const addNode = (nodeType: string) => {
    const baseData = {
      trigger: { 
        label: 'New Trigger', 
        trigger: 'appointment_completed', 
        config: {} 
      },
      action: { 
        label: 'New Action', 
        action: 'send_email', 
        config: { 
          subject: 'New Message', 
          message: 'Your message here' 
        } 
      },
      condition: { 
        label: 'New Condition', 
        config: {
          type: 'client_tag',
          value: ''
        } 
      },
      delay: { 
        label: 'New Delay', 
        config: { 
          duration: 1, 
          unit: 'hours' 
        } 
      },
    };

    const newNode = {
      id: `node-${Date.now()}`,
      type: nodeType,
      position: { 
        x: Math.random() * 300 + 100, 
        y: Math.random() * 300 + 100 
      },
      data: baseData[nodeType as keyof typeof baseData] || { label: 'New Node' },
    };
    
    setNodes((nds) => [...nds, newNode]);
  };

  if (isCreatingFromTemplate) {
    return <div>Creating workflow from template...</div>;
  }

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading workflow.</div>;

  // Convert template blocks to React Flow nodes
  const convertBlocksToNodes = (blocks: any[]): Node[] => {
    return blocks.map((block) => ({
      id: block.id,
      type: block.type,
      position: block.position || { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: block.data?.label || block.type || 'Node',
        ...block.data,
        config: block.config || block.data?.config || {}
      },
    }));
  };

  // Convert template connections to React Flow edges
  const convertConnectionsToEdges = (connections: any[]): Edge[] => {
    return connections.map((connection) => ({
      id: connection.id,
      source: connection.source,
      target: connection.target,
      animated: true
    }));
  };

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-full">
        <header className="p-4 border-b bg-white">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <Input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="text-lg font-bold"
              />
              <Textarea
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="Workflow description"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="workflow-enabled">Enabled</Label>
                <Switch
                  id="workflow-enabled"
                  checked={isEnabled}
                  onCheckedChange={setIsEnabled}
                />
              </div>
              <Button onClick={handleSave} disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </header>
        <div className="flex-grow bg-gray-50 relative overflow-hidden" style={{ height: '600px' }}>
          {/* Debug info */}
          <div className="absolute top-2 left-2 bg-yellow-100 p-2 rounded text-xs z-50">
            Nodes: {nodes.length} | Edges: {edges.length}
          </div>
          
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
            style={{ width: '100%', height: '100%' }}
          >
            <Controls />
            <MiniMap 
              nodeStrokeColor="#666"
              nodeColor="#fff"
              nodeBorderRadius={2}
            />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            
            {/* Node Palette */}
            <Panel position="top-left" className="bg-white border rounded-lg shadow-lg p-4">
              <h3 className="font-semibold mb-3 text-sm">Add Nodes</h3>
              <div className="flex flex-col space-y-2">
                <Button
                  size="sm"
                  onClick={() => addNode('trigger')}
                  className="bg-green-500 hover:bg-green-600 text-white text-xs"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Trigger
                </Button>
                <Button
                  size="sm"
                  onClick={() => addNode('action')}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Action
                </Button>
                <Button
                  size="sm"
                  onClick={() => addNode('condition')}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs"
                >
                  <GitBranch className="w-3 h-3 mr-1" />
                  Condition
                </Button>
                <Button
                  size="sm"
                  onClick={() => addNode('delay')}
                  className="bg-purple-500 hover:bg-purple-600 text-white text-xs"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Delay
                </Button>
              </div>
            </Panel>

            {/* Instructions Panel */}
            <Panel position="top-right" className="bg-white border rounded-lg shadow-lg p-4 max-w-xs">
              <h3 className="font-semibold mb-2 text-sm">Instructions</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Click "Node" button to add nodes</li>
                <li>• Drag nodes to reposition</li>
                <li>• Connect nodes by dragging from handles</li>
                <li>• Use the minimap to navigate</li>
                <li>• Save your workflow when ready</li>
              </ul>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
