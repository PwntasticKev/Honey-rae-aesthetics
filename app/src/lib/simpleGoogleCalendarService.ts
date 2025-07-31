// Simple Google Calendar service using direct fetch calls
// This is an alternative to the Google API client library

interface SimpleGoogleCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  calendarId: string;
  calendarName: string;
}

interface SimpleGoogleCalendar {
  id: string;
  name: string;
  color: string;
  isSelected: boolean;
}

class SimpleGoogleCalendarService {
  private apiKey: string;
  private accessToken: string | null = null;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";
  }

  async initialize(): Promise<void> {
    console.log("🔧 Initializing Simple Google Calendar service...");
    console.log("📋 API Key configured:", !!this.apiKey);
    console.log("📋 API Key length:", this.apiKey?.length || 0);
  }

  async authenticate(): Promise<boolean> {
    try {
      console.log("🔐 Starting simple authentication...");

      // Check for OAuth token
      const oauthToken = localStorage.getItem("google_calendar_access_token");
      if (oauthToken) {
        console.log("✅ OAuth token found - authentication successful");
        return true;
      } else {
        console.log("⚠️ No OAuth token found - authentication required");
        return false;
      }
    } catch (error) {
      console.error("Authentication failed:", error);
      return false;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    // Check for OAuth token
    const oauthToken = localStorage.getItem("google_calendar_access_token");
    return !!oauthToken;
  }

  async getCalendars(): Promise<SimpleGoogleCalendar[]> {
    try {
      // Check for OAuth token first
      const oauthToken = localStorage.getItem("google_calendar_access_token");
      if (!oauthToken) {
        console.warn("No OAuth token found - cannot access user calendars");
        return [];
      }

      console.log("📋 Fetching calendars with OAuth token...");

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/users/me/calendarList`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${oauthToken}`,
          },
        },
      );

      console.log("📋 Calendar API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("📋 Calendar API error:", errorText);
        throw new Error(
          `Calendar API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      const calendars = data.items || [];

      console.log(`📋 Found ${calendars.length} calendars`);

      const mappedCalendars: SimpleGoogleCalendar[] = calendars.map(
        (calendar: any) => ({
          id: calendar.id,
          name: calendar.summary,
          color: calendar.backgroundColor || "#4285f4",
          isSelected: calendar.id === "primary",
        }),
      );

      return mappedCalendars;
    } catch (error) {
      console.error("Failed to get calendars:", error);
      return [];
    }
  }

  async getEvents(
    calendarId: string,
    timeMin: Date,
    timeMax: Date,
  ): Promise<SimpleGoogleCalendarEvent[]> {
    try {
      // Check for OAuth token first
      const oauthToken = localStorage.getItem("google_calendar_access_token");
      if (!oauthToken) {
        console.warn(
          "No OAuth token found - cannot access user calendar events",
        );
        return [];
      }

      console.log(`📅 Fetching events for calendar: ${calendarId}`);
      console.log(
        `📅 Time range: ${timeMin.toISOString()} to ${timeMax.toISOString()}`,
      );

      const url = new URL(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      );
      url.searchParams.set("timeMin", timeMin.toISOString());
      url.searchParams.set("timeMax", timeMax.toISOString());
      url.searchParams.set("singleEvents", "true");
      url.searchParams.set("orderBy", "startTime");
      url.searchParams.set("maxResults", "2500");

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${oauthToken}`,
        },
      });

      console.log("📅 Events API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("📅 Events API error:", errorText);
        throw new Error(
          `Events API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      const events = data.items || [];

      console.log(`📅 Found ${events.length} events`);

      const mappedEvents = events.map((event: any) => ({
        id: event.id,
        title: event.summary || "Untitled Event",
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date),
        description: event.description,
        location: event.location,
        calendarId,
        calendarName: "Calendar", // We could get this from the calendar list
      }));

      return mappedEvents;
    } catch (error) {
      console.error("Failed to get events:", error);
      return [];
    }
  }

  async getEventsFromMultipleCalendars(
    calendars: SimpleGoogleCalendar[],
    timeMin: Date,
    timeMax: Date,
  ): Promise<SimpleGoogleCalendarEvent[]> {
    try {
      const selectedCalendars = calendars.filter((cal) => cal.isSelected);
      console.log(
        `📅 Fetching events from ${selectedCalendars.length} selected calendars`,
      );

      if (selectedCalendars.length === 0) {
        console.warn("⚠️ No calendars selected for event fetching");
        return [];
      }

      const allEvents: SimpleGoogleCalendarEvent[] = [];

      for (const calendar of selectedCalendars) {
        try {
          console.log(
            `📅 Fetching from calendar: ${calendar.name} (${calendar.id})`,
          );
          const events = await this.getEvents(calendar.id, timeMin, timeMax);

          // Add calendar info to each event
          const eventsWithCalendarInfo = events.map((event) => ({
            ...event,
            calendarName: calendar.name,
          }));

          allEvents.push(...eventsWithCalendarInfo);
          console.log(`📅 Added ${events.length} events from ${calendar.name}`);
        } catch (error) {
          console.error(
            `Failed to get events from calendar ${calendar.name}:`,
            error,
          );
        }
      }

      // Sort events by start time
      const sortedEvents = allEvents.sort(
        (a, b) => a.start.getTime() - b.start.getTime(),
      );
      console.log(`📅 Total events loaded: ${sortedEvents.length}`);
      return sortedEvents;
    } catch (error) {
      console.error("Failed to get events from multiple calendars:", error);
      return [];
    }
  }

  logout(): void {
    this.accessToken = null;
    console.log("✅ Logged out from Simple Google Calendar service");
  }
}

export const simpleGoogleCalendarService = new SimpleGoogleCalendarService();
