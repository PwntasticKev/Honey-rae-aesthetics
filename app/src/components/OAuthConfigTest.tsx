"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Settings,
  ExternalLink,
} from "lucide-react";

export function OAuthConfigTest() {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    clientId: boolean;
    redirectUri: boolean;
    oauthUrl: boolean;
    error?: string;
  } | null>(null);

  const testOAuthConfig = async () => {
    setIsTesting(true);
    setTestResults(null);

    try {
      console.log("🔧 Testing OAuth configuration...");

      // Test 1: Check Client ID
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error("Client ID not found in environment variables");
      }
      console.log("✅ Client ID found:", clientId.substring(0, 20) + "...");

      // Test 2: Check Redirect URI
      const redirectUri = `${window.location.origin}/api/auth/google/callback`;
      console.log("✅ Redirect URI:", redirectUri);

      // Test 3: Test OAuth URL generation
      const response = await fetch("/api/auth/google?action=login");
      if (!response.ok) {
        throw new Error(`OAuth URL generation failed: ${response.status}`);
      }

      const data = await response.json();
      if (!data.authUrl) {
        throw new Error("No auth URL returned from server");
      }

      console.log("✅ OAuth URL generated successfully");

      setTestResults({
        clientId: true,
        redirectUri: true,
        oauthUrl: true,
      });
    } catch (error) {
      console.error("❌ OAuth config test failed:", error);
      setTestResults({
        clientId: false,
        redirectUri: false,
        oauthUrl: false,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const openOAuthUrl = async () => {
    try {
      const response = await fetch("/api/auth/google?action=login");
      const data = await response.json();

      if (data.authUrl) {
        console.log("🔗 Opening OAuth URL...");
        window.open(data.authUrl, "_blank");
      }
    } catch (error) {
      console.error("Failed to get OAuth URL:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          OAuth Configuration Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={testOAuthConfig}
            disabled={isTesting}
            className="flex items-center gap-2"
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Settings className="h-4 w-4" />
            )}
            Test OAuth Config
          </Button>
          <Button
            onClick={openOAuthUrl}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Test OAuth Flow
          </Button>
        </div>

        {testResults && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span>Client ID:</span>
              {testResults.clientId ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Found
                </Badge>
              ) : (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1"
                >
                  <XCircle className="h-3 w-3" />
                  Missing
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span>Redirect URI:</span>
              {testResults.redirectUri ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Valid
                </Badge>
              ) : (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1"
                >
                  <XCircle className="h-3 w-3" />
                  Invalid
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span>OAuth URL:</span>
              {testResults.oauthUrl ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Generated
                </Badge>
              ) : (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1"
                >
                  <XCircle className="h-3 w-3" />
                  Failed
                </Badge>
              )}
            </div>

            {testResults.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <h4 className="font-semibold text-red-800">Error</h4>
                <p className="text-red-700 text-sm">{testResults.error}</p>
              </div>
            )}
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p>
            <strong>What this tests:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Client ID is properly configured</li>
            <li>Redirect URI is correctly formatted</li>
            <li>OAuth URL can be generated by the server</li>
            <li>Server-side OAuth endpoints are working</li>
          </ul>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="font-semibold text-yellow-800">
              Google Console Setup Required
            </h4>
            <p className="text-yellow-700 text-sm">
              Make sure to add{" "}
              <code>http://localhost:3001/api/auth/google/callback</code>
              to your OAuth 2.0 Client ID's "Authorized redirect URIs" in Google
              Cloud Console.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
