"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, LogOut } from "lucide-react";
import { SimpleSearch } from "@/components/SimpleSearch";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { EnvironmentToggle } from "@/components/EnvironmentToggle";
import { useAuth } from "@/hooks/useAuth";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onMenuToggle: () => void;
  rightContent?: React.ReactNode;
}

export function PageHeader({ title, subtitle, onMenuToggle, rightContent }: PageHeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between pl-0 pr-6 h-16">
        <div className="flex items-center space-x-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="lg:hidden z-10"
            data-testid="mobile-menu-button"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Page Title */}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Custom right content */}
          {rightContent}

          {/* Search */}
          <div className="hidden md:block">
            <SimpleSearch />
          </div>

          {/* Notifications */}
          <NotificationDropdown />

          {/* Environment Toggle */}
          <EnvironmentToggle />

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src="/avatar.jpg" />
              <AvatarFallback className="bg-gray-100 text-gray-900">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">Dr. Rae</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title="Logout"
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}