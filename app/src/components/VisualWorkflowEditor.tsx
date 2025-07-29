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
        label: "Duration",
        type: "number",
        placeholder: "1",
      },
      {
        key: "unit",
        label: "Unit",
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
        placeholder: "Enter your message here...",
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
      subject: "Follow-up",
      message: "Thank you for your appointment!",
    },
    configFields: [
      {
        key: "subject",
        label: "Subject",
        type: "input",
        placeholder: "Email subject...",
      },
      {
        key: "message",
        label: "Message",
        type: "textarea",
        placeholder: "Enter your email message...",
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
      tag: "followed_up",
    },
    configFields: [
      {
        key: "tag",
        label: "Tag Name",
        type: "input",
        placeholder: "Enter tag name...",
      },
    ],
  },
  {
    type: "if",
    label: "Condition",
    icon: Settings, // Changed from GitBranch to Settings
    description: "If statement",
    color: "bg-red-500",
    config: {
      condition: "has_reviewed",
      operator: "equals",
      value: "false",
    },
    configFields: [
      {
        key: "condition",
        label: "Condition",
        type: "select",
        options: [
          { value: "has_reviewed", label: "Has Reviewed" },
          { value: "is_vip", label: "Is VIP Client" },
          { value: "has_appointment", label: "Has Appointment" },
        ],
      },
      {
        key: "operator",
        label: "Operator",
        type: "select",
        options: [
          { value: "equals", label: "Equals" },
          { value: "not_equals", label: "Not Equals" },
          { value: "contains", label: "Contains" },
        ],
      },
      {
        key: "value",
        label: "Value",
        type: "input",
        placeholder: "Enter value...",
      },
    ],
  },
];

