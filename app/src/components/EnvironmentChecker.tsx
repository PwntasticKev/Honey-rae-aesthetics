"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

export function EnvironmentChecker() {
  const checkEnvironmentVariables = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    return {
      clientId: {
        value: clientId,
        exists: !!clientId,
        valid:
          clientId &&
          clientId !== "your_google_client_id" &&
          clientId.length > 10,
      },
      clientSecret: {
        value: clientSecret,
        exists: !!clientSecret,
        valid:
          clientSecret &&
          clientSecret !== "your_google_client_secret" &&
          clientSecret.length > 10,
      },
      apiKey: {
        value: apiKey,
        exists: !!apiKey,
        valid: apiKey && apiKey !== "your_google_api_key" && apiKey.length > 10,
      },
      appUrl: {
        value: appUrl,
        exists: !!appUrl,
        valid:
          appUrl &&
          appUrl !== "http://localhost:3000" &&
          appUrl.includes("localhost:3000"),
      },
    };
  };

  const envVars = checkEnvironmentVariables();

  const getStatusIcon = (valid: boolean, exists: boolean) => {
    if (!exists) return <XCircle className="h-4 w-4 text-red-500" />;
    if (!valid) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusBadge = (valid: boolean, exists: boolean) => {
    if (!exists) return <Badge variant="destructive">Missing</Badge>;
    if (!valid) return <Badge variant="secondary">Invalid</Badge>;
    return (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Valid
      </Badge>
    );
  };

  const getValueDisplay = (value: string | undefined) => {
    if (!value) return "Not set";
    if (value.includes("your_") || value === "http://localhost:3000") {
      return `${value.substring(0, 20)}... (placeholder)`;
    }
    return `${value.substring(0, 20)}...`;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Environment Variables Check
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(
                !!envVars.clientId.valid,
                !!envVars.clientId.exists,
              )}
              <div>
                <span className="text-sm font-medium">
                  NEXT_PUBLIC_GOOGLE_CLIENT_ID
                </span>
                <div className="text-xs text-gray-500">
                  {getValueDisplay(envVars.clientId.value)}
                </div>
              </div>
            </div>
            {getStatusBadge(
              !!envVars.clientId.valid,
              !!envVars.clientId.exists,
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(
                !!envVars.clientSecret.valid,
                !!envVars.clientSecret.exists,
              )}
              <div>
                <span className="text-sm font-medium">
                  GOOGLE_CLIENT_SECRET
                </span>
                <div className="text-xs text-gray-500">
                  {getValueDisplay(envVars.clientSecret.value)}
                </div>
              </div>
            </div>
            {getStatusBadge(
              !!envVars.clientSecret.valid,
              !!envVars.clientSecret.exists,
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(!!envVars.apiKey.valid, !!envVars.apiKey.exists)}
              <div>
                <span className="text-sm font-medium">
                  NEXT_PUBLIC_GOOGLE_API_KEY
                </span>
                <div className="text-xs text-gray-500">
                  {getValueDisplay(envVars.apiKey.value)}
                </div>
              </div>
            </div>
            {getStatusBadge(!!envVars.apiKey.valid, !!envVars.apiKey.exists)}
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(!!envVars.appUrl.valid, !!envVars.appUrl.exists)}
              <div>
                <span className="text-sm font-medium">NEXT_PUBLIC_APP_URL</span>
                <div className="text-xs text-gray-500">
                  {getValueDisplay(envVars.appUrl.value)}
                </div>
              </div>
            </div>
            {getStatusBadge(!!envVars.appUrl.valid, !!envVars.appUrl.exists)}
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            Setup Instructions:
          </h4>
          <div className="text-xs text-blue-800 space-y-1">
            <p>
              1. Copy <code>env.example</code> to <code>.env.local</code>
            </p>
            <p>
              2. Replace placeholder values with your actual Google OAuth
              credentials
            </p>
            <p>
              3. Set <code>NEXT_PUBLIC_APP_URL=http://localhost:3000</code>
            </p>
            <p>4. Restart your development server</p>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-yellow-900 mb-2">
            Current URL Info:
          </h4>
          <div className="text-xs text-yellow-800">
            <p>
              <strong>Current URL:</strong> {window.location.origin}
            </p>
            <p>
              <strong>Expected for OAuth:</strong> http://localhost:3000
            </p>
            <p>
              <strong>Port:</strong> {window.location.port || "80/443"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
