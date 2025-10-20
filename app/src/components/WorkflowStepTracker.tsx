"use client";

import React, { useState } from "react";
// Temporarily disabled Convex
// import { useQuery } from "convex/react";
// import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Play,
  Pause,
  Mail,
  MessageSquare,
  Tag,
  Calendar,
  User,
  Eye,
} from "lucide-react";

interface WorkflowStep {
  id: string;
  type: string;
  title: string;
  description?: string;
  config: any;
  clientCount: number;
  completedCount: number;
  failedCount: number;
  pendingCount: number;
}

interface WorkflowStepTrackerProps {
  workflowId: string;
  orgId: string;
}

export function WorkflowStepTracker({
  workflowId,
  orgId,
}: WorkflowStepTrackerProps) {
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [showClientDetails, setShowClientDetails] = useState(false);

  // Temporarily disabled Convex queries
  const workflow = {
    name: "Sample Workflow",
    description: "This is a placeholder workflow",
    status: "active",
    blocks: []
  };
  const workflowStats = {
    totalEnrollments: 0,
    activeEnrollments: 0,
    completedEnrollments: 0,
    successRate: 0
  };
  const enrollments: any[] = [];
  const executionLogs: any[] = [];

  if (!workflow) {
    return <div className="p-4">Loading workflow...</div>;
  }

  // Convert workflow blocks to steps with client counts
  const workflowSteps: WorkflowStep[] =
    workflow.blocks?.map((block) => {
      // Count clients at this step based on execution logs
      const stepLogs =
        executionLogs?.filter((log) => log.stepId === block.id) || [];
      const clientsAtStep = new Set(stepLogs.map((log) => log.clientId));
      const completedLogs = stepLogs.filter((log) => log.status === "executed");
      const failedLogs = stepLogs.filter((log) => log.status === "failed");
      const pendingLogs = stepLogs.filter((log) => log.status === "pending");

      return {
        id: block.id,
        type: block.type,
        title: getStepTitle(block),
        description: getStepDescription(block),
        config: block.config,
        clientCount: clientsAtStep.size,
        completedCount: completedLogs.length,
        failedCount: failedLogs.length,
        pendingCount: pendingLogs.length,
      };
    }) || [];

  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case "send_email":
        return <Mail className="h-4 w-4" />;
      case "send_sms":
        return <MessageSquare className="h-4 w-4" />;
      case "delay":
        return <Clock className="h-4 w-4" />;
      case "tag":
        return <Tag className="h-4 w-4" />;
      case "create_appointment":
        return <Calendar className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getStepColor = (step: WorkflowStep) => {
    if (step.failedCount > 0) return "border-red-200 bg-red-50";
    if (step.pendingCount > 0) return "border-yellow-200 bg-yellow-50";
    if (step.completedCount > 0) return "border-green-200 bg-green-50";
    return "border-gray-200 bg-gray-50";
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "executed":
        return "bg-white text-green-700 border border-green-200";
      case "failed":
        return "bg-white text-red-700 border border-red-200";
      case "pending":
        return "bg-white text-yellow-700 border border-yellow-200";
      default:
        return "bg-white text-gray-700 border border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Workflow Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {workflow.status === "active" ? (
                  <Play className="h-5 w-5 text-green-600" />
                ) : (
                  <Pause className="h-5 w-5 text-gray-400" />
                )}
                {workflow.name}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {workflow.description || "No description provided"}
              </p>
            </div>
            <Badge
              className={
                workflow.status === "active"
                  ? "bg-white text-green-700 border border-green-200"
                  : "bg-white text-gray-700 border border-gray-200"
              }
            >
              {workflow.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {workflowStats?.totalEnrollments || 0}
              </div>
              <div className="text-sm text-gray-500">Total Enrolled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {workflowStats?.activeEnrollments || 0}
              </div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {workflowStats?.completedEnrollments || 0}
              </div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {Math.round(workflowStats?.successRate || 0)}%
              </div>
              <div className="text-sm text-gray-500">Success Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Steps Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Workflow Steps & Client Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workflowSteps.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No workflow steps configured. Create steps in the workflow editor.
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-6">
                {workflowSteps.map((step, index) => (
                  <div key={step.id} className="relative">
                    {/* Step Card */}
                    <Card
                      className={`transition-colors ${getStepColor(step)}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-white">
                              {getStepIcon(step.type)}
                            </div>
                            <div>
                              <h4 className="font-medium">{step.title}</h4>
                              <p className="text-sm text-gray-600">
                                {step.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            {/* Client Counts - Clickable */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex flex-col items-center p-2 h-auto hover:bg-blue-50"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent card click
                                setSelectedStep(step.id);
                              }}
                            >
                              <div className="text-lg font-bold text-blue-600">
                                {step.clientCount}
                              </div>
                              <div className="text-xs text-gray-500">
                                Clients
                              </div>
                            </Button>

                            {/* Status Indicators */}
                            <div className="flex space-x-1">
                              {step.completedCount > 0 && (
                                <Badge className="bg-white text-green-700 border border-green-200 text-xs">
                                  ✓ {step.completedCount}
                                </Badge>
                              )}
                              {step.failedCount > 0 && (
                                <Badge className="bg-white text-red-700 border border-red-200 text-xs">
                                  ✗ {step.failedCount}
                                </Badge>
                              )}
                              {step.pendingCount > 0 && (
                                <Badge className="bg-white text-yellow-700 border border-yellow-200 text-xs">
                                  ⏳ {step.pendingCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Arrow connector - positioned inside the container */}
                    {index < workflowSteps.length - 1 && (
                      <div className="flex justify-center my-2">
                        <ArrowRight className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step Details Sheet */}
      <Sheet
        open={selectedStep !== null}
        onOpenChange={(open) => !open && setSelectedStep(null)}
      >
        <SheetContent className="w-[600px] sm:w-[600px]">
          <SheetHeader>
            <SheetTitle>Step Details</SheetTitle>
            <SheetDescription>
              View clients and execution details for this workflow step
            </SheetDescription>
          </SheetHeader>

          {selectedStep &&
            (() => {
              const step = workflowSteps.find((s) => s.id === selectedStep);
              const stepLogs =
                executionLogs?.filter((log) => log.stepId === selectedStep) ||
                [];
              const stepClients = stepLogs.reduce((acc, log) => {
                if (!acc.find((c) => c.clientId === log.clientId)) {
                  acc.push({
                    clientId: log.clientId,
                    client: log.client,
                    status: log.status,
                    executedAt: log.executedAt,
                    message: log.message,
                    error: log.error,
                  });
                }
                return acc;
              }, [] as any[]);

              return (
                <div className="mt-6 space-y-6">
                  {/* Step Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {step && getStepIcon(step.type)}
                        {step?.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-600">
                            {step?.completedCount || 0}
                          </div>
                          <div className="text-sm text-gray-500">Completed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-red-600">
                            {step?.failedCount || 0}
                          </div>
                          <div className="text-sm text-gray-500">Failed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-yellow-600">
                            {step?.pendingCount || 0}
                          </div>
                          <div className="text-sm text-gray-500">Pending</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Client List */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Clients at this Step</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stepClients.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">
                            No clients have reached this step yet
                          </p>
                        ) : (
                          stepClients.map((client, index) => (
                            <div
                              key={`${client.clientId}-${index}`}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {client.client?.fullName ||
                                      "Unknown Client"}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {client.client?.email}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge
                                  className={getStatusBadgeColor(client.status)}
                                >
                                  {client.status}
                                </Badge>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(
                                    client.executedAt,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {stepLogs.slice(0, 10).map((log, index) => (
                          <div
                            key={`${log._id}-${index}`}
                            className="flex items-center space-x-3 text-sm"
                          >
                            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                            <div className="flex-1">
                              <span className="font-medium">
                                {log.client?.fullName}
                              </span>
                              <span className="text-gray-500 mx-2">•</span>
                              <span>
                                {log.message || `${log.action} ${log.status}`}
                              </span>
                            </div>
                            <div className="text-gray-400">
                              {new Date(log.executedAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Helper functions
function getStepTitle(block: any): string {
  switch (block.type) {
    case "send_email":
      return `Send Email: ${block.config?.template?.subject || "Email"}`;
    case "send_sms":
      return `Send SMS: ${block.config?.message?.substring(0, 30) || "Message"}...`;
    case "delay":
      const delay = block.config?.delay || 0;
      const unit = block.config?.unit || "days";
      return `Wait ${delay} ${unit}`;
    case "tag":
      return `Add Tag: ${block.config?.tag || "Tag"}`;
    case "create_appointment":
      return `Schedule: ${block.config?.appointmentType || "Appointment"}`;
    case "conditional":
      return `Decision: ${block.config?.condition || "Condition"}`;
    default:
      return `${block.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}`;
  }
}

function getStepDescription(block: any): string {
  switch (block.type) {
    case "send_email":
      return "Send automated email to client";
    case "send_sms":
      return "Send text message to client";
    case "delay":
      return "Wait before continuing workflow";
    case "tag":
      return "Add tag to client record";
    case "create_appointment":
      return "Schedule follow-up appointment";
    case "conditional":
      return "Branch workflow based on conditions";
    default:
      return "Custom workflow action";
  }
}
