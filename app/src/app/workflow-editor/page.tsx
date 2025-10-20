"use client";

import { useSearchParams } from "next/navigation";
import EnhancedWorkflowEditor from "@/components/EnhancedWorkflowEditor";
import { Suspense } from "react";
import { PageLayout } from "@/components/PageLayout";

function WorkflowEditorContent() {
  const searchParams = useSearchParams();
  const workflowId = searchParams.get("id") || undefined;
  const templateId = searchParams.get("templateId") || undefined;

  // Mock orgId for testing
  const mockOrgId = 15;

  return (
    <EnhancedWorkflowEditor
      workflowId={workflowId}
      orgId={mockOrgId}
      templateId={templateId}
    />
  );
}

export default function WorkflowEditorPage() {
  return (
    <PageLayout
      title="Workflow Editor"
      subtitle="Design and automate your business processes"
      fullHeight={true}
    >
      <div className="h-full flex flex-col">
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
      </div>
    </PageLayout>
  );
}
