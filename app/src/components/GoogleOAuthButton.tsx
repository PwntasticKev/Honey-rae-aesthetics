"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, LogIn, LogOut } from "lucide-react";

interface OAuthStatus {
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: string;
}

export function GoogleOAuthButton() {
  const [status, setStatus] = useState<OAuthStatus>({
    isAuthenticated: false,
    isLoading: false,
  });

  const handleLogin = async () => {
    setStatus({ isAuthenticated: false, isLoading: true, error: undefined });

    try {
      console.log("🔐 Starting Google OAuth login...");

      // Check if Google Identity Services is available
      if (!(window as any).google?.accounts?.oauth2) {
        console.error("❌ Google Identity Services not loaded");
        throw new Error(
          "Google Identity Services not loaded. Please refresh the page and try again.",
        );
      }

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error("Google Client ID not configured");
      }

      // Create token client with refresh token support
      const tokenClient = (
        window as any
      ).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope:
          "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events",
        prompt: "consent", // Force consent to get refresh token
        callback: (response: any) => {
          if (response.error) {
            console.error("OAuth error:", response.error);
            setStatus({
              isAuthenticated: false,
              isLoading: false,
              error: `OAuth error: ${response.error}`,
            });
            return;
          }

          console.log("✅ OAuth successful, tokens received");

          // Store both access token and refresh token
          localStorage.setItem(
            "google_calendar_access_token",
            response.access_token,
          );

          if (response.refresh_token) {
            localStorage.setItem(
              "google_calendar_refresh_token",
              response.refresh_token,
            );
            console.log("✅ Refresh token stored");
          }

          setStatus({
            isAuthenticated: true,
            isLoading: false,
          });
        },
      });

      // Request access token
      tokenClient.requestAccessToken();

      // Set a timeout in case the callback doesn't fire
      setTimeout(() => {
        if (!status.isAuthenticated) {
          setStatus({
            isAuthenticated: false,
            isLoading: false,
            error: "OAuth timeout - no response received",
          });
        }
      }, 10000);
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

  // Check if already authenticated on component mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedToken = localStorage.getItem("google_calendar_access_token");
    const storedRefreshToken = localStorage.getItem(
      "google_calendar_refresh_token",
    );
    if (storedToken && storedRefreshToken) {
      setStatus({ isAuthenticated: true, isLoading: false });
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogIn className="h-5 w-5" />
          Google Calendar OAuth
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
              disabled={
                status.isLoading || !(window as any).google?.accounts?.oauth2
              }
              className="flex items-center gap-2"
            >
              {status.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              Login with Google
            </Button>
          ) : (
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          )}
        </div>

        {!(window as any).google?.accounts?.oauth2 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="font-semibold text-yellow-800">
              Google Services Not Loaded
            </h4>
            <p className="text-yellow-700 text-sm">
              Google Identity Services are not loaded. Please refresh the page
              and try again.
            </p>
          </div>
        )}

        {status.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <h4 className="font-semibold text-red-800">Error</h4>
            <p className="text-red-700 text-sm">{status.error}</p>
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p>
            <strong>Why OAuth is required:</strong> Google Calendar API requires
            OAuth2 authentication to access your personal calendar data. API
            keys alone cannot access user-specific calendar information.
          </p>
          <p className="mt-2">
            <strong>What this does:</strong> This will open a Google login popup
            and request permission to access your calendar data. The access
            token will be stored locally for future API calls.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
