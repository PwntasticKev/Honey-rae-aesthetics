"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  DialogFooter,
  DialogDescription,
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
  ChevronLeft,
  GripVertical,
  BarChart3,
  Eye,
  Trash2,
} from "lucide-react";
import { InferSelectModel } from "drizzle-orm";
import { workflows as workflowSchema } from "@/db/schema";

type Workflow = InferSelectModel<typeof workflowSchema>;

interface Directory {
  id: number;
  name: string;
  parentId?: number;
  description?: string;
  color?: string;
  children: Directory[];
  workflowCount: number;
}

interface EnhancedWorkflowListProps {
  orgId: number;
  viewMode?: "full" | "sidebar";
  workflows: Workflow[];
  directories: Directory[];
  onCreateWorkflow: () => void;
}

export function EnhancedWorkflowList({
  orgId,
  viewMode = "full",
  workflows = [],
  directories = [],
  onCreateWorkflow,
}: EnhancedWorkflowListProps) {
  const router = useRouter();
  const [selectedDirectory, setSelectedDirectory] = useState<number | null>(
    null,
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDirectories, setExpandedDirectories] = useState<Set<number>>(
    new Set(),
  );
  const [showNewDirectoryDialog, setShowNewDirectoryDialog] = useState(false);
  const [newDirectoryName, setNewDirectoryName] = useState("");
  const [newDirectoryDescription, setNewDirectoryDescription] = useState("");
  const [draggedWorkflow, setDraggedWorkflow] = useState<number | null>(null);
  const [draggedDirectory, setDraggedDirectory] = useState<number | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(280); // Increased default width
  const [isResizing, setIsResizing] = useState(false);
  const [directorySidebarOpen, setDirectorySidebarOpen] = useState(true);
  const [dragOverDirectory, setDragOverDirectory] = useState<number | null>(
    null,
  );
  const [editingWorkflowId, setEditingWorkflowId] = useState<number | null>(
    null,
  );
  const [editingWorkflowName, setEditingWorkflowName] = useState<string>("");

  const handleCreateDirectory = async () => {
    if (!newDirectoryName.trim()) return;
    
    try {
      const response = await fetch('/api/workflow-directories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: 15, // Should get from auth context in real app
          name: newDirectoryName,
          description: newDirectoryDescription,
        }),
      });
      
      if (response.ok) {
        // Reset form and close dialog
        setNewDirectoryName('');
        setNewDirectoryDescription('');
        setShowNewDirectoryDialog(false);
        // Refresh directories - would need to update parent component
        window.location.reload(); // Temporary solution
      } else {
        console.error('Failed to create directory');
      }
    } catch (error) {
      console.error('Error creating directory:', error);
    }
  };

  const toggleDirectory = (directoryId: number) => {
    const newExpanded = new Set(expandedDirectories);
    if (newExpanded.has(directoryId)) {
      newExpanded.delete(directoryId);
    } else {
      newExpanded.add(directoryId);
    }
    setExpandedDirectories(newExpanded);
  };

  const handleWorkflowDragStart = (e: React.DragEvent, workflowId: number) => {
    setDraggedWorkflow(workflowId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", workflowId.toString());
  };

  const handleWorkflowDragEnd = () => {
    setDraggedWorkflow(null);
    setDragOverDirectory(null);
  };

  const handleDirectoryDragOver = (
    e: React.DragEvent,
    directoryId: number | null,
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    // Only allow drop if we're dragging a workflow
    if (draggedWorkflow) {
      setDragOverDirectory(directoryId);
    }
  };

  const handleDirectoryDragLeave = () => {
    setDragOverDirectory(null);
  };

  const handleDirectoryDrop = async (
    e: React.DragEvent,
    targetDirectoryId: number | null,
  ) => {
    e.preventDefault();
    
    if (!draggedWorkflow) return;
    
    try {
      const response = await fetch(`/api/workflows/${draggedWorkflow}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directoryId: targetDirectoryId,
        }),
      });
      
      if (response.ok) {
        // Update local state to reflect the move without page reload
        setWorkflows((prevWorkflows) =>
          prevWorkflows.map((workflow) =>
            workflow.id === draggedWorkflow
              ? { ...workflow, directoryId: targetDirectoryId }
              : workflow
          )
        );
      } else {
        console.error('Failed to move workflow');
        alert('Failed to move workflow. Please try again.');
      }
    } catch (error) {
      console.error('Error moving workflow:', error);
      alert('Error moving workflow. Please try again.');
    } finally {
      setDraggedWorkflow(null);
      setDragOverDirectory(null);
    }
  };

  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesSearch =
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (workflow.description &&
        workflow.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" ||
      (workflow.enabled ? "active" : "inactive") === statusFilter;
    
    // Directory filtering - show workflows in selected directory or all if none selected
    const matchesDirectory = selectedDirectory === null || workflow.directoryId === selectedDirectory;

    return matchesSearch && matchesStatus && matchesDirectory;
  });

  const getWorkflowsForDirectory = (directoryId: number | null) => {
    // This will need to be adjusted once workflows have directory IDs
    if (directoryId === null) {
      return workflows.filter((w) => !w.directoryId);
    }
    return workflows.filter((workflow) => workflow.directoryId === directoryId);
  };

  const renderDirectoryTree = (dirs: Directory[], level = 0) => {
    return dirs.map((directory) => {
      const directoryWorkflows = getWorkflowsForDirectory(directory.id);
      const isExpanded = expandedDirectories.has(directory.id);
      const isSelected = selectedDirectory === directory.id;
      const isDraggedOver = dragOverDirectory === directory.id;

      return (
        <div key={directory.id} className="select-none">
          <div
            className={`group flex items-center py-1.5 px-2 rounded-md text-sm cursor-pointer hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
              isSelected ? "bg-gray-100" : ""
            } ${isDraggedOver ? "bg-blue-50 border-2 border-dashed border-blue-400 shadow-md" : ""} ${draggedWorkflow ? "border border-dashed border-gray-300" : ""}`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => {
              setSelectedDirectory(directory.id);
              toggleDirectory(directory.id);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedDirectory(directory.id);
                toggleDirectory(directory.id);
              }
            }}
            role="button"
            tabIndex={0}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? "Collapse" : "Expand"} folder ${directory.name} with ${directoryWorkflows.length} workflows`}
            onDragOver={(e) => handleDirectoryDragOver(e, directory.id)}
            onDragLeave={handleDirectoryDragLeave}
            onDrop={(e) => handleDirectoryDrop(e, directory.id)}
          >
            <div className="mr-1 p-0.5 rounded transition-colors">
              {directory.children.length > 0 ||
              directoryWorkflows.length > 0 ? (
                isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )
              ) : (
                <div className="w-3 h-3" />
              )}
            </div>

            {isExpanded ? (
              <FolderOpen className="w-4 h-4 mr-2 text-gray-600" />
            ) : (
              <Folder className="w-4 h-4 mr-2 text-gray-600" />
            )}

            <span className="flex-1 truncate text-gray-900">
              {directory.name}
            </span>

            <Badge variant="secondary" className="text-xs ml-2">
              {getWorkflowsForDirectory(directory.id).length}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1 p-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Render workflows in this directory */}
          {isExpanded &&
            directoryWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                className={`flex items-center py-1 px-2 rounded-md text-sm cursor-pointer hover:bg-gray-100 transition-colors ${
                  draggedWorkflow === workflow.id ? "opacity-50" : ""
                }`}
                style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
                draggable={true}
                onDragStart={(e) => handleWorkflowDragStart(e, workflow.id)}
                onDragEnd={handleWorkflowDragEnd}
                onClick={() =>
                  router.push(`/workflow-editor?id=${workflow.id}`)
                }
              >
                <FileText className="w-3 h-3 mr-2 text-gray-600" />
                <span className="flex-1 truncate text-gray-700">
                  {workflow.name}
                </span>
                <div className="ml-2">
                  {workflow.enabled ? (
                    <Play className="w-3 h-3 text-green-600" />
                  ) : (
                    <Pause className="w-3 h-3 text-gray-500" />
                  )}
                </div>
              </div>
            ))}

          {/* Render child directories */}
          {isExpanded && directory.children.length > 0 && (
            <div>{renderDirectoryTree(directory.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex h-full">
      {/* Directory Sidebar - Clean Nexlio-style file explorer */}
      {directorySidebarOpen && (
        <div
          className="bg-white border-r border-gray-200"
          style={{ width: Math.max(sidebarWidth, 220), minWidth: "220px" }}
        >
          <div className="p-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">Workflows</h3>
              <Dialog
                open={showNewDirectoryDialog}
                onOpenChange={setShowNewDirectoryDialog}
              >
                <DialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="directory-name">Folder Name</Label>
                      <Input
                        id="directory-name"
                        value={newDirectoryName}
                        onChange={(e) => setNewDirectoryName(e.target.value)}
                        placeholder="Enter folder name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="directory-description">Description</Label>
                      <Textarea
                        id="directory-description"
                        value={newDirectoryDescription}
                        onChange={(e) =>
                          setNewDirectoryDescription(e.target.value)
                        }
                        placeholder="Optional description"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateDirectory}>
                      Create Folder
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Root level */}
            <div
              className={`flex items-center py-2 px-2 rounded-md text-sm cursor-pointer hover:bg-gray-100 transition-colors ${
                selectedDirectory === null ? "bg-gray-100" : ""
              } ${dragOverDirectory === null && draggedWorkflow ? "bg-blue-50 border-2 border-dashed border-blue-400 shadow-md" : ""} ${draggedWorkflow ? "border border-dashed border-gray-300" : ""}`}
              onClick={() => {
                setSelectedDirectory(null);
              }}
              onDragOver={(e) => handleDirectoryDragOver(e, null)}
              onDragLeave={handleDirectoryDragLeave}
              onDrop={(e) => handleDirectoryDrop(e, null)}
            >
              <Folder className="w-4 h-4 mr-2 text-gray-600" />
              <span className="flex-1">All Workflows</span>
              <Badge variant="secondary" className="text-xs">
                {workflows.length}
              </Badge>
            </div>

            {/* Directory tree */}
            <div className="mt-3 space-y-1">
              {renderDirectoryTree(directories)}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Clean Toolbar */}
        <div className="border-b border-gray-200 p-4 bg-white">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDirectorySidebarOpen(!directorySidebarOpen)}
                className="h-8 w-8 p-0 flex-shrink-0"
                aria-label="Toggle folder sidebar"
              >
                <Folder className="w-4 h-4" />
              </Button>

              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <Input
                  className="pl-10 h-8 w-full"
                  placeholder="Search workflows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-8 flex-shrink-0">
                  <SelectValue placeholder="Filter" />
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

            <Button size="sm" className="flex-shrink-0" onClick={onCreateWorkflow}>
              <Plus className="w-4 h-4 mr-2" />
              New Workflow
            </Button>
          </div>
        </div>

        {/* Clean Workflow List */}
        <div className="flex-1 p-4 bg-gray-50">
          {filteredWorkflows.length > 0 ? (
            <div className="space-y-2">
              {filteredWorkflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className={`group bg-white p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-all cursor-move ${
                    draggedWorkflow === workflow.id ? "opacity-50 scale-95 shadow-lg border-blue-400" : "hover:border-gray-300"
                  }`}
                  draggable
                  onDragStart={(e) => handleWorkflowDragStart(e, workflow.id)}
                  onDragEnd={handleWorkflowDragEnd}
                  onClick={(e) => {
                    // Only navigate if not dragging
                    if (!draggedWorkflow) {
                      router.push(`/workflow-editor?id=${workflow.id}`);
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-2 flex-1 min-w-0">
                      <div 
                        className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                        title="Drag to move workflow to a folder"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <FileText className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          <h3 className="font-medium text-gray-900 break-words">
                            {workflow.name}
                          </h3>
                          <Badge
                            variant={workflow.enabled ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {workflow.enabled ? "Active" : "Inactive"}
                          </Badge>
                          {workflow.enabled ? (
                            <Play className="w-3 h-3 text-green-600" />
                          ) : (
                            <Pause className="w-3 h-3 text-gray-500" />
                          )}
                        </div>

                        {workflow.description && (
                          <p className="text-sm text-gray-600 mb-2 truncate">
                            {workflow.description}
                          </p>
                        )}

                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Trigger: {workflow.trigger}</span>
                          <span>Runs: {workflow.runCount}</span>
                          <span>
                            Created:{" "}
                            {new Date(workflow.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle workflow toggle
                        }}
                      >
                        {workflow.enabled ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">
                {selectedDirectory
                  ? "No workflows in this folder"
                  : "No workflows found"}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {searchQuery
                  ? "Try adjusting your search criteria"
                  : "Create your first workflow to get started"}
              </p>
              <Button onClick={onCreateWorkflow}>
                <Plus className="w-4 h-4 mr-2" />
                Create Workflow
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}