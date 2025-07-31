"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Plus, Save, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function TemplatesPage() {
  const [templateType, setTemplateType] = useState<"email" | "sms">("email");
  const [templateName, setTemplateName] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const availableVariables = [
    "{{first_name}}",
    "{{last_name}}",
    "{{full_name}}",
    "{{email}}",
    "{{phone}}",
    "{{company_name}}",
    "{{today}}",
    "{{appointment_date}}",
  ];

  const handleCreateTemplate = async () => {
    if (!templateName.trim() || !content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (templateType === "email" && !subject.trim()) {
      toast({
        title: "Missing Subject",
        description: "Email templates require a subject line.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      // TODO: Implement template creation API
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      toast({
        title: "Template Created",
        description: `${templateType.toUpperCase()} template "${templateName}" has been created successfully.`,
      });

      // Reset form
      setTemplateName("");
      setSubject("");
      setContent("");
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: "Failed to create template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.querySelector("textarea");
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent =
        content.substring(0, start) + variable + content.substring(end);
      setContent(newContent);

      // Focus back on textarea
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + variable.length,
          start + variable.length,
        );
      }, 0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Create Template
              </h1>
              <p className="text-gray-600">
                Create reusable email and SMS templates
              </p>
            </div>
          </div>
        </div>

        {/* Template Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-6">
            {/* Template Type */}
            <div>
              <Label>Template Type</Label>
              <Select
                value={templateType}
                onValueChange={(value: "email" | "sms") =>
                  setTemplateType(value)
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Email Template</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="sms">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>SMS Template</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Template Name */}
            <div>
              <Label>Template Name *</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Enter template name"
                className="mt-2"
              />
            </div>

            {/* Subject (Email only) */}
            {templateType === "email" && (
              <div>
                <Label>Subject *</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                  className="mt-2"
                />
              </div>
            )}

            {/* Content */}
            <div>
              <Label>Message Content *</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Enter your ${templateType} message here...`}
                rows={8}
                className="mt-2 font-mono text-sm"
              />
            </div>

            {/* Available Variables */}
            <div>
              <Label className="text-sm font-medium">Available Variables</Label>
              <p className="text-sm text-gray-600 mb-2">
                Click on a variable to insert it into your message
              </p>
              <div className="flex flex-wrap gap-2">
                {availableVariables.map((variable) => (
                  <Badge
                    key={variable}
                    variant="secondary"
                    className="cursor-pointer hover:bg-gray-200"
                    onClick={() => insertVariable(variable)}
                  >
                    {variable}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Preview */}
            {content && (
              <div>
                <Label className="text-sm font-medium">Preview</Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                  {templateType === "email" && subject && (
                    <div className="mb-2">
                      <span className="font-medium">Subject:</span> {subject}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-sm">{content}</div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTemplate}
                disabled={isCreating || !templateName.trim() || !content.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isCreating ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Template
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
