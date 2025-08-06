"use client";

import { useSearchParams } from "next/navigation";
import { EnhancedWorkflowEditor } from "@/components/EnhancedWorkflowEditor";
import { useAuth } from "@/hooks/useAuth";
import { Suspense } from "react";

function WorkflowEditorContent() {
  const searchParams = useSearchParams();
  const workflowId = searchParams.get("id");
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <EnhancedWorkflowEditor
        workflowId={workflowId || undefined}
        orgId="placeholder-org-id"
      />
    </div>
  );
}

export default function WorkflowEditorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading workflow editor...</p>
      </div>
    </div>}>
      <WorkflowEditorContent />
    </Suspense>
  );
}
