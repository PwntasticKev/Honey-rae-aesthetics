import { NextResponse } from "next/server";

const mockTemplates = [
  {
    id: "template-1",
    name: "New Client Welcome",
    description: "A simple workflow to welcome new clients with an email and a follow-up SMS.",
    complexity: "Simple",
    tags: ["Onboarding", "Welcome"],
    estimatedDuration: "2 days",
    blocks: [
      { id: "1", type: "trigger", position: { x: 250, y: 50 }, data: { label: "Client Created" } },
      { id: "2", type: "action", position: { x: 250, y: 200 }, data: { label: "Send Welcome Email" } },
      { id: "3", type: "delay", position: { x: 250, y: 350 }, data: { label: "Wait 1 Day" } },
      { id: "4", type: "action", position: { x: 250, y: 500 }, data: { label: "Send Follow-up SMS" } },
    ],
    connections: [
      { id: "e1-2", source: "1", target: "2" },
      { id: "e2-3", source: "2", target: "3" },
      { id: "e3-4", source: "3", target: "4" },
    ],
  },
  {
    id: "template-2",
    name: "Post-Appointment Review Request",
    description: "Ask for a Google review 15 minutes after an appointment is completed.",
    complexity: "Beginner",
    tags: ["Reviews", "Post-Appointment"],
    estimatedDuration: "15 minutes",
    blocks: [
        { id: "1", type: "trigger", position: { x: 250, y: 50 }, data: { label: "Appointment Completed" } },
        { id: "2", type: "delay", position: { x: 250, y: 200 }, data: { label: "Wait 15 Minutes" } },
        { id: "3", type: "action", position: { x: 250, y: 350 }, data: { label: "Send Review Request SMS" } },
    ],
    connections: [
        { id: "e1-2", source: "1", target: "2" },
        { id: "e2-3", source: "2", target: "3" },
    ]
  },
];

export async function GET() {
  return NextResponse.json({ templates: mockTemplates });
}