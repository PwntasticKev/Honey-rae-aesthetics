"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  MessageSquare,
  Users,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";

interface ClientMessagingProps {
  orgId: string;
  selectedClients: string[];
  onSelectionChange: (clientIds: string[]) => void;
}

export function ClientMessaging({
  orgId,
  selectedClients,
  onSelectionChange,
}: ClientMessagingProps) {
  const [messagingDialogOpen, setMessagingDialogOpen] = useState(false);
  const [messageType, setMessageType] = useState<"email" | "sms">("email");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [templateId, setTemplateId] = useState<string>("");
  const [isSending, setIsSending] = useState(false);

  const { toast } = useToast();

  // Queries
  const templates = useQuery(api.messageTemplates.getByOrg, {
    orgId: orgId as any,
  });
  const awsConfig = useQuery(api.awsConfig.getByOrg, { orgId: orgId as any });

  // Mutations
  const createBulkMessage = useMutation(api.bulkMessages.create);
  const sendBulkMessage = useMutation(api.bulkMessages.sendBulkMessage);

  const handleSendMessage = async () => {
    if (!content.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message to send.",
        variant: "destructive",
      });
      return;
    }

    if (selectedClients.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please select at least one client to send a message to.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      // Create bulk message
      const bulkMessageId = await createBulkMessage({
        orgId: orgId as any,
        name: `${messageType === "email" ? "Email" : "SMS"} Campaign - ${new Date().toLocaleDateString()}`,
        type: messageType,
        templateId: templateId ? (templateId as any) : undefined,
        subject: messageType === "email" ? subject : undefined,
        content,
      });

      // Send to selected clients
      await sendBulkMessage({
        bulkMessageId,
        clientIds: selectedClients as any[],
      });

      toast({
        title: "Message Sent",
        description: `Successfully sent ${messageType.toUpperCase()} to ${selectedClients.length} clients.`,
      });

      // Reset form
      setSubject("");
      setContent("");
      setTemplateId("");
      setMessagingDialogOpen(false);
      onSelectionChange([]);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Send Failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setTemplateId(templateId);
    if (templateId && templateId !== "none") {
      const template = templates?.find((t) => t._id === templateId);
      if (template) {
        // Ensure content is treated as a string, not a template literal
        setContent(String(template.content || ""));
        if (template.subject) {
          setSubject(String(template.subject));
        }
      }
    } else {
      setContent("");
      setSubject("");
    }
  };

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

  return (
    <div className="space-y-4">
      {/* Messaging Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">
              {selectedClients.length} client
              {selectedClients.length !== 1 ? "s" : ""} selected
            </span>
          </div>
          {selectedClients.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectionChange([])}
              className="text-gray-500"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setMessagingDialogOpen(true)}
            disabled={selectedClients.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Mail className="h-4 w-4 mr-2" />
            Email Selected
          </Button>
          <Button
            onClick={() => {
              setMessageType("sms");
              setMessagingDialogOpen(true);
            }}
            disabled={selectedClients.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            SMS Selected
          </Button>
        </div>
      </div>

      {/* AWS Configuration Status */}
      {awsConfig && (
        <div className="flex items-center space-x-2 text-sm">
          {awsConfig.isConfigured ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span>AWS configured</span>
            </div>
          ) : (
            <div className="flex items-center text-orange-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span>AWS not configured</span>
            </div>
          )}
        </div>
      )}

      {/* Messaging Dialog */}
      <Dialog open={messagingDialogOpen} onOpenChange={setMessagingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {messageType === "email" ? (
                <Mail className="h-5 w-5" />
              ) : (
                <MessageSquare className="h-5 w-5" />
              )}
              Send {messageType.toUpperCase()} to {selectedClients.length}{" "}
              clients
            </DialogTitle>
            <DialogDescription>
              Send a {messageType} message to all selected clients. You can use
              variables like {"{{first_name}}"} to personalize the message.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Message Type */}
            <div>
              <Label>Message Type</Label>
              <Select
                value={messageType}
                onValueChange={(value: "email" | "sms") =>
                  setMessageType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Template Selection */}
            {templates && templates.length > 0 && (
              <div>
                <Label>Template (Optional)</Label>
                <Select value={templateId} onValueChange={handleTemplateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No template</SelectItem>
                    {templates
                      .filter((t) => t.type === messageType)
                      .map((template) => (
                        <SelectItem key={template._id} value={template._id}>
                          {template.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Subject (Email only) */}
            {messageType === "email" && (
              <div>
                <Label>Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                />
              </div>
            )}

            {/* Message Content */}
            <div>
              <Label>Message Content</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Enter your ${messageType} message here...`}
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            {/* Available Variables */}
            <div>
              <Label className="text-sm font-medium">Available Variables</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableVariables.map((variable) => (
                  <Badge
                    key={variable}
                    variant="secondary"
                    className="cursor-pointer hover:bg-gray-200"
                    onClick={() => {
                      const textarea = document.querySelector("textarea");
                      if (textarea) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const newContent =
                          content.substring(0, start) +
                          variable +
                          content.substring(end);
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
                    }}
                  >
                    {variable}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Recipients Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">
                Recipients ({selectedClients.length})
              </h4>
              <p className="text-sm text-gray-600">
                This {messageType} will be sent to {selectedClients.length}{" "}
                selected client{selectedClients.length !== 1 ? "s" : ""}.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMessagingDialogOpen(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={isSending || !content.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send {messageType.toUpperCase()}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
