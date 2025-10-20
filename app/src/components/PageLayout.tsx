"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { PageHeader } from "@/components/PageHeader";
import { AuthWrapper } from "@/components/AuthWrapper";

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  headerRightContent?: React.ReactNode;
  fullHeight?: boolean;
}

export function PageLayout({ title, subtitle, children, headerRightContent, fullHeight = false }: PageLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-white">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:ml-48 relative">
          {/* Header */}
          <PageHeader
            title={title}
            subtitle={subtitle}
            onMenuToggle={() => setSidebarOpen(true)}
            rightContent={headerRightContent}
          />

          {/* Page Content */}
          <main className={fullHeight ? "flex-1 h-screen" : "flex-1"}>
            {children}
          </main>
        </div>
      </div>
    </AuthWrapper>
  );
}