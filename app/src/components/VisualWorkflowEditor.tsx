"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, {
	Node,
	Edge,
	addEdge,
	Connection,
	useNodesState,
	useEdgesState,
	Controls,
	Background,
	MiniMap,
	Panel,
	Handle,
	Position,
	MarkerType,
	ReactFlowProvider,
	useReactFlow,
	XYPosition,
	ConnectionLineType,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
	Plus, 
	Trash2, 
	Settings, 
	Save,
	X,
	Zap,
	Clock,
	MessageSquare,
	Mail,
	Tag,
	GitBranch,
	Play,
	Pause,
	ChevronDown,
	ChevronRight,
	Move,
	Copy,
	RotateCcw,
	Edit3,
	FileText,
	Eye,
	ArrowLeft
} from "lucide-react";

interface ConfigField {
	key: string;
	label: string;
	type: 'input' | 'textarea' | 'number' | 'select';
	placeholder?: string;
	options?: { value: string; label: string; }[];
}

interface BlockType {
	type: string;
	label: string;
	icon: any;
	description: string;
	color: string;
	config: any;
	configFields?: ConfigField[];
}

interface WorkflowBlock {
	id: string;
	type: string;
	position: { x: number; y: number };
	width: number;
	height: number;
	config: any;
	connections: string[];
}

interface WorkflowConnection {
	id: string;
	from: string;
	to: string;
	fromPort: string;
	toPort: string;
}

interface VisualWorkflowEditorProps {
	workflow?: {
		id: string;
		name: string;
		description: string;
		enabled: boolean;
		blocks: WorkflowBlock[];
		connections: WorkflowConnection[];
	};
	onSave: (workflow: any) => void;
	onCancel: () => void;
}

const blockTypes: BlockType[] = [
	{
		type: "trigger",
		label: "Trigger",
		icon: Zap,
		description: "Start of workflow",
		color: "bg-blue-500",
		config: {
			event: "appointment_completed"
		},
		configFields: [
			{
				key: "event",
				label: "Trigger Event",
				type: "select",
				options: [
					{ value: "appointment_completed", label: "Appointment Completed" },
					{ value: "appointment_scheduled", label: "Appointment Scheduled" },
					{ value: "client_added", label: "New Client Added" },
					{ value: "follow_up_due", label: "Follow-up Due" },
					{ value: "birthday", label: "Client Birthday" },
					{ value: "contact_created", label: "Contact Created" },
					{ value: "contact_changed", label: "Contact Changed" },
					{ value: "note_added", label: "Note Added" },
					{ value: "task_added", label: "Task Added" }
				]
			}
		]
	},
	{
		type: "delay",
		label: "Delay",
		icon: Clock,
		description: "Wait for time",
		color: "bg-yellow-500",
		config: {
			minutes: 15
		},
		configFields: [
			{
				key: "minutes",
				label: "Delay (minutes)",
				type: "number",
				placeholder: "15"
			}
		]
	},
	{
		type: "send_sms",
		label: "Send SMS",
		icon: MessageSquare,
		description: "Send text message",
		color: "bg-green-500",
		config: {
			message: "{{first_name}}, thank you for your appointment!"
		},
		configFields: [
			{
				key: "message",
				label: "Message",
				type: "textarea",
				placeholder: "Enter your message here..."
			}
		]
	},
	{
		type: "send_email",
		label: "Send Email",
		icon: Mail,
		description: "Send email",
		color: "bg-purple-500",
		config: {
			subject: "Follow-up",
			message: "Thank you for your appointment!"
		},
		configFields: [
			{
				key: "subject",
				label: "Subject",
				type: "input",
				placeholder: "Email subject..."
			},
			{
				key: "message",
				label: "Message",
				type: "textarea",
				placeholder: "Enter your email message..."
			}
		]
	},
	{
		type: "add_tag",
		label: "Add Tag",
		icon: Tag,
		description: "Add client tag",
		color: "bg-orange-500",
		config: {
			tag: "followed_up"
		},
		configFields: [
			{
				key: "tag",
				label: "Tag Name",
				type: "input",
				placeholder: "Enter tag name..."
			}
		]
	},
	{
		type: "if",
		label: "Condition",
		icon: GitBranch,
		description: "If statement",
		color: "bg-red-500",
		config: {
			condition: "has_reviewed",
			operator: "equals",
			value: "false"
		},
		configFields: [
			{
				key: "condition",
				label: "Condition",
				type: "select",
				options: [
					{ value: "has_reviewed", label: "Has Reviewed" },
					{ value: "is_vip", label: "Is VIP Client" },
					{ value: "has_appointment", label: "Has Appointment" }
				]
			},
			{
				key: "operator",
				label: "Operator",
				type: "select",
				options: [
					{ value: "equals", label: "Equals" },
					{ value: "not_equals", label: "Not Equals" },
					{ value: "contains", label: "Contains" }
				]
			},
			{
				key: "value",
				label: "Value",
				type: "input",
				placeholder: "Enter value..."
			}
		]
	}
];

