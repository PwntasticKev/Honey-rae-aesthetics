"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  ExternalLink,
  Copy,
  CheckCircle,
  XCircle,
} from "lucide-react";

export function OAuthDebug() {
  const [isLoading, setIsLoading] = useState(false);
  const [oauthUrl, setOauthUrl] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const [serverEnvInfo, setServerEnvInfo] = useState<any>(null);

  const checkServerEnvironment = async () => {
    try {
      const response = await fetch("/api/debug/oauth");
      if (response.ok) {
        const data = await response.json();
        setServerEnvInfo(data);
      }
    } catch (error) {
      console.error("Failed to check server environment:", error);
    }
  };

  const generateOAuthUrl = async () => {
    setIsLoading(true);
    try {
      // First check server environment
      await checkServerEnvironment();

      const response = await fetch("/api/auth/google?action=login");
      if (response.ok) {
        const data = await response.json();
        setOauthUrl(data.authUrl);

        // Parse the URL to show debug info
        const url = new URL(data.authUrl);
        setDebugInfo({
          clientId: url.searchParams.get("client_id"),
          redirectUri: url.searchParams.get("redirect_uri"),
          scope: url.searchParams.get("scope"),
          responseType: url.searchParams.get("response_type"),
          accessType: url.searchParams.get("access_type"),
          prompt: url.searchParams.get("prompt"),
        });
      } else {
        const error = await response.text();
        console.error("Failed to generate OAuth URL:", error);
      }
    } catch (error) {
      console.error("Error generating OAuth URL:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const openOAuthUrl = () => {
    if (oauthUrl) {
      window.open(
        oauthUrl,
        "google-oauth",
        "width=500,height=600,scrollbars=yes,resizable=yes",
      );
    }
  };

  const checkEnvironmentVariables = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    return {
      clientId: !!clientId,
      apiKey: !!apiKey,
      appUrl: !!appUrl,
      currentUrl: window.location.origin,
    };
  };

  const envVars = checkEnvironmentVariables();

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 OAuth Debug Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Environment Variables Check */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Environment Variables</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">
                NEXT_PUBLIC_GOOGLE_CLIENT_ID
              </span>
              {envVars.clientId ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">
                NEXT_PUBLIC_GOOGLE_API_KEY
              </span>
              {envVars.apiKey ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">NEXT_PUBLIC_APP_URL</span>
              {envVars.appUrl ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Current URL</span>
              <span className="text-xs text-gray-600">
                {envVars.currentUrl}
              </span>
            </div>
          </div>
        </div>

        {/* OAuth URL Generation */}
        <div>
          <h3 className="text-lg font-semibold mb-3">OAuth URL Generation</h3>
          <div className="flex gap-2 mb-4">
            <Button onClick={generateOAuthUrl} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                "Generate OAuth URL"
              )}
            </Button>
            {oauthUrl && (
              <>
                <Button variant="outline" onClick={openOAuthUrl}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open OAuth
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(oauthUrl)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? "Copied!" : "Copy URL"}
                </Button>
              </>
            )}
          </div>

          {oauthUrl && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Generated OAuth URL:
                </label>
                <Input
                  value={oauthUrl}
                  readOnly
                  className="mt-1 font-mono text-xs"
                />
              </div>

              {debugInfo && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold mb-2">
                    URL Parameters:
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <strong>Client ID:</strong> {debugInfo.clientId}
                    </div>
                    <div>
                      <strong>Redirect URI:</strong> {debugInfo.redirectUri}
                    </div>
                    <div>
                      <strong>Scope:</strong> {debugInfo.scope}
                    </div>
                    <div>
                      <strong>Response Type:</strong> {debugInfo.responseType}
                    </div>
                    <div>
                      <strong>Access Type:</strong> {debugInfo.accessType}
                    </div>
                    <div>
                      <strong>Prompt:</strong> {debugInfo.prompt}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Server Environment Check */}
        {serverEnvInfo && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-green-900">
              OAuth Configuration
            </h3>
            <div className="text-sm text-green-800 space-y-2">
              {Object.entries(serverEnvInfo.environment).map(
                ([key, info]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="font-medium">{key}:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">
                        {info.preview || info.value}
                      </span>
                      {info.valid ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>

            {/* Troubleshooting Section */}
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <h4 className="text-sm font-semibold text-yellow-900 mb-2">
                Troubleshooting "invalid_client" Error:
              </h4>
              <div className="text-xs text-yellow-800 space-y-1">
                {serverEnvInfo.troubleshooting?.invalidClient?.steps.map(
                  (step: string, index: number) => (
                    <div key={index}>{step}</div>
                  ),
                )}
              </div>
            </div>
          </div>
        )}

        {/* Google Cloud Console Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-blue-900">
            Google Cloud Console Setup
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>Authorized JavaScript origins:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>http://localhost:3000</li>
              <li>https://yourdomain.com (for production)</li>
            </ul>
            <p>
              <strong>Authorized redirect URIs:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>http://localhost:3000/api/auth/google/callback</li>
              <li>
                https://yourdomain.com/api/auth/google/callback (for production)
              </li>
            </ul>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-yellow-900">
            Troubleshooting
          </h3>
          <div className="text-sm text-yellow-800 space-y-2">
            <p>
              <strong>Common Issues:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>
                Redirect URI mismatch - ensure it matches exactly in Google
                Cloud Console
              </li>
              <li>Missing environment variables - check .env.local file</li>
              <li>Wrong port - make sure you're running on port 3000</li>
              <li>
                HTTPS required - Google OAuth requires HTTPS in production
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
