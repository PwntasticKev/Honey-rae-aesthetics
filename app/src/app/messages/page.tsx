"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  MessageSquare,
  Mail,
  Search,
  Plus,
  Send,
  Eye,
  Edit,
  Trash2,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Template,
  Loader2,
  Copy,
  Filter,
} from "lucide-react";
import { format } from "date-fns";

interface MessageTemplate {
  id: number;
  name: string;
  description?: string;
  type: "sms" | "email";
  subject?: string;
  content: string;
  variables: string[];
  category?: string;
  usageCount: number;
  isActive: boolean;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

interface TemplateAnalytics {
  overview: {
    totalTemplates: number;
    activeTemplates: number;
    emailTemplates: number;
    smsTemplates: number;
    totalUsage: number;
    averageUsage: number;
  };
  categoryBreakdown: Array<{
    category: string;
    templateCount: number;
    totalUsage: number;
  }>;
  mostUsedTemplates: Array<{
    id: number;
    name: string;
    type: "sms" | "email";
    usageCount: number;
  }>;
}

interface Client {
  id: number;
  fullName: string;
  email: string;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [analytics, setAnalytics] = useState<TemplateAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeTab, setActiveTab] = useState("templates");

  // Template dialog states
  const [templateDialog, setTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateType, setTemplateType] = useState<"sms" | "email">("email");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [templateCategory, setTemplateCategory] = useState("");

