"use client";

import { useSearchParams } from "next/navigation";
import EnhancedWorkflowEditor from "@/components/EnhancedWorkflowEditor";
import { useAuth } from "@/hooks/useAuth";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import { MainLayout } from "@/components/MainLayout";

function WorkflowEditorContent() {
  const searchParams = useSearchParams();
  const workflowId = searchParams.get("id") || undefined;
  const { user, orgId } = useAuth();

  if (!user || !orgId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user and organization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <EnhancedWorkflowEditor workflowId={workflowId} orgId={orgId} />
    </div>
  );
}

export default function WorkflowEditorPage() {
  return (
    <MainLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading workflow editor...</p>
            </div>
          </div>
        }
      >
        <WorkflowEditorContent />
      </Suspense>
    </MainLayout>
  );
}
