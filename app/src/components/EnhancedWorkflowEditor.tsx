"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ConnectionMode,
  MarkerType,
  NodeTypes,
  BackgroundVariant,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  MessageSquare,
  Mail,
  Clock,
  GitBranch,
  Tag,
  Calendar,
  FileText,
  Settings,
  Play,
  Users,
  BarChart3,
  MessageCircle,
  Save,
  Eye,
  Zap,
  Phone,
  Timer,
  Filter,
  X,
  ArrowLeft,
  Star,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Node data interfaces
interface BaseNodeData {
  label: string;
  type: string;
  config?: any;
  userCount?: number;
  users?: any[];
}

interface TriggerNodeData extends BaseNodeData {
  trigger: 'appointment_booked' | 'appointment_completed' | '6_months_passed' | 'appointment_cancelled' | 'client_added';
  conditions?: any[];
}

interface ActionNodeData extends BaseNodeData {
  action: 'send_sms' | 'send_email';
  message?: string;
  recipient?: string;
}

interface DelayNodeData extends BaseNodeData {
  duration: number;
  unit: 'minutes' | 'hours' | 'days' | 'weeks';
}

interface ConditionNodeData extends BaseNodeData {
  condition: string;
  trueLabel?: string;
  falseLabel?: string;
}

// Custom Node Components
const TriggerNode: React.FC<{ data: TriggerNodeData }> = ({ data }) => (
  <div className="relative">
    {/* User count indicator - positioned outside the node */}
    {data.userCount && data.userCount > 0 && (
      <div 
        className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium shadow-sm z-10 cursor-help"
        title={`${data.userCount} users currently at this step`}
      >
        {data.userCount}
      </div>
    )}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 min-w-[150px] shadow-sm relative">
      
      <div className="flex items-center justify-center mb-2">
        <Zap className="h-5 w-5 text-blue-600" />
      </div>
      <div className="text-center text-sm font-medium text-blue-800">
        {data.label}
      </div>
      <div className="text-xs text-blue-600 text-center mt-1">
        Trigger
      </div>
      
      {/* ReactFlow Handles */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
    </div>
  </div>
);

const ActionNode: React.FC<{ data: ActionNodeData }> = ({ data }) => (
  <div className="relative">
    {/* User count indicator - positioned outside the node */}
    {data.userCount && data.userCount > 0 && (
      <div 
        className="absolute -top-2 -right-2 bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium shadow-sm z-10 cursor-help"
        title={`${data.userCount} users currently at this step`}
      >
        {data.userCount}
      </div>
    )}
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 min-w-[150px] shadow-sm relative">
      
      <div className="flex items-center justify-center mb-2">
        {data.action === 'send_sms' ? (
          <Phone className="h-5 w-5 text-green-600" />
        ) : (
          <Mail className="h-5 w-5 text-green-600" />
        )}
      </div>
      <div className="text-center text-sm font-medium text-green-800">
        {data.label}
      </div>
      <div className="text-xs text-green-600 text-center mt-1">
        Action
      </div>
      
      {/* ReactFlow Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
      />
    </div>
  </div>
);

const DelayNode: React.FC<{ data: DelayNodeData }> = ({ data }) => (
  <div className="relative">
    {/* User count indicator - positioned outside the node */}
    {data.userCount && data.userCount > 0 && (
      <div 
        className="absolute -top-2 -right-2 bg-yellow-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium shadow-sm z-10 cursor-help"
        title={`${data.userCount} users currently waiting at this delay`}
      >
        {data.userCount}
      </div>
    )}
    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3 min-w-[150px] shadow-sm relative">
      
      <div className="flex items-center justify-center mb-2">
        <Timer className="h-5 w-5 text-yellow-600" />
      </div>
      <div className="text-center text-sm font-medium text-yellow-800">
        {data.label}
      </div>
      <div className="text-xs text-yellow-600 text-center mt-1">
        {data.duration} {data.unit}
      </div>
      
      {/* ReactFlow Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-yellow-500 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-yellow-500 !border-2 !border-white"
      />
    </div>
  </div>
);

const ConditionNode: React.FC<{ data: ConditionNodeData }> = ({ data }) => (
  <div className="relative">
    {/* User count indicator - positioned outside the node */}
    {data.userCount && data.userCount > 0 && (
      <div 
        className="absolute -top-2 -right-2 bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium shadow-sm z-10 cursor-help"
        title={`${data.userCount} users currently at this condition check`}
      >
        {data.userCount}
      </div>
    )}
    <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3 min-w-[150px] shadow-sm relative">
      
      <div className="flex items-center justify-center mb-2">
        <Filter className="h-5 w-5 text-purple-600" />
      </div>
      <div className="text-center text-sm font-medium text-purple-800">
        {data.label}
      </div>
      <div className="text-xs text-purple-600 text-center mt-1">
        Condition
      </div>
      
      {/* ReactFlow Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ top: '25%' }}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ top: '75%' }}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white"
      />
    </div>
  </div>
);

// Node types
const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  delay: DelayNode,
  condition: ConditionNode,
};

interface EnhancedWorkflowEditorProps {
  workflowId?: string;
  orgId: string;
}

// Internal component that uses ReactFlow hooks
function WorkflowEditorInner({
  workflowId,
  orgId,
}: EnhancedWorkflowEditorProps) {
  const { user } = useAuth();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [workflowName, setWorkflowName] = useState("Untitled Workflow");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // ReactFlow instance
  const { screenToFlowPosition } = useReactFlow();

  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Track changes for unsaved warning
  const markAsChanged = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  // Custom onNodesChange to track changes
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    markAsChanged();
  }, [onNodesChange, markAsChanged]);

  // Custom onEdgesChange to track changes
  const handleEdgesChange = useCallback((changes: any) => {
    onEdgesChange(changes);
    markAsChanged();
  }, [onEdgesChange, markAsChanged]);

  // Load existing workflow if editing
  const existingWorkflow = useQuery(
    api.workflows.get,
    workflowId && workflowId !== "new" ? { id: workflowId as any } : "skip"
  );

  // Get user tracking data for the workflow
  const userTracking = useQuery(
    api.workflows.getWorkflowUserTracking,
    workflowId && workflowId !== "new" ? { workflowId: workflowId as any } : "skip"
  );

  // Mutations
  const createWorkflow = useMutation(api.workflows.create);
  const updateWorkflow = useMutation(api.workflows.update);

  // Load workflow data
  useEffect(() => {
    if (existingWorkflow) {
      setWorkflowName(existingWorkflow.name);
      setWorkflowDescription(existingWorkflow.description || "");
      
      // Convert blocks to ReactFlow nodes
      if (existingWorkflow.blocks) {
        const flowNodes = existingWorkflow.blocks.map((block: any) => ({
          id: block.id,
          type: block.type,
          position: block.position,
          data: {
            label: getNodeLabel(block.type, block.config),
            type: block.type,
            config: block.config,
            userCount: userTracking?.[block.id]?.userCount || 0,
            users: userTracking?.[block.id]?.users || [],
          },
        }));
        setNodes(flowNodes);
      }

      // Convert connections to ReactFlow edges
      if (existingWorkflow.connections) {
        const flowEdges = existingWorkflow.connections.map((conn: any) => ({
          id: conn.id,
          source: conn.from,
          target: conn.to,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        }));
        setEdges(flowEdges);
      }
    }
  }, [existingWorkflow, userTracking, setNodes, setEdges]);

  // Helper function to get node labels
  const getNodeLabel = (type: string, config: any) => {
    switch (type) {
      case 'trigger':
        return config?.trigger || 'Trigger';
      case 'action':
        return config?.action === 'send_sms' ? 'Send SMS' : 'Send Email';
      case 'delay':
        return `Wait ${config?.duration || 5} ${config?.unit || 'minutes'}`;
      case 'condition':
        return config?.condition || 'If/Then';
      default:
        return 'Unknown';
    }
  };

  // Handle edge connections
  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      setEdges((eds) => addEdge(edge, eds));
      markAsChanged();
    },
    [setEdges, markAsChanged]
  );

  // Handle node selection
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Handle drag over for drag and drop
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop for drag and drop
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = (event.target as Element).getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const nodeData = JSON.parse(type);
      const position = screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${nodeData.type}-${Date.now()}`,
        type: nodeData.type,
        position,
        data: {
          label: nodeData.label,
          type: nodeData.type,
          config: getDefaultConfig(nodeData.type),
          userCount: 0, // Will be updated when real tracking is implemented
          users: [],
        },
      };

      setNodes((nds) => nds.concat(newNode));
      markAsChanged();
    },
    [screenToFlowPosition, setNodes, markAsChanged]
  );

  // Get default config for node type
  const getDefaultConfig = (type: string) => {
    switch (type) {
      case 'delay':
        return { duration: 5, unit: 'minutes' };
      case 'action':
        return { action: 'send_sms', message: 'Hello! This is an automated message.' };
      case 'trigger':
        return { trigger: 'appointment_booked' };
      case 'condition':
        return { condition: 'client_age_over_18' };
      default:
        return {};
    }
  };

  // Add new node from sidebar (fallback for click)
  const addNode = useCallback(
    (type: string, label: string) => {
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position: {
          x: Math.random() * 300 + 100,
          y: Math.random() * 300 + 100,
        },
        data: {
          label,
          type,
          config: getDefaultConfig(type),
          userCount: 0, // Will be updated when real tracking is implemented
          users: [],
        },
      };
      setNodes((nds) => [...nds, newNode]);
      markAsChanged();
    },
    [setNodes, markAsChanged]
  );

  // Handle back navigation with unsaved changes warning
  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        window.location.href = '/workflows';
      }
    } else {
      window.location.href = '/workflows';
    }
  }, [hasUnsavedChanges]);

  // Save workflow
  const handleSave = useCallback(async () => {
    if (!user || !orgId) return;

    // Convert ReactFlow nodes back to blocks
    const blocks = nodes.map((node) => ({
      id: node.id,
      type: node.type || 'unknown',
      position: node.position,
      width: 200,
      height: 100,
      config: node.data?.config || {},
    }));

    // Convert ReactFlow edges back to connections
    const connections = edges.map((edge) => ({
      id: edge.id,
      from: edge.source,
      to: edge.target,
      fromPort: 'out',
      toPort: 'in',
    }));

    try {
      if (workflowId && workflowId !== "new") {
        await updateWorkflow({
          id: workflowId as any,
          name: workflowName,
          description: workflowDescription,
          blocks,
          connections,
        });
        setHasUnsavedChanges(false);
        alert('Workflow saved successfully!');
      } else {
        const newWorkflowId = await createWorkflow({
          orgId: orgId as any,
          name: workflowName,
          description: workflowDescription,
          trigger: 'appointment_completed',
          conditions: [],
          actions: [],
          blocks,
          connections,
          isActive: true,
        });
        setHasUnsavedChanges(false);
        alert('Workflow created successfully!');
        // Redirect to the new workflow URL
        window.location.href = `/workflow-editor?id=${newWorkflowId}`;
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Error saving workflow');
    }
  }, [
    user,
    orgId,
    workflowId,
    workflowName,
    workflowDescription,
    nodes,
    edges,
    createWorkflow,
    updateWorkflow,
  ]);

  // Node sidebar categories
  const nodeCategories = [
    {
      title: "Triggers",
      nodes: [
        {
          type: "trigger",
          label: "Appointment Booked",
          icon: Calendar,
          description: "When a new appointment is scheduled",
        },
        {
          type: "trigger",
          label: "Appointment Completed",
          icon: Calendar,
          description: "When an appointment is finished",
        },
        {
          type: "trigger",
          label: "Appointment Cancelled", 
          icon: X,
          description: "When an appointment is cancelled",
        },
        {
          type: "trigger",
          label: "6 Months Passed",
          icon: Clock,
          description: "Time-based trigger for follow-ups",
        },
        {
          type: "trigger",
          label: "Client Added",
          icon: UserPlus,
          description: "When a new client is added",
        },
      ],
    },
    {
      title: "Actions",
      nodes: [
        {
          type: "action",
          label: "Send SMS",
          icon: Phone,
          description: "Send text message to client",
        },
        {
          type: "action",
          label: "Send Email", 
          icon: Mail,
          description: "Send email to client",
        },
        {
          type: "action",
          label: "Google Review Request",
          icon: Star,
          description: "Request Google review from client",
        },
        {
          type: "action",
          label: "Update Client Status",
          icon: Tag,
          description: "Change client status or add tags",
        },
        {
          type: "action",
          label: "Create Follow-up",
          icon: Calendar,
          description: "Schedule follow-up appointment",
        },
      ],
    },
    {
      title: "Logic & Timing",
      nodes: [
        {
          type: "delay",
          label: "Delay",
          icon: Timer,
          description: "Wait for a specified time",
        },
        {
          type: "condition",
          label: "If/Then",
          icon: Filter,
          description: "Branch based on conditions",
        },
        {
          type: "condition",
          label: "Client Age Check",
          icon: Users,
          description: "Branch based on client age",
        },
        {
          type: "condition",
          label: "Appointment Type",
          icon: FileText,
          description: "Branch based on appointment type",
        },
        {
          type: "condition",
          label: "Time Since Last Visit",
          icon: Clock,
          description: "Branch based on time elapsed",
        },
      ],
    },
    {
      title: "Advanced Actions",
      nodes: [
        {
          type: "action",
          label: "Add Client Tag",
          icon: Tag,
          description: "Add a tag to the client",
        },
        {
          type: "action",
          label: "Remove Client Tag", 
          icon: X,
          description: "Remove a tag from the client",
        },
        {
          type: "action",
          label: "Create Task",
          icon: FileText,
          description: "Create a task or reminder",
        },
        {
          type: "action",
          label: "Update Client Notes",
          icon: FileText,
          description: "Add notes to client profile",
        },
        {
          type: "action",
          label: "Schedule Callback",
          icon: Phone,
          description: "Schedule a callback task",
        },
      ],
    },
  ];

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Node Sidebar */}
      <div
        className={`bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarOpen ? "w-80" : "w-0"
        } overflow-hidden`}
      >
        <div className="p-4 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Workflow Nodes</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Node Categories */}
          {nodeCategories.map((category) => (
            <div key={category.title} className="mb-6">
              <h4 className="font-medium text-sm text-gray-700 mb-2">
                {category.title}
              </h4>
              <div className="space-y-2">
                {category.nodes.map((node) => (
                  <div
                    key={`${node.type}-${node.label}`}
                    className="flex items-center p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        "application/reactflow",
                        JSON.stringify({ type: node.type, label: node.label })
                      );
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={() => addNode(node.type, node.label)}
                  >
                    <node.icon className="h-4 w-4 mr-2 text-gray-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{node.label}</div>
                      <div className="text-xs text-gray-500">
                        {node.description}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 ml-2">
                      Drag or Click
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Nodes
              </Button>
            )}
            
            <div className="flex flex-col">
              <Input
                value={workflowName}
                onChange={(e) => {
                  setWorkflowName(e.target.value);
                  markAsChanged();
                }}
                className="font-semibold text-lg border-none p-0 h-auto"
                placeholder="Workflow Name"
              />
              <Input
                value={workflowDescription}
                onChange={(e) => {
                  setWorkflowDescription(e.target.value);
                  markAsChanged();
                }}
                className="text-sm text-gray-600 border-none p-0 h-auto mt-1"
                placeholder="Description"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                Unsaved Changes
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={() => alert('Preview functionality coming soon!')}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSave} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* ReactFlow Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            className="bg-gray-50"
            panOnScroll={true}
            selectionOnDrag={true}
            panOnDrag={[1, 2]}
            zoomOnScroll={true}
            zoomOnPinch={true}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>

      {/* Properties Panel */}
      {selectedNode && (
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Node Properties</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedNode(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Node Type</Label>
              <div className="text-sm text-gray-600 capitalize">
                {selectedNode.type}
              </div>
            </div>

            <div>
              <Label>Label</Label>
              <Input
                value={selectedNode.data?.label || ""}
                onChange={(e) => {
                  setNodes((nds) =>
                    nds.map((n) =>
                      n.id === selectedNode.id
                        ? {
                            ...n,
                            data: { ...n.data, label: e.target.value },
                          }
                        : n
                    )
                  );
                }}
              />
            </div>

            {/* Type-specific properties */}
            {selectedNode.type === "delay" && (
              <>
                <div>
                  <Label>Duration</Label>
                  <Input
                    type="number"
                    value={selectedNode.data?.config?.duration || 5}
                    onChange={(e) => {
                      setNodes((nds) =>
                        nds.map((n) =>
                          n.id === selectedNode.id
                            ? {
                                ...n,
                                data: {
                                  ...n.data,
                                  config: {
                                    ...n.data.config,
                                    duration: parseInt(e.target.value),
                                  },
                                },
                              }
                            : n
                        )
                      );
                    }}
                  />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select
                    value={selectedNode.data?.config?.unit || "minutes"}
                    onValueChange={(value) => {
                      setNodes((nds) =>
                        nds.map((n) =>
                          n.id === selectedNode.id
                            ? {
                                ...n,
                                data: {
                                  ...n.data,
                                  config: {
                                    ...n.data.config,
                                    unit: value,
                                  },
                                },
                              }
                            : n
                        )
                      );
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {selectedNode.type === "action" && (
              <>
                <div>
                  <Label>Action Type</Label>
                  <Select
                    value={selectedNode.data?.config?.action || "send_sms"}
                    onValueChange={(value) => {
                      setNodes((nds) =>
                        nds.map((n) =>
                          n.id === selectedNode.id
                            ? {
                                ...n,
                                data: {
                                  ...n.data,
                                  config: {
                                    ...n.data.config,
                                    action: value,
                                  },
                                },
                              }
                            : n
                        )
                      );
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="send_sms">Send SMS</SelectItem>
                      <SelectItem value="send_email">Send Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea
                    value={selectedNode.data?.config?.message || ""}
                    onChange={(e) => {
                      setNodes((nds) =>
                        nds.map((n) =>
                          n.id === selectedNode.id
                            ? {
                                ...n,
                                data: {
                                  ...n.data,
                                  config: {
                                    ...n.data.config,
                                    message: e.target.value,
                                  },
                                },
                              }
                            : n
                        )
                      );
                    }}
                    placeholder="Enter your message..."
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Main component wrapped with ReactFlowProvider
export default function EnhancedWorkflowEditor(props: EnhancedWorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <WorkflowEditorInner {...props} />
    </ReactFlowProvider>
  );
}