// Custom Node Components using React Flow patterns
const TriggerNode = ({ data, selected }: any) => {
	const blockType = blockTypes.find(bt => bt.type === data.type);
	const Icon = blockType?.icon || Zap;
	
	return (
		<div className={`px-4 py-3 rounded-lg border-2 ${blockType?.color} text-white min-w-[200px] shadow-lg ${selected ? 'ring-2 ring-blue-300' : ''} cursor-pointer`}>
			<Handle 
				type="target" 
				position={Position.Top} 
				className="w-3 h-3 bg-white border-2 border-gray-300" 
			/>
			<div className="flex items-center space-x-2">
				<Icon className="w-4 h-4" />
				<span className="text-sm font-medium">{blockType?.label}</span>
			</div>
			<div className="text-xs mt-1 opacity-90">
				{blockType?.description}
			</div>
			<Handle 
				type="source" 
				position={Position.Bottom} 
				className="w-3 h-3 bg-white border-2 border-gray-300" 
			/>
		</div>
	);
};

const ActionNode = ({ data, selected }: any) => {
	const blockType = blockTypes.find(bt => bt.type === data.type);
	const Icon = blockType?.icon || Settings;
	
	return (
		<div className={`px-4 py-3 rounded-lg border-2 ${blockType?.color} text-white min-w-[200px] shadow-lg ${selected ? 'ring-2 ring-blue-300' : ''} cursor-pointer`}>
			<Handle 
				type="target" 
				position={Position.Top} 
				className="w-3 h-3 bg-white border-2 border-gray-300" 
			/>
			<div className="flex items-center space-x-2">
				<Icon className="w-4 h-4" />
				<span className="text-sm font-medium">{blockType?.label}</span>
			</div>
			<div className="text-xs mt-1 opacity-90">
				{blockType?.description}
			</div>
			<Handle 
				type="source" 
				position={Position.Bottom} 
				className="w-3 h-3 bg-white border-2 border-gray-300" 
			/>
		</div>
	);
};

const ConditionNode = ({ data, selected }: any) => {
	const blockType = blockTypes.find(bt => bt.type === data.type);
	const Icon = blockType?.icon || GitBranch;
	
	return (
		<div className={`px-4 py-3 rounded-lg border-2 ${blockType?.color} text-white min-w-[200px] shadow-lg ${selected ? 'ring-2 ring-blue-300' : ''} cursor-pointer`}>
			<Handle 
				type="target" 
				position={Position.Top} 
				className="w-3 h-3 bg-white border-2 border-gray-300" 
			/>
			<div className="flex items-center space-x-2">
				<Icon className="w-4 h-4" />
				<span className="text-sm font-medium">{blockType?.label}</span>
			</div>
			<div className="text-xs mt-1 opacity-90">
				{blockType?.description}
			</div>
			<Handle 
				type="source" 
				position={Position.Bottom} 
				id="true" 
				className="w-3 h-3 bg-white border-2 border-gray-300" 
			/>
			<Handle 
				type="source" 
				position={Position.Right} 
				id="false" 
				className="w-3 h-3 bg-white border-2 border-gray-300" 
			/>
		</div>
	);
};

const nodeTypes = {
	trigger: TriggerNode,
	action: ActionNode,
	condition: ConditionNode,
};

