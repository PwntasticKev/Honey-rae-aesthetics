"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
  MoreHorizontal,
  Filter,
  Search,
  FileText,
  ChevronRight,
  ChevronDown,
  BarChart3,
  Eye,
  Trash2,
} from "lucide-react";

interface Directory {
  id: number;
  name: string;
  parentId?: number;
  description?: string;
  color?: string;
  children: Directory[];
  workflowCount: number;
}

interface Workflow {
  id: number;
  name: string;
  description?: string;
  status: "active" | "inactive" | "draft" | "archived";
  trigger: string;
  directoryId?: number;
  enabled: boolean;
  runCount: number;
  createdAt: string;
}

interface DrizzleWorkflowListProps {
  orgId: string;
  viewMode?: "full" | "sidebar";
}

export function DrizzleWorkflowList({
  orgId,
  viewMode = "full",
}: DrizzleWorkflowListProps) {
  const router = useRouter();
  const [selectedDirectory, setSelectedDirectory] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDirectories, setExpandedDirectories] = useState<Set<number>>(new Set());
  const [showNewDirectoryDialog, setShowNewDirectoryDialog] = useState(false);
  const [newDirectoryName, setNewDirectoryName] = useState("");
  const [newDirectoryDescription, setNewDirectoryDescription] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [directorySidebarOpen, setDirectorySidebarOpen] = useState(true);
  
  // Data state
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  // Load directories and workflows
  useEffect(() => {
    loadData();
  }, [orgId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load directories
      const dirResponse = await fetch(`/api/workflow-directories?orgId=${orgId}`);
      const dirData = await dirResponse.json();
      setDirectories(dirData.directories || []);
      
      // Load workflows
      const workflowResponse = await fetch(`/api/workflows/simple?orgId=${orgId}`);
      const workflowData = await workflowResponse.json();
      setWorkflows(workflowData.workflows || []);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create new directory
  const handleCreateDirectory = async () => {
    try {
      const response = await fetch('/api/workflow-directories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDirectoryName,
          description: newDirectoryDescription,
          parentId: selectedDirectory,
          orgId: parseInt(orgId),
          createdBy: 1, // TODO: Get from auth
        }),
      });
      
      if (response.ok) {
        setShowNewDirectoryDialog(false);
        setNewDirectoryName("");
        setNewDirectoryDescription("");
        loadData(); // Reload data
      }
    } catch (error) {
      console.error('Error creating directory:', error);
    }
  };

  // Toggle directory expansion
  const toggleDirectory = (directoryId: number) => {
    const newExpanded = new Set(expandedDirectories);
    if (newExpanded.has(directoryId)) {
      newExpanded.delete(directoryId);
    } else {
      newExpanded.add(directoryId);
    }
    setExpandedDirectories(newExpanded);
  };

  // Filter workflows
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         workflow.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
    const matchesDirectory = selectedDirectory === null || workflow.directoryId === selectedDirectory;
    
    return matchesSearch && matchesStatus && matchesDirectory;
  });

  // Render directory tree recursively
  const renderDirectoryTree = (dirs: Directory[], level = 0) => {
    return dirs.map((directory) => (
      <div key={directory.id} className="select-none">
        <div
          className={`flex items-center py-1 px-2 rounded cursor-pointer hover:bg-gray-100 ${
            selectedDirectory === directory.id ? 'bg-pink-100 text-pink-700' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => setSelectedDirectory(directory.id)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleDirectory(directory.id);
            }}
            className="mr-1 p-1 rounded hover:bg-gray-200"
          >
            {directory.children.length > 0 ? (
              expandedDirectories.has(directory.id) ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )
            ) : (
              <div className="w-3 h-3" />
            )}
          </button>
          
          {expandedDirectories.has(directory.id) ? (
            <FolderOpen className="w-4 h-4 mr-2 text-blue-500" />
          ) : (
            <Folder className="w-4 h-4 mr-2 text-blue-500" />
          )}
          
          <span className="text-sm font-medium flex-1">{directory.name}</span>
          
          <Badge variant="secondary" className="text-xs ml-2">
            {directory.workflowCount}
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 p-1 opacity-0 group-hover:opacity-100"
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
        
        {expandedDirectories.has(directory.id) && directory.children.length > 0 && (
          <div>{renderDirectoryTree(directory.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        <span className="ml-2">Loading workflows...</span>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Directory Sidebar */}
      {directorySidebarOpen && (
        <div 
          className="border-r border-gray-200 bg-gray-50"
          style={{ width: sidebarWidth }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Folders</h3>
              <Dialog open={showNewDirectoryDialog} onOpenChange={setShowNewDirectoryDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
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
                        onChange={(e) => setNewDirectoryDescription(e.target.value)}
                        placeholder="Optional description"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateDirectory}>Create Folder</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Root level */}
            <div
              className={`flex items-center py-2 px-2 rounded cursor-pointer hover:bg-gray-100 mb-2 ${
                selectedDirectory === null ? 'bg-pink-100 text-pink-700' : ''
              }`}
              onClick={() => setSelectedDirectory(null)}
            >
              <Folder className="w-4 h-4 mr-2 text-gray-500" />
              <span className="text-sm font-medium">All Workflows</span>
              <Badge variant="secondary" className="text-xs ml-auto">
                {workflows.length}
              </Badge>
            </div>
            
            {/* Directory tree */}
            <div className="space-y-1">
              {renderDirectoryTree(directories)}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDirectorySidebarOpen(!directorySidebarOpen)}
              >
                <Folder className="w-4 h-4" />
              </Button>
              
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder="Search workflows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            
            <Button className="bg-pink-600 hover:bg-pink-700">
              <Plus className="w-4 h-4 mr-2" />
              New Workflow
            </Button>
          </div>
        </div>

        {/* Workflow List */}
        <div className="flex-1 p-4">
          {filteredWorkflows.length > 0 ? (
            <div className="grid gap-4">
              {filteredWorkflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/workflow-editor?id=${workflow.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <h3 className="font-medium text-gray-900">{workflow.name}</h3>
                        <Badge
                          variant={workflow.status === 'active' ? 'default' : 'secondary'}
                        >
                          {workflow.status}
                        </Badge>
                      </div>
                      
                      {workflow.description && (
                        <p className="text-sm text-gray-600 mt-2">{workflow.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                        <span>Trigger: {workflow.trigger}</span>
                        <span>Runs: {workflow.runCount}</span>
                        <span>Created: {new Date(workflow.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
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
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedDirectory ? 'No workflows in this folder' : 'No workflows found'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery ? 'Try adjusting your search criteria' : 'Create your first workflow to get started'}
              </p>
              <Button className="bg-pink-600 hover:bg-pink-700">
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