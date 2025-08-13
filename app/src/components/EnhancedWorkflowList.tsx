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
  Trash2,
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
  const [draggedDirectory, setDraggedDirectory] = useState<string | null>(null);
  const [viewingStepTracker, setViewingStepTracker] = useState<string | null>(
    null,
  );
  const [sidebarWidth, setSidebarWidth] = useState(240); // Smaller default width
  const [isResizing, setIsResizing] = useState(false);
  const [contextMenuDirectory, setContextMenuDirectory] = useState<
    string | null
  >(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [directoryToDelete, setDirectoryToDelete] = useState<string | null>(
    null,
  );
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [directoryToRename, setDirectoryToRename] = useState<string | null>(
    null,
  );
  const [renameValue, setRenameValue] = useState("");
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [dragOverDirectory, setDragOverDirectory] = useState<string | null>(
    null,
  );

  // Queries
  const directories = useQuery(
    api.workflowDirectories.getDirectories,
    orgId ? { orgId: orgId as any } : "skip",
  );
  const archivedDirectories = useQuery(
    api.workflowDirectories.getArchivedDirectories,
    orgId ? { orgId: orgId as any } : "skip",
  );
  const workflows = useQuery(
    api.enhancedWorkflows.getWorkflows,
    orgId
      ? {
          orgId: orgId as any,
          status: statusFilter === "all" ? undefined : (statusFilter as any),
          directoryId: selectedDirectory
            ? (selectedDirectory as any)
            : undefined,
        }
      : "skip",
  );

  // Mutations
  const createDirectory = useMutation(api.workflowDirectories.createDirectory);
  const updateWorkflowStatus = useMutation(
    api.enhancedWorkflows.updateWorkflowStatus,
  );
  const moveWorkflowToDirectory = useMutation(
    api.workflowDirectories.moveWorkflowToDirectory,
  );
  const moveDirectory = useMutation(api.workflowDirectories.moveDirectory);
  const renameDirectory = useMutation(api.workflowDirectories.renameDirectory);
  const deleteDirectory = useMutation(api.workflowDirectories.deleteDirectory);
  const restoreDirectory = useMutation(
    api.workflowDirectories.restoreDirectory,
  );
  const permanentlyDeleteDirectory = useMutation(
    api.workflowDirectories.permanentlyDeleteDirectory,
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
        parentId: undefined, // Always create at root level initially
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

  const handleDirectoryDragStart = (directoryId: string) => {
    setDraggedDirectory(directoryId);
  };

  const handleDragOver = (e: React.DragEvent, directoryId?: string) => {
    e.preventDefault();
    const targetId = directoryId === "root" ? null : directoryId;
    if (dragOverDirectory !== targetId) {
      setDragOverDirectory(targetId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear if we're leaving the component entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverDirectory(null);
    }
  };

  const handleDrop = async (
    e: React.DragEvent,
    targetDirectoryId: string | null,
  ) => {
    e.preventDefault();
    setDragOverDirectory(null);

    if (draggedWorkflow) {
      try {
        await moveWorkflowToDirectory({
          workflowId: draggedWorkflow as any,
          directoryId: targetDirectoryId as any,
        });
        setDraggedWorkflow(null);
      } catch (error) {
        console.error("Failed to move workflow:", error);
      }
    } else if (draggedDirectory && draggedDirectory !== targetDirectoryId) {
      try {
        await moveDirectory({
          directoryId: draggedDirectory as any,
          newParentId: targetDirectoryId as any,
        });
        setDraggedDirectory(null);
      } catch (error) {
        console.error("Failed to move directory:", error);
      }
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

  const handleRenameDirectory = async () => {
    if (!directoryToRename || !renameValue.trim()) return;

    try {
      await renameDirectory({
        directoryId: directoryToRename as any,
        name: renameValue.trim(),
      });
      setShowRenameDialog(false);
      setDirectoryToRename(null);
      setRenameValue("");
    } catch (error) {
      console.error("Failed to rename directory:", error);
      alert("Failed to rename directory");
    }
  };

  const handleDeleteDirectory = async () => {
    if (!directoryToDelete) return;

    try {
      await deleteDirectory({
        directoryId: directoryToDelete as any,
        userId: user?.userId as any,
      });
      setShowDeleteDialog(false);
      setDirectoryToDelete(null);
    } catch (error) {
      console.error("Failed to archive directory:", error);
      alert("Failed to archive directory");
    }
  };

  // Utility function to find a directory by ID in the tree
  const findDirectoryById = (dir: Directory, id: string): Directory | null => {
    if (dir._id === id) return dir;
    for (const child of dir.children) {
      const found = findDirectoryById(child, id);
      if (found) return found;
    }
    return null;
  };

  const renderDirectory = (directory: Directory, level: number = 0) => {
    const isExpanded = expandedDirectories.has(directory._id);
    const hasChildren = directory.children.length > 0;
    const isSelected = selectedDirectory === directory._id;

    return (
      <div key={directory._id} className="mb-1">
        <div
          className={`flex items-center p-2 rounded-lg cursor-pointer ${
            isSelected ? "bg-blue-50 border border-blue-200" : ""
          } ${draggedDirectory === directory._id ? "opacity-50" : ""} ${
            dragOverDirectory === directory._id
              ? "bg-blue-100 border-2 border-blue-300 border-dashed"
              : ""
          }`}
          data-theme-aware="true"
          data-variant="light"
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => setSelectedDirectory(directory._id)}
          onDragOver={(e) => handleDragOver(e, directory._id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, directory._id)}
          draggable
          onDragStart={() => handleDirectoryDragStart(directory._id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleDirectory(directory._id);
              }}
              className="mr-1 p-0.5 rounded cursor-pointer"
              data-theme-aware="true"
              data-variant="light"
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

          <span className="text-sm font-medium flex-1">{directory.name}</span>

          {directory.description && (
            <span className="text-xs text-gray-500 ml-2">
              {directory.description}
            </span>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 ml-2"
                onClick={(e) => e.stopPropagation()}
                data-theme-aware="true"
                data-variant="light"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  const dir = directories?.find((d) =>
                    findDirectoryById(d, directory._id),
                  );
                  if (dir) {
                    setDirectoryToRename(directory._id);
                    setRenameValue(directory.name);
                    setShowRenameDialog(true);
                  }
                }}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setDirectoryToDelete(directory._id);
                  setShowDeleteDialog(true);
                }}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
      active: { color: "bg-gray-50 text-gray-600 border-gray-200", label: "Active" },
      inactive: { color: "bg-gray-50 text-gray-500 border-gray-200", label: "Inactive" },
      draft: { color: "bg-gray-50 text-gray-500 border-gray-200", label: "Draft" },
      archived: { color: "bg-gray-50 text-gray-400 border-gray-200", label: "Archived" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>;
  };

  const formatTrigger = (trigger: string) => {
    return trigger.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // If viewing step tracker, show that instead
  if (viewingStepTracker) {
    const selectedWorkflow = filteredWorkflows.find(
      (w) => w._id === viewingStepTracker,
    );
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
        <WorkflowStepTracker workflowId={viewingStepTracker} orgId={orgId} />
      </div>
    );
  }

  // Handle sidebar resize
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(
        180,
        Math.min(400, startWidth + (e.clientX - startX)),
      );
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className="flex h-[calc(100vh-12rem)]">
      {/* Directory Sidebar */}
      <div
        className="border-r bg-gray-50 p-2 relative"
        style={{ width: `${sidebarWidth}px` }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Directories</h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowArchiveDialog(true)}
              title="View Archive"
            >
              <Archive className="h-4 w-4" />
            </Button>
            <Dialog
              open={showNewDirectoryDialog}
              onOpenChange={setShowNewDirectoryDialog}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" title="New Folder">
                  <Plus className="h-4 w-4" />
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
                      onChange={(e) =>
                        setNewDirectoryDescription(e.target.value)
                      }
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
        </div>

        {/* Root Level */}
        <div
          className={`flex items-center p-2 rounded-lg cursor-pointer mb-2 ${
            selectedDirectory === null
              ? "bg-blue-50 border border-blue-200"
              : ""
          } ${
            dragOverDirectory === null && (draggedDirectory || draggedWorkflow)
              ? "bg-green-100 border-2 border-green-300 border-dashed"
              : ""
          }`}
          data-theme-aware="true"
          data-variant="light"
          onClick={() => setSelectedDirectory(null)}
          onDragOver={(e) => handleDragOver(e, "root")}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, null)}
        >
          <Folder className="h-4 w-4 mr-2 text-gray-500" />
          <span className="text-sm font-medium">All Workflows</span>
        </div>

        {/* Directory Tree */}
        <div className="space-y-1">
          {directories?.map((directory) => renderDirectory(directory))}
        </div>

        {/* Resize Handle */}
        <div
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-gray-300 hover:bg-gray-400 transition-colors"
          onMouseDown={handleMouseDown}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-2">
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

        {/* Workflow List */}
        <div className="space-y-2" data-testid="workflow-list">
          {filteredWorkflows.map((workflow) => (
            <div
              key={workflow._id}
              draggable
              onDragStart={() => handleDragStart(workflow._id)}
              className="bg-gray-50/50 hover:bg-white rounded-md border border-gray-100 hover:border-gray-200 transition-all cursor-move workflow-item"
              data-theme-aware="true"
              data-variant="light"
              data-testid="workflow-item"
            >
              <div className="p-3">
                {/* Single Row Layout */}
                <div className="flex items-center justify-between">
                  {/* Left Section: Name, Description, and Badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h3
                        className="font-medium text-gray-800 truncate cursor-pointer hover:text-gray-900 transition-colors"
                        onClick={() =>
                          router.push(`/workflow-editor?id=${workflow._id}`)
                        }
                      >
                        {workflow.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(workflow.status)}
                        <Badge variant="outline" className="text-xs bg-gray-50 text-gray-500 border-gray-200">
                          {formatTrigger(workflow.trigger)}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 truncate">
                      {workflow.description || "No description"}
                    </p>
                  </div>

                  {/* Center Section: Stats */}
                  <div className="flex items-center space-x-6 mx-8">
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-700">
                        {workflow.activeEnrollmentCount}
                      </div>
                      <div className="text-xs text-gray-400">Active</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-700">
                        {workflow.totalRuns}
                      </div>
                      <div className="text-xs text-gray-400">Total Runs</div>
                    </div>
                    {workflow.lastRun && (
                      <div className="text-center">
                        <div className="text-xs text-gray-400">Last run</div>
                        <div className="text-xs text-gray-500">
                          {new Date(workflow.lastRun).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Section: Actions */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
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

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600 hover:bg-gray-100">
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
                        <DropdownMenuItem
                          onClick={() => {
                            const email = prompt("Enter test email address:");
                            const phone = prompt("Enter test phone number:");
                            if (email || phone) {
                              alert(
                                `Test workflow would be sent to:\nEmail: ${email || "Not provided"}\nPhone: ${phone || "Not provided"}`,
                              );
                            }
                          }}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Test
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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

      {/* Rename Directory Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Directory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rename-input">Directory Name</Label>
              <Input
                id="rename-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Enter new directory name"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowRenameDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleRenameDirectory}>Rename</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Directory Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Directory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p className="mb-2">
                Are you sure you want to delete this directory? This action
                cannot be undone.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-yellow-800">
                  <strong>Warning:</strong> All workflows in this directory will
                  be moved to the root level. The directory will be archived and
                  can be restored from the archive if needed.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteDirectory}
                className="text-white"
              >
                Delete Directory
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Dialog */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Archived Directories</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {archivedDirectories && archivedDirectories.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {archivedDirectories.map((dir) => (
                  <div
                    key={dir._id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{dir.name}</span>
                      </div>
                      {dir.description && (
                        <p className="text-sm text-gray-600 ml-6">
                          {dir.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 ml-6">
                        Archived{" "}
                        {new Date(dir.archivedAt!).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            await restoreDirectory({
                              directoryId: dir._id as any,
                            });
                            alert(`Directory "${dir.name}" has been restored!`);
                          } catch (error) {
                            console.error(
                              "Failed to restore directory:",
                              error,
                            );
                            alert("Failed to restore directory");
                          }
                        }}
                      >
                        Restore
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          if (
                            confirm(
                              `Permanently delete "${dir.name}"? This cannot be undone.`,
                            )
                          ) {
                            try {
                              await permanentlyDeleteDirectory({
                                directoryId: dir._id as any,
                              });
                              alert(
                                `Directory "${dir.name}" has been permanently deleted.`,
                              );
                            } catch (error) {
                              console.error(
                                "Failed to permanently delete directory:",
                                error,
                              );
                              alert("Failed to permanently delete directory");
                            }
                          }
                        }}
                      >
                        Delete Forever
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Archive className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No archived directories</p>
              </div>
            )}
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowArchiveDialog(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
