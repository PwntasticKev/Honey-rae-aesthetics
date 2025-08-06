"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Folder,
  FolderOpen,
  Play,
  Pause,
  Edit3,
  Send,
  MoreHorizontal,
  Filter,
  Search,
  Archive,
  FileText,
  Users,
  Clock,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  BarChart3,
  Eye,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { WorkflowStepTracker } from "./WorkflowStepTracker";

interface Directory {
  _id: string;
  name: string;
  parentId?: string;
  description?: string;
  color?: string;
  children: Directory[];
}

interface Workflow {
  _id: string;
  name: string;
  description?: string;
  status: "active" | "inactive" | "draft" | "archived";
  trigger: string;
  directoryId?: string;
  activeEnrollmentCount: number;
  totalEnrollmentCount: number;
  totalRuns: number;
  successfulRuns: number;
  lastRun?: number;
  createdAt: number;
}

interface EnhancedWorkflowListProps {
  orgId: string;
}

export function EnhancedWorkflowList({ orgId }: EnhancedWorkflowListProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(
    null,
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDirectories, setExpandedDirectories] = useState<Set<string>>(
    new Set(),
  );
  const [showNewDirectoryDialog, setShowNewDirectoryDialog] = useState(false);
  const [newDirectoryName, setNewDirectoryName] = useState("");
  const [newDirectoryDescription, setNewDirectoryDescription] = useState("");
  const [draggedWorkflow, setDraggedWorkflow] = useState<string | null>(null);
  const [viewingStepTracker, setViewingStepTracker] = useState<string | null>(null);

  // Queries
  const directories = useQuery(api.workflowDirectories.getDirectories, {
    orgId: orgId as any,
  });
  const workflows = useQuery(api.enhancedWorkflows.getWorkflows, {
    orgId: orgId as any,
    status: statusFilter === "all" ? undefined : (statusFilter as any),
    directoryId: selectedDirectory ? (selectedDirectory as any) : undefined,
  });

  // Mutations
  const createDirectory = useMutation(api.workflowDirectories.createDirectory);
  const updateWorkflowStatus = useMutation(
    api.enhancedWorkflows.updateWorkflowStatus,
  );
  const moveWorkflowToDirectory = useMutation(
    api.workflowDirectories.moveWorkflowToDirectory,
  );

  // Filter workflows by search query
  const filteredWorkflows =
    workflows?.filter(
      (workflow) =>
        workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workflow.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  const handleCreateDirectory = async () => {
    if (!newDirectoryName.trim()) return;

    try {
      await createDirectory({
        orgId: orgId as any,
        name: newDirectoryName,
        description: newDirectoryDescription || undefined,
        parentId: selectedDirectory ? (selectedDirectory as any) : undefined,
      });
      setShowNewDirectoryDialog(false);
      setNewDirectoryName("");
      setNewDirectoryDescription("");
    } catch (error) {
      console.error("Failed to create directory:", error);
    }
  };

  const handleToggleWorkflow = async (
    workflowId: string,
    currentStatus: string,
  ) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await updateWorkflowStatus({
        workflowId: workflowId as any,
        status: newStatus as any,
      });
    } catch (error) {
      console.error("Failed to toggle workflow:", error);
    }
  };

  const handleDragStart = (workflowId: string) => {
    setDraggedWorkflow(workflowId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (
    e: React.DragEvent,
    targetDirectoryId: string | null,
  ) => {
    e.preventDefault();
    if (!draggedWorkflow) return;

    try {
      await moveWorkflowToDirectory({
        workflowId: draggedWorkflow as any,
        directoryId: targetDirectoryId as any,
      });
      setDraggedWorkflow(null);
    } catch (error) {
      console.error("Failed to move workflow:", error);
    }
  };

  const toggleDirectory = (directoryId: string) => {
    const newExpanded = new Set(expandedDirectories);
    if (newExpanded.has(directoryId)) {
      newExpanded.delete(directoryId);
    } else {
      newExpanded.add(directoryId);
    }
    setExpandedDirectories(newExpanded);
  };

  const renderDirectory = (directory: Directory, level: number = 0) => {
    const isExpanded = expandedDirectories.has(directory._id);
    const hasChildren = directory.children.length > 0;
    const isSelected = selectedDirectory === directory._id;

    return (
      <div key={directory._id} className="mb-1">
        <div
          className={`flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-50 ${
            isSelected ? "bg-blue-50 border border-blue-200" : ""
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => setSelectedDirectory(directory._id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, directory._id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleDirectory(directory._id);
              }}
              className="mr-1 p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}

          {isExpanded || !hasChildren ? (
            <FolderOpen className="h-4 w-4 mr-2 text-blue-500" />
          ) : (
            <Folder className="h-4 w-4 mr-2 text-blue-500" />
          )}

          <span className="text-sm font-medium">{directory.name}</span>

          {directory.description && (
            <span className="text-xs text-gray-500 ml-2">
              {directory.description}
            </span>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div className="ml-2">
            {directory.children.map((child) =>
              renderDirectory(child, level + 1),
            )}
          </div>
        )}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", label: "Active" },
      inactive: { color: "bg-gray-100 text-gray-800", label: "Inactive" },
      draft: { color: "bg-yellow-100 text-yellow-800", label: "Draft" },
      archived: { color: "bg-red-100 text-red-800", label: "Archived" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatTrigger = (trigger: string) => {
    return trigger.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // If viewing step tracker, show that instead
  if (viewingStepTracker) {
    const selectedWorkflow = filteredWorkflows.find(w => w._id === viewingStepTracker);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => setViewingStepTracker(null)}
            >
              ← Back to Workflows
            </Button>
            <div>
              <h2 className="text-xl font-bold">{selectedWorkflow?.name}</h2>
              <p className="text-gray-600">Step-by-step workflow tracking</p>
            </div>
          </div>
        </div>
        <WorkflowStepTracker 
          workflowId={viewingStepTracker} 
          orgId={orgId} 
        />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Directory Sidebar */}
      <div className="w-80 border-r bg-gray-50 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Directories</h3>
          <Dialog
            open={showNewDirectoryDialog}
            onOpenChange={setShowNewDirectoryDialog}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Directory</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="directory-name">Directory Name</Label>
                  <Input
                    id="directory-name"
                    value={newDirectoryName}
                    onChange={(e) => setNewDirectoryName(e.target.value)}
                    placeholder="Enter directory name"
                  />
                </div>
                <div>
                  <Label htmlFor="directory-description">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="directory-description"
                    value={newDirectoryDescription}
                    onChange={(e) => setNewDirectoryDescription(e.target.value)}
                    placeholder="Enter directory description"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewDirectoryDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateDirectory}>
                    Create Directory
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Root Level */}
        <div
          className={`flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-50 mb-2 ${
            selectedDirectory === null
              ? "bg-blue-50 border border-blue-200"
              : ""
          }`}
          onClick={() => setSelectedDirectory(null)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, null)}
        >
          <Folder className="h-4 w-4 mr-2 text-gray-500" />
          <span className="text-sm font-medium">All Workflows</span>
        </div>

        {/* Directory Tree */}
        <div className="space-y-1">
          {directories?.map((directory) => renderDirectory(directory))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedDirectory ? "Directory Workflows" : "All Workflows"}
            </h1>
            <p className="text-gray-600">
              {filteredWorkflows.length} workflow
              {filteredWorkflows.length !== 1 ? "s" : ""}
            </p>
          </div>

          <Button
            onClick={() => router.push("/workflow-editor")}
            data-testid="add-workflow-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Workflow Grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          data-testid="workflow-list"
        >
          {filteredWorkflows.map((workflow) => (
            <div
              key={workflow._id}
              draggable
              onDragStart={() => handleDragStart(workflow._id)}
              className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-move"
              data-testid="workflow-item"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {workflow.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {workflow.description || "No description"}
                    </p>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(workflow.status)}
                      <Badge variant="outline" className="text-xs">
                        {formatTrigger(workflow.trigger)}
                      </Badge>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/workflow-editor?id=${workflow._id}`)
                        }
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setViewingStepTracker(workflow._id)}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Step Tracking
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Send className="h-4 w-4 mr-2" />
                        Test
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {workflow.activeEnrollmentCount}
                    </div>
                    <div className="text-xs text-gray-500">Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {workflow.totalRuns}
                    </div>
                    <div className="text-xs text-gray-500">Total Runs</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <Button
                    variant={
                      workflow.status === "active" ? "outline" : "default"
                    }
                    size="sm"
                    onClick={() =>
                      handleToggleWorkflow(workflow._id, workflow.status)
                    }
                    data-testid={
                      workflow.status === "active"
                        ? "pause-workflow"
                        : "play-workflow"
                    }
                  >
                    {workflow.status === "active" ? (
                      <>
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>

                  {workflow.lastRun && (
                    <span className="text-xs text-gray-500">
                      Last run:{" "}
                      {new Date(workflow.lastRun).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredWorkflows.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No workflows found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters or search query"
                : "Get started by creating your first workflow"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button onClick={() => router.push("/workflow-editor")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
