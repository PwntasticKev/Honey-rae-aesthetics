"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  description?: string;
  location?: string;
}

export function SimpleCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem("google_calendar_access_token");
    setIsAuthenticated(!!token);
  };

  const loadEvents = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("google_calendar_access_token");
      if (!token) {
        throw new Error("No access token found. Please authenticate first.");
      }

      console.log("📅 Loading calendar events...");

      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
          `timeMin=${now.toISOString()}&timeMax=${oneWeekFromNow.toISOString()}&maxResults=20&orderBy=startTime&singleEvents=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Calendar API error:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(
        "✅ Calendar events loaded:",
        data.items?.length || 0,
        "events",
      );

      setEvents(data.items || []);
    } catch (error) {
      console.error("❌ Failed to load events:", error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const formatEventTime = (event: CalendarEvent) => {
    const start = event.start.dateTime || event.start.date;
    if (!start) return "No time specified";

    const date = new Date(start);
    return date.toLocaleString();
  };

  const formatEventDuration = (event: CalendarEvent) => {
    const start = event.start.dateTime || event.start.date;
    const end = event.end.dateTime || event.end.date;

    if (!start || !end) return "";

    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    return `${diffHours}h`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Simple Calendar Events
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>Authentication:</span>
            {isAuthenticated ? (
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

          <Button
            onClick={loadEvents}
            disabled={isLoading || !isAuthenticated}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Load Events
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <h4 className="font-semibold text-red-800">Error</h4>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {events.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Events (Next 7 Days)</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.map((event) => (
                <div key={event.id} className="p-3 border rounded-md">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {event.summary || "No title"}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {formatEventTime(event)}
                      </p>
                      {event.location && (
                        <p className="text-sm text-gray-500">
                          📍 {event.location}
                        </p>
                      )}
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">
                      {formatEventDuration(event)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isAuthenticated && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="font-semibold text-yellow-800">
              Authentication Required
            </h4>
            <p className="text-yellow-700 text-sm">
              Please use the OAuth buttons above to authenticate with Google
              Calendar first.
            </p>
          </div>
        )}

        {isAuthenticated && events.length === 0 && !isLoading && !error && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-semibold text-blue-800">No Events Found</h4>
            <p className="text-blue-700 text-sm">
              No events found in your primary calendar for the next 7 days.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
