"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@/components/PageLayout";
import { EnhancedWorkflowList } from "@/components/EnhancedWorkflowList";
import { workflows as workflowSchema } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Workflow = InferSelectModel<typeof workflowSchema>;

async function fetchWorkflows(orgId: number): Promise<{ workflows: Workflow[] }> {
  const res = await fetch(`/api/workflows?orgId=${orgId}`);
  if (!res.ok) throw new Error("Failed to fetch workflows");
  return res.json();
}

async function fetchTemplates(): Promise<{ templates: any[] }> {
  const res = await fetch("/api/workflows/templates");
  if (!res.ok) throw new Error("Failed to fetch templates");
  return res.json();
}

async function fetchDirectories(orgId: number): Promise<{ directories: any[] }> {
  const res = await fetch(`/api/workflow-directories?orgId=${orgId}`);
  if (!res.ok) throw new Error("Failed to fetch directories");
  return res.json();
}

export default function WorkflowsPage() {
  const router = useRouter();
  const orgId = 15; // Updated to use test orgId

  const {
    data: workflowsData,
    isLoading: isLoadingWorkflows,
    error: workflowsError,
  } = useQuery({
    queryKey: ["workflows", orgId],
    queryFn: () => fetchWorkflows(orgId),
  });

  const {
    data: directoriesData,
    isLoading: isLoadingDirectories,
    error: directoriesError,
  } = useQuery({
    queryKey: ["workflowDirectories", orgId],
    queryFn: () => fetchDirectories(orgId),
  });

  const {
    data: templatesData,
    isLoading: isLoadingTemplates,
    error: templatesError,
  } = useQuery({
    queryKey: ["workflowTemplates"],
    queryFn: fetchTemplates,
  });

  const headerRightContent = (
    <Button onClick={() => router.push("/workflow-editor")}>
      <Plus className="w-4 h-4 mr-2" />
      Create Workflow
    </Button>
  );

  return (
    <PageLayout
      title="Workflow Automation"
      subtitle="Automate your business processes"
      headerRightContent={headerRightContent}
    >
      <Tabs defaultValue="workflows" className="h-full">
        <TabsList>
          <TabsTrigger value="workflows">My Workflows</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        <TabsContent value="workflows" className="h-full">
          <div className="h-full">
            {(isLoadingWorkflows || isLoadingDirectories) && <div>Loading workflows...</div>}
            {(workflowsError || directoriesError) && <div>Error loading workflows.</div>}
            {workflowsData && directoriesData && (
              <EnhancedWorkflowList
                orgId={orgId}
                viewMode="full"
                workflows={workflowsData.workflows || []}
                directories={directoriesData.directories || []}
                onCreateWorkflow={() => router.push("/workflow-editor")}
              />
            )}
          </div>
        </TabsContent>
        <TabsContent value="templates">
          {isLoadingTemplates && <div>Loading templates...</div>}
          {templatesError && <div>Error loading templates.</div>}
          {templatesData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {templatesData.templates.map((template) => (
                <Card
                  key={template.id}
                  className="p-4 flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-bold">{template.name}</h3>
                    <p className="text-sm text-gray-500">
                      {template.description}
                    </p>
                    <div className="mt-2">
                      {template.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="mr-1">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    className="mt-4 w-full"
                    onClick={() =>
                      router.push(`/workflow-editor?templateId=${template.id}`)
                    }
                  >
                    Use Template
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
