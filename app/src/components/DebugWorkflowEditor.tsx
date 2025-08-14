"use client";

import React, { useState, useCallback } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Panel,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Mail, Zap, Clock, Tag, X, Settings } from "lucide-react";

// Simple test node types
const testBlockTypes = [
  {
    type: "trigger",
    label: "Trigger",
    icon: Zap,
    configFields: [
      {
        key: "event",
        label: "Trigger Event",
        type: "select",
        options: [
          { value: "appointment_completed", label: "Appointment Completed" },
          { value: "appointment_scheduled", label: "Appointment Booked" },
        ],
      },
    ],
  },
  {
    type: "send_sms",
    label: "Send SMS",
    icon: MessageSquare,
    configFields: [
      {
        key: "message",
        label: "SMS Message",
        type: "textarea",
        placeholder: "Hi {{first_name}}, thank you for your appointment!",
      },
    ],
  },
  {
    type: "send_email",
    label: "Send Email",
    icon: Mail,
    configFields: [
      {
        key: "subject",
        label: "Email Subject",
        type: "input",
        placeholder: "Thank you for your appointment!",
      },
      {
        key: "body",
        label: "Email Body",
        type: "textarea",
        placeholder: "Hi {{first_name}}, thank you for visiting us today!",
      },
    ],
  },
  {
    type: "delay",
    label: "Wait",
    icon: Clock,
    configFields: [
      {
        key: "value",
        label: "Wait Time",
        type: "number",
        placeholder: "1",
      },
      {
        key: "unit",
        label: "Time Unit",
        type: "select",
        options: [
          { value: "minutes", label: "Minutes" },
          { value: "hours", label: "Hours" },
          { value: "days", label: "Days" },
        ],
      },
    ],
  },
];

// Simple node component
const SimpleNode = ({ data, selected }: any) => {
  const blockType = testBlockTypes.find((bt) => bt.type === data.type);
  const Icon = blockType?.icon || Settings;

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 ${selected ? "border-blue-500" : "border-gray-200"} bg-white cursor-pointer shadow-md`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="flex items-center space-x-2">
        <Icon className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium">{blockType?.label || data.type}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

function DebugEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  // Node click handler
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log("🔍 Node clicked:", node);
    setSelectedNode(node);
    setShowPanel(true);
  }, []);

  // Update node config
  const updateNodeConfig = useCallback((nodeId: string, config: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                config: { ...node.data.config, ...config },
              },
            }
          : node,
      ),
    );
  }, [setNodes]);

  // Add test nodes
  const addTestNode = (type: string) => {
    const blockType = testBlockTypes.find(bt => bt.type === type);
    const newNode = {
      id: `${type}_${Date.now()}`,
      type: "simple",
      position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 },
      data: {
        type,
        label: blockType?.label || type,
        config: {},
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  // Render config form
  const renderConfig = () => {
    if (!selectedNode) return <p>No node selected</p>;

    console.log("🔍 Rendering config for node:", {
      nodeId: selectedNode.id,
      nodeDataType: selectedNode.data?.type,
      availableTypes: testBlockTypes.map(bt => bt.type),
      selectedNodeData: selectedNode.data
    });

    const blockType = testBlockTypes.find(bt => bt.type === selectedNode.data?.type);
    
    console.log("🔍 Found blockType:", blockType);
    
    if (!blockType) {
      return (
        <div>
          <h3 className="font-bold text-red-600">Debug Info - Block Type Not Found</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded mt-2">
            {JSON.stringify({
              nodeId: selectedNode.id,
              nodeType: selectedNode.data?.type,
              nodeData: selectedNode.data,
              availableTypes: testBlockTypes.map(bt => bt.type),
              comparison: testBlockTypes.map(bt => ({
                blockType: bt.type,
                matches: bt.type === selectedNode.data?.type,
                typeofBlock: typeof bt.type,
                typeofNode: typeof selectedNode.data?.type
              }))
            }, null, 2)}
          </pre>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="font-bold">Configure {blockType.label}</h3>
        {blockType.configFields?.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label>{field.label}</Label>
            {field.type === "input" && (
              <Input
                value={selectedNode.data?.config?.[field.key] || ""}
                onChange={(e) => updateNodeConfig(selectedNode.id, { [field.key]: e.target.value })}
                placeholder={field.placeholder}
              />
            )}
            {field.type === "textarea" && (
              <Textarea
                value={selectedNode.data?.config?.[field.key] || ""}
                onChange={(e) => updateNodeConfig(selectedNode.id, { [field.key]: e.target.value })}
                placeholder={field.placeholder}
              />
            )}
            {field.type === "number" && (
              <Input
                type="number"
                value={selectedNode.data?.config?.[field.key] || ""}
                onChange={(e) => updateNodeConfig(selectedNode.id, { [field.key]: parseInt(e.target.value) || 0 })}
                placeholder={field.placeholder}
              />
            )}
            {field.type === "select" && (
              <Select
                value={selectedNode.data?.config?.[field.key] || ""}
                onValueChange={(value) => updateNodeConfig(selectedNode.id, { [field.key]: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-screen flex">
      {/* Left Panel */}
      <div className="w-64 bg-white border-r p-4">
        <h2 className="font-bold mb-4">Debug Workflow Editor</h2>
        <div className="space-y-2">
          {testBlockTypes.map((blockType) => (
            <Button
              key={blockType.type}
              onClick={() => addTestNode(blockType.type)}
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <blockType.icon className="w-4 h-4 mr-2" />
              Add {blockType.label}
            </Button>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <h3 className="font-medium mb-2">Instructions:</h3>
          <ol className="text-sm text-gray-600 space-y-1">
            <li>1. Click "Add" buttons to create nodes</li>
            <li>2. Click on any node to configure it</li>
            <li>3. Right panel should show config form</li>
          </ol>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={{ simple: SimpleNode }}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} />
          <Controls />
          <Panel position="top-left">
            <div className="bg-white p-2 rounded shadow">
              <p className="text-sm">Nodes: {nodes.length}</p>
              <p className="text-sm">Selected: {selectedNode?.id || "None"}</p>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Right Panel */}
      {showPanel && (
        <div className="w-80 bg-white border-l p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Node Settings</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowPanel(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          {renderConfig()}
        </div>
      )}
    </div>
  );
}

export function DebugWorkflowEditor() {
  return (
    <ReactFlowProvider>
      <DebugEditor />
    </ReactFlowProvider>
  );
}