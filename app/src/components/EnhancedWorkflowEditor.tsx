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
  FolderOpen,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { EnhancedWorkflowList } from "@/components/EnhancedWorkflowList";

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

  // Build a smooth cubic bezier path for minimal curved connection
  const dx = Math.abs(targetX - sourceX);
  const dy = Math.abs(targetY - sourceY);
  const curvature = Math.max(40, Math.min(200, Math.max(dx, dy) * 0.5));
  const c1x = sourceX + curvature;
  const c1y = sourceY;
  const c2x = targetX - curvature;
  const c2y = targetY;
  const d = `M ${sourceX},${sourceY} C ${c1x},${c1y} ${c2x},${c2y} ${targetX},${targetY}`;

  // Enforce tiny arrowhead
  const tinyMarker = markerEnd
    ? { ...markerEnd, width: 8, height: 8, color: "#9ca3af" }
    : undefined;

  return (
    <>
      {/* Main edge hit area (transparent for interactions) */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={d}
        markerEnd={tinyMarker}
        style={{
          strokeWidth: 8,
          stroke: "transparent",
          cursor: "pointer",
          pointerEvents: "stroke",
          ...style,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={(e) => {
          const related = (e as any).relatedTarget as HTMLElement | null;
          if (!related || related.dataset?.edgeDelete !== id) {
            setIsHovered(false);
          }
        }}
        onClick={() => data?.onEdgeDelete?.(id)}
      />

      {/* Visual animated flow line */}
      <path
        d={d}
        fill="none"
        stroke="#9ca3af"
        strokeWidth={1.5}
        strokeDasharray="4 8"
        strokeLinecap="round"
        className="edge-flow"
        markerEnd={tinyMarker}
        style={{
          opacity: 0.95,
          pointerEvents: "none",
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
            data-edge-delete={id}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
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
    onNodeDelete?: (nodeId: string) => void;
    nodeId?: string;
    errors?: string[];
  };
}> = ({ data }) => (
  <div className="relative group">
    {/* User count indicator - top-left, tiny, blends with node */}
    <div
      className="absolute -top-2 -left-2 px-1.5 py-0.5 rounded-md text-[10px] font-medium z-20 cursor-pointer transition-all duration-200 hover:scale-105 bg-gray-100 text-gray-600 border border-gray-200"
      title={`${data.userCount || 0} users currently at this step`}
      onClick={() => {
        data.onDetailsClick?.(data);
      }}
    >
      <div className="flex items-center gap-0.5">
        <Users className="w-2.5 h-2.5" />
        <span className="leading-none">{data.userCount || 0}</span>
      </div>
    </div>

    {/* Hover delete button - right side, middle */}
    <button
      className="absolute -right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 border-red-500 text-red-500 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors shadow-md opacity-0 group-hover:opacity-100 z-20"
      onClick={(e) => {
        e.stopPropagation();
        data.onNodeDelete?.(data.nodeId || "");
      }}
      title="Delete node"
    >
      <X className="w-3 h-3" />
    </button>

    <div className="bg-blue-50 rounded-lg p-3 min-w-[150px] shadow-sm relative transition-all duration-200 hover:shadow-md hover:scale-105">
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
        style={{ left: "50%", zIndex: 50 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
        style={{ left: "50%", zIndex: 50 }}
      />

      {/* Plus button for adding connected nodes */}
      <button
        className="absolute -bottom-[36px] left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-150 hover:scale-105 hover:shadow-md z-10 add-node-btn"
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
    onNodeDelete?: (nodeId: string) => void;
    nodeId?: string;
    errors?: string[];
  };
}> = ({ data }) => (
  <div className="relative group">
    {/* User count indicator - top-left, blends with node */}
    <div
      className="absolute -top-2 -left-2 px-1.5 py-0.5 rounded-md text-[10px] font-medium z-20 cursor-pointer transition-all duration-200 hover:scale-105 bg-gray-100 text-gray-600 border border-gray-200"
      title={`${data.userCount || 0} users currently at this step`}
      onClick={() => {
        data.onDetailsClick?.(data);
      }}
    >
      <div className="flex items-center gap-0.5">
        <Users className="w-2.5 h-2.5" />
        <span className="leading-none">{data.userCount || 0}</span>
      </div>
    </div>

    {/* Hover delete button - right side, middle */}
    <button
      className="absolute -right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 border-red-500 text-red-500 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors shadow-md opacity-0 group-hover:opacity-100 z-20"
      onClick={(e) => {
        e.stopPropagation();
        data.onNodeDelete?.(data.nodeId || "");
      }}
      title="Delete node"
    >
      <X className="w-3 h-3" />
    </button>

    <div className="bg-green-50 rounded-lg p-3 min-w-[150px] shadow-sm relative transition-all duration-200 hover:shadow-md hover:scale-105">
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
        style={{ left: "50%", zIndex: 50 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
        style={{ left: "50%", zIndex: 50 }}
      />

      {/* Plus button for adding connected nodes */}
      <button
        className="absolute -bottom-[36px] left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center border border-green-200 bg-green-50 text-green-700 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all duration-150 hover:scale-105 hover:shadow-md z-10 add-node-btn"
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
    onNodeDelete?: (nodeId: string) => void;
    nodeId?: string;
    errors?: string[];
  };
}> = ({ data }) => (
  <div className="relative group">
    {/* User count indicator - top-left, blends with node */}
    <div
      className="absolute -top-2 -left-2 px-1.5 py-0.5 rounded-md text-[10px] font-medium z-20 cursor-pointer transition-all duration-200 hover:scale-105 bg-gray-100 text-gray-600 border border-gray-200"
      title={`${data.userCount || 0} users currently waiting at this delay`}
      onClick={() => {
        data.onDetailsClick?.(data);
      }}
    >
      <div className="flex items-center gap-0.5">
        <Users className="w-2.5 h-2.5" />
        <span className="leading-none">{data.userCount || 0}</span>
      </div>
    </div>

    {/* Hover delete button - right side, middle */}
    <button
      className="absolute -right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 border-red-500 text-red-500 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors shadow-md opacity-0 group-hover:opacity-100 z-20"
      onClick={(e) => {
        e.stopPropagation();
        data.onNodeDelete?.(data.nodeId || "");
      }}
      title="Delete node"
    >
      <X className="w-3 h-3" />
    </button>

    <div className="bg-yellow-50 rounded-lg p-3 min-w-[150px] shadow-sm relative transition-all duration-200 hover:shadow-md hover:scale-105">
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
        style={{ left: "50%", zIndex: 50 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-yellow-500 !border-2 !border-white"
        style={{ left: "50%", zIndex: 50 }}
      />

      {/* Plus button for adding connected nodes */}
      <button
        className="absolute -bottom-[36px] left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center border border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-500 hover:text-white hover:border-yellow-500 transition-all duration-150 hover:scale-105 hover:shadow-md z-10 add-node-btn"
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
    onNodeDelete?: (nodeId: string) => void;
    nodeId?: string;
    errors?: string[];
  };
}> = ({ data }) => (
  <div className="relative group">
    {/* User count indicator - top-left, blends with node */}
    <div
      className="absolute -top-2 -left-2 px-1.5 py-0.5 rounded-md text-[10px] font-medium z-20 cursor-pointer transition-all duration-200 hover:scale-105 bg-gray-100 text-gray-600 border border-gray-200"
      title={`${data.userCount || 0} users currently at this condition check`}
      onClick={() => {
        data.onDetailsClick?.(data);
      }}
    >
      <div className="flex items-center gap-0.5">
        <Users className="w-2.5 h-2.5" />
        <span className="leading-none">{data.userCount || 0}</span>
      </div>
    </div>

    {/* Hover delete button - right side, middle */}
    <button
      className="absolute -right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 border-red-500 text-red-500 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors shadow-md opacity-0 group-hover:opacity-100 z-20"
      onClick={(e) => {
        e.stopPropagation();
        data.onNodeDelete?.(data.nodeId || "");
      }}
      title="Delete node"
    >
      <X className="w-3 h-3" />
    </button>

    <div className="bg-purple-50 rounded-lg p-3 min-w-[150px] shadow-sm relative transition-all duration-200 hover:shadow-md hover:scale-105">
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
        style={{ left: "50%", zIndex: 50 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: "25%", zIndex: 50 }}
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: "75%", zIndex: 50 }}
        className="!w-3 !h-3 !bg-red-500 !border-2 !border-white"
      />

      {/* Plus buttons for adding connected nodes - one for each output */}
      <button
        className="absolute -bottom-[36px] left-1/4 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center border border-green-200 bg-green-50 text-green-700 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all duration-150 hover:scale-105 hover:shadow-md z-10 add-node-btn"
        onClick={(e) => data.onPlusClick?.(e, data.nodeId || "")}
        title="Add node (True path)"
      >
        <Plus className="w-3 h-3" />
      </button>

      <button
        className="absolute -bottom-[36px] left-3/4 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center border border-red-200 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-150 hover:scale-105 hover:shadow-md z-10 add-node-btn"
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
  const router = useRouter();

  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Sidebar state
  const [sidebarOpen] = useState(true);

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

  // Allow saving new workflows even before initialState diffing finishes
  const canSave = useMemo(() => {
    const metaChanged =
      workflowName.trim() !== "Untitled Workflow" ||
      workflowDescription.trim().length > 0;
    const graphChanged = nodes.length > 0 || edges.length > 0;
    if (!workflowId || workflowId === "new") {
      return hasUnsavedChanges || metaChanged || graphChanged;
    }
    return hasUnsavedChanges;
  }, [
    hasUnsavedChanges,
    workflowId,
    workflowName,
    workflowDescription,
    nodes.length,
    edges.length,
  ]);

  // Track selected edges for deletion
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);

  // Directory menu collapse state (default closed)
  const [directoryMenuOpen, setDirectoryMenuOpen] = useState(false);

  // Auto-collapse directory menu on mobile/tablet screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        // lg breakpoint
        setDirectoryMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Check initial size

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Add scroll-to-close functionality for directory menu
  useEffect(() => {
    if (!directoryMenuOpen) return;

    const directoryElement = document.querySelector("[data-directory-menu]");
    if (!directoryElement) return;

    let startScrollLeft = 0;
    let isScrolling = false;

    const handleScrollStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.scrollLeft !== undefined) {
        startScrollLeft = target.scrollLeft;
        isScrolling = true;
      }
    };

    const handleScroll = (e: Event) => {
      if (!isScrolling) return;

      const target = e.target as HTMLElement;
      if (target.scrollLeft !== undefined) {
        const currentScrollLeft = target.scrollLeft;
        const scrollDelta = startScrollLeft - currentScrollLeft;
        const threshold = (target.scrollWidth - target.clientWidth) * 0.6; // 60% threshold

        if (scrollDelta > threshold) {
          setDirectoryMenuOpen(false);
          isScrolling = false;
        }
      }
    };

    const handleScrollEnd = () => {
      isScrolling = false;
    };

    directoryElement.addEventListener("scroll", handleScroll);
    directoryElement.addEventListener("touchstart", handleScrollStart);
    directoryElement.addEventListener("mousedown", handleScrollStart);
    directoryElement.addEventListener("touchend", handleScrollEnd);
    directoryElement.addEventListener("mouseup", handleScrollEnd);

    return () => {
      directoryElement.removeEventListener("scroll", handleScroll);
      directoryElement.removeEventListener("touchstart", handleScrollStart);
      directoryElement.removeEventListener("mousedown", handleScrollStart);
      directoryElement.removeEventListener("touchend", handleScrollEnd);
      directoryElement.removeEventListener("mouseup", handleScrollEnd);
    };
  }, [directoryMenuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedEdgeIds.length > 0
      ) {
        setEdges((eds) => eds.filter((e) => !selectedEdgeIds.includes(e.id)));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedEdgeIds, setEdges]);

  const handleSelectionChange = useCallback((sel: any) => {
    const ids = (sel && sel.edges ? sel.edges : [])
      .map((e: any) => e.id)
      .slice()
      .sort();
    setSelectedEdgeIds((prev) => {
      if (prev.length === ids.length && prev.every((v, i) => v === ids[i])) {
        return prev; // no change, avoid re-render loop
      }
      return ids;
    });
  }, []);

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

    // Compare node data (excluding functions)
    for (let i = 0; i < nodes.length; i++) {
      const currentNode = nodes[i];
      const initialNode = initialState.nodes.find(
        (n) => n.id === currentNode.id,
      );
      if (!initialNode || currentNode.type !== initialNode.type) {
        setHasUnsavedChanges(true);
        return;
      }

      // Compare only serializable config data
      const currentConfig = currentNode.data?.config || {};
      const initialConfig = initialNode.data?.config || {};
      const currentLabel = currentNode.data?.label || "";
      const initialLabel = initialNode.data?.label || "";

      if (
        JSON.stringify(currentConfig) !== JSON.stringify(initialConfig) ||
        currentLabel !== initialLabel
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

  // Debug logging for save button state (moved after existingWorkflow declaration)
  useEffect(() => {
    console.log("Save button state:", {
      hasUnsavedChanges,
      initialState: !!initialState,
      nodeCount: nodes.length,
      workflowName,
      workflowId,
      initialNodeCount: initialState?.nodes?.length || 0,
      existingWorkflow: !!existingWorkflow,
    });
  }, [
    hasUnsavedChanges,
    initialState,
    nodes.length,
    workflowName,
    workflowId,
    existingWorkflow,
  ]);

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

      // Always set initial state for existing workflows (even if empty)
      const hasBlocks =
        existingWorkflow.blocks && existingWorkflow.blocks.length > 0;
      const hasConnections =
        existingWorkflow.connections && existingWorkflow.connections.length > 0;

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
            onNodeDelete: handleNodeDelete,
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

      // Capture initial state for change tracking (always, even if empty)
      setTimeout(() => {
        setInitialState({
          name: existingWorkflow.name,
          description: existingWorkflow.description || "",
          nodes: hasBlocks
            ? existingWorkflow.blocks.map((block: any) => ({
                id: block.id,
                type: block.type,
                position: block.position,
                data: {
                  label: getNodeLabel(block.type, block.config),
                  type: block.type,
                  config: block.config,
                  // Only store essential data, not functions
                },
              }))
            : [],
          edges: hasConnections
            ? existingWorkflow.connections.map((conn: any) => ({
                id: conn.id,
                source: conn.from,
                target: conn.to,
                type: "deletable",
                // Only store essential data, not functions
              }))
            : [],
        });
      }, 100); // Small delay to ensure nodes/edges are set
    } else if (workflowId === "new") {
      // For new workflows, set initial state as empty immediately
      setInitialState({
        name: "Untitled Workflow",
        description: "",
        nodes: [],
        edges: [],
      });
    } else if (workflowId && !existingWorkflow) {
      // For workflows that are still loading, set initial state as empty
      setInitialState({
        name: "Untitled Workflow",
        description: "",
        nodes: [],
        edges: [],
      });
    }
  }, [existingWorkflow, userTracking, workflowId]); // Keep dependencies minimal to prevent infinite loops

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

  // Confirm navigation if there are unsaved changes
  const confirmNavigate = useCallback(
    (targetUrl: string) => {
      if (hasUnsavedChanges) {
        const proceed = confirm(
          "You have unsaved changes. Are you sure you want to leave?",
        );
        if (!proceed) return;
      }
      router.push(targetUrl);
    },
    [hasUnsavedChanges, router],
  );

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
        {
          type: "action",
          label: "Remove Tag",
          description: "Remove a tag from the client",
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

  // Filter nodes based on search and context (show only triggers for first node)
  const filteredNodeCategories = nodeCategories
    .map((category) => ({
      ...category,
      nodes: category.nodes.filter(
        (node) =>
          (node.label.toLowerCase().includes(nodeSearch.toLowerCase()) ||
            node.description
              .toLowerCase()
              .includes(nodeSearch.toLowerCase())) &&
          // For first node (empty sourceNodeId), only show triggers
          (sourceNodeId === "" ? category.title === "Triggers" : true),
      ),
    }))
    .filter((category) => category.nodes.length > 0);

  // Handler for adding node from popup
  const handleAddNodeFromPopup = useCallback(
    (nodeType: string, nodeLabel: string) => {
      if (sourceNodeId === null) return;

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
          onNodeDelete: handleNodeDelete,
          nodeId: `node-${Date.now()}`,
        },
      };

      // Handle positioning and connections
      if (sourceNodeId === "") {
        // First node - position in center
        newNode.position = { x: 200, y: 150 };
        // Add node without any edges for first node
        setNodes((nds) => [...nds, newNode]);
      } else {
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
      }

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

  // Handler for node deletion
  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      // Remove the node
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));

      // Remove all edges connected to this node
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId),
      );

      // Clear selection if the deleted node was selected
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
      if (selectedNodeForDetails?.id === nodeId) {
        setSelectedNodeForDetails(null);
        setRightPanelOpen(false);
      }
    },
    [selectedNode, selectedNodeForDetails],
  );

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
      case "condition": {
        // Summarize first condition for a compact label
        const first = config?.conditions?.[0];
        if (first) {
          const fieldMap: Record<string, string> = {
            tags: "Tag",
            appointment_type: "Appointment",
            last_visit: "Last Visit",
          };
          const opMap: Record<string, string> = {
            equals: "=",
            not_equals: "≠",
            includes: "includes",
            not_includes: "not includes",
            date_before: "before",
            date_after: "after",
            days_ago: "days ago",
          };
          const field = fieldMap[first.field] || first.field;
          const op = opMap[first.operator] || first.operator;
          return `${field} ${op} ${first.value ?? ""}`.trim();
        }
        return "If/Then";
      }
      default:
        return "Unknown";
    }
  };

  // Handle edge connections
  const onConnect = useCallback(
    (params: Connection) => {
      // Prevent connecting into trigger nodes (targets cannot be triggers)
      const targetNode = nodes.find((n) => n.id === params.target);
      if (targetNode && targetNode.type === "trigger") {
        return; // disallow connections that target triggers
      }

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
    [setEdges, handleEdgeDelete, nodes],
  );

  // Update node configuration
  const updateNodeConfig = useCallback(
    (nodeId: string, configUpdate: any) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  config: { ...node.data?.config, ...configUpdate },
                },
              }
            : node,
        ),
      );
    },
    [setNodes],
  );

  // Render editable configuration forms
  const renderNodeConfig = useCallback(() => {
    if (!selectedNode) return null;

    const nodeType = selectedNode.type;
    const config = selectedNode.data?.config || {};

    switch (nodeType) {
      case "trigger":
        return (
          <div className="space-y-4">
            <div>
              <Label>Trigger Event</Label>
              <Select
                value={config.trigger || ""}
                onValueChange={(value) =>
                  updateNodeConfig(selectedNode.id, { trigger: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointment_booked">
                    Appointment Booked
                  </SelectItem>
                  <SelectItem value="appointment_completed">
                    Appointment Completed
                  </SelectItem>
                  <SelectItem value="6_months_passed">
                    6 Months Passed
                  </SelectItem>
                  <SelectItem value="appointment_cancelled">
                    Appointment Cancelled
                  </SelectItem>
                  <SelectItem value="client_added">Client Added</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "action":
        return (
          <div className="space-y-4">
            <div>
              <Label>Action Type</Label>
              <Select
                value={config.action || ""}
                onValueChange={(value) =>
                  updateNodeConfig(selectedNode.id, { action: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="send_sms">Send SMS</SelectItem>
                  <SelectItem value="send_email">Send Email</SelectItem>
                  <SelectItem value="add_tag">Add Tag</SelectItem>
                  <SelectItem value="remove_tag">Remove Tag</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(config.action === "send_sms" ||
              config.action === "send_email") && (
              <div>
                <Label>Message</Label>
                <Textarea
                  value={config.message || ""}
                  onChange={(e) =>
                    updateNodeConfig(selectedNode.id, {
                      message: e.target.value,
                    })
                  }
                  placeholder={
                    config.action === "send_sms"
                      ? "Hi {{first_name}}, thank you for your appointment!"
                      : "Subject: Thank you!\n\nHi {{first_name}}, thank you for your appointment!"
                  }
                  rows={4}
                />
              </div>
            )}

            {config.action === "send_email" && (
              <div>
                <Label>Email Subject</Label>
                <Input
                  value={config.subject || ""}
                  onChange={(e) =>
                    updateNodeConfig(selectedNode.id, {
                      subject: e.target.value,
                    })
                  }
                  placeholder="Thank you for your appointment!"
                />
              </div>
            )}

            {(config.action === "add_tag" ||
              config.action === "remove_tag") && (
              <div>
                <Label>Tag</Label>
                <Input
                  value={config.tag || ""}
                  onChange={(e) =>
                    updateNodeConfig(selectedNode.id, { tag: e.target.value })
                  }
                  placeholder="Enter tag name"
                />
              </div>
            )}
          </div>
        );

      case "delay":
        return (
          <div className="space-y-4">
            <div>
              <Label>Delay Duration</Label>
              <Input
                type="number"
                value={config.duration || ""}
                onChange={(e) =>
                  updateNodeConfig(selectedNode.id, {
                    duration: parseInt(e.target.value) || 1,
                  })
                }
                placeholder="1"
                min="1"
              />
            </div>
            <div>
              <Label>Time Unit</Label>
              <Select
                value={config.unit || "days"}
                onValueChange={(value) =>
                  updateNodeConfig(selectedNode.id, { unit: value })
                }
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
          </div>
        );

      case "condition":
        // Keep existing condition builder for condition nodes
        return null; // This will fall back to existing condition builder

      default:
        return (
          <div className="text-sm text-gray-600">
            <p>
              Configuration options for {nodeType} nodes will be available soon.
            </p>
            <div className="mt-2 bg-gray-50 rounded p-2">
              <pre className="text-xs">{JSON.stringify(config, null, 2)}</pre>
            </div>
          </div>
        );
    }
  }, [selectedNode, updateNodeConfig]);

  // Render editable configuration forms for any node
  const renderNodeConfigForNode = useCallback(
    (node: Node | null) => {
      if (!node) return null;

      const nodeType = node.type;
      const config = node.data?.config || {};

      switch (nodeType) {
        case "trigger":
          return (
            <div className="space-y-4">
              <div>
                <Label>Trigger Event</Label>
                <Select
                  value={config.trigger || ""}
                  onValueChange={(value) =>
                    updateNodeConfig(node.id, { trigger: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appointment_booked">
                      Appointment Booked
                    </SelectItem>
                    <SelectItem value="appointment_completed">
                      Appointment Completed
                    </SelectItem>
                    <SelectItem value="6_months_passed">
                      6 Months Passed
                    </SelectItem>
                    <SelectItem value="appointment_cancelled">
                      Appointment Cancelled
                    </SelectItem>
                    <SelectItem value="client_added">Client Added</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          );

        case "action":
          return (
            <div className="space-y-4">
              <div>
                <Label>Action Type</Label>
                <Select
                  value={config.action || ""}
                  onValueChange={(value) =>
                    updateNodeConfig(node.id, { action: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="send_sms">Send SMS</SelectItem>
                    <SelectItem value="send_email">Send Email</SelectItem>
                    <SelectItem value="add_tag">Add Tag</SelectItem>
                    <SelectItem value="remove_tag">Remove Tag</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(config.action === "send_sms" ||
                config.action === "send_email") && (
                <div>
                  <Label>Message</Label>
                  <Textarea
                    value={config.message || ""}
                    onChange={(e) =>
                      updateNodeConfig(node.id, { message: e.target.value })
                    }
                    placeholder={
                      config.action === "send_sms"
                        ? "Hi {{first_name}}, thank you for your appointment!"
                        : "Subject: Thank you!\n\nHi {{first_name}}, thank you for your appointment!"
                    }
                    rows={4}
                  />
                </div>
              )}

              {config.action === "send_email" && (
                <div>
                  <Label>Email Subject</Label>
                  <Input
                    value={config.subject || ""}
                    onChange={(e) =>
                      updateNodeConfig(node.id, { subject: e.target.value })
                    }
                    placeholder="Thank you for your appointment!"
                  />
                </div>
              )}

              {(config.action === "add_tag" ||
                config.action === "remove_tag") && (
                <div>
                  <Label>Tag</Label>
                  <Input
                    value={config.tag || ""}
                    onChange={(e) =>
                      updateNodeConfig(node.id, { tag: e.target.value })
                    }
                    placeholder="Enter tag name"
                  />
                </div>
              )}
            </div>
          );

        case "delay":
          return (
            <div className="space-y-4">
              <div>
                <Label>Delay Duration</Label>
                <Input
                  type="number"
                  value={config.duration || ""}
                  onChange={(e) =>
                    updateNodeConfig(node.id, {
                      duration: parseInt(e.target.value) || 1,
                    })
                  }
                  placeholder="1"
                  min="1"
                />
              </div>
              <div>
                <Label>Time Unit</Label>
                <Select
                  value={config.unit || "days"}
                  onValueChange={(value) =>
                    updateNodeConfig(node.id, { unit: value })
                  }
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
            </div>
          );

        case "condition":
          // Keep existing condition builder for condition nodes
          return null; // This will fall back to existing condition builder

        default:
          return (
            <div className="text-sm text-gray-600">
              <p>
                Configuration options for {nodeType} nodes will be available
                soon.
              </p>
              <div className="mt-2 bg-gray-50 rounded p-2">
                <pre className="text-xs">{JSON.stringify(config, null, 2)}</pre>
              </div>
            </div>
          );
      }
    },
    [updateNodeConfig],
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
          onNodeDelete: handleNodeDelete,
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
          action: "send_sms", // send_sms | send_email | add_tag | remove_tag
          message: "Hello! This is an automated message.",
          tag: "",
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
          onNodeDelete: handleNodeDelete,
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
    <div className="h-full flex bg-gray-50 relative">
      {/* Persistent toggle control anchored to sidebar edge */}
      <button
        onClick={() => setDirectoryMenuOpen(!directoryMenuOpen)}
        className="absolute top-1/2 -translate-y-1/2 z-50 bg-white border border-gray-200 rounded-r-md shadow-md hover:shadow-lg transition-all duration-200 p-2 hover:bg-gray-50"
        style={{ left: directoryMenuOpen ? 320 : 0 }}
        title={
          directoryMenuOpen ? "Close directory menu" : "Open directory menu"
        }
      >
        {directoryMenuOpen ? (
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-600" />
        )}
      </button>

      {/* Enhanced Workflow List Sidebar */}
      <div
        className={`overflow-hidden bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${
          directoryMenuOpen ? "w-80" : "w-0"
        }`}
      >
        <div
          className="w-80 h-full relative overflow-hidden"
          data-directory_menu_fix="true"
          data-directory-menu
        >
          <EnhancedWorkflowList orgId={orgId} viewMode="sidebar" />
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
              data-theme-aware="true"
              data-variant="light"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

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
              data-theme-aware="true"
              data-variant="light"
            >
              <Send className="h-4 w-4 mr-2" />
              Test Workflow
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              disabled={!canSave}
              className={!canSave ? "opacity-50 cursor-not-allowed" : ""}
              data-theme-aware="true"
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
              data-theme-aware="true"
              data-variant="light"
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
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onSelectionChange={handleSelectionChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            className="bg-gray-50"
            panOnScroll={true}
            selectionOnDrag={false}
            panOnDrag={[0, 1]}
            zoomOnScroll={true}
            zoomOnPinch={true}
            multiSelectionKeyCode={"Meta"}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            <Controls />
            <MiniMap />
          </ReactFlow>

          {/* Empty State - Add First Node Button */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <button
                className="pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-150 hover:scale-105 hover:shadow-lg cursor-pointer"
                onClick={(e) => handleNodePlusClick(e, "")}
                title="Add your first node"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          )}
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

            {/* Condition Builder (only for condition nodes) */}
            {selectedNode.type === "condition" && (
              <div className="space-y-3">
                <Label className="text-sm">Condition Builder</Label>
                <SmallConditionBuilder
                  config={
                    (selectedNode.data?.config as any) || {
                      conditions: [],
                      logic: "AND",
                    }
                  }
                  onChange={(next) => {
                    setNodes((nds) =>
                      nds.map((n) =>
                        n.id === selectedNode.id
                          ? {
                              ...n,
                              data: {
                                ...n.data,
                                config: { ...n.data?.config, ...next },
                                label: getNodeLabel("condition", next),
                              },
                            }
                          : n,
                      ),
                    );
                  }}
                />
              </div>
            )}

            <div>
              {/* User Statistics */}
              <div className="space-y-3">
                {selectedNode.data?.userCount > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700">
                      Active Users:
                    </h5>
                    <div className="max-h-32 overflow-y-auto themed-scroll space-y-1">
                      {(selectedNode.data?.users || [])
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
                      {(selectedNode.data?.userCount || 0) > 5 && (
                        <div className="text-xs text-gray-500 text-center py-1">
                          +{(selectedNode.data?.userCount || 0) - 5} more users
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Configuration */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Configuration
                </h4>
                {renderNodeConfig() || (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(selectedNode.data?.config, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Node Information */}
            <div className="mt-6 pt-4 border-t">
              <pre className="text-[10px] text-gray-400 font-mono bg-gray-50 p-1.5 rounded overflow-x-auto">
                {`Node ID: ${selectedNode.id}
Type: ${selectedNode.type}
Config: ${JSON.stringify(selectedNode.data?.config || {}, null, 2)}`}
              </pre>
            </div>
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
                    <div className="max-h-32 overflow-y-auto themed-scroll space-y-1">
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
              {renderNodeConfigForNode(selectedNodeForDetails) || (
                <div className="bg-gray-50 rounded-lg p-3">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(
                      selectedNodeForDetails.data?.config,
                      null,
                      2,
                    )}
                  </pre>
                </div>
              )}
            </div>

            {/* Node Information */}
            <div className="mt-6 pt-4 border-t">
              <pre className="text-[10px] text-gray-400 font-mono bg-gray-50 p-1.5 rounded overflow-x-auto">
                {`Node ID: ${selectedNodeForDetails.id}
Type: ${selectedNodeForDetails.type}
Config: ${JSON.stringify(selectedNodeForDetails.data?.config || {}, null, 2)}`}
              </pre>
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
            className="absolute bg-white rounded-lg shadow-lg border max-w-sm w-80 max-h-96 overflow-y-auto themed-scroll"
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
                        className="flex items-center p-2 rounded-md cursor-pointer transition-colors"
                        data-theme-aware="true"
                        data-variant="light"
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

// Compact condition builder component
function SmallConditionBuilder({
  config,
  onChange,
}: {
  config: {
    conditions: Array<{ field: string; operator: string; value: any }>;
    logic: "AND" | "OR";
  };
  onChange: (next: {
    conditions: Array<{ field: string; operator: string; value: any }>;
    logic: "AND" | "OR";
  }) => void;
}) {
  const fields = [
    { value: "tags", label: "Tags" },
    { value: "appointment_type", label: "Appointment Type" },
    { value: "last_visit", label: "Last Visit" },
  ];

  const operators = [
    { value: "equals", label: "equals" },
    { value: "not_equals", label: "not equals" },
    { value: "includes", label: "includes" },
    { value: "not_includes", label: "not includes" },
    { value: "date_before", label: "before" },
    { value: "date_after", label: "after" },
    { value: "days_ago", label: "days ago" },
  ];

  const update = (
    idx: number,
    patch: Partial<{ field: string; operator: string; value: any }>,
  ) => {
    const next = { ...config, conditions: [...config.conditions] };
    next.conditions[idx] = { ...next.conditions[idx], ...patch } as any;
    onChange(next);
  };

  const add = () =>
    onChange({
      ...config,
      conditions: [
        ...config.conditions,
        { field: "tags", operator: "includes", value: "" },
      ],
    });
  const remove = (idx: number) =>
    onChange({
      ...config,
      conditions: config.conditions.filter((_, i) => i !== idx),
    });

  const setLogic = (logic: "AND" | "OR") => onChange({ ...config, logic });

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-gray-600">Match</span>
        <Select value={config.logic} onValueChange={(v) => setLogic(v as any)}>
          <SelectTrigger className="h-7 px-2 text-xs w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AND">All (AND)</SelectItem>
            <SelectItem value="OR">Any (OR)</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-gray-600">conditions</span>
      </div>

      {config.conditions.map((c, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-4">
            <Select
              value={c.field}
              onValueChange={(v) => update(i, { field: v })}
            >
              <SelectTrigger className="h-7 px-2 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fields.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-4">
            <Select
              value={c.operator}
              onValueChange={(v) => update(i, { operator: v })}
            >
              <SelectTrigger className="h-7 px-2 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {operators.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-3">
            {c.field === "last_visit" && c.operator === "days_ago" ? (
              <Input
                className="h-7 text-xs"
                type="number"
                placeholder="e.g. 30"
                value={c.value ?? ""}
                onChange={(e) => update(i, { value: Number(e.target.value) })}
              />
            ) : c.field === "last_visit" &&
              (c.operator === "date_before" || c.operator === "date_after") ? (
              <Input
                className="h-7 text-xs"
                type="date"
                value={c.value ?? ""}
                onChange={(e) => update(i, { value: e.target.value })}
              />
            ) : (
              <Input
                className="h-7 text-xs"
                placeholder={
                  c.field === "appointment_type" ? "e.g. Morpheus8" : "e.g. vip"
                }
                value={c.value ?? ""}
                onChange={(e) => update(i, { value: e.target.value })}
              />
            )}
          </div>
          <div className="col-span-1 text-right">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-red-500"
              onClick={() => remove(i)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}

      <div className="pt-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={add}
        >
          <Plus className="h-3 w-3 mr-1" /> Add condition
        </Button>
      </div>
    </div>
  );
}
