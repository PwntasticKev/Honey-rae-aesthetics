"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { googleCalendarService } from "@/lib/googleCalendarService";

interface DebugInfo {
  apiKeysConfigured: boolean;
  gapiInited: boolean;
  gisInited: boolean;
  isAuthenticated: boolean;
  calendarsCount: number;
  eventsCount: number;
  lastError?: string;
}

export function GoogleCalendarDebug() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    apiKeysConfigured: false,
    gapiInited: false,
    gisInited: false,
    isAuthenticated: false,
    calendarsCount: 0,
    eventsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const runDiagnostics = async () => {
    setIsLoading(true);
    setLogs([]);

    try {
      addLog("🔧 Starting Google Calendar diagnostics...");

      // Check API keys
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      const apiKeysConfigured = !!(clientId && apiKey);

      addLog(`📋 API Keys configured: ${apiKeysConfigured}`);
      addLog(`📋 Client ID: ${clientId ? "✅ Set" : "❌ Missing"}`);
      addLog(`📋 API Key: ${apiKey ? "✅ Set" : "❌ Missing"}`);

      if (!apiKeysConfigured) {
        addLog("❌ Cannot proceed without API keys");
        setDebugInfo((prev) => ({ ...prev, apiKeysConfigured: false }));
        return;
      }

      // Initialize service
      addLog("🔄 Initializing Google Calendar service...");
      await googleCalendarService.initialize();
      addLog("✅ Service initialization complete");

      // Check authentication
      addLog("🔐 Checking authentication status...");
      const isAuthenticated = await googleCalendarService.isAuthenticated();
      addLog(`🔐 Authenticated: ${isAuthenticated ? "✅ Yes" : "❌ No"}`);

      if (!isAuthenticated) {
        addLog("🔐 Attempting authentication...");
        const authSuccess = await googleCalendarService.authenticate();
        addLog(
          `🔐 Authentication result: ${authSuccess ? "✅ Success" : "❌ Failed"}`,
        );
      }

      // Get calendars
      addLog("📋 Fetching calendars...");
      const calendars = await googleCalendarService.getCalendars();
      addLog(`📋 Found ${calendars.length} calendars`);
      calendars.forEach((cal) => {
        addLog(
          `📋 Calendar: ${cal.name} (${cal.id}) - Selected: ${cal.isSelected}`,
        );
      });

      // Get events
      if (calendars.length > 0) {
        addLog("📅 Fetching events...");
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        const events =
          await googleCalendarService.getEventsFromMultipleCalendars(
            calendars,
            startDate,
            endDate,
          );
        addLog(`📅 Found ${events.length} events`);

        if (events.length > 0) {
          events.slice(0, 3).forEach((event) => {
            addLog(
              `📅 Event: ${event.title} (${event.start.toLocaleDateString()})`,
            );
          });
        }
      }

      setDebugInfo({
        apiKeysConfigured,
        gapiInited: true, // Assuming initialization succeeded
        gisInited: true, // Assuming initialization succeeded
        isAuthenticated: await googleCalendarService.isAuthenticated(),
        calendarsCount: calendars.length,
        eventsCount: 0, // Will be updated after events fetch
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addLog(`❌ Error: ${errorMessage}`);
      setDebugInfo((prev) => ({ ...prev, lastError: errorMessage }));
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Google Calendar Debug
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={runDiagnostics}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Run Diagnostics
            </Button>
            <Button variant="outline" onClick={clearLogs}>
              Clear Logs
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Status</h3>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {debugInfo.apiKeysConfigured ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>API Keys</span>
                </div>
                <div className="flex items-center gap-2">
                  {debugInfo.gapiInited ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>Google API</span>
                </div>
                <div className="flex items-center gap-2">
                  {debugInfo.gisInited ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>Identity Services</span>
                </div>
                <div className="flex items-center gap-2">
                  {debugInfo.isAuthenticated ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>Authenticated</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Data</h3>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{debugInfo.calendarsCount}</Badge>
                  <span>Calendars</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{debugInfo.eventsCount}</Badge>
                  <span>Events</span>
                </div>
              </div>
            </div>
          </div>

          {debugInfo.lastError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <h4 className="font-semibold text-red-800">Last Error</h4>
              <p className="text-red-700 text-sm">{debugInfo.lastError}</p>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold">Debug Logs</h3>
            <div className="bg-gray-50 p-3 rounded-md max-h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No logs yet. Run diagnostics to see logs.
                </p>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="text-sm font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
