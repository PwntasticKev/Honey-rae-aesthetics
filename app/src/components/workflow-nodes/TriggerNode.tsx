"use client";

import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Play, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface TriggerNodeData {
  label: string;
  trigger?: string;
  config?: any;
}

interface TriggerNodeProps extends NodeProps<TriggerNodeData> {
  onNodeDataChange?: (id: string, newData: TriggerNodeData) => void;
}

const TriggerNode = memo(({ data, id, onNodeDataChange }: TriggerNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nodeData, setNodeData] = useState<TriggerNodeData>(data);

  const triggerTypes = [
    { value: 'manual', label: 'Manual Trigger' },
    { value: 'appointment_scheduled', label: 'Appointment Scheduled' },
    { value: 'appointment_completed', label: 'Appointment Completed' },
    { value: 'appointment_no_show', label: 'Appointment No Show' },
    { value: 'appointment_cancelled', label: 'Appointment Cancelled' },
    { value: 'client_created', label: 'New Client Created' },
    { value: 'client_updated', label: 'Client Updated' },
    { value: 'birthday_reminder', label: 'Client Birthday' },
    { value: 'anniversary_reminder', label: 'Client Anniversary' },
    { value: 'recurring_reminder', label: 'Recurring Reminder' },
    { value: 'follow_up_reminder', label: 'Follow-up Reminder' },
    { value: 'pre_appointment', label: 'Pre-appointment Reminder' },
    { value: 'post_appointment', label: 'Post-appointment Follow-up' },
    { value: 'webhook', label: 'External Webhook' },
  ];

  const handleSave = () => {
    // Update the node data in the parent component
    if (onNodeDataChange && id) {
      onNodeDataChange(id, nodeData);
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-green-500 text-white rounded-lg border-2 border-green-600 shadow-lg min-w-[200px]">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-2">
          <Play className="w-4 h-4" />
          <span className="font-medium text-sm">{nodeData.label || 'Trigger'}</span>
        </div>
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 w-6 p-0 text-white hover:bg-green-600"
            >
              <Settings className="w-3 h-3" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure Trigger</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="trigger-label">Label</Label>
                <Input
                  id="trigger-label"
                  value={nodeData.label}
                  onChange={(e) => setNodeData({ ...nodeData, label: e.target.value })}
                  placeholder="Enter trigger name"
                />
              </div>
              <div>
                <Label htmlFor="trigger-type">Trigger Type</Label>
                <Select
                  value={nodeData.trigger}
                  onValueChange={(value) => setNodeData({ ...nodeData, trigger: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger type" />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Conditional configuration based on trigger type */}
              {(nodeData.trigger === 'pre_appointment' || nodeData.trigger === 'post_appointment') && (
                <div>
                  <Label htmlFor="trigger-timing">Timing (days)</Label>
                  <Input
                    id="trigger-timing"
                    type="number"
                    value={nodeData.config?.daysBefore || nodeData.config?.daysAfter || 1}
                    onChange={(e) => setNodeData({ 
                      ...nodeData, 
                      config: { 
                        ...nodeData.config, 
                        [nodeData.trigger === 'pre_appointment' ? 'daysBefore' : 'daysAfter']: parseInt(e.target.value) 
                      } 
                    })}
                    placeholder="Number of days"
                  />
                </div>
              )}
              
              {nodeData.trigger === 'recurring_reminder' && (
                <div>
                  <Label htmlFor="recurring-interval">Recurring Interval</Label>
                  <Select
                    value={nodeData.config?.recurringInterval || 'weekly'}
                    onValueChange={(value) => setNodeData({ 
                      ...nodeData, 
                      config: { ...nodeData.config, recurringInterval: value } 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <Label htmlFor="appointment-types">Appointment Types (optional)</Label>
                <Input
                  id="appointment-types"
                  value={(nodeData.config?.appointmentTypes || []).join(', ')}
                  onChange={(e) => setNodeData({ 
                    ...nodeData, 
                    config: { 
                      ...nodeData.config, 
                      appointmentTypes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                    } 
                  })}
                  placeholder="Botox, Facial, etc. (comma separated)"
                />
              </div>
              
              <Button onClick={handleSave} className="w-full">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {nodeData.trigger && (
        <div className="px-3 pb-2">
          <div className="text-xs bg-green-600 rounded px-2 py-1">
            {triggerTypes.find(t => t.value === nodeData.trigger)?.label || nodeData.trigger}
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-white !border-2 !border-green-600"
      />
    </div>
  );
});

TriggerNode.displayName = 'TriggerNode';

export default TriggerNode;