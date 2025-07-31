"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Tag,
  Trash2,
  Download,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";

interface ClientHeaderActionsProps {
  orgId: string;
  selectedClients: string[];
  onSelectionChange: (clientIds: string[]) => void;
}

export function ClientHeaderActions({
  orgId,
  selectedClients,
  onSelectionChange,
}: ClientHeaderActionsProps) {
  const [messagingDialogOpen, setMessagingDialogOpen] = useState(false);
  const [taggingDialogOpen, setTaggingDialogOpen] = useState(false);
  const [messageType, setMessageType] = useState<"email" | "sms">("email");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [templateId, setTemplateId] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [tagAction, setTagAction] = useState<"add" | "remove">("add");
  const [tagName, setTagName] = useState("");
  const [isTagging, setIsTagging] = useState(false);

  const { toast } = useToast();

  // Queries
  const templates = useQuery(api.messageTemplates.getByOrg, {
    orgId: orgId as any,
  });
  const awsConfig = useQuery(api.awsConfig.getByOrg, { orgId: orgId as any });

  // Mutations
  const createBulkMessage = useMutation(api.bulkMessages.create);
  const sendBulkMessage = useMutation(api.bulkMessages.sendBulkMessage);
  const addTagToClients = useMutation(api.clients.addTagToMultiple);
  const removeTagFromClients = useMutation(api.clients.removeTagFromMultiple);

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

  const handleTagging = async () => {
    if (!tagName.trim()) {
      toast({
        title: "Tag Required",
        description: "Please enter a tag name.",
        variant: "destructive",
      });
      return;
    }

    if (selectedClients.length === 0) {
      toast({
        title: "No Clients Selected",
        description: "Please select at least one client.",
        variant: "destructive",
      });
      return;
    }

    setIsTagging(true);

    try {
      if (tagAction === "add") {
        await addTagToClients({
          orgId: orgId as any,
          clientIds: selectedClients as any[],
          tag: tagName.trim(),
        });
        toast({
          title: "Tag Added",
          description: `Added tag "${tagName}" to ${selectedClients.length} clients.`,
        });
      } else {
        await removeTagFromClients({
          orgId: orgId as any,
          clientIds: selectedClients as any[],
          tag: tagName.trim(),
        });
        toast({
          title: "Tag Removed",
          description: `Removed tag "${tagName}" from ${selectedClients.length} clients.`,
        });
      }

      setTagName("");
      setTaggingDialogOpen(false);
      onSelectionChange([]);
    } catch (error) {
      console.error("Failed to update tags:", error);
      toast({
        title: "Tag Update Failed",
        description: "Failed to update tags. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTagging(false);
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

  const handleCreateTemplate = () => {
    // Redirect to template creation page
    window.open("/templates", "_blank");
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
    <div className="flex items-center space-x-2">
      {/* Selection Count */}
      {selectedClients.length > 0 && (
        <div className="flex items-center space-x-2 mr-4">
          <Users className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {selectedClients.length} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectionChange([])}
            className="text-gray-500 h-6 px-2"
            title="Clear selection"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Email Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          setMessageType("email");
          setMessagingDialogOpen(true);
        }}
        disabled={selectedClients.length === 0}
        className="h-8 w-8"
        title="Send Email"
      >
        <Mail className="h-4 w-4" />
      </Button>

      {/* SMS Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          setMessageType("sms");
          setMessagingDialogOpen(true);
        }}
        disabled={selectedClients.length === 0}
        className="h-8 w-8"
        title="Send SMS"
      >
        <MessageSquare className="h-4 w-4" />
      </Button>

      {/* Tag Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTaggingDialogOpen(true)}
        disabled={selectedClients.length === 0}
        className="h-8 w-8"
        title="Manage Tags"
      >
        <Tag className="h-4 w-4" />
      </Button>

      {/* AWS Configuration Status */}
      {awsConfig && (
        <div className="flex items-center space-x-1 text-xs">
          {awsConfig.isConfigured ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              <span>AWS</span>
            </div>
          ) : (
            <div className="flex items-center text-orange-600">
              <AlertCircle className="h-3 w-3 mr-1" />
              <span>AWS</span>
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
              Send {messageType === "email" ? "Email" : "SMS"} to{" "}
              {selectedClients.length} clients
            </DialogTitle>
            <DialogDescription>
              {messageType === "email"
                ? "Send an email to all selected clients. You can use variables like {{first_name}} to personalize the message."
                : "Send an SMS to all selected clients. You can use variables like {{first_name}} to personalize the message."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Sender Information */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">
                {messageType === "email"
                  ? "Email Configuration"
                  : "SMS Configuration"}
              </h4>
              {messageType === "email" ? (
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="font-medium">From:</span>
                    <span className="ml-2 text-gray-600">
                      {awsConfig?.fromEmail || "Not configured"}
                    </span>
                  </div>
                  {!awsConfig?.fromEmail && (
                    <p className="text-xs text-orange-600">
                      Please configure your email settings in AWS configuration.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="font-medium">From:</span>
                    <span className="ml-2 text-gray-600">
                      {awsConfig?.fromPhone || "Not configured"}
                    </span>
                  </div>
                  {!awsConfig?.fromPhone && (
                    <p className="text-xs text-orange-600">
                      Please configure your SMS settings in AWS configuration.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Template Selection - Only show for email */}
            {messageType === "email" && (
              <div>
                <Label>Email Template (Optional)</Label>
                {templates &&
                templates.filter((t) => t.type === "email").length > 0 ? (
                  <Select
                    value={templateId}
                    onValueChange={handleTemplateChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an email template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No template</SelectItem>
                      {templates
                        .filter((t) => t.type === "email")
                        .map((template) => (
                          <SelectItem key={template._id} value={template._id}>
                            {template.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800 mb-2">
                      No email templates available.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateTemplate}
                      className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                    >
                      Create Email Template
                    </Button>
                  </div>
                )}
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
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Enter your ${messageType} message here...`}
                rows={6}
                className="w-full p-3 border border-gray-300 rounded-md font-mono text-sm"
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
                  {messageType === "email" ? (
                    <Mail className="h-4 w-4 mr-2" />
                  ) : (
                    <MessageSquare className="h-4 w-4 mr-2" />
                  )}
                  Send {messageType === "email" ? "Email" : "SMS"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tagging Dialog */}
      <Dialog open={taggingDialogOpen} onOpenChange={setTaggingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Manage Tags
            </DialogTitle>
            <DialogDescription>
              {tagAction === "add" ? "Add" : "Remove"} tags for{" "}
              {selectedClients.length} selected clients.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tag Action */}
            <div>
              <Label>Action</Label>
              <Select
                value={tagAction}
                onValueChange={(value: "add" | "remove") => setTagAction(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Tag</SelectItem>
                  <SelectItem value="remove">Remove Tag</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tag Name */}
            <div>
              <Label>Tag Name</Label>
              <Input
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="Enter tag name"
              />
            </div>

            {/* Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Summary</h4>
              <p className="text-sm text-gray-600">
                {tagAction === "add" ? "Add" : "Remove"} tag "
                {tagName || "[tag name]"}" from {selectedClients.length}{" "}
                selected client{selectedClients.length !== 1 ? "s" : ""}.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTaggingDialogOpen(false)}
              disabled={isTagging}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTagging}
              disabled={isTagging || !tagName.trim()}
              className={
                tagAction === "add"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {isTagging ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  {tagAction === "add" ? (
                    <Tag className="h-4 w-4 mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {tagAction === "add" ? "Add" : "Remove"} Tag
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
