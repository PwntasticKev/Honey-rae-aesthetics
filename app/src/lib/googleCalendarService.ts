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
        return;
      }

      // Load Google API client
      await this.loadGoogleAPI();
      await this.loadGoogleIdentityServices();

      this.gapiInited = true;
      this.gisInited = true;
    } catch (error) {
      console.error("Failed to initialize Google Calendar service:", error);
    }
  }

  private async loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Check if gapi is already loaded
        if ((window as any).gapi) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = "https://apis.google.com/js/api.js";
        script.onload = () => {
          try {
            (window as any).gapi.load("client", async () => {
              try {
                await (window as any).gapi.client.init({
                  apiKey: this.apiKey,
                  discoveryDocs: this.discoveryDocs,
                });
                resolve();
              } catch (error) {
                console.warn("Google API initialization failed:", error);
                resolve(); // Resolve anyway to prevent blocking
              }
            });
          } catch (error) {
            console.warn("Google API load failed:", error);
            resolve(); // Resolve anyway to prevent blocking
          }
        };
        script.onerror = () => {
          console.warn("Google API script failed to load");
          resolve(); // Resolve anyway to prevent blocking
        };
        document.head.appendChild(script);
      } catch (error) {
        console.warn("Failed to create Google API script:", error);
        resolve(); // Resolve anyway to prevent blocking
      }
    });
  }

  private async loadGoogleIdentityServices(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Check if gis is already loaded
        if ((window as any).google?.accounts?.oauth2) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.onload = () => {
          try {
            this.tokenClient = (
              window as any
            ).google.accounts.oauth2.initTokenClient({
              client_id: this.clientId,
              scope: this.scopes,
              callback: this.onTokenReceived.bind(this),
            });
            resolve();
          } catch (error) {
            console.warn(
              "Google Identity Services initialization failed:",
              error,
            );
            resolve(); // Resolve anyway to prevent blocking
          }
        };
        script.onerror = () => {
          console.warn("Google Identity Services script failed to load");
          resolve(); // Resolve anyway to prevent blocking
        };
        document.head.appendChild(script);
      } catch (error) {
        console.warn(
          "Failed to create Google Identity Services script:",
          error,
        );
        resolve(); // Resolve anyway to prevent blocking
      }
    });
  }

  private onTokenReceived(accessToken: string): void {
    // Store the access token for API calls
    (window as any).gapi.client.setToken({ access_token: accessToken });
  }

  async authenticate(): Promise<boolean> {
    try {
      if (!this.clientId || !this.apiKey) {
        console.error("Google API keys not configured");
        return false;
      }

      if (!this.gapiInited || !this.gisInited) {
        console.error("Google APIs not initialized");
        return false;
      }

      if (!this.tokenClient) {
        console.error("Token client not initialized");
        return false;
      }

      return new Promise((resolve) => {
        try {
          this.tokenClient.requestAccessToken();
          resolve(true);
        } catch (error) {
          console.error("Authentication failed:", error);
          resolve(false);
        }
      });
    } catch (error) {
      console.error("Authentication error:", error);
      return false;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      if (!this.gapiInited) {
        return false;
      }

      const token = (window as any).gapi.client.getToken();
      return !!token?.access_token;
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

      const response = await (
        window as any
      ).gapi.client.calendar.calendarList.list();
      const calendars = response.result.items || [];

      return calendars.map((calendar: any) => ({
        id: calendar.id,
        name: calendar.summary,
        color: this.getColorFromId(calendar.backgroundColor),
        isSelected: true,
        email: calendar.id,
      }));
    } catch (error) {
      console.error("Failed to get calendars:", error);
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

      const response = await (window as any).gapi.client.calendar.events.list({
        calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      });

      const events = response.result.items || [];

      return events.map((event: any) => ({
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
    } catch (error) {
      console.error("Failed to get events:", error);
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
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
export type { GoogleCalendarEvent, GoogleCalendar };