// Custom Node Components using React Flow patterns
const TriggerNode = ({ data, selected }: any) => {
  const blockType = blockTypes.find((bt) => bt.type === data.type);
  const Icon = blockType?.icon || Zap;

  // Format the trigger event display
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

  // Get the action type and display appropriate info
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

  // Format the condition display
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

  // Get the message from config
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

  // Get the subject from config
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

  // Get the tag from config
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

  // Format the delay display
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
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesState] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const { toast } = useToast();
  const [workflowName, setWorkflowName] = useState(
    workflow?.name || "New Workflow",
  );
  const [workflowDescription, setWorkflowDescription] = useState(
    workflow?.description || "",
  );
  const [nodesInitialized, setNodesInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update workflow name and description when workflow prop changes
  useEffect(() => {
    // Only update name if it's different from current state and not empty
    if (
      workflow?.name &&
      workflow.name !== "Loading..." &&
      workflow.name !== workflowName
    ) {
      setWorkflowName(workflow.name);
    }
    if (
      workflow?.description !== undefined &&
      workflow.description !== workflowDescription
    ) {
      setWorkflowDescription(workflow.description);
    }
  }, [workflow]); // Remove workflowName and workflowDescription from dependencies
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

  // Initialize nodes and edges from workflow data or create default trigger
  useEffect(() => {
    // Don't initialize nodes if we're in the middle of saving
    if (isSaving) {
      return;
    }

    // Don't reset nodes if we already have nodes and they haven't been initialized yet
    if (nodes.length > 0 && !nodesInitialized) {
      setNodesInitialized(true);
      return;
    }

    // Only initialize nodes if they haven't been initialized yet
    if (nodesInitialized) {
      return;
    }

    if (workflow?.blocks && workflow.blocks.length > 0) {
      const initialNodes: Node[] = workflow.blocks.map((block, index) => ({
        id: block.id,
        type:
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
                      : "action",
        position: block.position,
        data: {
          type: block.type,
          config: block.config,
          label:
            blockTypes.find((bt) => bt.type === block.type)?.label ||
            block.type,
        },
      }));

      const initialEdges: Edge[] = workflow.connections.map((conn) => ({
        id: conn.id,
        source: conn.from,
        target: conn.to,
        sourceHandle: conn.fromPort,
        targetHandle: conn.toPort,
        type: "smoothstep",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: "#6B7280",
        },
        style: { stroke: "#6B7280", strokeWidth: 2 },
      }));

      setNodes(initialNodes);
      setEdges(initialEdges);
      setNodesInitialized(true);
    } else if (workflow && (!workflow.blocks || workflow.blocks.length === 0)) {
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
  }, [workflow, setNodes, setEdges, nodesInitialized, isSaving, nodes.length]);

  const saveWorkflow = () => {
    setIsSaving(true);

    const workflowData = {
      id: workflow?.id || Date.now().toString(),
      name: workflowName,
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
      connections: edges.map((edge) => ({
        id: edge.id,
        from: edge.source,
        to: edge.target,
        fromPort: edge.sourceHandle,
        toPort: edge.targetHandle,
      })),
    };

    onSave(workflowData);
  };

  const testWorkflow = async () => {
    if (!selectedTestContact) {
      toast({
        title: "Error",
        description: "Please select a contact to test with",
        variant: "destructive",
      });
      return;
    }

    // Extract email from contact string
    const emailMatch = selectedTestContact.match(/\(([^)]+)\)/);
    const email = emailMatch ? emailMatch[1] : selectedTestContact;
    const name = selectedTestContact.split(" (")[0];

    // Find trigger node
    const triggerNode = nodes.find((node) => node.type === "trigger");
    if (!triggerNode) {
      toast({
        title: "Error",
        description: "No trigger node found in workflow",
        variant: "destructive",
      });
      return;
    }

    // Execute each node sequentially
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      switch (node.data.type) {
        case "send_sms":
          const smsMessage =
            node.data.config.message?.replace("{{first_name}}", name) ||
            "Test SMS message";
          await EmailService.sendSMS({ to: email, message: smsMessage });
          break;
        case "send_email":
          const emailSubject = node.data.config.subject || "Test Email";
          const emailMessage =
            node.data.config.message?.replace("{{first_name}}", name) ||
            "Test email message";
          await EmailService.sendEmail({
            to: email,
            subject: emailSubject,
            message: emailMessage,
          });
          break;
        case "add_tag":
          const tag = node.data.config.tag || "test_tag";
          await EmailService.addTag(selectedTestContact, tag);
          break;
        case "delay":
          const value = node.data.config.value || 1;
          const unit = node.data.config.unit || "days";

          // Convert to milliseconds for actual delay
          let delayMs = 0;
          switch (unit) {
            case "minutes":
              delayMs = value * 60 * 1000;
              break;
            case "hours":
              delayMs = value * 60 * 60 * 1000;
              break;
            case "days":
              delayMs = value * 24 * 60 * 60 * 1000;
              break;
            case "weeks":
              delayMs = value * 7 * 24 * 60 * 60 * 1000;
              break;
            default:
              delayMs = value * 60 * 1000; // default to minutes
          }

          // Show delay message with countdown
          const delayMessage = `⏰ Delaying for ${value} ${unit} for ${selectedTestContact}\n\nThis will take ${delayMs / 1000} seconds...`;
          alert(delayMessage);

          // Show progress every second
          const totalSeconds = Math.floor(delayMs / 1000);
          for (let second = 1; second <= totalSeconds; second++) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }

          break;
        case "if":
          toast({
            title: "Condition Checked",
            description: `${node.data.config.condition} ${node.data.config.operator} ${node.data.config.value}`,
            variant: "default",
          });
          break;
      }
    }

    alert(`✅ Workflow test completed for ${selectedTestContact}!`);
    setShowTestPanel(false);
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
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    console.log("Drag over event");
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      console.log("Drop event triggered");

      if (!reactFlowInstance) {
        console.log("No reactFlowInstance available");
        return;
      }

      // Get the React Flow container element
      const reactFlowElement = document.querySelector(
        ".react-flow",
      ) as HTMLElement;
      if (!reactFlowElement) {
        console.log("No React Flow element found");
        return;
      }

      const reactFlowBounds = reactFlowElement.getBoundingClientRect();
      const type = event.dataTransfer.getData("application/reactflow");
      const label = event.dataTransfer.getData("application/reactflow-label");

      console.log("Drop data:", { type, label, reactFlowBounds });

      if (typeof type === "undefined" || !reactFlowBounds) {
        console.log("Invalid drop data or bounds");
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      console.log("Calculated position:", position);

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

      console.log("Creating new node:", newNode);
      console.log("Node type:", nodeType, "Original type:", type);
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes],
  );

  const onDragStart = (
    event: React.DragEvent,
    nodeType: string,
    label: string,
  ) => {
    console.log("Drag started:", { nodeType, label });
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.setData("application/reactflow-label", label);
    event.dataTransfer.effectAllowed = "move";
  };

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log("Node clicked:", node);
    console.log("Node data:", node.data);
    console.log("Node type:", node.type);
    console.log("Node config:", node.data?.config);
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
      console.log("Updating node config:", nodeId, config);
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const updatedNode = { ...node, data: { ...node.data, config } };
            console.log("Updated node:", updatedNode);
            return updatedNode;
          }
          return node;
        }),
      );
    },
    [setNodes],
  );

  const renderNodeConfig = () => {
    if (!editingNode) return null;

    console.log("Rendering config for node:", editingNode);
    console.log("Node data type:", editingNode.data?.type);

    // Find block type by the actual type in data, not the React Flow node type
    const blockType = blockTypes.find(
      (bt) => bt.type === editingNode.data?.type,
    );
    console.log("Found block type:", blockType);
    if (!blockType) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Configure {blockType.label}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedNode(null);
              setEditingNode(null);
              setShowRightPanel(false);
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {blockType.configFields?.map((field, index) => (
          <div key={index} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            {field.type === "input" && (
              <Input
                id={field.key}
                value={editingNode.data?.config?.[field.key] || ""}
                onChange={(e) => {
                  const newConfig = {
                    ...editingNode.data?.config,
                    [field.key]: e.target.value,
                  };
                  updateNodeConfig(editingNode.id, newConfig);
                }}
                placeholder={field.placeholder}
              />
            )}
            {field.type === "textarea" && (
              <Textarea
                id={field.key}
                value={editingNode.data?.config?.[field.key] || ""}
                onChange={(e) => {
                  const newConfig = {
                    ...editingNode.data?.config,
                    [field.key]: e.target.value,
                  };
                  updateNodeConfig(editingNode.id, newConfig);
                }}
                placeholder={field.placeholder}
                rows={3}
              />
            )}
            {field.type === "number" && (
              <Input
                id={field.key}
                type="number"
                value={editingNode.data?.config?.[field.key] || ""}
                onChange={(e) => {
                  console.log(
                    "Number value changed:",
                    field.key,
                    e.target.value,
                  );
                  const newConfig = {
                    ...editingNode.data?.config,
                    [field.key]: parseInt(e.target.value) || 0,
                  };
                  console.log("New config:", newConfig);
                  updateNodeConfig(editingNode.id, newConfig);
                }}
                placeholder={field.placeholder}
              />
            )}
            {field.type === "select" && (
              <Select
                value={editingNode.data?.config?.[field.key] || ""}
                onValueChange={(value) => {
                  console.log("Select value changed:", field.key, value);
                  const newConfig = {
                    ...editingNode.data?.config,
                    [field.key]: value,
                  };
                  console.log("New config:", newConfig);
                  updateNodeConfig(editingNode.id, newConfig);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={field.placeholder} />
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

        <div className="pt-4 border-t">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteNode(editingNode.id)}
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Node
          </Button>
        </div>
      </div>
    );
  };

  const nodeTypes = useMemo(
    () => ({
      trigger: TriggerNode,
      action: ActionNode,
      condition: ConditionNode,
      delay: WorkflowDelayNode,
      send_sms: SendSMSNode,
      send_email: SendEmailNode,
      add_tag: AddTagNode,
      if: ConditionNode,
    }),
    [],
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Workflows
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {workflowName}
                </h1>
                <p className="text-sm text-gray-500">Workflow Builder</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowTestPanel(true)}
                className="bg-blue-50 text-blue-600 hover:bg-blue-100"
              >
                <Play className="w-4 h-4 mr-2" />
                Test Workflow
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                onClick={saveWorkflow}
                className="bg-gradient-to-r from-pink-500 to-purple-600"
                disabled={isSaving}
              >
                {isSaving ? (
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isSaving ? "Saving..." : "Save Workflow"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("builder")}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === "builder"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Builder</span>
            </button>
            <button
              onClick={() => setActiveTab("execution-logs")}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === "execution-logs"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Execution Logs</span>
            </button>
            <button
              onClick={() => setActiveTab("enrollment-history")}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === "enrollment-history"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Enrollment History</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeTab === "builder" && (
        <div className="flex h-[calc(100vh-128px)]">
          {/* Left Panel */}
          <div className="w-80 bg-white border-r overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Workflow Info */}
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Workflow Info</h3>
                <Label htmlFor="workflow-name" className="mb-1 block">
                  Name
                </Label>
                <Input
                  id="workflow-name"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="My New Workflow"
                  className="mb-2"
                />
                <Label htmlFor="workflow-description" className="mb-1 block">
                  Description
                </Label>
                <Textarea
                  id="workflow-description"
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  placeholder="Describe your workflow"
                />
              </div>

              {/* Workflow Blocks */}
              <div>
                <h3 className="font-semibold mb-3">Add Steps</h3>
                <div className="space-y-2">
                  {blockTypes.map((blockType) => (
                    <div
                      key={blockType.type}
                      className="p-2 border rounded-lg flex flex-col items-center cursor-grab hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      onDragStart={(event) =>
                        onDragStart(event, blockType.type, blockType.label)
                      }
                      draggable
                      data-testid={`draggable-block-${blockType.type}`}
                    >
                      <blockType.icon className="h-4 w-4 mb-1 text-blue-500" />
                      <span className="text-xs font-medium text-center">
                        {blockType.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Canvas */}
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
              nodeTypes={nodeTypes}
              fitView={false}
              defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
              className="bg-gray-100 dark:bg-gray-800"
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              proOptions={{ hideAttribution: true }}
              data-testid="react-flow-canvas"
              panOnScroll={true}
              zoomOnScroll={false}
              zoomOnPinch={true}
              panOnDrag={true}
              connectionLineType={ConnectionLineType.SmoothStep}
              connectionLineStyle={{ stroke: "#6B7280", strokeWidth: 2 }}
            >
              <MiniMap
                nodeColor={(n) => {
                  if (n.type === "trigger") return "#6EE7B7";
                  if (n.type === "condition") return "#FCD34D";
                  return "#93C5FD";
                }}
                style={{ width: 150, height: 100 }}
                zoomable={true}
                pannable={true}
              />
              <Controls />
              <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            </ReactFlow>

            {/* Empty state */}
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center bg-white/90 p-8 rounded-lg shadow-lg">
                  <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Start Building Your Workflow
                  </h3>
                  <p className="text-gray-600">
                    Drag and drop blocks from the left panel to begin.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Node Configuration */}
          {showRightPanel && editingNode && (
            <div
              className="w-80 bg-white border-l overflow-y-auto"
              data-testid="node-config-panel"
            >
              <div className="p-4">{renderNodeConfig()}</div>
            </div>
          )}

          {/* Test Panel - Right Side */}
          {showTestPanel && (
            <div
              className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-40"
              data-testid="test-panel"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Test Workflow</h3>
                  <button
                    onClick={() => setShowTestPanel(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label
                      htmlFor="test-contact"
                      className="text-sm font-medium"
                    >
                      Select Contact
                    </Label>
                    <Select
                      value={selectedTestContact}
                      onValueChange={setSelectedTestContact}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Choose a contact to test with" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kevin lee (pwntastickevin@gmail.com)">
                          kevin lee (pwntastickevin@gmail.com)
                        </SelectItem>
                        <SelectItem value="sarah smith (sarah@example.com)">
                          sarah smith (sarah@example.com)
                        </SelectItem>
                        <SelectItem value="john doe (john@example.com)">
                          john doe (john@example.com)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">
                      Test Instructions
                    </h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Select a contact to simulate workflow execution</li>
                      <li>
                        • Delays will actually wait for the specified time
                      </li>
                      <li>• Emails/SMS will show alerts with content</li>
                      <li>• Check console for detailed execution logs</li>
                    </ul>
                  </div>

                  <Button
                    onClick={testWorkflow}
                    className="w-full"
                    disabled={!selectedTestContact}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run Test
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "execution-logs" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ExecutionLogs
            logs={mockExecutionLogs}
            onRefresh={() => console.log("Refresh execution logs")}
          />
        </div>
      )}

      {activeTab === "enrollment-history" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EnrollmentHistory
            enrollments={mockEnrollments}
            onRefresh={() => console.log("Refresh enrollment history")}
          />
        </div>
      )}
    </div>
  );
}

export function VisualWorkflowEditor(props: VisualWorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <div data-testid="workflow-editor">
        <WorkflowEditor {...props} />
      </div>
    </ReactFlowProvider>
  );
}
