"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Loader2,
  LogIn,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

interface OAuthStatus {
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: string;
  success?: boolean;
}

export function ServerOAuthButton() {
  const [status, setStatus] = useState<OAuthStatus>({
    isAuthenticated: false,
    isLoading: false,
  });
  const searchParams = useSearchParams();

  // Check URL parameters for OAuth result
  useEffect(() => {
    const success = searchParams.get("success");
    const token = searchParams.get("token");
    const refresh = searchParams.get("refresh");
    const error = searchParams.get("error");

    if (success === "true" && token) {
      console.log("✅ OAuth successful - storing tokens");
      localStorage.setItem("google_calendar_access_token", token);
      if (refresh) {
        localStorage.setItem("google_calendar_refresh_token", refresh);
      }
      setStatus({
        isAuthenticated: true,
        isLoading: false,
        success: true,
      });
    } else if (error) {
      console.error("❌ OAuth error:", error);
      setStatus({
        isAuthenticated: false,
        isLoading: false,
        error: decodeURIComponent(error),
      });
    }
  }, [searchParams]);

  // Check if already authenticated on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem("google_calendar_access_token");
    if (storedToken) {
      setStatus({ isAuthenticated: true, isLoading: false });
    }
  }, []);

  const handleLogin = async () => {
    setStatus({ isAuthenticated: false, isLoading: true, error: undefined });

    try {
      console.log("🔐 Starting server-side OAuth login...");

      // Get the OAuth URL from our server
      const response = await fetch("/api/auth/google?action=login");

      if (!response.ok) {
        throw new Error("Failed to get OAuth URL");
      }

      const { authUrl } = await response.json();
      console.log("📋 Redirecting to Google OAuth...");

      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (error) {
      console.error("OAuth login failed:", error);
      setStatus({
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("google_calendar_access_token");
    localStorage.removeItem("google_calendar_refresh_token");
    setStatus({
      isAuthenticated: false,
      isLoading: false,
    });
    console.log("✅ Logged out from Google Calendar");
  };

  const handleRefreshToken = async () => {
    setStatus({ ...status, isLoading: true });

    try {
      const refreshToken = localStorage.getItem(
        "google_calendar_refresh_token",
      );
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      console.log("🔄 Refreshing access token...");

      const response = await fetch("/api/auth/google/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const { access_token } = await response.json();
      localStorage.setItem("google_calendar_access_token", access_token);

      setStatus({
        isAuthenticated: true,
        isLoading: false,
        success: true,
      });

      console.log("✅ Token refreshed successfully");
    } catch (error) {
      console.error("Token refresh failed:", error);
      setStatus({
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogIn className="h-5 w-5" />
          Server-Side Google OAuth
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span>Authentication Status:</span>
          {status.isAuthenticated ? (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Authenticated
            </Badge>
          ) : (
            <Badge variant="destructive" className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Not Authenticated
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          {!status.isAuthenticated ? (
            <Button
              onClick={handleLogin}
              disabled={status.isLoading}
              className="flex items-center gap-2"
            >
              {status.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              Login with Google (Server-Side)
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleRefreshToken}
                disabled={status.isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {status.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh Token
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          )}
        </div>

        {status.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <h4 className="font-semibold text-red-800">Error</h4>
            <p className="text-red-700 text-sm">{status.error}</p>
          </div>
        )}

        {status.success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <h4 className="font-semibold text-green-800">Success</h4>
            <p className="text-green-700 text-sm">
              OAuth authentication successful!
            </p>
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p>
            <strong>Server-Side OAuth:</strong> This uses your OAuth2 client ID
            and secret for proper server-side authentication, which is more
            secure and reliable.
          </p>
          <p className="mt-2">
            <strong>What happens:</strong> You'll be redirected to Google, then
            back to our server which exchanges the authorization code for an
            access token.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