function WorkflowEditor({ workflow, onSave, onCancel }: VisualWorkflowEditorProps) {
	const router = useRouter();
	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesState] = useEdgesState([]);
	const [selectedNode, setSelectedNode] = useState<Node | null>(null);
	const [workflowName, setWorkflowName] = useState(workflow?.name || "New Workflow");
	const [workflowDescription, setWorkflowDescription] = useState(workflow?.description || "");
	const [viewMode, setViewMode] = useState<'visual' | 'form'>('visual');
	const [editingNode, setEditingNode] = useState<Node | null>(null);
	const [showRightPanel, setShowRightPanel] = useState(false);
	const { project } = useReactFlow();

	// Initialize nodes and edges from workflow data or create default trigger
	useMemo(() => {
		if (workflow?.blocks && workflow.blocks.length > 0) {
			const initialNodes: Node[] = workflow.blocks.map((block, index) => ({
				id: block.id,
				type: block.type === 'trigger' ? 'trigger' : block.type === 'if' ? 'condition' : 'action',
				position: block.position,
				data: { 
					type: block.type,
					config: block.config,
					label: blockTypes.find(bt => bt.type === block.type)?.label || block.type
				},
			}));

			const initialEdges: Edge[] = workflow.connections.map(conn => ({
				id: conn.id,
				source: conn.from,
				target: conn.to,
				sourceHandle: conn.fromPort,
				targetHandle: conn.toPort,
				type: 'smoothstep',
				markerEnd: {
					type: MarkerType.ArrowClosed,
				},
				style: { stroke: '#6366f1', strokeWidth: 2 },
			}));

			setNodes(initialNodes);
			setEdges(initialEdges);
		} else {
			// Create default trigger node
			const defaultTrigger: Node = {
				id: "trigger_1",
				type: "trigger",
				position: { x: 250, y: 100 },
				data: { 
					type: "trigger",
					config: { event: "appointment_completed" },
					label: "Trigger"
				},
			};
			setNodes([defaultTrigger]);
		}
	}, [workflow, setNodes, setEdges]);

	const onConnect = useCallback(
		(params: Connection) => {
			setEdges((eds) => addEdge({
				...params,
				type: 'smoothstep',
				markerEnd: { type: MarkerType.ArrowClosed },
				style: { stroke: '#6366f1', strokeWidth: 2 },
			}, eds));
		},
		[setEdges],
	);

	const onNodeClick = useCallback((event: any, node: Node) => {
		setSelectedNode(node);
		setEditingNode(node);
		setShowRightPanel(true);
	}, []);

	const onPaneClick = useCallback(() => {
		setSelectedNode(null);
		setEditingNode(null);
		setShowRightPanel(false);
	}, []);

	const addNode = (type: string, position?: XYPosition) => {
		const blockType = blockTypes.find(bt => bt.type === type);
		if (!blockType) return;

		// If no position provided, find a good spot
		let newPosition: XYPosition;
		if (position) {
			newPosition = position;
		} else {
			// Find the rightmost node to place new node to the right
			const rightmostNode = nodes.reduce((rightmost, node) => {
				return node.position.x > rightmost.position.x ? node : rightmost;
			}, nodes[0] || { position: { x: 0, y: 0 } });
			
			newPosition = {
				x: rightmostNode.position.x + 250,
				y: rightmostNode.position.y
			};
		}

		const newNode: Node = {
			id: `node_${Date.now()}`,
			type: type === 'trigger' ? 'trigger' : type === 'if' ? 'condition' : 'action',
			position: newPosition,
			data: { 
				type,
				config: { ...blockType.config },
				label: blockType.label
			},
		};

		setNodes((nds) => [...nds, newNode]);
	};

	const insertNodeBetween = (type: string, sourceNodeId: string, targetNodeId: string) => {
		const sourceNode = nodes.find(n => n.id === sourceNodeId);
		const targetNode = nodes.find(n => n.id === targetNodeId);
		
		if (!sourceNode || !targetNode) return;

		const blockType = blockTypes.find(bt => bt.type === type);
		if (!blockType) return;

		// Calculate position between the two nodes
		const newPosition: XYPosition = {
			x: (sourceNode.position.x + targetNode.position.x) / 2,
			y: (sourceNode.position.y + targetNode.position.y) / 2,
		};

		const newNode: Node = {
			id: `node_${Date.now()}`,
			type: type === 'trigger' ? 'trigger' : type === 'if' ? 'condition' : 'action',
			position: newPosition,
			data: { 
				type,
				config: { ...blockType.config },
				label: blockType.label
			},
		};

		// Add the new node
		setNodes((nds) => [...nds, newNode]);

		// Remove the old connection
		setEdges((eds) => eds.filter(edge => 
			!(edge.source === sourceNodeId && edge.target === targetNodeId)
		));

		// Add new connections
		setEdges((eds) => [
			...eds,
			{
				id: `edge_${sourceNodeId}_${newNode.id}`,
				source: sourceNodeId,
				target: newNode.id,
				type: 'smoothstep',
				markerEnd: { type: MarkerType.ArrowClosed },
				style: { stroke: '#6366f1', strokeWidth: 2 },
			},
			{
				id: `edge_${newNode.id}_${targetNodeId}`,
				source: newNode.id,
				target: targetNodeId,
				type: 'smoothstep',
				markerEnd: { type: MarkerType.ArrowClosed },
				style: { stroke: '#6366f1', strokeWidth: 2 },
			}
		]);
	};

	const deleteNode = (nodeId: string) => {
		// Find all edges connected to this node
		const connectedEdges = edges.filter(edge => 
			edge.source === nodeId || edge.target === nodeId
		);

		// If this node is in the middle of a chain, reconnect the ends
		if (connectedEdges.length === 2) {
			const incomingEdge = connectedEdges.find(edge => edge.target === nodeId);
			const outgoingEdge = connectedEdges.find(edge => edge.source === nodeId);
			
			if (incomingEdge && outgoingEdge) {
				// Create a new connection between the nodes on either side
				setEdges((eds) => [
					...eds.filter(edge => 
						edge.source !== nodeId && edge.target !== nodeId
					),
					{
						id: `edge_${incomingEdge.source}_${outgoingEdge.target}`,
						source: incomingEdge.source,
						target: outgoingEdge.target,
						type: 'smoothstep',
						markerEnd: { type: MarkerType.ArrowClosed },
						style: { stroke: '#6366f1', strokeWidth: 2 },
					}
				]);
			}
		}

		setNodes((nds) => nds.filter((node) => node.id !== nodeId));
		setSelectedNode(null);
		setEditingNode(null);
		setShowRightPanel(false);
	};

	const duplicateNode = (nodeId: string) => {
		const nodeToDuplicate = nodes.find(n => n.id === nodeId);
		if (!nodeToDuplicate) return;

		const newNode: Node = {
			...nodeToDuplicate,
			id: `node_${Date.now()}`,
			position: {
				x: nodeToDuplicate.position.x + 50,
				y: nodeToDuplicate.position.y + 50,
			},
		};

		setNodes((nds) => [...nds, newNode]);
	};

	const updateNodeConfig = (nodeId: string, config: any) => {
		setNodes((nds) => nds.map(node => 
			node.id === nodeId 
				? { ...node, data: { ...node.data, config } }
				: node
		));
	};

	const saveWorkflow = () => {
		const workflowData = {
			id: workflow?.id || `workflow_${Date.now()}`,
			name: workflowName,
			description: workflowDescription,
			enabled: workflow?.enabled || true,
			blocks: nodes.map(node => ({
				id: node.id,
				type: node.data.type,
				position: node.position,
				width: 200,
				height: 80,
				config: node.data.config || {},
				connections: []
			})),
			connections: edges.map(edge => ({
				id: edge.id,
				from: edge.source,
				to: edge.target,
				fromPort: edge.sourceHandle || "output",
				toPort: edge.targetHandle || "input"
			}))
		};
		onSave(workflowData);
	};

	const renderNodeConfig = () => {
		if (!editingNode) return null;

		const blockType = blockTypes.find(bt => bt.type === editingNode.data.type);
		if (!blockType) return null;

		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-semibold">Configure {blockType.label}</h3>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setEditingNode(null);
							setShowRightPanel(false);
						}}
					>
						<X className="w-4 h-4" />
					</Button>
				</div>
				
				<div className="space-y-3">
					{blockType.configFields?.map((field) => (
						<div key={field.key}>
							<Label htmlFor={field.key}>{field.label}</Label>
							{field.type === 'input' && (
								<Input
									id={field.key}
									value={editingNode.data.config[field.key] || ''}
									onChange={(e) => updateNodeConfig(editingNode.id, {
										...editingNode.data.config,
										[field.key]: e.target.value
									})}
									placeholder={field.placeholder}
								/>
							)}
							{field.type === 'textarea' && (
								<Textarea
									id={field.key}
									value={editingNode.data.config[field.key] || ''}
									onChange={(e) => updateNodeConfig(editingNode.id, {
										...editingNode.data.config,
										[field.key]: e.target.value
									})}
									placeholder={field.placeholder}
									rows={3}
								/>
							)}
							{field.type === 'number' && (
								<Input
									id={field.key}
									type="number"
									value={editingNode.data.config[field.key] || ''}
									onChange={(e) => updateNodeConfig(editingNode.id, {
										...editingNode.data.config,
										[field.key]: parseInt(e.target.value) || 0
									})}
									placeholder={field.placeholder}
								/>
							)}
							{field.type === 'select' && (
								<Select
									value={editingNode.data.config[field.key] || ''}
									onValueChange={(value) => updateNodeConfig(editingNode.id, {
										...editingNode.data.config,
										[field.key]: value
									})}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select option..." />
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
			</div>
		);
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<div className="flex items-center space-x-4">
							<Button
								variant="outline"
								onClick={() => router.back()}
								className="flex items-center space-x-2"
							>
								<ArrowLeft className="w-4 h-4" />
								Back to Workflows
							</Button>
							<div>
								<h1 className="text-xl font-semibold text-gray-900">{workflowName}</h1>
								<p className="text-sm text-gray-500">Workflow Builder</p>
							</div>
						</div>
						<div className="flex items-center space-x-2">
							<Button
								variant="outline"
								onClick={() => setViewMode(viewMode === 'visual' ? 'form' : 'visual')}
							>
								{viewMode === 'visual' ? <FileText className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
								{viewMode === 'visual' ? 'Form View' : 'Visual View'}
							</Button>
							<Button variant="outline" onClick={onCancel}>
								Cancel
							</Button>
							<Button onClick={saveWorkflow} className="bg-gradient-to-r from-pink-500 to-purple-600">
								<Save className="w-4 h-4 mr-2" />
								Save Workflow
							</Button>
						</div>
					</div>
				</div>
			</div>

			<div className="flex h-[calc(100vh-64px)]">
				{/* Left Panel */}
				<div className="w-80 bg-white border-r overflow-y-auto">
					<div className="p-4 space-y-4">
						{/* Workflow Info */}
						<div className="border-b pb-4">
							<h3 className="font-semibold mb-3">Workflow Info</h3>
							<div className="space-y-2">
								<div>
									<Label>Name</Label>
									<Input 
										value={workflowName}
										onChange={(e) => setWorkflowName(e.target.value)}
										className="mt-1"
									/>
								</div>
								<div>
									<Label>Description</Label>
									<Input 
										value={workflowDescription}
										onChange={(e) => setWorkflowDescription(e.target.value)}
										className="mt-1"
									/>
								</div>
							</div>
						</div>

						{/* Workflow Blocks */}
						<div>
							<h3 className="font-semibold mb-3">Add Steps</h3>
							<div className="space-y-2">
								{blockTypes.map((blockType) => (
									<div
										key={blockType.type}
										className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
										onClick={() => addNode(blockType.type)}
									>
										<div className="flex items-center space-x-2">
											<div className={`w-8 h-8 rounded-lg flex items-center justify-center ${blockType.color} text-white`}>
												<blockType.icon className="w-4 h-4" />
											</div>
											<div>
												<div className="font-medium text-sm">{blockType.label}</div>
												<div className="text-xs text-muted-foreground">{blockType.description}</div>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Canvas */}
				<div className="flex-1 relative">
					<ReactFlow
						nodes={nodes}
						edges={edges}
						onNodesChange={onNodesChange}
						onEdgesChange={onEdgesState}
						onConnect={onConnect}
						onNodeClick={onNodeClick}
						onPaneClick={onPaneClick}
						nodeTypes={nodeTypes}
						connectionLineType={ConnectionLineType.SmoothStep}
						fitView
						attributionPosition="bottom-left"
						proOptions={{ hideAttribution: true }}
					>
						<Controls />
						<Background />
						<MiniMap 
							nodeColor="#6366f1"
							maskColor="rgba(0, 0, 0, 0.1)"
						/>
					</ReactFlow>

					{/* Empty state */}
					{nodes.length === 0 && (
						<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
							<div className="text-center bg-white/90 p-8 rounded-lg shadow-lg">
								<Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
								<h3 className="text-lg font-semibold text-gray-900 mb-2">Start Building Your Workflow</h3>
								<p className="text-gray-600 mb-4">
									Drag blocks from the left panel to create your workflow
								</p>
							</div>
						</div>
					)}
				</div>

				{/* Right Panel - Node Configuration */}
				{showRightPanel && editingNode && (
					<div className="w-80 bg-white border-l overflow-y-auto" data-testid="node-config-panel">
						<div className="p-4">
							{renderNodeConfig()}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export function VisualWorkflowEditor(props: VisualWorkflowEditorProps) {
	return (
		<ReactFlowProvider>
			<WorkflowEditor {...props} />
		</ReactFlowProvider>
	);
} 