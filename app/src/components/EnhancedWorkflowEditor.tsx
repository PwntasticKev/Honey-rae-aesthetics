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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Send,
  CheckCircle,
  AlertCircle,
  Search,
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
  trigger:
    | "appointment_booked"
    | "appointment_completed"
    | "6_months_passed"
    | "appointment_cancelled"
    | "client_added";
  conditions?: any[];
}

interface ActionNodeData extends BaseNodeData {
  action: "send_sms" | "send_email";
  message?: string;
  recipient?: string;
}

interface DelayNodeData extends BaseNodeData {
  duration: number;
  unit: "minutes" | "hours" | "days" | "weeks";
}

interface ConditionNodeData extends BaseNodeData {
  condition: string;
  trueLabel?: string;
  falseLabel?: string;
}

// Custom Edge Component with delete button and flowing animation
const DeletableEdge: React.FC<any> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  style,
  data,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate midpoint for delete button positioning
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  // Calculate path length for animation
  const pathLength = Math.sqrt(
    Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2),
  );

  return (
    <>
      {/* Main edge path */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={`M${sourceX},${sourceY} L${targetX},${targetY}`}
        markerEnd={markerEnd}
        style={{
          strokeWidth: 2,
          stroke: isHovered ? "#ef4444" : "#6b7280",
          cursor: "pointer",
          ...style,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Animated flowing dots */}
      <path
        d={`M${sourceX},${sourceY} L${targetX},${targetY}`}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="3"
        strokeDasharray="8 12"
        strokeLinecap="round"
        className="flowing-edge"
        style={{
          opacity: 0.7,
          pointerEvents: "none",
          animationDuration: "3s",
        }}
      />

      {/* Delete button - only show on hover */}
      {isHovered && (
        <foreignObject
          width={24}
          height={24}
          x={midX - 12}
          y={midY - 12}
          className="overflow-visible"
        >
          <button
            className="w-6 h-6 bg-white border-2 border-red-500 text-red-500 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors shadow-md"
            onClick={() => data?.onEdgeDelete?.(id)}
            title="Delete connection"
          >
            <X className="w-3 h-3" />
          </button>
        </foreignObject>
      )}
    </>
  );
};

// Custom Node Components with context
const TriggerNode: React.FC<{
  data: TriggerNodeData & {
    onDetailsClick?: (data: any) => void;
    onPlusClick?: (event: React.MouseEvent, nodeId: string) => void;
    nodeId?: string;
    errors?: string[];
  };
}> = ({ data }) => (
  <div className="relative">
    {/* User count indicator - merged into top of node */}
    <div
      className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-2 py-1 text-white rounded-t-lg text-xs font-medium shadow-sm z-10 cursor-pointer transition-all duration-200 hover:scale-105 ${
        data.userCount && data.userCount > 0 ? "bg-blue-600" : "bg-gray-400"
      }`}
      title={`${data.userCount || 0} users currently at this step`}
      onClick={() => {
        data.onDetailsClick?.(data);
      }}
    >
      <div className="flex items-center gap-1">
        <Users className="w-3 h-3" />
        <span>{data.userCount || 0}</span>
      </div>
    </div>
    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 min-w-[150px] shadow-sm relative transition-all duration-200 hover:shadow-md hover:scale-105">
      <div className="flex items-center justify-center mb-2">
        <Zap className="h-5 w-5 text-blue-600" />
      </div>
      <div className="text-center text-sm font-medium text-blue-800">
        {data.label}
      </div>
      <div className="text-xs text-blue-600 text-center mt-1">Trigger</div>

      {/* Validation Errors */}
      {data.errors && data.errors.length > 0 && (
        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700">
          {data.errors.map((error, index) => (
            <div key={index} className="flex items-center">
              <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
              {error}
            </div>
          ))}
        </div>
      )}

      {/* ReactFlow Handles - Now top input (hidden) and bottom output */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !opacity-0"
        style={{ left: "50%" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
        style={{ left: "50%" }}
      />

      {/* Plus button for adding connected nodes */}
      <button
        className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-md z-20"
        onClick={(e) => data.onPlusClick?.(e, data.nodeId || "")}
        title="Add node"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  </div>
);

const ActionNode: React.FC<{
  data: ActionNodeData & {
    onDetailsClick?: (data: any) => void;
    onPlusClick?: (event: React.MouseEvent, nodeId: string) => void;
    nodeId?: string;
    errors?: string[];
  };
}> = ({ data }) => (
  <div className="relative">
    {/* User count indicator - merged into top of node */}
    <div
      className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-2 py-1 text-white rounded-t-lg text-xs font-medium shadow-sm z-10 cursor-pointer transition-all duration-200 hover:scale-105 ${
        data.userCount && data.userCount > 0 ? "bg-green-600" : "bg-gray-400"
      }`}
      title={`${data.userCount || 0} users currently at this step`}
      onClick={() => {
        data.onDetailsClick?.(data);
      }}
    >
      <div className="flex items-center gap-1">
        <Users className="w-3 h-3" />
        <span>{data.userCount || 0}</span>
      </div>
    </div>
    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 min-w-[150px] shadow-sm relative transition-all duration-200 hover:shadow-md hover:scale-105">
      <div className="flex items-center justify-center mb-2">
        {data.action === "send_sms" ? (
          <Phone className="h-5 w-5 text-green-600" />
        ) : (
          <Mail className="h-5 w-5 text-green-600" />
        )}
      </div>
      <div className="text-center text-sm font-medium text-green-800">
        {data.label}
      </div>
      <div className="text-xs text-green-600 text-center mt-1">Action</div>

      {/* Validation Errors */}
      {data.errors && data.errors.length > 0 && (
        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700">
          {data.errors.map((error, index) => (
            <div key={index} className="flex items-center">
              <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
              {error}
            </div>
          ))}
        </div>
      )}

      {/* ReactFlow Handles - Now top input and bottom output */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
        style={{ left: "50%" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
        style={{ left: "50%" }}
      />

      {/* Plus button for adding connected nodes */}
      <button
        className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors shadow-md z-20"
        onClick={(e) => data.onPlusClick?.(e, data.nodeId || "")}
        title="Add node"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  </div>
);

const DelayNode: React.FC<{
  data: DelayNodeData & {
    onDetailsClick?: (data: any) => void;
    onPlusClick?: (event: React.MouseEvent, nodeId: string) => void;
    nodeId?: string;
    errors?: string[];
  };
}> = ({ data }) => (
  <div className="relative">
    {/* User count indicator - merged into top of node */}
    <div
      className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-2 py-1 text-white rounded-t-lg text-xs font-medium shadow-sm z-10 cursor-pointer transition-all duration-200 hover:scale-105 ${
        data.userCount && data.userCount > 0 ? "bg-yellow-600" : "bg-gray-400"
      }`}
      title={`${data.userCount || 0} users currently waiting at this delay`}
      onClick={() => {
        data.onDetailsClick?.(data);
      }}
    >
      <div className="flex items-center gap-1">
        <Users className="w-3 h-3" />
        <span>{data.userCount || 0}</span>
      </div>
    </div>
    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3 min-w-[150px] shadow-sm relative transition-all duration-200 hover:shadow-md hover:scale-105">
      <div className="flex items-center justify-center mb-2">
        <Timer className="h-5 w-5 text-yellow-600" />
      </div>
      <div className="text-center text-sm font-medium text-yellow-800">
        {data.label}
      </div>
      <div className="text-xs text-yellow-600 text-center mt-1">
        {data.duration} {data.unit}
      </div>

      {/* Validation Errors */}
      {data.errors && data.errors.length > 0 && (
        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700">
          {data.errors.map((error, index) => (
            <div key={index} className="flex items-center">
              <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
              {error}
            </div>
          ))}
        </div>
      )}

      {/* ReactFlow Handles - Now top input and bottom output */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-yellow-500 !border-2 !border-white"
        style={{ left: "50%" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-yellow-500 !border-2 !border-white"
        style={{ left: "50%" }}
      />

      {/* Plus button for adding connected nodes */}
      <button
        className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center hover:bg-yellow-600 transition-colors shadow-md z-20"
        onClick={(e) => data.onPlusClick?.(e, data.nodeId || "")}
        title="Add node"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  </div>
);

const ConditionNode: React.FC<{
  data: ConditionNodeData & {
    onDetailsClick?: (data: any) => void;
    onPlusClick?: (event: React.MouseEvent, nodeId: string) => void;
    nodeId?: string;
    errors?: string[];
  };
}> = ({ data }) => (
  <div className="relative">
    {/* User count indicator - merged into top of node */}
    <div
      className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-2 py-1 text-white rounded-t-lg text-xs font-medium shadow-sm z-10 cursor-pointer transition-all duration-200 hover:scale-105 ${
        data.userCount && data.userCount > 0 ? "bg-purple-600" : "bg-gray-400"
      }`}
      title={`${data.userCount || 0} users currently at this condition check`}
      onClick={() => {
        data.onDetailsClick?.(data);
      }}
    >
      <div className="flex items-center gap-1">
        <Users className="w-3 h-3" />
        <span>{data.userCount || 0}</span>
      </div>
    </div>
    <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3 min-w-[150px] shadow-sm relative transition-all duration-200 hover:shadow-md hover:scale-105">
      <div className="flex items-center justify-center mb-2">
        <Filter className="h-5 w-5 text-purple-600" />
      </div>
      <div className="text-center text-sm font-medium text-purple-800">
        {data.label}
      </div>
      <div className="text-xs text-purple-600 text-center mt-1">Condition</div>

      {/* Validation Errors */}
      {data.errors && data.errors.length > 0 && (
        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700">
          {data.errors.map((error, index) => (
            <div key={index} className="flex items-center">
              <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
              {error}
            </div>
          ))}
        </div>
      )}

      {/* ReactFlow Handles - Top input, two bottom outputs */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white"
        style={{ left: "50%" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: "25%" }}
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: "75%" }}
        className="!w-3 !h-3 !bg-red-500 !border-2 !border-white"
      />

      {/* Plus buttons for adding connected nodes - one for each output */}
      <button
        className="absolute -bottom-6 left-1/4 transform -translate-x-1/2 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors shadow-md z-20"
        onClick={(e) => data.onPlusClick?.(e, data.nodeId || "")}
        title="Add node (True path)"
      >
        <Plus className="w-3 h-3" />
      </button>

      <button
        className="absolute -bottom-6 left-3/4 transform -translate-x-1/2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md z-20"
        onClick={(e) => data.onPlusClick?.(e, data.nodeId || "")}
        title="Add node (False path)"
      >
        <Plus className="w-3 h-3" />
      </button>
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

// Edge types
const edgeTypes = {
  deletable: DeletableEdge,
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

  // Track initial state for better change detection
  const [initialState, setInitialState] = useState<{
    name: string;
    description: string;
    nodes: Node[];
    edges: Edge[];
  } | null>(null);

  // ReactFlow instance
  const { screenToFlowPosition } = useReactFlow();

  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Right panel state for node details
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [selectedNodeForDetails, setSelectedNodeForDetails] =
    useState<Node | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [workflowSearch, setWorkflowSearch] = useState("");
  const [nodePopupOpen, setNodePopupOpen] = useState(false);
  const [nodePopupPosition, setNodePopupPosition] = useState({ x: 0, y: 0 });
  const [sourceNodeId, setSourceNodeId] = useState<string | null>(null);
  const [nodeSearch, setNodeSearch] = useState("");
  const [deletedEdges, setDeletedEdges] = useState<Edge[]>([]);
  const [showUndoDelete, setShowUndoDelete] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    [nodeId: string]: string[];
  }>({});

  // Compare current state with initial state to detect real changes

  // Update hasUnsavedChanges based on real changes
  useEffect(() => {
    if (!initialState) {
      setHasUnsavedChanges(false);
      return;
    }

    // Compare workflow metadata
    if (
      workflowName !== initialState.name ||
      workflowDescription !== initialState.description
    ) {
      setHasUnsavedChanges(true);
      return;
    }

    // Compare nodes length
    if (nodes.length !== initialState.nodes.length) {
      setHasUnsavedChanges(true);
      return;
    }

    // Compare node data
    for (let i = 0; i < nodes.length; i++) {
      const currentNode = nodes[i];
      const initialNode = initialState.nodes.find(
        (n) => n.id === currentNode.id,
      );
      if (
        !initialNode ||
        currentNode.type !== initialNode.type ||
        JSON.stringify(currentNode.data) !== JSON.stringify(initialNode.data)
      ) {
        setHasUnsavedChanges(true);
        return;
      }
    }

    // Compare edges
    if (edges.length !== initialState.edges.length) {
      setHasUnsavedChanges(true);
      return;
    }

    for (let i = 0; i < edges.length; i++) {
      const currentEdge = edges[i];
      const initialEdge = initialState.edges.find(
        (e) => e.id === currentEdge.id,
      );
      if (
        !initialEdge ||
        currentEdge.source !== initialEdge.source ||
        currentEdge.target !== initialEdge.target
      ) {
        setHasUnsavedChanges(true);
        return;
      }
    }

    setHasUnsavedChanges(false);
  }, [workflowName, workflowDescription, nodes, edges, initialState]);

  // Auto-save timer - save every 30 seconds if there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges || autoSaveStatus === "saving") return;

    const autoSaveTimer = setInterval(() => {
      if (hasUnsavedChanges && autoSaveStatus !== "saving") {
        autoSave();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveTimer);
  }, [hasUnsavedChanges, autoSaveStatus]); // Removed autoSave from dependencies to fix initialization issue

  // Handle opening right panel for node details
  const handleNodeDetailsClick = useCallback(
    (nodeData: any) => {
      // Find the full node data
      const node = nodes.find((n) => n.data === nodeData);
      if (node) {
        setSelectedNodeForDetails(node);
        setRightPanelOpen(true);
      }
    },
    [nodes],
  );

  // Custom onNodesChange with change tracking handled by useEffect
  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes);
    },
    [onNodesChange],
  );

  // Custom onEdgesChange with change tracking handled by useEffect
  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes);
    },
    [onEdgesChange],
  );

  // Load existing workflow if editing
  const existingWorkflow = useQuery(
    api.workflows.get,
    workflowId && workflowId !== "new" ? { id: workflowId as any } : "skip",
  );

  // Get user tracking data for the workflow
  const userTracking = useQuery(
    api.workflows.getWorkflowUserTracking,
    workflowId && workflowId !== "new"
      ? { workflowId: workflowId as any }
      : "skip",
  );

  // Get recent workflows for sidebar navigation
  const recentWorkflows = useQuery(
    api.enhancedWorkflows.getWorkflows,
    orgId ? { orgId: orgId as any } : "skip",
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
            onDetailsClick: handleNodeDetailsClick,
            onPlusClick: handleNodePlusClick,
            nodeId: block.id,
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
          type: "deletable",
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          data: {
            onEdgeDelete: handleEdgeDelete,
          },
        }));
        setEdges(flowEdges);
      }

      // Capture initial state for change tracking
      setTimeout(() => {
        setInitialState({
          name: existingWorkflow.name,
          description: existingWorkflow.description || "",
          nodes: existingWorkflow.blocks
            ? existingWorkflow.blocks.map((block: any) => ({
                id: block.id,
                type: block.type,
                position: block.position,
                data: {
                  label: getNodeLabel(block.type, block.config),
                  type: block.type,
                  config: block.config,
                  userCount: userTracking?.[block.id]?.userCount || 0,
                  users: userTracking?.[block.id]?.users || [],
                  onDetailsClick: handleNodeDetailsClick,
                  onPlusClick: handleNodePlusClick,
                  nodeId: block.id,
                },
              }))
            : [],
          edges: existingWorkflow.connections
            ? existingWorkflow.connections.map((conn: any) => ({
                id: conn.id,
                source: conn.from,
                target: conn.to,
                type: "deletable",
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                },
                data: {
                  onEdgeDelete: handleEdgeDelete,
                },
              }))
            : [],
        });
      }, 100); // Small delay to ensure nodes/edges are set
    } else if (workflowId === "new") {
      // For new workflows, set initial state as empty
      setInitialState({
        name: "Untitled Workflow",
        description: "",
        nodes: [],
        edges: [],
      });
    }
  }, [existingWorkflow, userTracking, workflowId]); // Removed setNodes, setEdges, handleNodeDetailsClick to prevent infinite loop

  // Helper function to get workflow status indicator
  const getWorkflowStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case "inactive":
      case "paused":
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      case "draft":
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  };

  // Helper function to get workflow trigger icon
  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case "appointment_booked":
        return Calendar;
      case "appointment_completed":
        return CheckCircle;
      case "client_message":
        return MessageSquare;
      default:
        return Play;
    }
  };

  // Filter workflows based on search
  const filteredRecentWorkflows =
    recentWorkflows?.filter((workflow) =>
      workflow.name.toLowerCase().includes(workflowSearch.toLowerCase()),
    ) || [];

  // Handler for plus button clicks on nodes
  const handleNodePlusClick = useCallback(
    (event: React.MouseEvent, nodeId: string) => {
      event.preventDefault();
      event.stopPropagation();

      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setNodePopupPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 5,
      });
      setSourceNodeId(nodeId);
      setNodePopupOpen(true);
    },
    [],
  );

  // Node categories for the popup
  const nodeCategories = [
    {
      title: "Triggers",
      nodes: [
        {
          type: "trigger",
          label: "Appointment Booked",
          description: "When a client books an appointment",
          icon: Calendar,
        },
        {
          type: "trigger",
          label: "Appointment Completed",
          description: "When an appointment is completed",
          icon: CheckCircle,
        },
        {
          type: "trigger",
          label: "Client Message",
          description: "When a client sends a message",
          icon: MessageSquare,
        },
      ],
    },
    {
      title: "Actions",
      nodes: [
        {
          type: "action",
          label: "Send SMS",
          description: "Send a text message to the client",
          icon: MessageSquare,
        },
        {
          type: "action",
          label: "Send Email",
          description: "Send an email to the client",
          icon: Mail,
        },
        {
          type: "action",
          label: "Add Tag",
          description: "Add a tag to the client",
          icon: Tag,
        },
      ],
    },
    {
      title: "Flow Control",
      nodes: [
        {
          type: "delay",
          label: "Wait",
          description: "Wait for a specified amount of time",
          icon: Clock,
        },
        {
          type: "condition",
          label: "If/Then",
          description: "Conditional logic based on client data",
          icon: GitBranch,
        },
      ],
    },
  ];

  // Filter nodes based on search
  const filteredNodeCategories = nodeCategories
    .map((category) => ({
      ...category,
      nodes: category.nodes.filter(
        (node) =>
          node.label.toLowerCase().includes(nodeSearch.toLowerCase()) ||
          node.description.toLowerCase().includes(nodeSearch.toLowerCase()),
      ),
    }))
    .filter((category) => category.nodes.length > 0);

  // Handler for adding node from popup
  const handleAddNodeFromPopup = useCallback(
    (nodeType: string, nodeLabel: string) => {
      if (!sourceNodeId) return;

      // Create new node
      const newNode = {
        id: `node-${Date.now()}`,
        type: nodeType,
        position: { x: 0, y: 0 }, // Will be positioned relative to source
        data: {
          label: nodeLabel,
          type: nodeType,
          config: getDefaultConfig(nodeType),
          userCount: 0,
          users: [],
          onDetailsClick: handleNodeDetailsClick,
          onPlusClick: handleNodePlusClick,
          nodeId: `node-${Date.now()}`,
        },
      };

      // Find source node position
      const sourceNode = nodes.find((n) => n.id === sourceNodeId);
      if (sourceNode) {
        newNode.position = {
          x: sourceNode.position.x,
          y: sourceNode.position.y + 120, // Position below source node
        };
      }

      // Add node and connection
      setNodes((nds) => [...nds, newNode]);

      // Create edge between source and new node
      const newEdge = {
        id: `edge-${sourceNodeId}-${newNode.id}`,
        source: sourceNodeId,
        target: newNode.id,
        type: "deletable",
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        data: {
          onEdgeDelete: handleEdgeDelete,
        },
      };

      setEdges((eds) => [...eds, newEdge]);

      // Close popup
      setNodePopupOpen(false);
      setSourceNodeId(null);
      setNodeSearch("");
    },
    [sourceNodeId, nodes],
  ); // Removed setNodes, setEdges, handleNodeDetailsClick to prevent infinite loop

  // Handler for edge deletion
  const handleEdgeDelete = useCallback(
    (edgeId: string) => {
      const edgeToDelete = edges.find((e) => e.id === edgeId);
      if (!edgeToDelete) return;

      // Store deleted edge for undo
      setDeletedEdges((prev) => [...prev, edgeToDelete]);

      // Remove edge
      setEdges((edges) => edges.filter((e) => e.id !== edgeId));

      // Show undo notification
      setShowUndoDelete(true);

      // Hide undo after 5 seconds
      setTimeout(() => setShowUndoDelete(false), 5000);
    },
    [edges],
  ); // Removed setEdges to prevent infinite loop

  // Handler for undo edge deletion
  const handleUndoEdgeDelete = useCallback(() => {
    if (deletedEdges.length === 0) return;

    const lastDeletedEdge = deletedEdges[deletedEdges.length - 1];

    // Restore the edge
    setEdges((edges) => [...edges, lastDeletedEdge]);

    // Remove from deleted edges
    setDeletedEdges((prev) => prev.slice(0, -1));

    // Hide undo notification
    setShowUndoDelete(false);
  }, [deletedEdges]); // Removed setEdges to prevent infinite loop

  // Validation functions
  const validateNodeConfig = useCallback((node: Node) => {
    const errors: string[] = [];

    switch (node.type) {
      case "trigger":
        if (!node.data?.config?.trigger) {
          errors.push("Missing trigger type");
        }
        break;

      case "action":
        if (!node.data?.config?.action) {
          errors.push("Missing action type");
        }
        if (
          node.data?.config?.action === "send_sms" ||
          node.data?.config?.action === "send_email"
        ) {
          if (
            !node.data?.config?.message ||
            node.data?.config?.message.trim() === ""
          ) {
            errors.push("Missing message content");
          }
        }
        break;

      case "delay":
        if (!node.data?.config?.duration || node.data?.config?.duration <= 0) {
          errors.push("Invalid delay duration");
        }
        if (!node.data?.config?.unit) {
          errors.push("Missing time unit");
        }
        break;

      case "condition":
        if (!node.data?.config?.condition) {
          errors.push("Missing condition logic");
        }
        break;
    }

    return errors;
  }, []);

  const findUnreachableNodes = useCallback(() => {
    const unreachableNodes: string[] = [];
    const reachableNodes = new Set<string>();

    // Find all trigger nodes (entry points)
    const triggerNodes = nodes.filter((node) => node.type === "trigger");

    // Mark trigger nodes as reachable
    triggerNodes.forEach((node) => reachableNodes.add(node.id));

    // Follow connections to find all reachable nodes
    let foundNewConnections = true;
    while (foundNewConnections) {
      foundNewConnections = false;

      edges.forEach((edge) => {
        if (
          reachableNodes.has(edge.source) &&
          !reachableNodes.has(edge.target)
        ) {
          reachableNodes.add(edge.target);
          foundNewConnections = true;
        }
      });
    }

    // Find nodes that are not reachable and not triggers
    nodes.forEach((node) => {
      if (!reachableNodes.has(node.id) && node.type !== "trigger") {
        unreachableNodes.push(node.id);
      }
    });

    return unreachableNodes;
  }, [nodes, edges]);

  // Run validation whenever nodes or edges change
  useEffect(() => {
    const nextErrors: { [nodeId: string]: string[] } = {};

    // Check each node's configuration
    nodes.forEach((node) => {
      const configErrors = validateNodeConfig(node);
      if (configErrors.length > 0) {
        nextErrors[node.id] = configErrors;
      }
    });

    // Check for unreachable nodes
    const unreachableNodes = findUnreachableNodes();
    unreachableNodes.forEach((nodeId) => {
      if (!nextErrors[nodeId]) nextErrors[nodeId] = [];
      nextErrors[nodeId].push("Node is unreachable - no path from trigger");
    });

    // Only update if changed to prevent loops
    setValidationErrors((prev) => {
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(nextErrors);
      if (prevKeys.length !== nextKeys.length) return nextErrors;
      for (const key of nextKeys) {
        const a = prev[key] || [];
        const b = nextErrors[key] || [];
        if (a.length !== b.length) return nextErrors;
        for (let i = 0; i < a.length; i++) {
          if (a[i] !== b[i]) return nextErrors;
        }
      }
      return prev; // no change
    });
  }, [nodes, edges]);

  // Update nodes with validation errors
  useEffect(() => {
    setNodes((currentNodes) => {
      let changed = false;
      const nextNodes = currentNodes.map((node) => {
        const nextErrors = validationErrors[node.id] || [];
        const prevErrors = (node.data as any).errors || [];
        const same =
          prevErrors.length === nextErrors.length &&
          prevErrors.every((v, i) => v === nextErrors[i]);
        if (same) return node;
        changed = true;
        return {
          ...node,
          data: {
            ...node.data,
            errors: nextErrors,
          },
        };
      });
      return changed ? nextNodes : currentNodes;
    });
  }, [validationErrors, setNodes]);

  // Helper function to get node labels
  const getNodeLabel = (type: string, config: any) => {
    switch (type) {
      case "trigger":
        return config?.trigger || "Trigger";
      case "action":
        return config?.action === "send_sms" ? "Send SMS" : "Send Email";
      case "delay":
        return `Wait ${config?.duration || 5} ${config?.unit || "minutes"}`;
      case "condition":
        return config?.condition || "If/Then";
      default:
        return "Unknown";
    }
  };

  // Handle edge connections
  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        type: "deletable",
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        data: {
          onEdgeDelete: handleEdgeDelete,
        },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges, handleEdgeDelete],
  );

  // Handle node selection
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Handle drag over for drag and drop
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Handle drop for drag and drop
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = (event.target as Element).getBoundingClientRect();
      const type = event.dataTransfer.getData("application/reactflow");

      if (typeof type === "undefined" || !type) {
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
          onDetailsClick: handleNodeDetailsClick,
          onPlusClick: handleNodePlusClick,
          nodeId: `${nodeData.type}-${Date.now()}`,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes, handleNodeDetailsClick],
  );

  // Get default config for node type
  const getDefaultConfig = (type: string) => {
    switch (type) {
      case "delay":
        return { duration: 5, unit: "minutes" };
      case "action":
        return {
          action: "send_sms",
          message: "Hello! This is an automated message.",
        };
      case "trigger":
        return { trigger: "appointment_booked" };
      case "condition":
        return { condition: "client_age_over_18" };
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
          onDetailsClick: handleNodeDetailsClick,
          onPlusClick: handleNodePlusClick,
          nodeId: `${type}-${Date.now()}`,
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, handleNodeDetailsClick],
  );

  // Handle back navigation with unsaved changes warning
  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      if (
        confirm("You have unsaved changes. Are you sure you want to leave?")
      ) {
        window.location.href = "/workflows";
      }
    } else {
      window.location.href = "/workflows";
    }
  }, [hasUnsavedChanges]);

  // Save workflow
  const handleSave = useCallback(async () => {
    if (!user || !orgId) return;

    // Convert ReactFlow nodes back to blocks
    const blocks = nodes.map((node) => ({
      id: node.id,
      type: node.type || "unknown",
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
      fromPort: "out",
      toPort: "in",
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
        // Update initial state to current state after successful save
        setInitialState({
          name: workflowName,
          description: workflowDescription,
          nodes: [...nodes],
          edges: [...edges],
        });
        alert("Workflow saved successfully!");
      } else {
        const newWorkflowId = await createWorkflow({
          orgId: orgId as any,
          name: workflowName,
          description: workflowDescription,
          trigger: "appointment_completed",
          conditions: [],
          actions: [],
          blocks,
          connections,
          isActive: true,
        });
        setHasUnsavedChanges(false);
        // Update initial state to current state after successful save
        setInitialState({
          name: workflowName,
          description: workflowDescription,
          nodes: [...nodes],
          edges: [...edges],
        });
        alert("Workflow created successfully!");
        // Redirect to the new workflow URL
        window.location.href = `/workflow-editor?id=${newWorkflowId}`;
      }
    } catch (error) {
      console.error("Error saving workflow:", error);
      alert("Error saving workflow");
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

  // Test workflow handler
  const handleTestWorkflow = useCallback(async () => {
    if (!testEmail && !testPhone) {
      alert(
        "Please enter either an email address or phone number for testing.",
      );
      return;
    }

    if (!workflowName || nodes.length === 0) {
      alert("Please create a workflow with at least one node before testing.");
      return;
    }

    setIsTesting(true);

    try {
      // Simulate test workflow execution
      console.log("🧪 Testing workflow:", {
        workflowName,
        description: workflowDescription,
        testEmail,
        testPhone,
        nodeCount: nodes.length,
        edgeCount: edges.length,
      });

      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      alert(
        `Test workflow "${workflowName}" completed successfully!\n\nSent to:\n${testEmail ? `📧 Email: ${testEmail}` : ""}\n${testPhone ? `📱 Phone: ${testPhone}` : ""}\n\nNodes executed: ${nodes.length}`,
      );

      // Close dialog and reset fields
      setTestDialogOpen(false);
      setTestEmail("");
      setTestPhone("");
    } catch (error) {
      console.error("Error testing workflow:", error);
      alert("Error testing workflow. Please try again.");
    } finally {
      setIsTesting(false);
    }
  }, [workflowName, workflowDescription, testEmail, testPhone, nodes, edges]);

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!user || !orgId || !hasUnsavedChanges || !initialState) return;

    setAutoSaveStatus("saving");

    // Convert ReactFlow nodes back to blocks
    const blocks = nodes.map((node) => ({
      id: node.id,
      type: node.type || "unknown",
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
      fromPort: "out",
      toPort: "in",
    }));

    try {
      if (workflowId && workflowId !== "new") {
        // For existing workflows, update in place as draft state
        await updateWorkflow({
          id: workflowId as any,
          name: workflowName,
          description: workflowDescription,
          blocks,
          connections,
          lastAutoSave: new Date().toISOString(), // Track auto-save timestamp
        });
      } else {
        // For new workflows, create with auto-save flag
        const draftWorkflowId = await createWorkflow({
          orgId: orgId as any,
          name: workflowName,
          description: workflowDescription,
          trigger: "appointment_completed",
          conditions: [],
          actions: [],
          blocks,
          connections,
          isActive: false, // New workflows start inactive
          status: "draft",
        });

        // Update URL to the new workflow for subsequent auto-saves
        if (draftWorkflowId) {
          window.history.replaceState(
            {},
            "",
            `/workflow-editor?id=${draftWorkflowId}`,
          );
          // Update workflowId for subsequent saves
          // Note: This would require prop update, for now we'll keep as-is
        }
      }

      setAutoSaveStatus("saved");
      setLastAutoSave(new Date());

      // Reset to idle after 3 seconds
      setTimeout(() => setAutoSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Auto-save failed:", error);
      setAutoSaveStatus("error");
      // Reset to idle after 3 seconds
      setTimeout(() => setAutoSaveStatus("idle"), 3000);
    }
  }, [
    user,
    orgId,
    hasUnsavedChanges,
    initialState,
    nodes,
    edges,
    workflowName,
    workflowDescription,
    workflowId,
    updateWorkflow,
    createWorkflow,
  ]);

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Recent Workflows Sidebar */}
      <div
        className={`bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarOpen ? "w-80" : "w-0"
        } overflow-hidden`}
      >
        <div className="p-4 h-full overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Recent Workflows</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <Input
              placeholder="Search workflows..."
              value={workflowSearch}
              onChange={(e) => setWorkflowSearch(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Create New Workflow Button */}
          <Button
            className="mb-4 w-full"
            onClick={() => window.open("/workflow-editor?id=new", "_blank")}
            data-theme-aware="true"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>

          {/* Recent Workflows List */}
          <div className="flex-1 space-y-2">
            {filteredRecentWorkflows.map((workflow) => {
              const TriggerIcon = getTriggerIcon(workflow.trigger);
              const isCurrentWorkflow = workflow._id === workflowId;

              return (
                <div
                  key={workflow._id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                    isCurrentWorkflow
                      ? "border-blue-200 bg-blue-50"
                      : "border-gray-200"
                  }`}
                  onClick={() => {
                    if (!isCurrentWorkflow) {
                      window.open(
                        `/workflow-editor?id=${workflow._id}`,
                        "_blank",
                      );
                    }
                  }}
                >
                  {/* Status indicator */}
                  <div className="flex items-center mr-3">
                    {getWorkflowStatusIcon(workflow.status)}
                  </div>

                  {/* Workflow icon */}
                  <TriggerIcon className="h-4 w-4 mr-3 text-gray-600" />

                  {/* Workflow info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {workflow.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {workflow.status === "active"
                        ? "Active"
                        : workflow.status === "paused"
                          ? "Paused"
                          : workflow.status === "draft"
                            ? "Draft"
                            : "Inactive"}{" "}
                      •{workflow.activeEnrollmentCount || 0} active
                    </div>
                  </div>

                  {/* Current workflow indicator */}
                  {isCurrentWorkflow && (
                    <div className="text-xs text-blue-600 font-medium">
                      Current
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty state */}
            {filteredRecentWorkflows.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">
                  {workflowSearch
                    ? "No workflows found"
                    : "No recent workflows"}
                </p>
              </div>
            )}
          </div>
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
                }}
                className="font-semibold text-lg border-none pl-1 pr-0 py-0 h-auto"
                placeholder="Workflow Name"
              />
              <Input
                value={workflowDescription}
                onChange={(e) => {
                  setWorkflowDescription(e.target.value);
                }}
                className="text-sm text-gray-600 border-none pl-1 pr-0 py-0 h-auto mt-1"
                placeholder="Description"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {hasUnsavedChanges && (
              <Badge
                variant="outline"
                className="text-orange-600 border-orange-300"
              >
                Unsaved Changes
              </Badge>
            )}
            {autoSaveStatus === "saving" && (
              <Badge
                variant="outline"
                className="text-blue-600 border-blue-300"
              >
                <Clock className="h-3 w-3 mr-1 animate-spin" />
                Auto-saving...
              </Badge>
            )}
            {autoSaveStatus === "saved" && lastAutoSave && (
              <Badge
                variant="outline"
                className="text-green-600 border-green-300"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Saved{" "}
                {lastAutoSave.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Badge>
            )}
            {autoSaveStatus === "error" && (
              <Badge variant="outline" className="text-red-600 border-red-300">
                <AlertCircle className="h-3 w-3 mr-1" />
                Auto-save failed
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTestDialogOpen(true)}
            >
              <Send className="h-4 w-4 mr-2" />
              Test Workflow
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              disabled={!hasUnsavedChanges}
              className={
                !hasUnsavedChanges ? "opacity-50 cursor-not-allowed" : ""
              }
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Undo Delete Notification */}
        {showUndoDelete && (
          <div className="fixed top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 flex items-center space-x-3">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-orange-500 mr-2" />
              <span className="text-sm text-gray-700">Connection deleted</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndoEdgeDelete}
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              Undo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUndoDelete(false)}
              className="text-gray-400 hover:text-gray-600 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

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
            edgeTypes={edgeTypes}
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
                        : n,
                    ),
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
                            : n,
                        ),
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
                            : n,
                        ),
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
                            : n,
                        ),
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
                            : n,
                        ),
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

      {/* Right-side Panel for Node Details */}
      {rightPanelOpen && selectedNodeForDetails && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-lg">Node Details</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRightPanelOpen(false)}
              className="transition-all duration-200 hover:scale-110"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-4 space-y-6">
            {/* Node Info */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Node Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium capitalize">
                    {selectedNodeForDetails.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">
                    {selectedNodeForDetails.data?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ID:</span>
                  <span className="font-mono text-xs">
                    {selectedNodeForDetails.id}
                  </span>
                </div>
              </div>
            </div>

            {/* User Statistics */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                User Statistics
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">
                      Currently Active
                    </span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {selectedNodeForDetails.data?.userCount || 0}
                  </span>
                </div>

                {selectedNodeForDetails.data?.userCount > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700">
                      Active Users:
                    </h5>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {(selectedNodeForDetails.data?.users || [])
                        .slice(0, 5)
                        .map((user: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-white rounded border text-xs"
                          >
                            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                              {user.clientName?.charAt(0) || "U"}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">
                                {user.clientName || "Unknown User"}
                              </div>
                              <div className="text-gray-500">
                                {user.email || "No email"}
                              </div>
                            </div>
                          </div>
                        ))}
                      {(selectedNodeForDetails.data?.userCount || 0) > 5 && (
                        <div className="text-xs text-gray-500 text-center py-1">
                          +{(selectedNodeForDetails.data?.userCount || 0) - 5}{" "}
                          more users
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Configuration */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Configuration</h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(selectedNodeForDetails.data?.config, null, 2)}
                </pre>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  // TODO: Navigate to full tracking view
                  console.log(
                    "Navigate to tracking view for node:",
                    selectedNodeForDetails.id,
                  );
                }}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Full Tracking
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  // TODO: Test this specific node
                  console.log("Test node:", selectedNodeForDetails.id);
                }}
              >
                <Play className="h-4 w-4 mr-2" />
                Test This Step
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Test Workflow Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Test Workflow
            </DialogTitle>
            <DialogDescription>
              Test your workflow by sending it to a specific email address or
              phone number.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Workflow Info */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Workflow Details</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Name:</span> {workflowName}
                </div>
                <div>
                  <span className="font-medium">Nodes:</span> {nodes.length}
                </div>
                <div>
                  <span className="font-medium">Connections:</span>{" "}
                  {edges.length}
                </div>
              </div>
            </div>

            {/* Test Recipients */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="test-email">
                  Test Email Address (Optional)
                </Label>
                <Input
                  id="test-email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter email for testing"
                />
              </div>

              <div>
                <Label htmlFor="test-phone">Test Phone Number (Optional)</Label>
                <Input
                  id="test-phone"
                  type="tel"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="Enter phone number for testing"
                />
              </div>
            </div>

            {/* Test Info */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This will simulate running your workflow
                with test data. No actual appointments or real data will be
                affected.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTestDialogOpen(false)}
              disabled={isTesting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTestWorkflow}
              disabled={isTesting || (!testEmail && !testPhone)}
              data-theme-aware="true"
            >
              {isTesting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Run Test
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Node Selection Popup */}
      {nodePopupOpen && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setNodePopupOpen(false)}
        >
          <div
            className="absolute bg-white rounded-lg shadow-lg border max-w-sm w-80 max-h-96 overflow-y-auto"
            style={{
              left: `${Math.min(nodePopupPosition.x - 160, window.innerWidth - 320)}px`,
              top: `${Math.min(nodePopupPosition.y, window.innerHeight - 400)}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Add Node</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNodePopupOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {/* Search */}
              <Input
                placeholder="Search nodes..."
                value={nodeSearch}
                onChange={(e) => setNodeSearch(e.target.value)}
                className="text-sm mb-3"
                autoFocus
              />

              {/* Node Categories */}
              {filteredNodeCategories.map((category) => (
                <div key={category.title} className="mb-4 last:mb-0">
                  <h4 className="font-medium text-xs text-gray-600 mb-2 uppercase tracking-wide">
                    {category.title}
                  </h4>
                  <div className="space-y-1">
                    {category.nodes.map((node) => (
                      <div
                        key={`${node.type}-${node.label}`}
                        className="flex items-center p-2 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() =>
                          handleAddNodeFromPopup(node.type, node.label)
                        }
                      >
                        <node.icon className="h-4 w-4 mr-3 text-gray-500" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {node.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {node.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Empty state */}
              {filteredNodeCategories.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <Search className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No nodes found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main component wrapped with ReactFlowProvider
export default function EnhancedWorkflowEditor(
  props: EnhancedWorkflowEditorProps,
) {
  return (
    <ReactFlowProvider>
      <WorkflowEditorInner {...props} />
    </ReactFlowProvider>
  );
}
