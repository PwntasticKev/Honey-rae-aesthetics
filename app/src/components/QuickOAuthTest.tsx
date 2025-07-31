"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Key,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

export function QuickOAuthTest() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string>("");
  const [hasToken, setHasToken] = useState<boolean>(false);

  const checkToken = () => {
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem("google_calendar_access_token");
    return !!token;
  };

  // Check token on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = checkToken();
      setHasToken(token);
    }
  }, []);

  const testOAuthFlow = async () => {
    setStatus("loading");
    setMessage("Starting OAuth flow...");

    try {
      // Step 1: Get OAuth URL
      console.log("🔐 Step 1: Getting OAuth URL...");
      const response = await fetch("/api/auth/google?action=login");

      if (!response.ok) {
        throw new Error(`Failed to get OAuth URL: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        "✅ OAuth URL generated:",
        data.authUrl.substring(0, 50) + "...",
      );

      // Step 2: Open OAuth URL in new window
      setMessage("Opening Google OAuth page...");
      window.open(data.authUrl, "_blank", "width=500,height=600");

      setStatus("success");
      setMessage(
        "OAuth URL opened. Please complete the authentication in the popup window.",
      );
    } catch (error) {
      console.error("❌ OAuth test failed:", error);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const testCalendarAccess = async () => {
    if (!checkToken()) {
      setStatus("error");
      setMessage("No access token found. Please authenticate first.");
      return;
    }

    setStatus("loading");
    setMessage("Testing calendar access...");

    try {
      const token = localStorage.getItem("google_calendar_access_token");

      console.log("📅 Testing calendar access with token...");
      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/users/me/calendarList",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Calendar API error: ${response.status} - ${errorText}`,
        );
      }

      const data = await response.json();
      console.log(
        "✅ Calendar access successful:",
        data.items?.length || 0,
        "calendars",
      );

      setStatus("success");
      setMessage(`Success! Found ${data.items?.length || 0} calendars.`);
    } catch (error) {
      console.error("❌ Calendar test failed:", error);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const clearTokens = () => {
    localStorage.removeItem("google_calendar_access_token");
    localStorage.removeItem("google_calendar_refresh_token");
    setHasToken(false);
    setStatus("idle");
    setMessage("Tokens cleared.");
  };

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Key className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Quick OAuth Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>Token Status:</span>
            {hasToken ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Found
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Missing
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={testOAuthFlow}
            disabled={status === "loading"}
            className="flex items-center gap-2"
          >
            {status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            Start OAuth Flow
          </Button>

          <Button
            onClick={testCalendarAccess}
            disabled={status === "loading" || !hasToken}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Test Calendar Access
          </Button>

          <Button
            onClick={clearTokens}
            variant="outline"
            className="flex items-center gap-2"
          >
            Clear Tokens
          </Button>
        </div>

        {message && (
          <div
            className={`p-3 border rounded-md ${
              status === "error"
                ? "bg-red-50 border-red-200"
                : status === "success"
                  ? "bg-green-50 border-green-200"
                  : "bg-blue-50 border-blue-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm">{message}</span>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p>
            <strong>Instructions:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Click "Start OAuth Flow" to begin authentication</li>
            <li>Complete the Google OAuth in the popup window</li>
            <li>You'll be redirected back with an access token</li>
            <li>Click "Test Calendar Access" to verify the token works</li>
          </ol>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="font-semibold text-yellow-800">Important</h4>
            <p className="text-yellow-700 text-sm">
              The OAuth popup will redirect to{" "}
              <code>http://localhost:3001/api/auth/google/callback</code>. Make
              sure this URI is added to your Google Console (which you've
              already done).
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
