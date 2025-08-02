// Simple Google Calendar API integration using direct fetch calls
// This service handles OAuth authentication and calendar operations

export interface GoogleCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  attendees?: string[];
  calendarId: string;
  calendarName: string;
  calendarColor: string;
}

export interface GoogleCalendar {
  id: string;
  name: string;
  color: string;
  isSelected: boolean;
  email?: string;
}

class SimpleGoogleCalendarService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage on initialization
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("google_calendar_access_token");
      this.refreshToken = localStorage.getItem("google_calendar_refresh_token");
    }
  }

  async initialize(): Promise<void> {
    try {
      console.log("🔧 Initializing Simple Google Calendar service...");

      // Check if we have an access token
      if (typeof window !== "undefined") {
        this.accessToken = localStorage.getItem("google_calendar_access_token");
      }

      if (!this.accessToken) {
        console.warn("No access token found. Please authenticate first.");
        return;
      }

      console.log("✅ Simple Google Calendar service initialized successfully");
    } catch (error) {
      console.error(
        "Failed to initialize Simple Google Calendar service:",
        error,
      );
    }
  }

  async isAuthenticated(): Promise<boolean> {
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("google_calendar_access_token");
      this.refreshToken = localStorage.getItem("google_calendar_refresh_token");
    }
    return !!this.accessToken;
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      console.warn("No refresh token available");
      return false;
    }

    try {
      console.log("🔄 Refreshing access token via server...");
      console.log("🔍 Refresh token length:", this.refreshToken.length);
      console.log(
        "🔍 Refresh token preview:",
        this.refreshToken.substring(0, 20) + "...",
      );

      const response = await fetch("/api/auth/google/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Token refresh failed:", errorText);
        return false;
      }

      const data = await response.json();
      this.accessToken = data.access_token;

      // Store the new access token
      if (typeof window !== "undefined" && this.accessToken) {
        localStorage.setItem("google_calendar_access_token", this.accessToken);
      }

      console.log("✅ Access token refreshed successfully");
      return true;
    } catch (error) {
      console.error("Failed to refresh access token:", error);
      return false;
    }
  }

  async getCalendars(): Promise<GoogleCalendar[]> {
    try {
      // Always check localStorage for the latest token
      if (typeof window !== "undefined") {
        this.accessToken = localStorage.getItem("google_calendar_access_token");
      }

      if (!this.accessToken) {
        console.warn("No access token found - cannot access user calendars");
        console.log("🔍 Checking localStorage for token...");
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("google_calendar_access_token");
          console.log(
            "🔍 Token in localStorage:",
            token ? "Found" : "Not found",
          );
          if (token) {
            console.log("🔍 Token length:", token.length);
            console.log("🔍 Token preview:", token.substring(0, 20) + "...");
          }
        }
        return [];
      }

      console.log("📋 Fetching calendars with access token...");
      console.log("🔍 Token length:", this.accessToken.length);
      console.log(
        "🔍 Token preview:",
        this.accessToken.substring(0, 20) + "...",
      );

      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/users/me/calendarList",
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("🔍 Full error response:", errorText);

        // If it's a 401 error, try to refresh the token
        if (response.status === 401) {
          console.log("🔄 Access token expired, attempting refresh...");
          const refreshSuccess = await this.refreshAccessToken();
          if (refreshSuccess) {
            // Retry the request with the new token
            const retryResponse = await fetch(
              "https://www.googleapis.com/calendar/v3/users/me/calendarList",
              {
                headers: {
                  Authorization: `Bearer ${this.accessToken}`,
                  "Content-Type": "application/json",
                },
              },
            );

            if (!retryResponse.ok) {
              const retryErrorText = await retryResponse.text();
              throw new Error(
                `HTTP ${retryResponse.status}: ${retryResponse.statusText} - ${retryErrorText}`,
              );
            }

            const data = await retryResponse.json();
            const calendars = data.items || [];

            console.log(
              `📋 Found ${calendars.length} calendars (after refresh)`,
            );

            const mappedCalendars: GoogleCalendar[] = calendars.map(
              (calendar: {
                id: string;
                summary: string;
                backgroundColor?: string;
              }) => ({
                id: calendar.id,
                name: calendar.summary,
                color: this.getColorFromId(calendar.backgroundColor || "1"),
                isSelected: calendar.id === "primary", // Default to primary calendar selected
                email: calendar.id,
              }),
            );

            console.log(
              "📋 Mapped calendars:",
              mappedCalendars.map((c) => ({
                name: c.name,
                selected: c.isSelected,
              })),
            );
            return mappedCalendars;
          } else {
            // Refresh failed, clear tokens and throw error
            this.logout();
            throw new Error(
              "Authentication failed - please reconnect your Google Calendar",
            );
          }
        }

        throw new Error(
          `HTTP ${response.status}: ${response.statusText} - ${errorText}`,
        );
      }

      const data = await response.json();
      const calendars = data.items || [];

      console.log(`📋 Found ${calendars.length} calendars`);

      const mappedCalendars: GoogleCalendar[] = calendars.map(
        (calendar: {
          id: string;
          summary: string;
          backgroundColor?: string;
        }) => ({
          id: calendar.id,
          name: calendar.summary,
          color: this.getColorFromId(calendar.backgroundColor || "1"),
          isSelected: calendar.id === "primary", // Default to primary calendar selected
          email: calendar.id,
        }),
      );

      console.log(
        "📋 Mapped calendars:",
        mappedCalendars.map((c) => ({ name: c.name, selected: c.isSelected })),
      );
      return mappedCalendars;
    } catch (error) {
      console.error("Failed to get calendars:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        hasAccessToken: !!this.accessToken,
      });
      return [];
    }
  }

  async getEvents(
    calendarId: string,
    timeMin: Date,
    timeMax: Date,
  ): Promise<GoogleCalendarEvent[]> {
    try {
      if (!this.accessToken) {
        console.warn("No access token found");
        return [];
      }

      console.log(`📅 Fetching events for calendar: ${calendarId}`);
      console.log(
        `📅 Time range: ${timeMin.toISOString()} to ${timeMax.toISOString()}`,
      );

      const url = new URL(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
          calendarId,
        )}/events`,
      );
      url.searchParams.append("timeMin", timeMin.toISOString());
      url.searchParams.append("timeMax", timeMax.toISOString());
      url.searchParams.append("singleEvents", "true");
      url.searchParams.append("orderBy", "startTime");
      url.searchParams.append("maxResults", "2500");

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("🔍 Full error response:", errorText);

        // If it's a 401 error, try to refresh the token
        if (response.status === 401) {
          console.log("🔄 Access token expired, attempting refresh...");
          const refreshSuccess = await this.refreshAccessToken();
          if (refreshSuccess) {
            // Retry the request with the new token
            const retryResponse = await fetch(url.toString(), {
              headers: {
                Authorization: `Bearer ${this.accessToken}`,
                "Content-Type": "application/json",
              },
            });

            if (!retryResponse.ok) {
              const retryErrorText = await retryResponse.text();
              throw new Error(
                `HTTP ${retryResponse.status}: ${retryResponse.statusText} - ${retryErrorText}`,
              );
            }

            const data = await retryResponse.json();
            const events = data.items || [];

            console.log(`📅 Found ${events.length} events (after refresh)`);

            const mappedEvents = events.map(
              (event: {
                id: string;
                summary?: string;
                start: { dateTime?: string; date?: string };
                end: { dateTime?: string; date?: string };
                description?: string;
                location?: string;
                attendees?: Array<{ email: string }>;
              }) => ({
                id: event.id,
                title: event.summary || "Untitled Event",
                start: new Date(
                  event.start.dateTime || event.start.date || new Date(),
                ),
                end: new Date(
                  event.end.dateTime || event.end.date || new Date(),
                ),
                description: event.description,
                location: event.location,
                attendees: event.attendees?.map((a) => a.email) || [],
                calendarId,
                calendarName: "Primary Calendar", // This could be enhanced to get actual calendar name
                calendarColor: "#4285f4",
              }),
            );

            console.log(`📅 Mapped events:`, mappedEvents.length);
            return mappedEvents;
          } else {
            // Refresh failed, clear tokens and throw error
            this.logout();
            throw new Error(
              "Authentication failed - please reconnect your Google Calendar",
            );
          }
        }

        throw new Error(
          `HTTP ${response.status}: ${response.statusText} - ${errorText}`,
        );
      }

      const data = await response.json();
      const events = data.items || [];

      console.log(`📅 Raw events from API:`, events.length);

      if (events.length === 0) {
        console.log("📅 No events found in the specified time range");
      }

      const mappedEvents = events.map(
        (event: {
          id: string;
          summary?: string;
          start: { dateTime?: string; date?: string };
          end: { dateTime?: string; date?: string };
          description?: string;
          location?: string;
          attendees?: Array<{ email: string }>;
        }) => ({
          id: event.id,
          title: event.summary || "Untitled Event",
          start: new Date(
            event.start.dateTime || event.start.date || new Date(),
          ),
          end: new Date(event.end.dateTime || event.end.date || new Date()),
          description: event.description,
          location: event.location,
          attendees: event.attendees?.map((a) => a.email) || [],
          calendarId,
          calendarName: "Primary Calendar", // This could be enhanced to get actual calendar name
          calendarColor: "#4285f4",
        }),
      );

      console.log(`📅 Mapped events:`, mappedEvents.length);
      if (mappedEvents.length > 0) {
        console.log(
          "📅 Sample events:",
          mappedEvents.slice(0, 3).map((e: GoogleCalendarEvent) => ({
            title: e.title,
            start: e.start.toISOString(),
            end: e.end.toISOString(),
          })),
        );
      }

      return mappedEvents;
    } catch (error) {
      console.error("Failed to get events:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        hasAccessToken: !!this.accessToken,
      });
      return [];
    }
  }

  async getEventsFromMultipleCalendars(
    calendars: GoogleCalendar[],
    timeMin: Date,
    timeMax: Date,
  ): Promise<GoogleCalendarEvent[]> {
    try {
      const selectedCalendars = calendars.filter((cal) => cal.isSelected);

      if (selectedCalendars.length === 0) {
        console.log("📅 No calendars selected");
        return [];
      }

      console.log(
        `📅 Fetching events from ${selectedCalendars.length} calendars`,
      );

      const allEvents: GoogleCalendarEvent[] = [];

      for (const calendar of selectedCalendars) {
        try {
          const events = await this.getEvents(calendar.id, timeMin, timeMax);
          allEvents.push(...events);
        } catch (error) {
          console.error(
            `Failed to get events for calendar ${calendar.name}:`,
            error,
          );
          // Continue with other calendars
        }
      }

      console.log(`📅 Total events loaded: ${allEvents.length}`);
      return allEvents;
    } catch (error) {
      console.error("Failed to get events from multiple calendars:", error);
      return [];
    }
  }

  private getColorFromId(colorId: string): string {
    const colors: { [key: string]: string } = {
      "1": "#4285f4", // Blue
      "2": "#ea4335", // Red
      "3": "#fbbc04", // Yellow
      "4": "#34a853", // Green
      "5": "#ff6d01", // Orange
      "6": "#46bdc6", // Teal
      "7": "#7b1fa2", // Purple
      "8": "#e67c73", // Pink
      "9": "#d50000", // Dark Red
      "10": "#e65100", // Dark Orange
      "11": "#f57f17", // Amber
      "12": "#f9a825", // Orange
      "13": "#c0ca33", // Lime
      "14": "#7cb342", // Light Green
      "15": "#2e7d32", // Green
      "16": "#388e3c", // Dark Green
      "17": "#00695c", // Teal
      "18": "#006064", // Cyan
      "19": "#0277bd", // Blue
      "20": "#1565c0", // Dark Blue
      "21": "#283593", // Indigo
      "22": "#303f9f", // Dark Indigo
      "23": "#512da8", // Purple
      "24": "#6a1b9a", // Dark Purple
    };

    return colors[colorId] || "#4285f4"; // Default to blue
  }

  logout(): void {
    this.accessToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("google_calendar_access_token");
      localStorage.removeItem("google_calendar_refresh_token");
    }
    console.log("🔓 Logged out of Google Calendar");
  }
}

// Export singleton instance
export const simpleGoogleCalendarService = new SimpleGoogleCalendarService();
