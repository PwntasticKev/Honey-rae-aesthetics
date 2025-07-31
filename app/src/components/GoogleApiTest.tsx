"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, TestTube } from "lucide-react";

export function GoogleApiTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const testApiKey = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

      if (!apiKey) {
        setTestResult({
          success: false,
          message: "API key not found in environment variables",
        });
        return;
      }

      console.log("🧪 Testing Google API key...");
      console.log("📋 API Key:", apiKey.substring(0, 20) + "...");

      // Test the API key by making a simple request to Google Calendar API
      const testUrl = `https://www.googleapis.com/calendar/v3/users/me/calendarList?key=${apiKey}`;

      const response = await fetch(testUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("📋 Response status:", response.status);
      console.log(
        "📋 Response headers:",
        Object.fromEntries(response.headers.entries()),
      );

      if (response.ok) {
        const data = await response.json();
        console.log("📋 Response data:", data);
        setTestResult({
          success: true,
          message: "API key is valid and working",
          details: {
            status: response.status,
            calendarsFound: data.items?.length || 0,
          },
        });
      } else {
        const errorData = await response.text();
        console.error("📋 Error response:", errorData);
        setTestResult({
          success: false,
          message: `API key test failed: ${response.status} ${response.statusText}`,
          details: {
            status: response.status,
            error: errorData,
          },
        });
      }
    } catch (error) {
      console.error("🧪 API test error:", error);
      setTestResult({
        success: false,
        message: `Network error: ${error instanceof Error ? error.message : String(error)}`,
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Google API Key Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={testApiKey}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4" />
            )}
            Test API Key
          </Button>
        </div>

        {testResult && (
          <div
            className={`p-4 rounded-md border ${
              testResult.success
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span
                className={`font-semibold ${
                  testResult.success ? "text-green-800" : "text-red-800"
                }`}
              >
                {testResult.success ? "Success" : "Failed"}
              </span>
            </div>
            <p
              className={`text-sm ${
                testResult.success ? "text-green-700" : "text-red-700"
              }`}
            >
              {testResult.message}
            </p>
            {testResult.details && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                <pre>{JSON.stringify(testResult.details, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p>
            This test will verify if your Google API key is valid and can access
            the Calendar API.
          </p>
          <p className="mt-1">
            <strong>Note:</strong> This test requires authentication, so it may
            fail even with a valid API key if you're not logged into Google.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
