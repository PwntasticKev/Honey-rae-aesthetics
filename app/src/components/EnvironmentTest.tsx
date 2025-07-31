"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

export function EnvironmentTest() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

  const isClientIdSet = !!clientId;
  const isApiKeySet = !!apiKey;
  const isClientIdValid = isClientIdSet && clientId.length > 10;
  const isApiKeyValid = isApiKeySet && apiKey.length > 10;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Environment Variables Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold">Google Calendar Configuration</h3>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {isClientIdSet ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span>NEXT_PUBLIC_GOOGLE_CLIENT_ID</span>
              <Badge variant={isClientIdSet ? "default" : "destructive"}>
                {isClientIdSet ? "Set" : "Missing"}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {isApiKeySet ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span>NEXT_PUBLIC_GOOGLE_API_KEY</span>
              <Badge variant={isApiKeySet ? "default" : "destructive"}>
                {isApiKeySet ? "Set" : "Missing"}
              </Badge>
            </div>
          </div>

          {isClientIdSet && (
            <div className="text-sm text-gray-600">
              <p>Client ID: {clientId.substring(0, 20)}...</p>
              <p>Length: {clientId.length} characters</p>
            </div>
          )}

          {isApiKeySet && (
            <div className="text-sm text-gray-600">
              <p>API Key: {apiKey.substring(0, 20)}...</p>
              <p>Length: {apiKey.length} characters</p>
            </div>
          )}

          {!isClientIdSet || !isApiKeySet ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="font-semibold text-yellow-800 mb-2">
                Setup Required
              </h4>
              <p className="text-yellow-700 text-sm mb-2">
                To use Google Calendar integration, you need to:
              </p>
              <ol className="text-yellow-700 text-sm list-decimal list-inside space-y-1">
                <li>
                  Create a <code>.env.local</code> file in the <code>app</code>{" "}
                  directory
                </li>
                <li>Add your Google API credentials to the file</li>
                <li>Restart the development server</li>
              </ol>
              <div className="mt-3 p-2 bg-yellow-100 rounded text-xs font-mono">
                {`NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_GOOGLE_API_KEY=your_api_key_here`}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h4 className="font-semibold text-green-800 mb-2">
                ✅ Environment Variables Configured
              </h4>
              <p className="text-green-700 text-sm">
                Your Google Calendar environment variables are properly
                configured.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
