/**
 * Test script to debug potential node type mismatches
 */

console.log("🔍 Debugging potential node type mismatch issues...");

// Block types from VisualWorkflowEditor (based on the code I saw)
const blockTypes = [
  { type: "trigger", label: "Trigger", configFields: [{ key: "event", label: "Trigger Event", type: "select" }] },
  { type: "delay", label: "Wait", configFields: [{ key: "value", label: "Wait Time", type: "number" }] },
  { type: "send_sms", label: "Send SMS", configFields: [{ key: "message", label: "SMS Message", type: "textarea" }] },
  { type: "send_email", label: "Send Email", configFields: [{ key: "subject", label: "Subject", type: "input" }] },
  { type: "add_tag", label: "Add Tag", configFields: [{ key: "tag", label: "Tag", type: "select" }] },
  { type: "remove_tag", label: "Remove Tag", configFields: [{ key: "tag", label: "Tag", type: "select" }] },
  { type: "if", label: "If/Then", configFields: [{ key: "field", label: "Field", type: "select" }] }
];

// Simulate drag and drop node creation (from onDrop function)
function simulateNodeCreation(draggedType) {
  console.log(`\n🎯 Simulating creation of node type: "${draggedType}"`);
  
  // Find the block type to get proper configuration
  const blockType = blockTypes.find((bt) => bt.type === draggedType);
  console.log("Found blockType:", blockType ? blockType.label : "NOT FOUND");
  
  // This logic comes from the onDrop function in VisualWorkflowEditor
  let nodeType = "default"; // Default node type
  if (draggedType === "trigger" || 
      draggedType === "delay" || 
      draggedType === "send_sms" || 
      draggedType === "send_email" || 
      draggedType === "add_tag" || 
      draggedType === "remove_tag") {
    nodeType = draggedType; // Use the specific type for these actions
  }
  
  const newNode = {
    id: `${draggedType}_${Date.now()}`,
    type: nodeType,  // This becomes the ReactFlow node type
    position: { x: 100, y: 100 },
    data: {
      type: draggedType,  // This is the data.type that renderNodeConfig uses
      label: blockType?.label || draggedType,
      config: blockType?.config || {},
    },
    width: 200,
    height: 80,
  };
  
  console.log("Created node:", JSON.stringify(newNode, null, 2));
  
  // Test if renderNodeConfig would work
  const foundBlockType = blockTypes.find((bt) => bt.type === newNode.data?.type);
  console.log("renderNodeConfig would find blockType:", foundBlockType ? foundBlockType.label : "NOT FOUND");
  console.log("Would render config fields:", foundBlockType?.configFields ? "YES" : "NO");
  
  return newNode;
}

// Test different node types
const testTypes = ["trigger", "send_sms", "send_email", "add_tag", "remove_tag", "delay", "if"];

testTypes.forEach(type => {
  simulateNodeCreation(type);
});

console.log("\n🎉 Analysis complete! If 'renderNodeConfig would find blockType' shows 'NOT FOUND' for any type, that's the issue.");