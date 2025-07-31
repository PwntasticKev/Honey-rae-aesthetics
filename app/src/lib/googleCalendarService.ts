// Google Calendar API integration service
// This service handles OAuth authentication and calendar operations

interface GoogleCalendarEvent {
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

interface GoogleCalendar {
  id: string;
  name: string;
  color: string;
  isSelected: boolean;
  email?: string;
}

class GoogleCalendarService {
  private clientId: string;
  private apiKey: string;
  private discoveryDocs: string[];
  private scopes: string;
  private tokenClient: any;
  private gapiInited: boolean = false;
  private gisInited: boolean = false;
  private accessToken: string | null = null;

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";
    this.discoveryDocs = [
      "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
    ];
    this.scopes =
      "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events";
  }

  async initialize(): Promise<void> {
    try {
      // Check if API keys are configured
      if (!this.clientId || !this.apiKey) {
        console.warn(
          "Google API keys not configured. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID and NEXT_PUBLIC_GOOGLE_API_KEY to your .env.local file",
        );
        console.warn("Client ID:", this.clientId ? "Set" : "Missing");
        console.warn("API Key:", this.apiKey ? "Set" : "Missing");
        return;
      }

      console.log("🔧 Initializing Google Calendar service...");
      console.log("📋 Client ID configured:", !!this.clientId);
      console.log("📋 API Key configured:", !!this.apiKey);
      console.log("📋 Client ID length:", this.clientId.length);
      console.log("📋 API Key length:", this.apiKey.length);

      // Load Google API client
      await this.loadGoogleAPI();
      await this.loadGoogleIdentityServices();

      // Set initialization flags
      this.gapiInited = true;
      this.gisInited = true;

      console.log("✅ Google Calendar service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Google Calendar service:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        clientId: this.clientId ? "Set" : "Missing",
        apiKey: this.apiKey ? "Set" : "Missing",
      });
      // Don't throw error, just log it
    }
  }

  private async loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log("🔄 Loading Google API...");
        console.log("📋 API Key configured:", !!this.apiKey);
        console.log("📋 API Key length:", this.apiKey?.length || 0);
        console.log("📋 Discovery Docs:", this.discoveryDocs);

        // Check if gapi is already loaded
        if ((window as any).gapi) {
          console.log("✅ Google API already loaded");
          resolve();
          return;
        }

        // Add timeout for script loading
        const timeout = setTimeout(() => {
          console.error("❌ Google API script loading timeout");
          reject(new Error("Google API script loading timeout"));
        }, 10000);

        const script = document.createElement("script");
        script.src = "https://apis.google.com/js/api.js";
        script.async = true;
        script.defer = true;

        script.onload = () => {
          clearTimeout(timeout);
          console.log("✅ Google API script loaded");

          // Add a small delay to ensure gapi is available
          setTimeout(() => {
            try {
              // Check if gapi is available after script load
              if (!(window as any).gapi) {
                console.error("❌ gapi not available after script load");
                reject(new Error("Google API not available after script load"));
                return;
              }

              console.log("✅ gapi object available");
              console.log(
                "📋 gapi methods:",
                Object.keys((window as any).gapi || {}),
              );

              (window as any).gapi.load("client", async () => {
                console.log("✅ Google API client loaded");
                try {
                  console.log("🔄 Initializing Google API client...");
                  console.log(
                    "📋 Using API Key:",
                    this.apiKey.substring(0, 10) + "...",
                  );
                  console.log("📋 Discovery Docs:", this.discoveryDocs);

                  // Test the API key first
                  if (!this.apiKey || this.apiKey.length < 10) {
                    throw new Error("Invalid API key - too short or missing");
                  }

                  const initResult = await (window as any).gapi.client.init({
                    apiKey: this.apiKey,
                    discoveryDocs: this.discoveryDocs,
                  });

                  console.log("✅ Google API client initialized");
                  console.log("📋 Init result:", initResult);

                  // Check if calendar API is available
                  if ((window as any).gapi?.client?.calendar) {
                    console.log("✅ Calendar API is available");
                  } else {
                    console.warn("⚠️ Calendar API not available");
                    console.log(
                      "📋 Available APIs:",
                      Object.keys((window as any).gapi?.client || {}),
                    );
                  }

                  resolve();
                } catch (error) {
                  console.error(
                    "Failed to initialize Google API client:",
                    error,
                  );
                  console.error("Error details:", {
                    message:
                      error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                    apiKey: this.apiKey ? "Set" : "Missing",
                    apiKeyLength: this.apiKey?.length || 0,
                    discoveryDocs: this.discoveryDocs,
                  });
                  reject(error);
                }
              });
            } catch (error) {
              console.error("Failed to load Google API client:", error);
              console.error("Error details:", {
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
              });
              reject(error);
            }
          }, 100);
        };

        script.onerror = (error) => {
          clearTimeout(timeout);
          console.error("Failed to load Google API script:", error);
          reject(new Error("Failed to load Google API script"));
        };

        document.head.appendChild(script);
      } catch (error) {
        console.error("Failed to load Google API:", error);
        reject(error);
      }
    });
  }

  private async loadGoogleIdentityServices(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log("🔄 Loading Google Identity Services...");

        // Check if gis is already loaded
        if ((window as any).google?.accounts?.oauth2) {
          console.log("✅ Google Identity Services already loaded");
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.onload = () => {
          console.log("✅ Google Identity Services script loaded");
          resolve();
        };
        script.onerror = () => {
          console.error("Failed to load Google Identity Services script");
          reject(new Error("Failed to load Google Identity Services script"));
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error("Failed to load Google Identity Services:", error);
        reject(error);
      }
    });
  }

  private onTokenReceived(accessToken: string): void {
    console.log("✅ Access token received");
    this.accessToken = accessToken;
    localStorage.setItem("google_calendar_access_token", accessToken);
  }

  async authenticate(): Promise<boolean> {
    try {
      console.log("🔐 Starting Google authentication...");

      if (!this.gisInited) {
        console.warn("Google Identity Services not initialized");
        return false;
      }

      if (!this.clientId) {
        console.error("Google Client ID not configured");
        return false;
      }

      // Create token client
      this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient(
        {
          client_id: this.clientId,
          scope: this.scopes,
          callback: (response: any) => {
            if (response.error) {
              console.error("Authentication error:", response.error);
              return;
            }
            this.onTokenReceived(response.access_token);
          },
        },
      );

      // Request access token
      this.tokenClient.requestAccessToken();

      // Wait for token (with timeout)
      return new Promise((resolve) => {
        const checkToken = () => {
          if (this.accessToken) {
            console.log("✅ Authentication successful");
            // Set the token in the API client for future requests
            (window as any).gapi.client.setToken({
              access_token: this.accessToken,
            });
            resolve(true);
          } else {
            setTimeout(checkToken, 100);
          }
        };
        checkToken();

        // Timeout after 10 seconds
        setTimeout(() => {
          console.warn("Authentication timeout");
          resolve(false);
        }, 10000);
      });
    } catch (error) {
      console.error("Authentication failed:", error);
      return false;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      // Check if we have a stored token
      const storedToken = localStorage.getItem("google_calendar_access_token");
      if (storedToken) {
        this.accessToken = storedToken;
        console.log("✅ Found stored access token");
        // Set the token in the API client for future requests
        if ((window as any).gapi?.client) {
          (window as any).gapi.client.setToken({ access_token: storedToken });
        }
        return true;
      }

      console.log("❌ No stored access token found");
      return false;
    } catch (error) {
      console.error("Failed to check authentication status:", error);
      return false;
    }
  }

  async getCalendars(): Promise<GoogleCalendar[]> {
    try {
      if (!this.gapiInited) {
        console.warn("Google API not initialized");
        return [];
      }

      // Check if we have an OAuth token
      const oauthToken = localStorage.getItem("google_calendar_access_token");
      if (!oauthToken) {
        console.warn("No OAuth token found - cannot access user calendars");
        return [];
      }

      console.log("📋 Fetching calendars with OAuth token...");

      const response = await (
        window as any
      ).gapi.client.calendar.calendarList.list();
      const calendars = response.result.items || [];

      console.log(`📋 Found ${calendars.length} calendars`);

      const mappedCalendars: GoogleCalendar[] = calendars.map(
        (calendar: any) => ({
          id: calendar.id,
          name: calendar.summary,
          color: this.getColorFromId(calendar.backgroundColor),
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
        hasOAuthToken: !!localStorage.getItem("google_calendar_access_token"),
        gapiInited: this.gapiInited,
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
      if (!this.gapiInited) {
        console.warn("Google API not initialized");
        return [];
      }

      console.log(`📅 Fetching events for calendar: ${calendarId}`);
      console.log(
        `📅 Time range: ${timeMin.toISOString()} to ${timeMax.toISOString()}`,
      );

      const response = await (window as any).gapi.client.calendar.events.list({
        calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 2500, // Increase max results
      });

      const events = response.result.items || [];
      console.log(`📅 Raw events from API:`, events.length);

      if (events.length === 0) {
        console.log("📅 No events found in the specified time range");
      }

      const mappedEvents = events.map((event: any) => ({
        id: event.id,
        title: event.summary || "Untitled Event",
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date),
        description: event.description,
        location: event.location,
        attendees: event.attendees?.map((a: any) => a.email) || [],
        calendarId,
        calendarName: "Primary Calendar", // This could be enhanced to get actual calendar name
        calendarColor: "#4285f4",
      }));

      console.log(`📅 Mapped events:`, mappedEvents.length);
      if (mappedEvents.length > 0) {
        console.log(
          "📅 Sample events:",
          mappedEvents.slice(0, 3).map((e: GoogleCalendarEvent) => ({
            title: e.title,
            start: e.start,
          })),
        );
      }
      return mappedEvents;
    } catch (error) {
      console.error("Failed to get events:", error);
      console.error("Error details:", {
        calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        error: error instanceof Error ? error.message : String(error),
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
      if (!this.gapiInited) {
        console.warn("Google API not initialized");
        return [];
      }

      const selectedCalendars = calendars.filter((cal) => cal.isSelected);
      console.log(
        `📅 Fetching events from ${selectedCalendars.length} selected calendars`,
      );

      if (selectedCalendars.length === 0) {
        console.warn("⚠️ No calendars selected for event fetching");
        return [];
      }

      const allEvents: GoogleCalendarEvent[] = [];

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
            calendarColor: calendar.color,
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

  private getColorFromId(colorId: string): string {
    const colorMap: { [key: string]: string } = {
      "1": "#7986cb", // Lavender
      "2": "#33b679", // Sage
      "3": "#8f6b29", // Grape
      "4": "#f6c02d", // Flamingo
      "5": "#f28b82", // Banana
      "6": "#fbb04e", // Tangerine
      "7": "#fdd663", // Peacock
      "8": "#7ffcb2", // Graphite
      "9": "#a8c5a8", // Blueberry
      "10": "#ff887c", // Basil
      "11": "#46d6db", // Tomato
      "12": "#fae053", // Avocado
      "13": "#f2a600", // Cantaloupe
      "14": "#dc2127", // Asparagus
      "15": "#db4437", // Narcissus
      "16": "#4285f4", // Bell Pepper
      "17": "#0f9d58", // Honeydew
      "18": "#ff6d01", // Maroon
      "19": "#c53929", // Eggplant
      "20": "#f4b400", // Artichoke
      "21": "#7b1fa2", // Cherry Blossom
      "22": "#6a1b9a", // Sage
      "23": "#e67c73", // Peacock
      "24": "#d81b60", // Blueberry
    };

    return colorMap[colorId] || "#4285f4";
  }

  async createEvent(
    calendarId: string,
    event: {
      title: string;
      start: Date;
      end: Date;
      description?: string;
      location?: string;
      attendees?: string[];
    },
  ): Promise<GoogleCalendarEvent | null> {
    try {
      if (!this.gapiInited) {
        console.warn("Google API not initialized");
        return null;
      }

      const eventData = {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.start.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: event.end.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        attendees: event.attendees?.map((email) => ({ email })) || [],
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 },
            { method: "popup", minutes: 10 },
          ],
        },
      };

      const response = await (window as any).gapi.client.calendar.events.insert(
        {
          calendarId,
          resource: eventData,
        },
      );

      const createdEvent = response.result;
      return {
        id: createdEvent.id,
        title: createdEvent.summary,
        start: new Date(createdEvent.start.dateTime || createdEvent.start.date),
        end: new Date(createdEvent.end.dateTime || createdEvent.end.date),
        description: createdEvent.description,
        location: createdEvent.location,
        attendees: createdEvent.attendees?.map((a: any) => a.email) || [],
        calendarId,
        calendarName: "Primary Calendar",
        calendarColor: "#4285f4",
      };
    } catch (error) {
      console.error("Failed to create event:", error);
      return null;
    }
  }

  async updateEvent(
    calendarId: string,
    eventId: string,
    updates: {
      title?: string;
      start?: Date;
      end?: Date;
      description?: string;
      location?: string;
      attendees?: string[];
    },
  ): Promise<GoogleCalendarEvent | null> {
    try {
      if (!this.gapiInited) {
        console.warn("Google API not initialized");
        return null;
      }

      const eventData: any = {};
      if (updates.title) eventData.summary = updates.title;
      if (updates.description) eventData.description = updates.description;
      if (updates.location) eventData.location = updates.location;
      if (updates.start) {
        eventData.start = {
          dateTime: updates.start.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      }
      if (updates.end) {
        eventData.end = {
          dateTime: updates.end.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      }
      if (updates.attendees) {
        eventData.attendees = updates.attendees.map((email) => ({ email }));
      }

      const response = await (window as any).gapi.client.calendar.events.update(
        {
          calendarId,
          eventId,
          resource: eventData,
        },
      );

      const updatedEvent = response.result;
      return {
        id: updatedEvent.id,
        title: updatedEvent.summary,
        start: new Date(updatedEvent.start.dateTime || updatedEvent.start.date),
        end: new Date(updatedEvent.end.dateTime || updatedEvent.end.date),
        description: updatedEvent.description,
        location: updatedEvent.location,
        attendees: updatedEvent.attendees?.map((a: any) => a.email) || [],
        calendarId,
        calendarName: "Primary Calendar",
        calendarColor: "#4285f4",
      };
    } catch (error) {
      console.error("Failed to update event:", error);
      return null;
    }
  }

  async deleteEvent(calendarId: string, eventId: string): Promise<boolean> {
    try {
      if (!this.gapiInited) {
        console.warn("Google API not initialized");
        return false;
      }

      await (window as any).gapi.client.calendar.events.delete({
        calendarId,
        eventId,
      });

      return true;
    } catch (error) {
      console.error("Failed to delete event:", error);
      return false;
    }
  }

  logout(): void {
    try {
      const token = (window as any).gapi.client.getToken();
      if (token) {
        (window as any).google.accounts.oauth2.revoke(token.access_token);
        (window as any).gapi.client.setToken("");
      }

      // Clear stored tokens
      localStorage.removeItem("google_calendar_access_token");
      localStorage.removeItem("google_calendar_token_timestamp");

      console.log("✅ Google Calendar logged out");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
export type { GoogleCalendarEvent, GoogleCalendar };
