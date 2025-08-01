"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTable } from "@/components/ui/data-table";
import {
  Plus,
  Zap,
  Play,
  Pause,
  Clock,
  MessageSquare,
  Mail,
  Calendar,
  Settings,
  Edit3,
  Send,
  Smartphone,
} from "lucide-react";
import { WorkflowForm } from "./WorkflowForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

interface Workflow {
  _id: string;
  name: string;
  description?: string;
  trigger: string;
  enabled?: boolean;
  isActive?: boolean;
  steps?: any[];
  actions?: any[];
  conditions?: any[];
  createdAt: number;
  lastRun?: number;
  runCount?: number;
}

interface WorkflowListProps {
  workflows: Workflow[];
  onAddWorkflow: () => void;
  onEditWorkflow: (id: string) => void;
  onDeleteWorkflow: (id: string) => void;
  onToggleWorkflow: (id: string, enabled: boolean) => void;
}

interface TestWorkflowModalProps {
  workflow: Workflow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TestWorkflowModal = ({
  workflow,
  open,
  onOpenChange,
}: TestWorkflowModalProps) => {
  const [testType, setTestType] = useState<"email" | "sms">("email");
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendTest = async () => {
    setIsSending(true);

    // Simulate sending a test message
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log(`Sending test ${testType} to ${recipient}:`, message);

    // In a real app, this would call your backend API
    // await fetch('/api/test-workflow', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ workflowId: workflow._id, type: testType, recipient, message })
    // });

    setIsSending(false);
    onOpenChange(false);
    alert(`Test ${testType.toUpperCase()} sent to ${recipient}!`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Test Workflow: {workflow.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="test-type">Test Type</Label>
            <Select
              value={testType}
              onValueChange={(value: "email" | "sms") => setTestType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </div>
                </SelectItem>
                <SelectItem value="sms">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-4 h-4" />
                    <span>SMS</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="recipient">
              {testType === "email" ? "Email Address" : "Phone Number"}
            </Label>
            <Input
              id="recipient"
              type={testType === "email" ? "email" : "tel"}
              placeholder={
                testType === "email" ? "test@example.com" : "+1234567890"
              }
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your test message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendTest}
              disabled={!recipient || !message || isSending}
              data-theme-aware="true"
            >
              {isSending ? "Sending..." : `Send Test ${testType.toUpperCase()}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const getWorkflowIcon = (trigger: string) => {
  switch (trigger) {
    case "appointment_completed":
      return Calendar;
    case "client_added":
      return MessageSquare;
    case "birthday":
      return Clock;
    default:
      return Zap;
  }
};

const getWorkflowStatus = (enabled: boolean) => {
  return enabled ? "active" : "inactive";
};

const getWorkflowStatusColor = (enabled: boolean) => {
  return enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
};

export function WorkflowList({
  workflows,
  onAddWorkflow,
  onEditWorkflow,
  onDeleteWorkflow,
  onToggleWorkflow,
}: WorkflowListProps) {
  const router = useRouter();
  const [filteredWorkflows, setFilteredWorkflows] =
    useState<Workflow[]>(workflows);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [testWorkflow, setTestWorkflow] = useState<Workflow | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);

  // Update filtered workflows when workflows prop changes
  React.useEffect(() => {
    setFilteredWorkflows(workflows);
  }, [workflows]);

  const handleSearch = (query: string) => {
    const filtered = workflows.filter(
      (workflow) =>
        workflow.name.toLowerCase().includes(query.toLowerCase()) ||
        workflow.description?.toLowerCase().includes(query.toLowerCase()) ||
        workflow.trigger.toLowerCase().includes(query.toLowerCase()),
    );
    setFilteredWorkflows(filtered);
  };

  const handleAddWorkflow = () => {
    // Navigate to the workflow editor page
    router.push("/workflow-editor");
  };

  const handleEditWorkflow = (id: string) => {
    // Navigate to the workflow editor page with the workflow ID
    router.push(`/workflow-editor?id=${id}`);
  };

  const handleDeleteWorkflow = (id: string) => {
    onDeleteWorkflow(id);
  };

  const handleViewWorkflow = (id: string) => {
    // Navigate to the workflow editor page with the workflow ID
    router.push(`/workflow-editor?id=${id}`);
  };

  const handleTestWorkflow = (workflow: Workflow) => {
    setTestWorkflow(workflow);
    setShowTestModal(true);
  };

  if (showAddForm) {
    return (
      <WorkflowForm
        onSubmit={(workflow) => {
          setShowAddForm(false);
        }}
        onCancel={() => setShowAddForm(false)}
      />
    );
  }

  if (editingWorkflow) {
    return (
      <WorkflowForm
        onSubmit={(workflow) => {
          setEditingWorkflow(null);
        }}
        onCancel={() => setEditingWorkflow(null)}
      />
    );
  }

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (value: any, workflow: Workflow) => {
        if (!workflow) return <div>No workflow data</div>;
        const isActive = workflow.enabled || workflow.isActive || false;
        return (
          <div
            className={`flex items-center space-x-3 p-2 rounded-lg ${isActive ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-200"}`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? "bg-green-100" : "bg-gray-100"}`}
            >
              {React.createElement(getWorkflowIcon(workflow.trigger || ""), {
                className: `w-4 h-4 ${isActive ? "text-green-600" : "text-gray-600"}`,
              })}
            </div>
            <div>
              <div
                className={`font-medium ${isActive ? "text-green-900" : "text-gray-900"}`}
              >
                {workflow.name || "Unnamed Workflow"}
              </div>
              <div
                className={`text-sm ${isActive ? "text-green-600" : "text-gray-500"}`}
              >
                {workflow.description || "No description"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "trigger",
      label: "Trigger",
      render: (value: any, workflow: Workflow) => {
        if (!workflow) return <div>No trigger</div>;
        return (
          <div className="text-sm text-gray-900 capitalize">
            {workflow.trigger?.replace(/_/g, " ") || "Unknown trigger"}
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (value: any, workflow: Workflow) => {
        if (!workflow)
          return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
        const isActive = workflow.enabled || workflow.isActive || false;
        return (
          <Badge className={getWorkflowStatusColor(isActive)}>
            {getWorkflowStatus(isActive)}
          </Badge>
        );
      },
    },
    {
      key: "stats",
      label: "Stats",
      render: (value: any, workflow: Workflow) => {
        if (!workflow)
          return <div className="text-sm text-gray-500">No stats</div>;
        return (
          <div className="text-sm text-gray-500">
            {workflow.runCount || 0} runs
            {workflow.lastRun && (
              <div>Last: {new Date(workflow.lastRun).toLocaleDateString()}</div>
            )}
          </div>
        );
      },
    },
  ];

  const renderCustomActions = (workflow: Workflow) => {
    if (!workflow) return null;
    const isActive = workflow.enabled || workflow.isActive || false;
    return (
      <div className="flex items-center space-x-2">
        <Button
          variant={isActive ? "outline" : "default"}
          size="sm"
          onClick={() => onToggleWorkflow(workflow._id, !isActive)}
          data-theme-aware="true"
        >
          {isActive ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span className="ml-1">{isActive ? "Pause" : "Activate"}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEditWorkflow(workflow._id)}
          data-testid="edit-workflow"
        >
          <Edit3 className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleTestWorkflow(workflow)}
          data-testid="test-workflow"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  return (
    <>
      <DataTable
        data={filteredWorkflows}
        columns={columns}
        searchPlaceholder="Search workflows..."
        onSearch={handleSearch}
        onEdit={handleEditWorkflow}
        onDelete={handleDeleteWorkflow}
        onView={handleViewWorkflow}
        customActions={renderCustomActions}
        actions={
          <div className="flex space-x-2">
            <Button
              onClick={handleAddWorkflow}
              data-theme-aware="true"
              data-testid="add-workflow-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Workflow
            </Button>
          </div>
        }
        data-testid="workflow-list"
      />

      {/* Test Workflow Modal */}
      {testWorkflow && (
        <TestWorkflowModal
          workflow={testWorkflow}
          open={showTestModal}
          onOpenChange={setShowTestModal}
        />
      )}
    </>
  );
}
