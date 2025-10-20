"use client";

import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { GitBranch, Settings } from 'lucide-react';
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

interface ConditionNodeData {
  label: string;
  config?: {
    field?: string;
    operator?: string;
    value?: string;
  };
}

interface ConditionNodeProps extends NodeProps<ConditionNodeData> {
  onNodeDataChange?: (id: string, newData: ConditionNodeData) => void;
}

const ConditionNode = memo(({ data, id, onNodeDataChange }: ConditionNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nodeData, setNodeData] = useState<ConditionNodeData>(data);

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
  ];

  const fields = [
    { value: 'client.name', label: 'Client Name' },
    { value: 'client.email', label: 'Client Email' },
    { value: 'client.phone', label: 'Client Phone' },
    { value: 'appointment.type', label: 'Appointment Type' },
    { value: 'appointment.status', label: 'Appointment Status' },
    { value: 'payment.amount', label: 'Payment Amount' },
    { value: 'custom', label: 'Custom Field' },
  ];

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

  const getConditionText = () => {
    const { field, operator, value } = nodeData.config || {};
    if (field && operator) {
      const fieldLabel = fields.find(f => f.value === field)?.label || field;
      const operatorLabel = operators.find(o => o.value === operator)?.label || operator;
      return `${fieldLabel} ${operatorLabel} ${value || ''}`;
    }
    return 'Set condition';
  };

  return (
    <div className="bg-yellow-500 text-white rounded-lg border-2 border-yellow-600 shadow-lg min-w-[200px]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-white !border-2 !border-yellow-600"
      />
      
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-2">
          <GitBranch className="w-4 h-4" />
          <span className="font-medium text-sm">{nodeData.label || 'Condition'}</span>
        </div>
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 w-6 p-0 text-white hover:bg-yellow-600"
            >
              <Settings className="w-3 h-3" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure Condition</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="condition-label">Label</Label>
                <Input
                  id="condition-label"
                  value={nodeData.label}
                  onChange={(e) => setNodeData({ ...nodeData, label: e.target.value })}
                  placeholder="Enter condition name"
                />
              </div>
              <div>
                <Label htmlFor="condition-field">Field</Label>
                <Select
                  value={nodeData.config?.field}
                  onValueChange={(value) => updateConfig('field', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((field) => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="condition-operator">Operator</Label>
                <Select
                  value={nodeData.config?.operator}
                  onValueChange={(value) => updateConfig('operator', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((operator) => (
                      <SelectItem key={operator.value} value={operator.value}>
                        {operator.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {nodeData.config?.operator && !['is_empty', 'is_not_empty'].includes(nodeData.config.operator) && (
                <div>
                  <Label htmlFor="condition-value">Value</Label>
                  <Input
                    id="condition-value"
                    value={nodeData.config?.value || ''}
                    onChange={(e) => updateConfig('value', e.target.value)}
                    placeholder="Enter comparison value"
                  />
                </div>
              )}
              <Button onClick={handleSave} className="w-full">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="px-3 pb-2">
        <div className="text-xs bg-yellow-600 rounded px-2 py-1">
          {getConditionText()}
        </div>
      </div>

      {/* Multiple outputs for conditions */}
      <div className="flex justify-between px-3 pb-2">
        <div className="relative">
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="w-3 h-3 !bg-green-400 !border-2 !border-green-600"
            style={{ left: '25%' }}
          />
          <div className="text-xs text-center mt-1">True</div>
        </div>
        <div className="relative">
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className="w-3 h-3 !bg-red-400 !border-2 !border-red-600"
            style={{ left: '75%' }}
          />
          <div className="text-xs text-center mt-1">False</div>
        </div>
      </div>
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';

export default ConditionNode;