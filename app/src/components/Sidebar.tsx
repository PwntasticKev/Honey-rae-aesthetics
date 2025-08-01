"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Users,
  Calendar,
  Image,
  MessageSquare,
  Workflow,
  Settings,
  Menu,
  X,
  FileText,
  Share2,
  BarChart3,
  UserPlus,
  Bell,
  CreditCard,
  Database,
  Sparkles,
  Heart,
  Camera,
  Mail,
  Phone,
  Zap,
  TrendingUp,
  Shield,
  Palette,
  Grid,
  List,
  Star,
  Box,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Grid,
    href: "/",
    notification: null,
  },
  {
    id: "clients",
    label: "Clients",
    icon: Heart,
    href: "/clients",
    notification: null,
  },
  {
    id: "appointments",
    label: "Appointments",
    icon: Calendar,
    href: "/appointments",
    notification: null,
  },
  {
    id: "gallery",
    label: "Photo Gallery",
    icon: Camera,
    href: "/gallery",
    notification: null,
  },
  {
    id: "workflows",
    label: "Workflows",
    icon: Zap,
    href: "/workflows",
    notification: null,
  },
  {
    id: "messaging",
    label: "Messages",
    icon: MessageSquare,
    href: "/messaging",
    notification: "1",
  },
  {
    id: "templates",
    label: "Templates",
    icon: FileText,
    href: "/templates",
    notification: null,
  },
  {
    id: "social",
    label: "Social Media",
    icon: Share2,
    href: "/social",
    notification: null,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    href: "/analytics",
    notification: null,
  },
  {
    id: "team",
    label: "Team",
    icon: Users,
    href: "/team",
    notification: null,
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: Box,
    href: "/inventory",
    notification: null,
  },
  {
    id: "reviews",
    label: "Reviews",
    icon: Star,
    href: "/reviews",
    notification: null,
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/settings",
    notification: null,
  },
  {
    id: "org-profile",
    label: "Organization",
    icon: Building,
    href: "/org-profile",
    notification: null,
  },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (href: string) => {
    router.push(href);
    // Close mobile sidebar after navigation
    if (isOpen) {
      onToggle();
    }
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        data-testid="sidebar"
        data-sidebar="true"
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-64 bg-white border-r border-gray-200 shadow-sm transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header with Logo */}
          <div className="flex items-center p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                data-theme-aware="true"
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Honey Rae</h1>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="lg:hidden ml-auto"
              data-testid="mobile-menu-button"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                data-testid={`sidebar-item-${item.id}`}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg text-left transition-all duration-200 group",
                  isActive(item.href) && "border-l-4",
                )}
                data-theme-aware={isActive(item.href) ? "true" : undefined}
                data-hover-aware="true"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={cn(
                      "w-6 h-6 flex items-center justify-center transition-all duration-200",
                      isActive(item.href)
                        ? ""
                        : "text-gray-500 group-hover:text-gray-700",
                    )}
                    data-theme-aware={isActive(item.href) ? "true" : undefined}
                  >
                    <item.icon
                      className="w-5 h-5"
                      data-theme-aware={
                        isActive(item.href) ? "true" : undefined
                      }
                    />
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? ""
                        : "text-gray-700 group-hover:text-gray-900",
                    )}
                    data-theme-aware={isActive(item.href) ? "true" : undefined}
                  >
                    {item.label}
                  </span>
                </div>
                {item.notification && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    data-theme-aware="true"
                  >
                    <span className="text-xs text-white font-medium">
                      {item.notification}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
