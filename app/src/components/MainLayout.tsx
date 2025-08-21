"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen w-full lg:pl-48">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div className="flex flex-1 flex-col">
        <Header onMenuClick={toggleSidebar} />
        <main className="flex flex-1 flex-col bg-gray-50/50">{children}</main>
      </div>
    </div>
  );
}
