"use client";

import React, { useState } from "react";
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
  Edit3,
  Trash2,
  Copy,
  Eye,
  Check,
} from "lucide-react";

interface MessageTemplate {
  _id: string;
  name: string;
  type: "sms" | "email";
  subject?: string;
  content: string;
  mergeTags: string[];
  createdAt: number;
}

interface TemplateSelectorProps {
  orgId: string;
  type: "sms" | "email";
  selectedTemplateId?: string;
  onTemplateSelect: (templateId: string, template: MessageTemplate) => void;
  onCreateTemplate?: (template: MessageTemplate) => void;
}

export function TemplateSelector({
  orgId,
  type,
  selectedTemplateId,
  onTemplateSelect,
  onCreateTemplate,
}: TemplateSelectorProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewTemplate, setPreviewTemplate] =
    useState<MessageTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    subject: "",
    content: "",
    type: type,
  });

  // Queries
  const templates = useQuery(api.messageTemplates.getByOrg, {
    orgId: orgId as any,
  });

  // Mutations
  const createTemplate = useMutation(api.messageTemplates.create);
  const updateTemplate = useMutation(api.messageTemplates.update);
  const deleteTemplate = useMutation(api.messageTemplates.remove);

  // Filter templates by type
  const filteredTemplates = templates?.filter((t) => t.type === type) || [];

  // Common merge tags
  const commonMergeTags = [
    "{{first_name}}",
    "{{last_name}}",
    "{{full_name}}",
    "{{email}}",
    "{{phone}}",
    "{{appointment_date}}",
    "{{appointment_time}}",
    "{{treatment_type}}",
    "{{provider_name}}",
    "{{clinic_name}}",
    "{{clinic_phone}}",
    "{{today_date}}",
  ];

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const templateId = await createTemplate({
        orgId: orgId as any,
        name: newTemplate.name,
        type: type,
        subject: type === "email" ? newTemplate.subject : undefined,
        content: newTemplate.content,
        mergeTags: extractMergeTags(newTemplate.content),
      });

      const createdTemplate = {
        _id: templateId,
        name: newTemplate.name,
        type: type,
        subject: newTemplate.subject,
        content: newTemplate.content,
        mergeTags: extractMergeTags(newTemplate.content),
        createdAt: Date.now(),
      };

      if (onCreateTemplate) {
        onCreateTemplate(createdTemplate);
      }

      setShowCreateDialog(false);
      setNewTemplate({ name: "", subject: "", content: "", type: type });
    } catch (error) {
      console.error("Failed to create template:", error);
      alert("Failed to create template");
    }
  };

  const handlePreviewTemplate = (template: MessageTemplate) => {
    setPreviewTemplate(template);
    setShowPreviewDialog(true);
  };

  const extractMergeTags = (content: string): string[] => {
    const matches = content.match(/\{\{[^}]+\}\}/g);
    return matches ? [...new Set(matches)] : [];
  };

  const insertMergeTag = (tag: string) => {
    const textarea = document.getElementById(
      "template-content",
    ) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent =
        newTemplate.content.substring(0, start) +
        tag +
        newTemplate.content.substring(end);

      setNewTemplate({ ...newTemplate, content: newContent });

      // Set cursor position after inserted tag
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    }
  };

  const renderPreview = (template: MessageTemplate) => {
    let content = template.content;

    // Replace merge tags with example data for preview
    const exampleData = {
      "{{first_name}}": "John",
      "{{last_name}}": "Smith",
      "{{full_name}}": "John Smith",
      "{{email}}": "john.smith@example.com",
      "{{phone}}": "(555) 123-4567",
      "{{appointment_date}}": "March 15, 2024",
      "{{appointment_time}}": "2:00 PM",
      "{{treatment_type}}": "Botox",
      "{{provider_name}}": "Dr. Johnson",
      "{{clinic_name}}": "Honey Rae Aesthetics",
      "{{clinic_phone}}": "(555) 987-6543",
      "{{today_date}}": new Date().toLocaleDateString(),
    };

    Object.entries(exampleData).forEach(([tag, value]) => {
      content = content.replace(
        new RegExp(tag.replace(/[{}]/g, "\\$&"), "g"),
        value,
      );
    });

    return content;
  };

  return (
    <div className="space-y-4">
      {/* Template Selection */}
      <div>
        <Label>Select {type.toUpperCase()} Template</Label>
        <div className="flex space-x-2 mt-1">
          <Select
            value={selectedTemplateId || ""}
            onValueChange={(value) => {
              const template = filteredTemplates.find((t) => t._id === value);
              if (template) {
                onTemplateSelect(value, template);
              }
            }}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={`Select ${type} template`} />
            </SelectTrigger>
            <SelectContent>
              {filteredTemplates.map((template) => (
                <SelectItem key={template._id} value={template._id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{template.name}</span>
                    <Badge variant="outline" className="ml-2">
                      {template.mergeTags.length} tags
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Selected Template Preview */}
      {selectedTemplateId && (
        <div className="mt-4">
          {(() => {
            const selectedTemplate = filteredTemplates.find(
              (t) => t._id === selectedTemplateId,
            );
            if (!selectedTemplate) return null;

            return (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center">
                      {type === "sms" ? (
                        <MessageSquare className="h-4 w-4 mr-2" />
                      ) : (
                        <Mail className="h-4 w-4 mr-2" />
                      )}
                      {selectedTemplate.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewTemplate(selectedTemplate)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {type === "email" && selectedTemplate.subject && (
                    <div className="mb-2">
                      <Label className="text-xs text-gray-500">Subject:</Label>
                      <div className="text-sm font-medium">
                        {selectedTemplate.subject}
                      </div>
                    </div>
                  )}
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {selectedTemplate.content.substring(0, 150)}
                    {selectedTemplate.content.length > 150 && "..."}
                  </div>
                  {selectedTemplate.mergeTags.length > 0 && (
                    <div className="mt-2">
                      <Label className="text-xs text-gray-500">
                        Merge Tags:
                      </Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedTemplate.mergeTags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}
        </div>
      )}

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New {type.toUpperCase()} Template</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                value={newTemplate.name}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, name: e.target.value })
                }
                placeholder="Enter template name"
              />
            </div>

            {type === "email" && (
              <div>
                <Label htmlFor="template-subject">Email Subject</Label>
                <Input
                  id="template-subject"
                  value={newTemplate.subject}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, subject: e.target.value })
                  }
                  placeholder="Enter email subject"
                />
              </div>
            )}

            <div>
              <Label htmlFor="template-content">Message Content *</Label>
              <Textarea
                id="template-content"
                value={newTemplate.content}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, content: e.target.value })
                }
                placeholder={`Enter your ${type} message...`}
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            {/* Merge Tags Helper */}
            <div>
              <Label>Quick Insert Merge Tags</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {commonMergeTags.map((tag) => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    className="text-xs justify-start"
                    onClick={() => insertMergeTag(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {newTemplate.content && (
              <div>
                <Label>Preview</Label>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  {type === "email" && newTemplate.subject && (
                    <div className="font-medium mb-2">
                      Subject: {newTemplate.subject}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">
                    {renderPreview({
                      _id: "",
                      name: newTemplate.name,
                      type: type,
                      subject: newTemplate.subject,
                      content: newTemplate.content,
                      mergeTags: extractMergeTags(newTemplate.content),
                      createdAt: Date.now(),
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate}>
                <Check className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Preview: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>

          {previewTemplate && (
            <div className="space-y-4">
              {type === "email" && previewTemplate.subject && (
                <div>
                  <Label>Subject</Label>
                  <div className="bg-gray-50 p-3 rounded">
                    {renderPreview(previewTemplate).split("\n")[0]}
                  </div>
                </div>
              )}

              <div>
                <Label>Message</Label>
                <div className="bg-gray-50 p-4 rounded whitespace-pre-wrap">
                  {renderPreview(previewTemplate)}
                </div>
              </div>

              <div className="text-xs text-gray-500">
                * This preview shows sample data. Actual messages will use real
                client information.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
