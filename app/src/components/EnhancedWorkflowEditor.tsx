"use client";

import React, { useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  config: any;
  comments?: string;
}

interface WorkflowConnection {
  id: string;
  from: string;
  to: string;
  fromPort: string;
  toPort: string;
}

interface EnhancedWorkflowEditorProps {
  workflowId?: string;
  orgId: string;
}

export function EnhancedWorkflowEditor({
  workflowId,
  orgId,
}: EnhancedWorkflowEditorProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("design");
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [nodeComment, setNodeComment] = useState("");

  // Workflow state
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [workflowTrigger, setWorkflowTrigger] = useState(
    "appointment_completed",
  );
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<WorkflowConnection[]>([]);

  // Queries
  const workflow = useQuery(
    api.enhancedWorkflows.getWorkflows,
    workflowId ? { orgId: orgId as any, directoryId: undefined } : "skip",
  );
  const enrollments = useQuery(
    api.enhancedWorkflows.getWorkflowEnrollments,
    workflowId ? { workflowId: workflowId as any } : "skip",
  );
  const executionLogs = useQuery(
    api.enhancedWorkflows.getExecutionLogs,
    workflowId ? { workflowId: workflowId as any, limit: 50 } : "skip",
  );
  const workflowStats = useQuery(
    api.enhancedWorkflows.getWorkflowStats,
    workflowId ? { workflowId: workflowId as any } : "skip",
  );
  const messageTemplates = useQuery(api.messageTemplates.getByOrg, orgId ? { orgId: orgId as any } : "skip");

  // Mutations
  const createWorkflow = useMutation(api.enhancedWorkflows.createWorkflow);
  const updateWorkflow = useMutation(api.workflows.update);

  const nodeTypes = [
    {
      type: "delay",
      label: "Wait/Delay",
      icon: Clock,
      color: "bg-blue-100 text-blue-800",
      description: "Wait for a specified amount of time",
    },
    {
      type: "send_sms",
      label: "Send SMS",
      icon: MessageSquare,
      color: "bg-green-100 text-green-800",
      description: "Send a text message to the client",
    },
    {
      type: "send_email",
      label: "Send Email",
      icon: Mail,
      color: "bg-purple-100 text-purple-800",
      description: "Send an email to the client",
    },
    {
      type: "conditional",
      label: "If Statement",
      icon: GitBranch,
      color: "bg-yellow-100 text-yellow-800",
      description: "Branch workflow based on conditions",
    },
    {
      type: "add_tag",
      label: "Add Tag",
      icon: Tag,
      color: "bg-orange-100 text-orange-800",
      description: "Add a tag to the client",
    },
    {
      type: "create_appointment",
      label: "Schedule Appointment",
      icon: Calendar,
      color: "bg-indigo-100 text-indigo-800",
      description: "Create a new appointment",
    },
    {
      type: "add_note",
      label: "Add Note",
      icon: FileText,
      color: "bg-gray-100 text-gray-800",
      description: "Add a note to the client record",
    },
  ];

  const conditionOperators = [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not Equals" },
    { value: "contains", label: "Contains" },
    { value: "greater_than", label: "Greater Than" },
    { value: "less_than", label: "Less Than" },
    { value: "greater_than_or_equal", label: "Greater Than or Equal" },
    { value: "less_than_or_equal", label: "Less Than or Equal" },
    { value: "is_empty", label: "Is Empty" },
    { value: "is_not_empty", label: "Is Not Empty" },
    { value: "date_before", label: "Date Before" },
    { value: "date_after", label: "Date After" },
    { value: "days_ago", label: "Days Ago" },
    { value: "has_tag", label: "Has Tag" },
    { value: "not_has_tag", label: "Does Not Have Tag" },
  ];

  const conditionFields = [
    { value: "first_name", label: "First Name" },
    { value: "last_name", label: "Last Name" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "age", label: "Age" },
    { value: "gender", label: "Gender" },
    { value: "last_visit", label: "Last Visit Date" },
    { value: "total_visits", label: "Total Visits" },
    { value: "tags", label: "Client Tags" },
    { value: "membership_type", label: "Membership Type" },
    { value: "referral_source", label: "Referral Source" },
    { value: "appointment_history", label: "Appointment History" },
    { value: "custom_field_1", label: "Custom Field 1" },
    { value: "custom_field_2", label: "Custom Field 2" },
  ];

  const addNode = (nodeType: string) => {
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: nodeType,
      position: { x: 100 + nodes.length * 50, y: 100 + nodes.length * 50 },
      width: 200,
      height: 120,
      config: getDefaultNodeConfig(nodeType),
      comments: "",
    };
    setNodes([...nodes, newNode]);
  };

  const getDefaultNodeConfig = (nodeType: string) => {
    switch (nodeType) {
      case "delay":
        return { delayMinutes: 15 };
      case "send_sms":
        return { templateId: null, message: "", useTemplate: false };
      case "send_email":
        return {
          templateId: null,
          subject: "",
          message: "",
          useTemplate: false,
        };
      case "conditional":
        return {
          conditions: [{ field: "first_name", operator: "equals", value: "" }],
          logic: "and", // "and" or "or"
        };
      case "add_tag":
        return { tag: "" };
      case "create_appointment":
        return { appointmentType: "follow-up", daysFromTrigger: 7 };
      case "add_note":
        return { noteText: "", tag: "general" };
      default:
        return {};
    }
  };

  const updateNodeConfig = (nodeId: string, config: any) => {
    setNodes(
      nodes.map((node) =>
        node.id === nodeId
          ? { ...node, config: { ...node.config, ...config } }
          : node,
      ),
    );
  };

  const updateNodeComment = (nodeId: string, comment: string) => {
    setNodes(
      nodes.map((node) =>
        node.id === nodeId ? { ...node, comments: comment } : node,
      ),
    );
  };

  const handleSaveWorkflow = async () => {
    try {
      if (workflowId) {
        await updateWorkflow({
          id: workflowId as any,
          name: workflowName,
          description: workflowDescription,
          blocks: nodes,
          connections,
        });
      } else {
        await createWorkflow({
          orgId: orgId as any,
          name: workflowName,
          description: workflowDescription,
          trigger: workflowTrigger as any,
          blocks: nodes,
          connections,
        });
      }
      alert("Workflow saved successfully!");
    } catch (error) {
      console.error("Failed to save workflow:", error);
      alert("Failed to save workflow");
    }
  };

  const renderNodeConfig = (node: WorkflowNode) => {
    switch (node.type) {
      case "delay":
        return (
          <div className="space-y-4">
            <div>
              <Label>Delay Duration (minutes)</Label>
              <Input
                type="number"
                value={node.config.delayMinutes || 15}
                onChange={(e) =>
                  updateNodeConfig(node.id, {
                    delayMinutes: parseInt(e.target.value),
                  })
                }
                min="1"
                max="10080" // 1 week
              />
            </div>
          </div>
        );

      case "send_sms":
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="use-template"
                checked={node.config.useTemplate}
                onChange={(e) =>
                  updateNodeConfig(node.id, { useTemplate: e.target.checked })
                }
              />
              <Label htmlFor="use-template">Use Template</Label>
            </div>

            {node.config.useTemplate ? (
              <div>
                <Label>SMS Template</Label>
                <Select
                  value={node.config.templateId || ""}
                  onValueChange={(value) =>
                    updateNodeConfig(node.id, { templateId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {messageTemplates
                      ?.filter((t) => t.type === "sms")
                      .map((template) => (
                        <SelectItem key={template._id} value={template._id}>
                          {template.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowTemplateDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create New Template
                </Button>
              </div>
            ) : (
              <div>
                <Label>Message</Label>
                <Textarea
                  value={node.config.message || ""}
                  onChange={(e) =>
                    updateNodeConfig(node.id, { message: e.target.value })
                  }
                  placeholder="Enter your SMS message. Use {{first_name}}, {{last_name}}, etc. for personalization"
                  rows={4}
                />
              </div>
            )}
          </div>
        );

      case "send_email":
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="use-email-template"
                checked={node.config.useTemplate}
                onChange={(e) =>
                  updateNodeConfig(node.id, { useTemplate: e.target.checked })
                }
              />
              <Label htmlFor="use-email-template">Use Template</Label>
            </div>

            {node.config.useTemplate ? (
              <div>
                <Label>Email Template</Label>
                <Select
                  value={node.config.templateId || ""}
                  onValueChange={(value) =>
                    updateNodeConfig(node.id, { templateId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {messageTemplates
                      ?.filter((t) => t.type === "email")
                      .map((template) => (
                        <SelectItem key={template._id} value={template._id}>
                          {template.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowTemplateDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create New Template
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <Label>Subject</Label>
                  <Input
                    value={node.config.subject || ""}
                    onChange={(e) =>
                      updateNodeConfig(node.id, { subject: e.target.value })
                    }
                    placeholder="Email subject"
                  />
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea
                    value={node.config.message || ""}
                    onChange={(e) =>
                      updateNodeConfig(node.id, { message: e.target.value })
                    }
                    placeholder="Enter your email message. Use {{first_name}}, {{last_name}}, etc. for personalization"
                    rows={6}
                  />
                </div>
              </>
            )}
          </div>
        );

      case "conditional":
        return (
          <div className="space-y-4">
            <div>
              <Label>Logic Type</Label>
              <Select
                value={node.config.logic || "and"}
                onValueChange={(value) =>
                  updateNodeConfig(node.id, { logic: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="and">
                    All conditions must be true (AND)
                  </SelectItem>
                  <SelectItem value="or">
                    Any condition can be true (OR)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Conditions</Label>
              {(node.config.conditions || []).map(
                (condition: any, index: number) => (
                  <div key={index} className="border rounded p-3 mb-2">
                    <div className="grid grid-cols-3 gap-2">
                      <Select
                        value={condition.field}
                        onValueChange={(value) => {
                          const newConditions = [
                            ...(node.config.conditions || []),
                          ];
                          newConditions[index] = { ...condition, field: value };
                          updateNodeConfig(node.id, {
                            conditions: newConditions,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Field" />
                        </SelectTrigger>
                        <SelectContent>
                          {conditionFields.map((field) => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={condition.operator}
                        onValueChange={(value) => {
                          const newConditions = [
                            ...(node.config.conditions || []),
                          ];
                          newConditions[index] = {
                            ...condition,
                            operator: value,
                          };
                          updateNodeConfig(node.id, {
                            conditions: newConditions,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {conditionOperators.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        value={condition.value}
                        onChange={(e) => {
                          const newConditions = [
                            ...(node.config.conditions || []),
                          ];
                          newConditions[index] = {
                            ...condition,
                            value: e.target.value,
                          };
                          updateNodeConfig(node.id, {
                            conditions: newConditions,
                          });
                        }}
                        placeholder="Value"
                      />
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        const newConditions = (
                          node.config.conditions || []
                        ).filter((_: any, i: number) => i !== index);
                        updateNodeConfig(node.id, {
                          conditions: newConditions,
                        });
                      }}
                    >
                      Remove Condition
                    </Button>
                  </div>
                ),
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newConditions = [
                    ...(node.config.conditions || []),
                    { field: "first_name", operator: "equals", value: "" },
                  ];
                  updateNodeConfig(node.id, { conditions: newConditions });
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Condition
              </Button>
            </div>
          </div>
        );

      case "add_tag":
        return (
          <div className="space-y-4">
            <div>
              <Label>Tag to Add</Label>
              <Input
                value={node.config.tag || ""}
                onChange={(e) =>
                  updateNodeConfig(node.id, { tag: e.target.value })
                }
                placeholder="Enter tag name"
              />
            </div>
          </div>
        );

      case "create_appointment":
        return (
          <div className="space-y-4">
            <div>
              <Label>Appointment Type</Label>
              <Select
                value={node.config.appointmentType || "follow-up"}
                onValueChange={(value) =>
                  updateNodeConfig(node.id, { appointmentType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="treatment">Treatment</SelectItem>
                  <SelectItem value="check-in">Check-in</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Days from Trigger</Label>
              <Input
                type="number"
                value={node.config.daysFromTrigger || 7}
                onChange={(e) =>
                  updateNodeConfig(node.id, {
                    daysFromTrigger: parseInt(e.target.value),
                  })
                }
                min="1"
                max="365"
              />
            </div>
          </div>
        );

      case "add_note":
        return (
          <div className="space-y-4">
            <div>
              <Label>Note Text</Label>
              <Textarea
                value={node.config.noteText || ""}
                onChange={(e) =>
                  updateNodeConfig(node.id, { noteText: e.target.value })
                }
                placeholder="Enter note content"
                rows={3}
              />
            </div>
            <div>
              <Label>Note Tag</Label>
              <Select
                value={node.config.tag || "general"}
                onValueChange={(value) =>
                  updateNodeConfig(node.id, { tag: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="treatment">Treatment</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="outcome">Outcome</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return <div>No configuration available for this node type.</div>;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {workflowId ? "Edit Workflow" : "Create Workflow"}
            </h1>
            <p className="text-gray-600">
              Design and configure your automated workflow
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSaveWorkflow}>
              <Save className="h-4 w-4 mr-2" />
              Save Workflow
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="logs">Execution Logs</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="design" className="flex-1 flex">
          {/* Node Palette */}
          <div className="w-80 border-r bg-gray-50 p-4">
            <h3 className="font-semibold mb-4">Workflow Nodes</h3>
            <div className="space-y-2">
              {nodeTypes.map((nodeType) => {
                const Icon = nodeType.icon;
                return (
                  <div
                    key={nodeType.type}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-white transition-colors"
                    onClick={() => addNode(nodeType.type)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded ${nodeType.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {nodeType.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {nodeType.description}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative bg-gray-100">
            <div className="absolute inset-0 overflow-auto p-4">
              {nodes.map((node) => {
                const nodeType = nodeTypes.find((t) => t.type === node.type);
                const Icon = nodeType?.icon || Settings;

                return (
                  <div
                    key={node.id}
                    className="absolute bg-white border rounded-lg shadow-sm cursor-pointer hover:shadow-md"
                    style={{
                      left: node.position.x,
                      top: node.position.y,
                      width: node.width,
                      minHeight: node.height,
                    }}
                    onClick={() => setSelectedNode(node)}
                  >
                    <div
                      className={`p-3 rounded-t-lg ${nodeType?.color || "bg-gray-100"}`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium text-sm">
                          {nodeType?.label}
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="text-xs text-gray-600 mb-2">
                        {Object.keys(node.config).length > 0
                          ? "Configured"
                          : "Not configured"}
                      </div>
                      {node.comments && (
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                          <MessageCircle className="h-3 w-3 inline mr-1" />
                          {node.comments.slice(0, 50)}...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Properties Panel */}
          {selectedNode && (
            <div className="w-96 border-l bg-white p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Node Properties</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNodeComment(selectedNode.comments || "");
                    setShowCommentDialog(true);
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Comment
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Node Type</Label>
                  <div className="text-sm text-gray-600">
                    {nodeTypes.find((t) => t.type === selectedNode.type)?.label}
                  </div>
                </div>

                {renderNodeConfig(selectedNode)}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="flex-1 p-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Execution Logs
              </CardTitle>
              <CardDescription>
                Recent workflow executions and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {executionLogs && executionLogs.length > 0 ? (
                <div className="space-y-2">
                  {executionLogs.map((log) => (
                    <div key={log._id} className="border rounded p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{log.action}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            {log.client?.firstName} {log.client?.lastName}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={
                              log.status === "executed"
                                ? "bg-green-100 text-green-800"
                                : log.status === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {log.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(log.executedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {log.message && (
                        <div className="text-sm text-gray-600 mt-2">
                          {log.message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No execution logs yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollments" className="flex-1 p-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Workflow Enrollments
              </CardTitle>
              <CardDescription>
                Clients currently enrolled in this workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enrollments && enrollments.length > 0 ? (
                <div className="space-y-2">
                  {enrollments.map((enrollment) => (
                    <div key={enrollment._id} className="border rounded p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">
                            {enrollment.client?.firstName}{" "}
                            {enrollment.client?.lastName}
                          </span>
                          <span className="text-sm text-gray-500 ml-2">
                            {enrollment.enrollmentReason}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={
                              enrollment.currentStatus === "active"
                                ? "bg-green-100 text-green-800"
                                : enrollment.currentStatus === "paused"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : enrollment.currentStatus === "completed"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                            }
                          >
                            {enrollment.currentStatus}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(
                              enrollment.enrolledAt,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No enrollments yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 p-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Settings</CardTitle>
              <CardDescription>
                Configure basic workflow properties
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="workflow-name">Workflow Name</Label>
                <Input
                  id="workflow-name"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="Enter workflow name"
                />
              </div>

              <div>
                <Label htmlFor="workflow-description">Description</Label>
                <Textarea
                  id="workflow-description"
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  placeholder="Describe what this workflow does"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="workflow-trigger">Trigger</Label>
                <Select
                  value={workflowTrigger}
                  onValueChange={setWorkflowTrigger}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appointment_completed">
                      Appointment Completed
                    </SelectItem>
                    <SelectItem value="morpheus8">
                      Morpheus8 Treatment
                    </SelectItem>
                    <SelectItem value="toxins">Toxin Treatment</SelectItem>
                    <SelectItem value="filler">Filler Treatment</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="new_client">New Client</SelectItem>
                    <SelectItem value="manual">Manual Trigger</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Comment Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Node Comment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Comment</Label>
              <Textarea
                value={nodeComment}
                onChange={(e) => setNodeComment(e.target.value)}
                placeholder="Add a comment to help your team understand this node..."
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowCommentDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedNode) {
                    updateNodeComment(selectedNode.id, nodeComment);
                  }
                  setShowCommentDialog(false);
                }}
              >
                Save Comment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
