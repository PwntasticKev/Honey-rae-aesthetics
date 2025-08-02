"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bell,
  X,
  Check,
  Info,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Download,
  Settings,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useClearAllNotifications,
  type NotificationData,
} from "@/lib/convexNotificationService";
import { useAuth } from "@/hooks/useAuth";

interface NotificationDropdownProps {
  className?: string;
}

export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Get notifications and unread count from Convex
  // Temporarily disabled until Convex functions are deployed
  const notifications: NotificationData[] = [];
  const unreadCount = 0;

  // Mutation hooks - temporarily disabled
  const markAsRead = async () => {};
  const markAllAsRead = async () => {};
  const clearAllNotifications = async () => {};

  const getNotificationIcon = (type: NotificationData["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "update":
        return <Download className="h-4 w-4 text-blue-500" />;
      case "message":
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case "appointment":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "workflow":
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      case "client":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: NotificationData["type"]) => {
    switch (type) {
      case "success":
        return "border-l-green-500 bg-green-50";
      case "warning":
        return "border-l-yellow-500 bg-yellow-50";
      case "error":
        return "border-l-red-500 bg-red-50";
      case "update":
        return "border-l-blue-500 bg-blue-50";
      case "message":
        return "border-l-purple-500 bg-purple-50";
      case "appointment":
        return "border-l-blue-500 bg-blue-50";
      case "workflow":
        return "border-l-purple-500 bg-purple-50";
      case "client":
        return "border-l-green-500 bg-green-50";
      default:
        return "border-l-blue-500 bg-blue-50";
    }
  };

  const handleNotificationClick = async (notification: NotificationData) => {
    await markAsRead();

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }

    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleClearAll = async () => {
    await clearAllNotifications();
  };

  const handleSettingsClick = () => {
    router.push("/settings/notifications");
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="notifications-button"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
            data-testid="notifications-badge"
            data-theme-aware="true"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
              </h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSettingsClick}
                  className="text-xs"
                >
                  <Settings className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-xs"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="p-2">
                {notifications.map((notification: NotificationData) => (
                  <Card
                    key={notification._id}
                    className={`mb-2 cursor-pointer transition-all hover:shadow-md ${
                      !notification.read ? "ring-2 ring-orange-200" : ""
                    } ${getNotificationColor(notification.type)}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {format(notification.createdAt, "MMM dd, h:mm a")}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          {notification.actionText && (
                            <div className="mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNotificationClick(notification);
                                }}
                              >
                                {notification.actionText}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
