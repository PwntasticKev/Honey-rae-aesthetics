"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function ThemeDebug() {
  const { user } = useAuth();

  // Get user's organization
  const userData = useQuery(
    api.users.getByEmail,
    user?.email ? { email: user.email } : "skip",
  );

  // Get organization theme
  const org = useQuery(
    api.orgs.get,
    userData?.orgId ? { id: userData.orgId as any } : "skip",
  );

  const getCurrentFontFamily = () => {
    if (typeof window !== "undefined") {
      return window.getComputedStyle(document.body).fontFamily;
    }
    return "Not available";
  };

  const getCurrentThemeColors = () => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      return {
        primary: root.style.getPropertyValue("--primary") || "Not set",
        background: root.style.getPropertyValue("--background") || "Not set",
        foreground: root.style.getPropertyValue("--foreground") || "Not set",
        fontFamily: root.style.getPropertyValue("--font-family") || "Not set",
      };
    }
    return {
      primary: "Not available",
      background: "Not available",
      foreground: "Not available",
      fontFamily: "Not available",
    };
  };

  const themeColors = getCurrentThemeColors();
  const currentFontFamily = getCurrentFontFamily();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎨 Theme Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User and Organization Info */}
        <div>
          <h3 className="text-sm font-semibold mb-2">User & Organization</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>User Authenticated:</span>
              <Badge variant={user ? "default" : "destructive"}>
                {user ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>User Email:</span>
              <span className="text-gray-600">
                {user?.email || "Not available"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>User Data Loaded:</span>
              <Badge variant={userData ? "default" : "destructive"}>
                {userData ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Organization ID:</span>
              <span className="text-gray-600">
                {userData?.orgId || "Not available"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Organization Loaded:</span>
              <Badge variant={org ? "default" : "destructive"}>
                {org ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Database Theme Info */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Database Theme</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Theme ID:</span>
              <span className="text-gray-600">
                {org?.theme && "themeId" in org.theme
                  ? (org.theme as any).themeId
                  : "Not set"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Font Family:</span>
              <span className="text-gray-600">
                {org?.theme && "fontFamily" in org.theme
                  ? (org.theme as any).fontFamily
                  : "Not set"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Applied At:</span>
              <span className="text-gray-600">
                {org?.theme && "appliedAt" in org.theme
                  ? new Date((org.theme as any).appliedAt).toLocaleString()
                  : "Not set"}
              </span>
            </div>
          </div>
        </div>

        {/* Applied Theme Info */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Applied Theme</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Primary Color:</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: themeColors.primary }}
                />
                <span className="text-gray-600">{themeColors.primary}</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span>Background Color:</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: themeColors.background }}
                />
                <span className="text-gray-600">{themeColors.background}</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span>Foreground Color:</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: themeColors.foreground }}
                />
                <span className="text-gray-600">{themeColors.foreground}</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span>Font Family (CSS):</span>
              <span className="text-gray-600">{themeColors.fontFamily}</span>
            </div>
            <div className="flex justify-between">
              <span>Font Family (Applied):</span>
              <span className="text-gray-600">{currentFontFamily}</span>
            </div>
          </div>
        </div>

        {/* Debug Actions */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Debug Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                console.log("🎨 Theme Debug - Current State:", {
                  user: !!user,
                  userEmail: user?.email,
                  userData: !!userData,
                  orgId: userData?.orgId,
                  org: !!org,
                  orgTheme: org?.theme,
                  themeColors,
                  currentFontFamily,
                });
              }}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
            >
              Log Theme State to Console
            </button>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  const root = document.documentElement;
                  console.log("🎨 CSS Custom Properties:", {
                    primary: root.style.getPropertyValue("--primary"),
                    background: root.style.getPropertyValue("--background"),
                    foreground: root.style.getPropertyValue("--foreground"),
                    fontFamily: root.style.getPropertyValue("--font-family"),
                  });
                }
              }}
              className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
            >
              Log CSS Properties
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
