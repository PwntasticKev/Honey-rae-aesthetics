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
        // Check if google.accounts is already loaded
        if ((window as any).google?.accounts) {
          try {
            this.tokenClient = (
              window as any
            ).google.accounts.oauth2.initTokenClient({
              client_id: this.clientId,
              scope: this.scopes,
              callback: (tokenResponse: any) => {
                if (tokenResponse && tokenResponse.access_token) {
                  localStorage.setItem(
                    "google_calendar_token",
                    tokenResponse.access_token,
                  );
                  this.onTokenReceived(tokenResponse.access_token);
                }
              },
            });
            console.log(
              "Token client initialized from existing google.accounts",
            );
            resolve();
            return;
          } catch (error) {
            console.warn(
              "Failed to initialize token client from existing google.accounts:",
              error,
            );
          }
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
              callback: (tokenResponse: any) => {
                if (tokenResponse && tokenResponse.access_token) {
                  localStorage.setItem(
                    "google_calendar_token",
                    tokenResponse.access_token,
                  );
                  this.onTokenReceived(tokenResponse.access_token);
                }
              },
            });
            console.log("Token client initialized from loaded script");
            resolve();
          } catch (error) {
            console.warn(
              "Failed to initialize token client from loaded script:",
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
    // Set the access token for API calls
    if ((window as any).gapi?.client) {
      (window as any).gapi.client.setToken({ access_token: accessToken });
    }
  }

  async authenticate(): Promise<boolean> {
    if (!this.gapiInited || !this.gisInited) {
      await this.initialize();
    }

    // Wait a bit for initialization to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    return new Promise((resolve) => {
      if (this.tokenClient) {
        this.tokenClient.requestAccessToken({ prompt: "consent" });
        resolve(true);
      } else {
        console.error("Token client not initialized");
        // Try to initialize the token client again
        try {
          if ((window as any).google?.accounts) {
            this.tokenClient = (
              window as any
            ).google.accounts.oauth2.initTokenClient({
              client_id: this.clientId,
              scope: this.scopes,
              callback: (tokenResponse: any) => {
                if (tokenResponse && tokenResponse.access_token) {
                  localStorage.setItem(
                    "google_calendar_token",
                    tokenResponse.access_token,
                  );
                  this.onTokenReceived(tokenResponse.access_token);
                }
              },
            });
            this.tokenClient.requestAccessToken({ prompt: "consent" });
            resolve(true);
          } else {
            console.error("Google accounts not available");
            resolve(false);
          }
        } catch (error) {
          console.error("Failed to initialize token client:", error);
          resolve(false);
        }
      }
    });
  }

  async isAuthenticated(): Promise<boolean> {
    const token = localStorage.getItem("google_calendar_token");
    if (!token) return false;

    try {
      // Verify token is still valid by making a test API call
      if ((window as any).gapi?.client) {
        const response = await (
          window as any
        ).gapi.client.calendar.calendarList.list();
        return true;
      }
      return false;
    } catch (error) {
      // Token is invalid, remove it
      localStorage.removeItem("google_calendar_token");
      return false;
    }
  }

  async getCalendars(): Promise<GoogleCalendar[]> {
    try {
      if (!(window as any).gapi?.client) {
        throw new Error("Google API not initialized");
      }

      const response = await (
        window as any
      ).gapi.client.calendar.calendarList.list();
      const calendars = response.result.items || [];

      return calendars.map((calendar: any) => ({
        id: calendar.id,
        name: calendar.summary,
        color: calendar.backgroundColor || "#4285f4",
        isSelected: true,
        email: calendar.id,
      }));
    } catch (error) {
      console.error("Failed to fetch calendars:", error);
      return [];
    }
  }

  async getEvents(
    calendarId: string,
    timeMin: Date,
    timeMax: Date,
  ): Promise<GoogleCalendarEvent[]> {
    try {
      if (!(window as any).gapi?.client) {
        throw new Error("Google API not initialized");
      }

      const response = await (window as any).gapi.client.calendar.events.list({
        calendarId: calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      });

      const events = response.result.items || [];

      return events.map((event: any) => ({
        id: event.id,
        title: event.summary || "No Title",
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date),
        description: event.description,
        location: event.location,
        attendees:
          event.attendees?.map((attendee: any) => attendee.email) || [],
        calendarId: calendarId,
        calendarName: event.organizer?.displayName || calendarId,
        calendarColor: event.colorId
          ? this.getColorFromId(event.colorId)
          : "#4285f4",
      }));
    } catch (error) {
      console.error("Failed to fetch events:", error);
      return [];
    }
  }

  private getColorFromId(colorId: string): string {
    const colors: { [key: string]: string } = {
      "1": "#a4bdfc",
      "2": "#7ae7bf",
      "3": "#dbadff",
      "4": "#ff887c",
      "5": "#fbd75b",
      "6": "#ffb878",
      "7": "#46d6db",
      "8": "#e1e1e1",
      "9": "#5484ed",
      "10": "#51b749",
      "11": "#dc2127",
    };
    return colors[colorId] || "#4285f4";
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
      if (!(window as any).gapi?.client) {
        throw new Error("Google API not initialized");
      }

      const response = await (window as any).gapi.client.calendar.events.insert(
        {
          calendarId: calendarId,
          resource: {
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
            attendees: event.attendees?.map((email) => ({ email })),
          },
        },
      );

      const createdEvent = response.result;
      return {
        id: createdEvent.id,
        title: createdEvent.summary || "No Title",
        start: new Date(createdEvent.start.dateTime || createdEvent.start.date),
        end: new Date(createdEvent.end.dateTime || createdEvent.end.date),
        description: createdEvent.description,
        location: createdEvent.location,
        attendees:
          createdEvent.attendees?.map((attendee: any) => attendee.email) || [],
        calendarId: calendarId,
        calendarName: createdEvent.organizer?.displayName || calendarId,
        calendarColor: createdEvent.colorId
          ? this.getColorFromId(createdEvent.colorId)
          : "#4285f4",
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
      if (!(window as any).gapi?.client) {
        throw new Error("Google API not initialized");
      }

      const response = await (window as any).gapi.client.calendar.events.patch({
        calendarId: calendarId,
        eventId: eventId,
        resource: {
          summary: updates.title,
          description: updates.description,
          location: updates.location,
          start: updates.start
            ? {
                dateTime: updates.start.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              }
            : undefined,
          end: updates.end
            ? {
                dateTime: updates.end.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              }
            : undefined,
          attendees: updates.attendees?.map((email) => ({ email })),
        },
      });

      const updatedEvent = response.result;
      return {
        id: updatedEvent.id,
        title: updatedEvent.summary || "No Title",
        start: new Date(updatedEvent.start.dateTime || updatedEvent.start.date),
        end: new Date(updatedEvent.end.dateTime || updatedEvent.end.date),
        description: updatedEvent.description,
        location: updatedEvent.location,
        attendees:
          updatedEvent.attendees?.map((attendee: any) => attendee.email) || [],
        calendarId: calendarId,
        calendarName: updatedEvent.organizer?.displayName || calendarId,
        calendarColor: updatedEvent.colorId
          ? this.getColorFromId(updatedEvent.colorId)
          : "#4285f4",
      };
    } catch (error) {
      console.error("Failed to update event:", error);
      return null;
    }
  }

  async deleteEvent(calendarId: string, eventId: string): Promise<boolean> {
    try {
      if (!(window as any).gapi?.client) {
        throw new Error("Google API not initialized");
      }

      await (window as any).gapi.client.calendar.events.delete({
        calendarId: calendarId,
        eventId: eventId,
      });
      return true;
    } catch (error) {
      console.error("Failed to delete event:", error);
      return false;
    }
  }

  logout(): void {
    localStorage.removeItem("google_calendar_token");
    if ((window as any).google?.accounts?.oauth2) {
      (window as any).google.accounts.oauth2.revoke(
        localStorage.getItem("google_calendar_token"),
        () => {
          console.log("Logged out successfully");
        },
      );
    }
  }
}

// Export singleton instance
export const googleCalendarService = new GoogleCalendarService();
export type { GoogleCalendarEvent, GoogleCalendar };