  // Send message dialog states
  const [sendDialog, setSendDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [messageVariables, setMessageVariables] = useState<Record<string, string>>({});

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        type: typeFilter,
        ...(categoryFilter && { category: categoryFilter }),
        sortBy: "newest",
      });

      const response = await fetch(`/api/messages/templates?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }

      const data = await response.json();
      setTemplates(data.templates);
      setAnalytics(data.analytics);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch clients
  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients?limit=1000");
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchClients();
  }, [searchTerm, typeFilter, categoryFilter]);

  // Handle template creation/update
  const handleSaveTemplate = async () => {
    if (!templateName || !templateContent) return;

    try {
      const templateData = {
        name: templateName,
        description: templateDescription,
        type: templateType,
        subject: templateType === "email" ? templateSubject : undefined,
        content: templateContent,
        category: templateCategory,
      };

      const response = await fetch(
        editingTemplate ? `/api/messages/templates/${editingTemplate.id}` : "/api/messages/templates",
        {
          method: editingTemplate ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(templateData),
        }
      );

      if (response.ok) {
        resetTemplateForm();
        fetchTemplates();
      }
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };

  // Reset template form
  const resetTemplateForm = () => {
    setTemplateDialog(false);
    setEditingTemplate(null);
    setTemplateName("");
    setTemplateDescription("");
    setTemplateType("email");
    setTemplateSubject("");
    setTemplateContent("");
    setTemplateCategory("");
  };

  // Handle template editing
  const handleEditTemplate = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateDescription(template.description || "");
    setTemplateType(template.type);
    setTemplateSubject(template.subject || "");
    setTemplateContent(template.content);
    setTemplateCategory(template.category || "");
    setTemplateDialog(true);
  };

  // Handle template deletion
  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const response = await fetch(`/api/messages/templates/${templateId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!selectedTemplate || selectedClients.length === 0) return;

    setSending(true);

    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          recipientIds: selectedClients,
          variables: messageVariables,
        }),
      });

      if (response.ok) {
        setSendDialog(false);
        setSelectedTemplate(null);
        setSelectedClients([]);
        setMessageVariables({});
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  // Extract available variables from template content
  const getTemplateVariables = (content: string, subject?: string) => {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    
    let match;
    while ((match = variableRegex.exec(content)) !== null) {
      variables.add(match[1]);
    }
    
    if (subject) {
      const subjectVariableRegex = /\{\{(\w+)\}\}/g;
      let subjectMatch;
      while ((subjectMatch = subjectVariableRegex.exec(subject)) !== null) {
        variables.add(subjectMatch[1]);
      }
    }
    
    return Array.from(variables);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Message Center</h1>
          <p className="text-muted-foreground">
            Manage email and SMS templates, send communications to clients
          </p>
        </div>
        
        <Button onClick={() => setTemplateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
              <Template className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.totalTemplates}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.overview.activeTemplates} active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Email Templates</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.emailTemplates}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.overview.smsTemplates} SMS templates
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.totalUsage}</div>
              <p className="text-xs text-muted-foreground">
                Avg: {analytics.overview.averageUsage} per template
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Used</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analytics.mostUsedTemplates[0] ? (
                <div>
                  <div className="text-sm font-medium">{analytics.mostUsedTemplates[0].name}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.mostUsedTemplates[0].usageCount} uses
                  </p>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No templates used yet</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="history">Message History</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {analytics?.categoryBreakdown.map((cat) => (
                        <SelectItem key={cat.category} value={cat.category}>
                          {cat.category} ({cat.templateCount})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {template.description && (
                        <CardDescription className="text-sm">
                          {template.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={template.type === "email" ? "default" : "secondary"}>
                        {template.type === "email" ? <Mail className="h-3 w-3 mr-1" /> : <MessageSquare className="h-3 w-3 mr-1" />}
                        {template.type.toUpperCase()}
                      </Badge>
                      {!template.isActive && (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {template.subject && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Subject:</p>
                        <p className="text-sm truncate">{template.subject}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Content Preview:</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.content}
                      </p>
                    </div>
                    
                    {template.variables.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Variables:</p>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.slice(0, 3).map((variable) => (
                            <Badge key={variable} variant="outline" className="text-xs">
                              {`{{${variable}}}`}
                            </Badge>
                          ))}
                          {template.variables.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.variables.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Used {template.usageCount} times</span>
                      <span>{format(new Date(template.createdAt), "MMM d, yyyy")}</span>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setSendDialog(true);
                        }}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Send
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="compose">
          <Card>
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
              <CardDescription>
                Send a custom message or use an existing template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Compose functionality will be implemented here
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Message History</CardTitle>
              <CardDescription>
                View sent messages and delivery status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Message history will be implemented here
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Creation/Edit Dialog */}
      <Dialog open={templateDialog} onOpenChange={setTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "Create New Template"}
            </DialogTitle>
            <DialogDescription>
              Create reusable message templates with variables
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Appointment Reminder"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={templateType} onValueChange={(value: "sms" | "email") => setTemplateType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Brief description of this template"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category (Optional)</Label>
              <Input
                id="category"
                placeholder="e.g., appointment_reminder, follow_up"
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value)}
              />
            </div>
            
            {templateType === "email" && (
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Email subject line"
                  value={templateSubject}
                  onChange={(e) => setTemplateSubject(e.target.value)}
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="content">Message Content</Label>
              <Textarea
                id="content"
                placeholder="Your message content. Use {{variableName}} for dynamic content."
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                rows={6}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use variables like {"{firstName}"}, {"{clientName}"}, {"{appointmentDate}"} etc.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={resetTemplateForm}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveTemplate}
              disabled={!templateName || !templateContent}
            >
              {editingTemplate ? "Update Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={sendDialog} onOpenChange={setSendDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>
              Send "{selectedTemplate?.name}" to selected clients
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Recipients</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select clients" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedTemplate && getTemplateVariables(selectedTemplate.content, selectedTemplate.subject).length > 0 && (
              <div>
                <Label>Template Variables</Label>
                <div className="space-y-2">
                  {getTemplateVariables(selectedTemplate.content, selectedTemplate.subject).map((variable) => (
                    <div key={variable}>
                      <Label htmlFor={variable} className="text-sm">
                        {variable}
                      </Label>
                      <Input
                        id={variable}
                        placeholder={`Value for {{${variable}}}`}
                        value={messageVariables[variable] || ""}
                        onChange={(e) => setMessageVariables({
                          ...messageVariables,
                          [variable]: e.target.value
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendMessage}
              disabled={selectedClients.length === 0 || sending}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}