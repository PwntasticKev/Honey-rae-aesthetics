"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  RefreshCw,
} from "lucide-react";

interface TestStep {
  name: string;
  status: "pending" | "running" | "success" | "error";
  message?: string;
}

export function OAuthTest() {
  const [steps, setSteps] = useState<TestStep[]>([
    { name: "Check Environment Variables", status: "pending" },
    { name: "Test OAuth URL Generation", status: "pending" },
    { name: "Test OAuth Flow", status: "pending" },
    { name: "Test Calendar Access", status: "pending" },
    { name: "Test Event Fetching", status: "pending" },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const updateStep = (
    index: number,
    status: TestStep["status"],
    message?: string,
  ) => {
    setSteps((prev) =>
      prev.map((step, i) =>
        i === index ? { ...step, status, message } : step,
      ),
    );
  };

  const runTests = async () => {
    setIsRunning(true);

    // Step 1: Check Environment Variables
    updateStep(0, "running");
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

      if (!clientId || !apiKey) {
        throw new Error("Missing environment variables");
      }

      updateStep(0, "success", `Client ID: ${clientId.substring(0, 20)}...`);
    } catch (error) {
      updateStep(
        0,
        "error",
        error instanceof Error ? error.message : String(error),
      );
      setIsRunning(false);
      return;
    }

    // Step 2: Test OAuth URL Generation
    updateStep(1, "running");
    try {
      const response = await fetch("/api/auth/google?action=login");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.authUrl) {
        throw new Error("No auth URL returned");
      }

      updateStep(1, "success", "OAuth URL generated successfully");
    } catch (error) {
      updateStep(
        1,
        "error",
        error instanceof Error ? error.message : String(error),
      );
      setIsRunning(false);
      return;
    }

    // Step 3: Test OAuth Flow (simulate)
    updateStep(2, "running");
    try {
      // Check if we have a stored token
      const storedToken = localStorage.getItem("google_calendar_access_token");
      if (storedToken) {
        updateStep(2, "success", "Found existing access token");
      } else {
        updateStep(
          2,
          "error",
          "No access token found. Please use the OAuth button to authenticate.",
        );
        setIsRunning(false);
        return;
      }
    } catch (error) {
      updateStep(
        2,
        "error",
        error instanceof Error ? error.message : String(error),
      );
      setIsRunning(false);
      return;
    }

    // Step 4: Test Calendar Access
    updateStep(3, "running");
    try {
      const token = localStorage.getItem("google_calendar_access_token");
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
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      updateStep(3, "success", `Found ${data.items?.length || 0} calendars`);
    } catch (error) {
      updateStep(
        3,
        "error",
        error instanceof Error ? error.message : String(error),
      );
      setIsRunning(false);
      return;
    }

    // Step 5: Test Event Fetching
    updateStep(4, "running");
    try {
      const token = localStorage.getItem("google_calendar_access_token");
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
          `timeMin=${now.toISOString()}&timeMax=${oneWeekFromNow.toISOString()}&maxResults=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      updateStep(
        4,
        "success",
        `Found ${data.items?.length || 0} events in the next week`,
      );
    } catch (error) {
      updateStep(
        4,
        "error",
        error instanceof Error ? error.message : String(error),
      );
    }

    setIsRunning(false);
  };

  const resetTests = () => {
    setSteps([
      { name: "Check Environment Variables", status: "pending" },
      { name: "Test OAuth URL Generation", status: "pending" },
      { name: "Test OAuth Flow", status: "pending" },
      { name: "Test Calendar Access", status: "pending" },
      { name: "Test Event Fetching", status: "pending" },
    ]);
  };

  const getStepIcon = (status: TestStep["status"]) => {
    switch (status) {
      case "pending":
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
      case "running":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          OAuth & Calendar Test Suite
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={runTests}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            Run OAuth Tests
          </Button>
          <Button
            onClick={resetTests}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset Tests
          </Button>
        </div>

        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-2 border rounded"
            >
              {getStepIcon(step.status)}
              <span className="flex-1">{step.name}</span>
              {step.message && (
                <Badge
                  variant={step.status === "error" ? "destructive" : "default"}
                >
                  {step.message}
                </Badge>
              )}
            </div>
          ))}
        </div>

        <div className="text-sm text-gray-600">
          <p>
            <strong>Instructions:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Click "Run OAuth Tests" to start the diagnostic</li>
            <li>If Step 3 fails, use the OAuth button to authenticate first</li>
            <li>
              Each step will test a different part of the calendar integration
            </li>
            <li>Green checkmarks mean success, red X means failure</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
