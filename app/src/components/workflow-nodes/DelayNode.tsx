"use client";

import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Clock, Settings } from 'lucide-react';
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

interface DelayNodeData {
  label: string;
  config?: {
    duration?: number;
    unit?: 'minutes' | 'hours' | 'days' | 'weeks';
  };
}

interface DelayNodeProps extends NodeProps<DelayNodeData> {
  onNodeDataChange?: (id: string, newData: DelayNodeData) => void;
}

const DelayNode = memo(({ data, id, onNodeDataChange }: DelayNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nodeData, setNodeData] = useState<DelayNodeData>(data);

  const timeUnits = [
    { value: 'minutes', label: 'Minutes' },
    { value: 'hours', label: 'Hours' },
    { value: 'days', label: 'Days' },
    { value: 'weeks', label: 'Weeks' },
  ];

  const handleSave = () => {
    // Update the node data in the parent component
    if (onNodeDataChange && id) {
      onNodeDataChange(id, nodeData);
    }
    setIsEditing(false);
  };

  const updateConfig = (key: string, value: any) => {
    setNodeData({
      ...nodeData,
      config: { ...nodeData.config, [key]: value }
    });
  };

  const getDelayText = () => {
    const { duration, unit } = nodeData.config || {};
    if (duration && unit) {
      return `${duration} ${unit}`;
    }
    return 'Set delay';
  };

  return (
    <div className="bg-purple-500 text-white rounded-lg border-2 border-purple-600 shadow-lg min-w-[200px]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-white !border-2 !border-purple-600"
      />
      
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <span className="font-medium text-sm">{nodeData.label || 'Delay'}</span>
        </div>
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 w-6 p-0 text-white hover:bg-purple-600"
            >
              <Settings className="w-3 h-3" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure Delay</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="delay-label">Label</Label>
                <Input
                  id="delay-label"
                  value={nodeData.label}
                  onChange={(e) => setNodeData({ ...nodeData, label: e.target.value })}
                  placeholder="Enter delay name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delay-duration">Duration</Label>
                  <Input
                    id="delay-duration"
                    type="number"
                    min="1"
                    value={nodeData.config?.duration || ''}
                    onChange={(e) => updateConfig('duration', parseInt(e.target.value))}
                    placeholder="Enter duration"
                  />
                </div>
                <div>
                  <Label htmlFor="delay-unit">Unit</Label>
                  <Select
                    value={nodeData.config?.unit}
                    onValueChange={(value) => updateConfig('unit', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeUnits.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSave} className="w-full">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="px-3 pb-2">
        <div className="text-xs bg-purple-600 rounded px-2 py-1">
          {getDelayText()}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-white !border-2 !border-purple-600"
      />
    </div>
  );
});

DelayNode.displayName = 'DelayNode';

export default DelayNode;