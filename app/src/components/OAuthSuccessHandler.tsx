"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

export function OAuthSuccessHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get("success");
    const token = searchParams.get("token");
    const refresh = searchParams.get("refresh");
    const error = searchParams.get("error");

    if (success === "true" && token) {
      // Save token to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("google_calendar_access_token", token);
        if (refresh) {
          localStorage.setItem("google_calendar_refresh_token", refresh);
        }
        console.log("✅ OAuth token saved to localStorage");

        // Clean up URL parameters
        const url = new URL(window.location.href);
        url.searchParams.delete("success");
        url.searchParams.delete("token");
        url.searchParams.delete("refresh");
        url.searchParams.delete("error");
        window.history.replaceState({}, "", url.toString());
      }
    } else if (error) {
      console.error("❌ OAuth error:", error);
    }
  }, [searchParams]);

  const success = searchParams.get("success");
  const token = searchParams.get("token");
  const error = searchParams.get("error");

  if (!success && !error) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {success === "true" ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              OAuth Success
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-red-500" />
              OAuth Error
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {success === "true" && token ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Token Received
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              Access token has been saved to localStorage. You can now use the
              calendar features.
            </p>
            <div className="text-xs text-gray-500">
              Token: {token.substring(0, 20)}...
            </div>
          </div>
        ) : error ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Error
              </Badge>
            </div>
            <p className="text-sm text-red-600">OAuth failed: {error}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
