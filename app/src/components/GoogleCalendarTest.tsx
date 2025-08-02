"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Calendar,
  RefreshCw,
} from "lucide-react";

export function GoogleCalendarTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<{
    oauthUrl: boolean;
    callback: boolean;
    tokens: boolean;
    calendars: boolean;
  } | null>(null);

  const runTests = async () => {
    setIsLoading(true);
    setTestResults(null);

    const results = {
      oauthUrl: false,
      callback: false,
      tokens: false,
      calendars: false,
    };

    try {
      // Test 1: OAuth URL generation
      console.log("🧪 Test 1: OAuth URL generation");
      const oauthResponse = await fetch("/api/auth/google?action=login");
      if (oauthResponse.ok) {
        const { authUrl } = await oauthResponse.json();
        if (authUrl && authUrl.includes("accounts.google.com")) {
          results.oauthUrl = true;
          console.log("✅ OAuth URL generation successful");
        }
      }

      // Test 2: Check if we have tokens (simulate successful auth)
      console.log("🧪 Test 2: Token storage");
      const accessToken = localStorage.getItem("google_calendar_access_token");
      const refreshToken = localStorage.getItem(
        "google_calendar_refresh_token",
      );
      if (accessToken) {
        results.tokens = true;
        console.log("✅ Tokens found in localStorage");
      }

      // Test 3: Calendar API access (if we have tokens)
      if (accessToken) {
        console.log("🧪 Test 3: Calendar API access");
        const calendarResponse = await fetch(
          "https://www.googleapis.com/calendar/v3/users/me/calendarList",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          },
        );
        if (calendarResponse.ok) {
          const data = await calendarResponse.json();
          if (data.items && Array.isArray(data.items)) {
            results.calendars = true;
            console.log(
              `✅ Calendar API access successful - found ${data.items.length} calendars`,
            );
          }
        }
      }

      // Test 4: Token refresh endpoint
      console.log("🧪 Test 4: Token refresh endpoint");
      if (refreshToken) {
        const refreshResponse = await fetch("/api/auth/google/refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshResponse.ok) {
          results.callback = true;
          console.log("✅ Token refresh endpoint working");
        }
      }
    } catch (error) {
      console.error("Test failed:", error);
    }

    setTestResults(results);
    setIsLoading(false);
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (status: boolean) => {
    return status ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Pass
      </Badge>
    ) : (
      <Badge variant="destructive">Fail</Badge>
    );
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Test the Google Calendar OAuth connection and API access
          </p>
          <Button onClick={runTests} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isLoading ? "Running Tests..." : "Run Tests"}
          </Button>
        </div>

        {testResults && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.oauthUrl)}
                <span className="text-sm font-medium">
                  OAuth URL Generation
                </span>
              </div>
              {getStatusBadge(testResults.oauthUrl)}
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.tokens)}
                <span className="text-sm font-medium">Token Storage</span>
              </div>
              {getStatusBadge(testResults.tokens)}
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.callback)}
                <span className="text-sm font-medium">Token Refresh</span>
              </div>
              {getStatusBadge(testResults.callback)}
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.calendars)}
                <span className="text-sm font-medium">Calendar API Access</span>
              </div>
              {getStatusBadge(testResults.calendars)}
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Next Steps:
              </h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• If OAuth URL fails: Check environment variables</li>
                <li>• If Token Storage fails: Complete OAuth flow</li>
                <li>
                  • If Token Refresh fails: Check server-side configuration
                </li>
                <li>• If Calendar API fails: Check OAuth scopes</li>
              </ul>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>Environment Variables Required:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>NEXT_PUBLIC_GOOGLE_CLIENT_ID</li>
            <li>GOOGLE_CLIENT_SECRET</li>
            <li>NEXT_PUBLIC_GOOGLE_API_KEY (optional)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
