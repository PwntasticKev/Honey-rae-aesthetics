"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Connection,
  Panel,
  Handle,
  Position,
  MarkerType,
  addEdge,
  XYPosition,
  ConnectionLineType,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExecutionLogs } from "@/components/ExecutionLogs";
import { EnrollmentHistory } from "@/components/EnrollmentHistory";
import { EmailService } from "@/lib/emailService";
import { useToast } from "@/hooks/use-toast";
import {
  Zap,
  Clock,
  MessageSquare,
  Mail,
  Save,
  X,
  ArrowLeft,
  Play,
  Pause,
  Settings,
  Trash2,
  FileText,
  Users,
  Activity,
  Tag,
} from "lucide-react";

interface ConfigField {
  key: string;
  label: string;
  type: "input" | "textarea" | "number" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface BlockType {
  type: string;
  label: string;
  icon: any;
  description: string;
  color: string;
  config: any;
  configFields?: ConfigField[];
}

interface WorkflowBlock {
  id: string;
  type: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  config: any;
  connections: string[];
}

interface WorkflowConnection {
  id: string;
  from: string;
  to: string;
  fromPort: string;
  toPort: string;
}

interface VisualWorkflowEditorProps {
  workflow?: {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    blocks: WorkflowBlock[];
    connections: WorkflowConnection[];
  };
  onSave: (workflow: any) => void;
  onCancel: () => void;
  environment?: "development" | "production";
}

const blockTypes: BlockType[] = [
  {
    type: "trigger",
    label: "Trigger",
    icon: Zap,
    description: "Start of workflow",
    color: "bg-blue-500",
    config: {
      event: "appointment_completed",
    },
    configFields: [
      {
        key: "event",
        label: "Trigger Event",
        type: "select",
        options: [
          { value: "appointment_completed", label: "Appointment Completed" },
          { value: "appointment_scheduled", label: "Appointment Scheduled" },
          { value: "client_added", label: "New Client Added" },
          { value: "follow_up_due", label: "Follow-up Due" },
          { value: "birthday", label: "Client Birthday" },
          { value: "contact_created", label: "Contact Created" },
          { value: "contact_changed", label: "Contact Changed" },
          { value: "note_added", label: "Note Added" },
          { value: "task_added", label: "Task Added" },
        ],
      },
    ],
  },
  {
    type: "delay",
    label: "Delay",
    icon: Clock,
    description: "Wait for time",
    color: "bg-yellow-500",
    config: {
      value: 1,
      unit: "days",
    },
    configFields: [
      {
        key: "value",
        label: "Delay Value",
        type: "number",
        placeholder: "1",
      },
      {
        key: "unit",
        label: "Delay Unit",
        type: "select",
        options: [
          { value: "minutes", label: "Minutes" },
          { value: "hours", label: "Hours" },
          { value: "days", label: "Days" },
          { value: "weeks", label: "Weeks" },
        ],
      },
    ],
  },
  {
    type: "send_sms",
    label: "Send SMS",
    icon: MessageSquare,
    description: "Send text message",
    color: "bg-green-500",
    config: {
      message: "{{first_name}}, thank you for your appointment!",
    },
    configFields: [
      {
        key: "message",
        label: "Message",
        type: "textarea",
        placeholder: "Enter your message...",
      },
    ],
  },
  {
    type: "send_email",
    label: "Send Email",
    icon: Mail,
    description: "Send email",
    color: "bg-purple-500",
    config: {
      subject: "Appointment Reminder",
      body: "Hi {{first_name}}, this is a reminder about your appointment.",
    },
    configFields: [
      {
        key: "subject",
        label: "Subject",
        type: "input",
        placeholder: "Email subject",
      },
      {
        key: "body",
        label: "Body",
        type: "textarea",
        placeholder: "Email body...",
      },
    ],
  },
  {
    type: "add_tag",
    label: "Add Tag",
    icon: Tag,
    description: "Add client tag",
    color: "bg-orange-500",
    config: {
      tag: "follow-up",
    },
    configFields: [
      {
        key: "tag",
        label: "Tag Name",
        type: "input",
        placeholder: "Enter tag name",
      },
    ],
  },
  {
    type: "if",
    label: "Condition",
    icon: Settings,
    description: "If statement",
    color: "bg-red-500",
    config: {
      field: "status",
      operator: "equals",
      value: "active",
    },
    configFields: [
      {
        key: "field",
        label: "Field",
        type: "input",
        placeholder: "Field name",
      },
      {
        key: "operator",
        label: "Operator",
        type: "select",
        options: [
          { value: "equals", label: "Equals" },
          { value: "contains", label: "Contains" },
          { value: "greater_than", label: "Greater Than" },
        ],
      },
      {
        key: "value",
        label: "Value",
        type: "input",
        placeholder: "Value to compare",
      },
    ],
  },
];

// Custom Node Components
const TriggerNode = ({ data, selected }: any) => {
  const blockType = blockTypes.find((bt) => bt.type === data.type);
  const Icon = blockType?.icon || Zap;

  const formatEvent = () => {
    const config = data.config || {};
    const event = config.event || "No event set";

    const eventLabels: { [key: string]: string } = {
      appointment_completed: "Appointment Completed",
      appointment_scheduled: "Appointment Scheduled",
      client_added: "New Client Added",
      follow_up_due: "Follow-up Due",
      birthday: "Client Birthday",
      contact_created: "Contact Created",
      contact_changed: "Contact Changed",
      note_added: "Note Added",
      task_added: "Task Added",
    };

    return eventLabels[event] || event;
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 ${blockType?.color} text-white min-w-[200px] shadow-lg ${selected ? "ring-2 ring-blue-300" : ""} cursor-pointer`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-white border-2 border-gray-300"
      />
      <div className="flex items-center space-x-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{blockType?.label}</span>
      </div>
      <div className="text-xs mt-1 opacity-90">{formatEvent()}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-white border-2 border-gray-300"
      />
    </div>
  );
};

const ActionNode = ({ data, selected }: any) => {
  const blockType = blockTypes.find((bt) => bt.type === data.type);
  const Icon = blockType?.icon || Settings;

  const getActionInfo = () => {
    const config = data.config || {};

    switch (data.type) {
      case "send_sms":
        const message = config.message || "No message set";
        return message.length > 25 ? message.substring(0, 25) + "..." : message;
      case "send_email":
        const subject = config.subject || "No subject set";
        return subject.length > 25 ? subject.substring(0, 25) + "..." : subject;
      case "add_tag":
        return config.tag || "No tag set";
      case "delay":
        const value = config.value || 1;
        const unit = config.unit || "days";
        const unitLabel =
          unit === "days"
            ? "day"
            : unit === "hours"
              ? "hour"
              : unit === "minutes"
                ? "minute"
                : unit === "weeks"
                  ? "week"
                  : unit;
        const plural = value === 1 ? unitLabel : unitLabel + "s";
        return `${value} ${plural}`;
      default:
        return blockType?.description || "Action";
    }
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 ${blockType?.color} text-white min-w-[200px] shadow-lg ${selected ? "ring-2 ring-blue-300" : ""} cursor-pointer`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-white border-2 border-gray-300"
      />
      <div className="flex items-center space-x-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{blockType?.label}</span>
      </div>
      <div className="text-xs mt-1 opacity-90">{getActionInfo()}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-white border-2 border-gray-300"
      />
    </div>
  );
};

const ConditionNode = ({ data, selected }: any) => {
  const blockType = blockTypes.find((bt) => bt.type === data.type);
  const Icon = blockType?.icon || Settings;

  const formatCondition = () => {
    const config = data.config || {};
    const condition = config.condition || "No condition set";
    const operator = config.operator || "equals";
    const value = config.value || "";

    const conditionLabels: { [key: string]: string } = {
      has_reviewed: "Has Reviewed",
      is_vip: "Is VIP Client",
      has_appointment: "Has Appointment",
    };

    const operatorLabels: { [key: string]: string } = {
      equals: "=",
      not_equals: "≠",
      contains: "contains",
    };

    const conditionLabel = conditionLabels[condition] || condition;
    const operatorLabel = operatorLabels[operator] || operator;

    return `${conditionLabel} ${operatorLabel} ${value}`;
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 ${blockType?.color} text-white min-w-[200px] shadow-lg ${selected ? "ring-2 ring-blue-300" : ""} cursor-pointer`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-white border-2 border-gray-300"
      />
      <div className="flex items-center space-x-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{blockType?.label}</span>
      </div>
      <div className="text-xs mt-1 opacity-90">{formatCondition()}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="w-3 h-3 bg-white border-2 border-gray-300"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        className="w-3 h-3 bg-white border-2 border-gray-300"
      />
    </div>
  );
};

const SendSMSNode = ({ data, selected }: any) => {
  const blockType = blockTypes.find((bt) => bt.type === data.type);
  const Icon = blockType?.icon || MessageSquare;

  const getMessage = () => {
    const config = data.config || {};
    const message = config.message || "No message set";
    return message.length > 30 ? message.substring(0, 30) + "..." : message;
  };

  return (
    <div
      className={`p-3 rounded-lg border-2 ${selected ? "border-blue-500" : "border-gray-200"} bg-white cursor-pointer`}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-100">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <div className="font-medium text-sm">Send SMS</div>
          <div className="text-xs text-gray-500">{getMessage()}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

const SendEmailNode = ({ data, selected }: any) => {
  const blockType = blockTypes.find((bt) => bt.type === data.type);
  const Icon = blockType?.icon || Mail;

  const getSubject = () => {
    const config = data.config || {};
    const subject = config.subject || "No subject set";
    return subject.length > 25 ? subject.substring(0, 25) + "..." : subject;
  };

  return (
    <div
      className={`p-3 rounded-lg border-2 ${selected ? "border-blue-500" : "border-gray-200"} bg-white cursor-pointer`}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-100">
          <Icon className="w-4 h-4 text-green-600" />
        </div>
        <div>
          <div className="font-medium text-sm">Send Email</div>
          <div className="text-xs text-gray-500">{getSubject()}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

const AddTagNode = ({ data, selected }: any) => {
  const blockType = blockTypes.find((bt) => bt.type === data.type);
  const Icon = blockType?.icon || Settings;

  const getTag = () => {
    const config = data.config || {};
    return config.tag || "No tag set";
  };

  return (
    <div
      className={`p-3 rounded-lg border-2 ${selected ? "border-blue-500" : "border-gray-200"} bg-white cursor-pointer`}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-100">
          <Icon className="w-4 h-4 text-orange-600" />
        </div>
        <div>
          <div className="font-medium text-sm">Add Tag</div>
          <div className="text-xs text-gray-500">{getTag()}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

const WorkflowDelayNode = ({ data, selected }: any) => {
  const blockType = blockTypes.find((bt) => bt.type === data.type);
  const Icon = blockType?.icon || Clock;

  const formatDelay = () => {
    const config = data.config || {};
    const value = config.value || 1;
    const unit = config.unit || "days";
    const unitLabel =
      unit === "days"
        ? "day"
        : unit === "hours"
          ? "hour"
          : unit === "minutes"
            ? "minute"
            : unit === "weeks"
              ? "week"
              : unit;
    const plural = value === 1 ? unitLabel : unitLabel + "s";
    return `${value} ${plural}`;
  };

  return (
    <div
      className={`p-3 rounded-lg border-2 ${selected ? "border-blue-500" : "border-gray-200"} bg-white cursor-pointer`}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-yellow-100">
          <Icon className="w-4 h-4 text-yellow-600" />
        </div>
        <div>
          <div className="font-medium text-sm">Delay</div>
          <div className="text-xs text-gray-500">{formatDelay()}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

function WorkflowEditor({
  workflow,
  onSave,
  onCancel,
}: VisualWorkflowEditorProps) {
  console.log("🔍 VisualWorkflowEditor received workflow:", {
    id: workflow?.id,
    name: workflow?.name,
    blocks: workflow?.blocks?.length,
    connections: workflow?.connections?.length,
  });

  // Add detailed logging for blocks and connections
  if (workflow?.blocks) {
    console.log("🔍 Workflow blocks:", workflow.blocks);
    console.log(
      "🔍 Block details:",
      workflow.blocks.map((block, index) => ({
        index,
        id: block.id,
        type: block.type,
        position: block.position,
        config: block.config,
      })),
    );
  }
  if (workflow?.connections) {
    console.log("🔍 Workflow connections:", workflow.connections);
  }
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesState] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const { toast } = useToast();
  const [workflowName, setWorkflowName] = useState(workflow?.name || "");
  const [workflowDescription, setWorkflowDescription] = useState(
    workflow?.description || "",
  );
  const [nodesInitialized, setNodesInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Add debugging to track node state changes
  useEffect(() => {
    console.log("🔍 Nodes state changed:", nodes.length, "nodes");
    console.log("🔍 Edges state changed:", edges.length, "edges");
  }, [nodes, edges]);

  // Reset initialization when workflow changes
  useEffect(() => {
    setNodesInitialized(false);
  }, [workflow?.id]);

  // Update workflow name and description when workflow changes
  useEffect(() => {
    if (workflow?.name && workflow.name !== "Loading...") {
      setWorkflowName(workflow.name);
    }
    if (
      workflow?.description &&
      workflow.description !== "Loading workflow data..."
    ) {
      setWorkflowDescription(workflow.description);
    }
  }, [workflow?.name, workflow?.description]);

  // Initialize nodes and edges from workflow data or create default trigger
  useEffect(() => {
    // Don't initialize nodes if we're in the middle of saving
    if (isSaving) {
      return;
    }

    // Always load nodes when workflow blocks are available and we haven't initialized yet
    if (workflow?.blocks && workflow.blocks.length > 0 && !nodesInitialized) {
      console.log(
        "🔍 Loading workflow blocks:",
        workflow.blocks.length,
        "blocks",
      );

      const initialNodes: Node[] = workflow.blocks.map((block, index) => {
        const nodeType =
          block.type === "trigger"
            ? "trigger"
            : block.type === "if"
              ? "condition"
              : block.type === "delay"
                ? "delay"
                : block.type === "send_sms"
                  ? "send_sms"
                  : block.type === "send_email"
                    ? "send_email"
                    : block.type === "add_tag"
                      ? "add_tag"
                      : "action";

        console.log(`🔍 Creating node ${index}:`, {
          id: block.id,
          type: block.type,
          nodeType,
          position: block.position,
          config: block.config,
        });

        return {
          id: block.id,
          type: nodeType,
          position: block.position,
          data: {
            type: block.type,
            config: block.config,
            label:
              blockTypes.find((bt) => bt.type === block.type)?.label ||
              block.type,
          },
        };
      });

      const initialEdges: Edge[] = workflow.connections
        .filter((conn) => conn.from && conn.to)
        .map((conn) => ({
          id: conn.id,
          source: conn.from,
          target: conn.to,
          sourceHandle: conn.fromPort || "output",
          targetHandle: conn.toPort || "input",
          type: "smoothstep",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: "#6B7280",
          },
          style: { stroke: "#6B7280", strokeWidth: 2 },
        }));

      console.log(
        "🔍 Setting nodes:",
        initialNodes.length,
        "and edges:",
        initialEdges.length,
      );
      console.log("🔍 Initial nodes:", initialNodes);
      console.log("🔍 Initial edges:", initialEdges);
      console.log("🔍 Current nodes state:", nodes);
      console.log("🔍 Current edges state:", edges);
      setNodes(initialNodes);
      setEdges(initialEdges);
      setNodesInitialized(true);
    } else if (
      workflow &&
      (!workflow.blocks || workflow.blocks.length === 0) &&
      !nodesInitialized
    ) {
      console.log("🔍 Creating default trigger node");
      // Create default trigger node for new workflows
      const defaultTrigger: Node = {
        id: "trigger_1",
        type: "trigger",
        position: { x: 250, y: 100 },
        data: {
          type: "trigger",
          config: { event: "appointment_completed" },
          label: "Trigger",
        },
      };
      setNodes([defaultTrigger]);
      setEdges([]);
      setNodesInitialized(true);
    }
  }, [workflow, setNodes, setEdges, nodesInitialized, isSaving]);

  const saveWorkflow = async () => {
    setIsSaving(true);

    try {
      // Filter out invalid connections with null port values
      const validConnections = edges
        .filter((edge) => edge.source && edge.target)
        .map((edge) => ({
          id: edge.id,
          from: edge.source,
          to: edge.target,
          fromPort: edge.sourceHandle || "output",
          toPort: edge.targetHandle || "input",
        }));

      const workflowData = {
        id: workflow?.id || `new_${Date.now()}`, // Preserve existing ID or create new one
        name:
          workflowName === "Loading..." ? "Untitled Workflow" : workflowName,
        description: workflowDescription,
        enabled: workflow?.enabled || false,
        blocks: nodes.map((node) => ({
          id: node.id,
          type: node.data?.type || node.type, // Use data.type for the actual block type
          position: node.position,
          width: node.width,
          height: node.height,
          config: node.data?.config || {},
        })),
        connections: validConnections,
      };

      console.log("🔍 Saving workflow:", {
        blocks: workflowData.blocks.length,
        connections: validConnections.length,
      });

      // Add detailed logging for connections
      console.log("🔍 All edges:", edges);
      console.log(
        "🔍 Edge details:",
        edges.map((edge, index) => ({
          index,
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
        })),
      );
      console.log("🔍 Valid connections:", validConnections);
      console.log(
        "🔍 Workflow connections before save:",
        workflowData.connections,
      );

      await onSave(workflowData);
    } catch (error) {
      console.error("Error saving workflow:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [selectedTestContact, setSelectedTestContact] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "builder" | "execution-logs" | "enrollment-history"
  >("builder");

  // Mock data for execution logs and enrollment history
  const mockExecutionLogs = [
    {
      _id: "1",
      client: {
        fullName: "Sarah Johnson",
        email: "sarah.johnson@email.com",
        phones: ["+1 (555) 123-4567"],
      },
      action: "send_sms",
      status: "executed" as const,
      executedAt: Date.now() - 86400000 * 2,
      message: "SMS sent successfully to Sarah Johnson",
      stepId: "send_followup_sms",
    },
    {
      _id: "2",
      client: {
        fullName: "Michael Chen",
        email: "michael.chen@email.com",
        phones: ["+1 (555) 234-5678"],
      },
      action: "send_email",
      status: "executed" as const,
      executedAt: Date.now() - 86400000 * 1,
      message: "Email sent successfully to Michael Chen",
      stepId: "send_review_email",
    },
    {
      _id: "3",
      client: {
        fullName: "Emily Rodriguez",
        email: "emily.rodriguez@email.com",
        phones: ["+1 (555) 345-6789"],
      },
      action: "add_tag",
      status: "executed" as const,
      executedAt: Date.now() - 86400000 * 3,
      message: "Tag 'followed_up' added to Emily Rodriguez",
      stepId: "add_followup_tag",
    },
  ];

  const mockEnrollments = [
    {
      _id: "1",
      client: {
        fullName: "Sarah Johnson",
        email: "sarah.johnson@email.com",
        phones: ["+1 (555) 123-4567"],
      },
      workflow: {
        name: "Appointment Follow-up",
        description: "Automated follow-up after appointments",
      },
      enrollmentReason: "appointment_completed",
      enrolledAt: Date.now() - 86400000 * 5,
      currentStep: "send_followup_sms",
      currentStatus: "active" as const,
      nextExecutionAt: Date.now() + 86400000 * 2,
      progress: 60,
      stepsCompleted: 3,
      totalSteps: 5,
    },
    {
      _id: "2",
      client: {
        fullName: "Michael Chen",
        email: "michael.chen@email.com",
        phones: ["+1 (555) 234-5678"],
      },
      workflow: {
        name: "New Client Welcome",
        description: "Welcome sequence for new clients",
      },
      enrollmentReason: "appointment_completed",
      enrolledAt: Date.now() - 86400000 * 3,
      currentStep: "send_review_email",
      currentStatus: "active" as const,
      nextExecutionAt: Date.now() + 86400000 * 1,
      progress: 40,
      stepsCompleted: 2,
      totalSteps: 5,
    },
    {
      _id: "3",
      client: {
        fullName: "Emily Rodriguez",
        email: "emily.rodriguez@email.com",
        phones: ["+1 (555) 345-6789"],
      },
      workflow: {
        name: "Birthday Reminder",
        description: "Send birthday wishes to clients",
      },
      enrollmentReason: "appointment_completed",
      enrolledAt: Date.now() - 86400000 * 7,
      currentStep: "add_followup_tag",
      currentStatus: "completed" as const,
      completedAt: Date.now() - 86400000 * 1,
      progress: 100,
      stepsCompleted: 4,
      totalSteps: 4,
    },
  ];

  const testWorkflow = async () => {
    if (!selectedTestContact) {
      toast({
        title: "Error",
        description: "Please select a test contact",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Testing Workflow",
      description: `Running workflow test for ${selectedTestContact}...`,
    });

    // Simulate workflow execution
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast({
      title: "Test Complete",
      description: `Workflow test completed for ${selectedTestContact}`,
    });
  };

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: "smoothstep",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: "#6B7280",
        },
        style: { stroke: "#6B7280", strokeWidth: 2 },
      };

      setEdges((eds) => {
        const updatedEdges = addEdge(newEdge, eds);
        return updatedEdges;
      });
    },
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance) {
        return;
      }

      // Get the React Flow container element
      const reactFlowElement = document.querySelector(
        ".react-flow",
      ) as HTMLElement;
      if (!reactFlowElement) {
        return;
      }

      const reactFlowBounds = reactFlowElement.getBoundingClientRect();
      const type = event.dataTransfer.getData("application/reactflow");
      const label = event.dataTransfer.getData("application/reactflow-label");

      if (typeof type === "undefined" || !reactFlowBounds) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Find the block type to get proper configuration
      const blockType = blockTypes.find((bt) => bt.type === type);

      // Determine the correct node type for React Flow
      let nodeType = "action"; // default
      if (type === "trigger") {
        nodeType = "trigger";
      } else if (type === "if") {
        nodeType = "condition";
      } else if (type === "delay") {
        nodeType = "delay"; // Use the specific type for delay
      } else if (
        type === "send_sms" ||
        type === "send_email" ||
        type === "add_tag"
      ) {
        nodeType = type; // Use the specific type for these actions
      }

      const newNode: Node = {
        id: `${type}_${Date.now()}`,
        type: nodeType,
        position,
        data: {
          type,
          label: label || blockType?.label || type,
          config: blockType?.config || {},
        },
        width: 200,
        height: 80,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes],
  );

  const onDragStart = (
    event: React.DragEvent,
    nodeType: string,
    label: string,
  ) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.setData("application/reactflow-label", label);
    event.dataTransfer.effectAllowed = "move";
  };

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setEditingNode(node);
    setShowRightPanel(true);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setEditingNode(null);
    setShowRightPanel(false);
  }, []);

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      );
      setSelectedNode(null);
      setEditingNode(null);
      setShowRightPanel(false);
    },
    [setNodes, setEdges],
  );

  const updateNodeConfig = useCallback(
    (nodeId: string, config: any) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  config: { ...node.data.config, ...config },
                },
              }
            : node,
        ),
      );
    },
    [setNodes],
  );

  const renderNodeConfig = () => {
    if (!editingNode) return null;

    const blockType = blockTypes.find(
      (bt) => bt.type === editingNode.data?.type,
    );
    if (!blockType?.configFields) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Configure {blockType.label}</h3>
        {blockType.configFields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            {field.type === "input" && (
              <Input
                id={field.key}
                value={editingNode.data?.config?.[field.key] || ""}
                onChange={(e) =>
                  updateNodeConfig(editingNode.id, {
                    [field.key]: e.target.value,
                  })
                }
                placeholder={field.placeholder}
              />
            )}
            {field.type === "textarea" && (
              <Textarea
                id={field.key}
                value={editingNode.data?.config?.[field.key] || ""}
                onChange={(e) =>
                  updateNodeConfig(editingNode.id, {
                    [field.key]: e.target.value,
                  })
                }
                placeholder={field.placeholder}
              />
            )}
            {field.type === "number" && (
              <Input
                id={field.key}
                type="number"
                value={editingNode.data?.config?.[field.key] || ""}
                onChange={(e) =>
                  updateNodeConfig(editingNode.id, {
                    [field.key]: parseInt(e.target.value) || 0,
                  })
                }
                placeholder={field.placeholder}
              />
            )}
            {field.type === "select" && (
              <Select
                value={editingNode.data?.config?.[field.key] || ""}
                onValueChange={(value) =>
                  updateNodeConfig(editingNode.id, {
                    [field.key]: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Memoize nodeTypes to prevent React Flow warnings
  const nodeTypes = useMemo(
    () => ({
      trigger: TriggerNode,
      condition: ConditionNode,
      delay: WorkflowDelayNode,
      send_sms: SendSMSNode,
      send_email: SendEmailNode,
      add_tag: AddTagNode,
      action: ActionNode,
    }),
    [],
  );

  // Memoize edgeTypes to prevent React Flow warnings
  const edgeTypes = useMemo(() => ({}), []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel */}
      <div className="w-80 bg-white border-r border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Workflows</span>
          </Button>
        </div>

        <div className="space-y-6">
          {/* Workflow Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Workflow Info
            </h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="workflow-name">Name</Label>
                <Input
                  id="workflow-name"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="Enter workflow name..."
                />
              </div>
              <div>
                <Label htmlFor="workflow-description">Description</Label>
                <Textarea
                  id="workflow-description"
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  placeholder="Describe your workflow..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Add Steps */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Add Steps
            </h3>
            <div className="space-y-2">
              {blockTypes.map((blockType) => (
                <div
                  key={blockType.type}
                  draggable
                  onDragStart={(event) =>
                    onDragStart(event, blockType.type, blockType.label)
                  }
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${blockType.color}`}
                  >
                    <blockType.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {blockType.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {blockType.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesState}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          className="bg-gray-50"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls />
          <MiniMap />
        </ReactFlow>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTestPanel(true)}
          >
            <Play className="w-4 h-4 mr-2" />
            Test Workflow
          </Button>
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={saveWorkflow}
            disabled={isSaving}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Workflow"}
          </Button>
        </div>
      </div>

      {/* Right Panel */}
      {showRightPanel && editingNode && (
        <div className="w-80 bg-white border-l border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Node Configuration</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRightPanel(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {renderNodeConfig()}
        </div>
      )}

      {/* Test Panel */}
      {showTestPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Test Workflow</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTestPanel(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="test-contact">Test Contact</Label>
                <Select
                  value={selectedTestContact}
                  onValueChange={setSelectedTestContact}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a test contact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sarah.johnson@email.com">
                      Sarah Johnson
                    </SelectItem>
                    <SelectItem value="michael.chen@email.com">
                      Michael Chen
                    </SelectItem>
                    <SelectItem value="emily.rodriguez@email.com">
                      Emily Rodriguez
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={testWorkflow}
                  disabled={!selectedTestContact}
                  className="flex-1"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Test
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowTestPanel(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function VisualWorkflowEditor(props: VisualWorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <WorkflowEditor {...props} />
    </ReactFlowProvider>
  );
}
