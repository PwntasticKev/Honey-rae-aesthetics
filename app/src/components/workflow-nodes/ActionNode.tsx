"use client";

import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Zap, Settings, Mail, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ActionNodeData {
  label: string;
  action?: string;
  config?: {
    subject?: string;
    message?: string;
    template?: string;
    recipient?: string;
    templateId?: string;
    tag?: string;
    status?: string;
  };
}

interface ActionNodeProps extends NodeProps<ActionNodeData> {
  onNodeDataChange?: (id: string, newData: ActionNodeData) => void;
}

const ActionNode = memo(({ data, id, onNodeDataChange }: ActionNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nodeData, setNodeData] = useState<ActionNodeData>(data);

  const actionTypes = [
    { value: 'send_email', label: 'Send Email', icon: Mail },
    { value: 'send_sms', label: 'Send SMS', icon: MessageSquare },
    { value: 'create_task', label: 'Create Task', icon: Send },
    { value: 'schedule_follow_up', label: 'Schedule Follow-up', icon: Zap },
    { value: 'add_tag', label: 'Add Client Tag', icon: Zap },
    { value: 'update_status', label: 'Update Status', icon: Zap },
    { value: 'webhook', label: 'Call Webhook', icon: Send },
  ];

  const getActionIcon = () => {
    const actionType = actionTypes.find(t => t.value === nodeData.action);
    const IconComponent = actionType?.icon || Zap;
    return <IconComponent className="w-4 h-4" />;
  };

  const handleSave = () => {
    // Update the node data in the parent component
    if (onNodeDataChange && id) {
      onNodeDataChange(id, nodeData);
    }
    setIsEditing(false);
  };

  const updateConfig = (key: string, value: string) => {
    setNodeData({
      ...nodeData,
      config: { ...nodeData.config, [key]: value }
    });
  };

  return (
    <div className="bg-blue-500 text-white rounded-lg border-2 border-blue-600 shadow-lg min-w-[200px]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-white !border-2 !border-blue-600"
      />
      
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-2">
          {getActionIcon()}
          <span className="font-medium text-sm">{nodeData.label || 'Action'}</span>
        </div>
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 w-6 p-0 text-white hover:bg-blue-600"
            >
              <Settings className="w-3 h-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Configure Action</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="action-label">Label</Label>
                <Input
                  id="action-label"
                  value={nodeData.label}
                  onChange={(e) => setNodeData({ ...nodeData, label: e.target.value })}
                  placeholder="Enter action name"
                />
              </div>
              <div>
                <Label htmlFor="action-type">Action Type</Label>
                <Select
                  value={nodeData.action}
                  onValueChange={(value) => setNodeData({ ...nodeData, action: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select action type" />
                  </SelectTrigger>
                  <SelectContent>
                    {actionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Email configuration */}
              {nodeData.action === 'send_email' && (
                <>
                  <div>
                    <Label htmlFor="email-template">Email Template (optional)</Label>
                    <Input
                      id="email-template"
                      value={nodeData.config?.templateId || ''}
                      onChange={(e) => updateConfig('templateId', e.target.value)}
                      placeholder="Template ID (leave blank for custom message)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email-subject">Subject</Label>
                    <Input
                      id="email-subject"
                      value={nodeData.config?.subject || ''}
                      onChange={(e) => updateConfig('subject', e.target.value)}
                      placeholder="Thank you for your visit! Use {firstName}, {appointmentType}, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="email-message">Message</Label>
                    <Textarea
                      id="email-message"
                      value={nodeData.config?.message || ''}
                      onChange={(e) => updateConfig('message', e.target.value)}
                      placeholder="Hi {firstName}, thank you for your {appointmentType} appointment..."
                      rows={4}
                    />
                  </div>
                </>
              )}
              
              {/* SMS configuration */}
              {nodeData.action === 'send_sms' && (
                <>
                  <div>
                    <Label htmlFor="sms-template">SMS Template (optional)</Label>
                    <Input
                      id="sms-template"
                      value={nodeData.config?.templateId || ''}
                      onChange={(e) => updateConfig('templateId', e.target.value)}
                      placeholder="Template ID (leave blank for custom message)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sms-message">SMS Message</Label>
                    <Textarea
                      id="sms-message"
                      value={nodeData.config?.message || ''}
                      onChange={(e) => updateConfig('message', e.target.value)}
                      placeholder="Hi {firstName}, thanks for your visit! Use variables like {appointmentType}..."
                      rows={3}
                      maxLength={160}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {(nodeData.config?.message || '').length}/160 characters
                    </p>
                  </div>
                </>
              )}
              
              {/* Task creation */}
              {nodeData.action === 'create_task' && (
                <div>
                  <Label htmlFor="task-description">Task Description</Label>
                  <Textarea
                    id="task-description"
                    value={nodeData.config?.message || ''}
                    onChange={(e) => updateConfig('message', e.target.value)}
                    placeholder="Follow up with {firstName} about {appointmentType} results"
                    rows={3}
                  />
                </div>
              )}
              
              {/* Follow-up scheduling */}
              {nodeData.action === 'schedule_follow_up' && (
                <>
                  <div>
                    <Label htmlFor="followup-days">Days until follow-up</Label>
                    <Input
                      id="followup-days"
                      type="number"
                      value={nodeData.config?.days || '7'}
                      onChange={(e) => updateConfig('days', e.target.value)}
                      placeholder="7"
                    />
                  </div>
                  <div>
                    <Label htmlFor="followup-message">Follow-up message</Label>
                    <Textarea
                      id="followup-message"
                      value={nodeData.config?.message || ''}
                      onChange={(e) => updateConfig('message', e.target.value)}
                      placeholder="Schedule follow-up for {firstName} - {appointmentType}"
                      rows={2}
                    />
                  </div>
                </>
              )}
              
              {/* Tag management */}
              {nodeData.action === 'add_tag' && (
                <div>
                  <Label htmlFor="client-tag">Tag to add</Label>
                  <Input
                    id="client-tag"
                    value={nodeData.config?.tag || ''}
                    onChange={(e) => updateConfig('tag', e.target.value)}
                    placeholder="VIP, New Client, Follow-up Needed, etc."
                  />
                </div>
              )}
              
              {/* Status update */}
              {nodeData.action === 'update_status' && (
                <div>
                  <Label htmlFor="client-status">New status</Label>
                  <Select
                    value={nodeData.config?.status || ''}
                    onValueChange={(value) => updateConfig('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="follow_up_needed">Follow-up Needed</SelectItem>
                      <SelectItem value="completed_treatment">Completed Treatment</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Webhook configuration */}
              {nodeData.action === 'webhook' && (
                <>
                  <div>
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <Input
                      id="webhook-url"
                      value={nodeData.config?.url || ''}
                      onChange={(e) => updateConfig('url', e.target.value)}
                      placeholder="https://your-system.com/webhook"
                    />
                  </div>
                  <div>
                    <Label htmlFor="webhook-payload">Custom payload (JSON)</Label>
                    <Textarea
                      id="webhook-payload"
                      value={nodeData.config?.payload || ''}
                      onChange={(e) => updateConfig('payload', e.target.value)}
                      placeholder='{"clientId": "{clientId}", "event": "appointment_completed"}'
                      rows={3}
                    />
                  </div>
                </>
              )}

              <Button onClick={handleSave} className="w-full">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {nodeData.action && (
        <div className="px-3 pb-2">
          <div className="text-xs bg-blue-600 rounded px-2 py-1">
            {actionTypes.find(t => t.value === nodeData.action)?.label || nodeData.action}
          </div>
          {nodeData.config?.subject && (
            <div className="text-xs mt-1 opacity-80">
              {nodeData.config.subject}
            </div>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-white !border-2 !border-blue-600"
      />
    </div>
  );
});

ActionNode.displayName = 'ActionNode';

export default ActionNode;