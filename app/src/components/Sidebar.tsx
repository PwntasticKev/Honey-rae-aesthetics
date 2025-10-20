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
  // {
  //   id: "dashboard",
  //   label: "Dashboard",
  //   icon: Grid,
  //   href: "/",
  //   notification: null,
  // },
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
  // {
  //   id: "gallery",
  //   label: "Photo Gallery",
  //   icon: Camera,
  //   href: "/gallery",
  //   notification: null,
  // },
  {
    id: "workflows",
    label: "Workflows",
    icon: Zap,
    href: "/workflows",
    notification: null,
  },
  // {
  //   id: "messaging",
  //   label: "Messages",
  //   icon: MessageSquare,
  //   href: "/messaging",
  //   notification: "1",
  // },
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
  // {
  //   id: "inventory",
  //   label: "Inventory",
  //   icon: Box,
  //   href: "/inventory",
  //   notification: null,
  // },
  // {
  //   id: "reviews",
  //   label: "Reviews",
  //   icon: Star,
  //   href: "/reviews",
  //   notification: null,
  // },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/settings",
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
          "fixed left-0 top-0 z-40 h-screen w-48 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header with Logo */}
          <div className="flex items-center px-4 py-5 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg">
                <Sparkles className="w-4 h-4 text-gray-700" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-gray-900">Honey Rae</h1>
                <p className="text-xs text-gray-500">Aesthetics</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="lg:hidden ml-auto h-8 w-8"
              data-testid="mobile-menu-button"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto min-h-0">
            {menuItems.map((item) => (
              <button
                key={item.id}
                data-testid={`sidebar-item-${item.id}`}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 text-left transition-all duration-200 group cursor-pointer rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  isActive(item.href)
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
                aria-label={`Navigate to ${item.label}`}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                <div className="flex items-center space-x-3">
                  <item.icon
                    className={cn(
                      "w-4 h-4 transition-colors duration-200",
                      isActive(item.href)
                        ? "text-gray-900"
                        : "text-gray-500 group-hover:text-gray-700"
                    )}
                  />
                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                </div>
                {item.notification && (
                  <Badge
                    className="w-5 h-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs font-medium border-0"
                  >
                    {item.notification}
                  </Badge>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
