// Google Calendar API service layer
import { db } from "@/lib/db";
import { calendarConnections, calendarSyncLog } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Google APIs imports - these will be available once googleapis is installed
// import { google } from 'googleapis';
// import { OAuth2Client } from 'google-auth-library';

// Types for Google Calendar integration
export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email?: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  location?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  created: string;
  updated: string;
  htmlLink: string;
  hangoutLink?: string;
  conferenceData?: any;
  recurrence?: string[];
  recurringEventId?: string;
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  timeZone: string;
  primary?: boolean;
  accessRole: string;
}

export interface CalendarListResponse {
  calendars: GoogleCalendar[];
  nextPageToken?: string;
}

export interface EventListResponse {
  events: GoogleCalendarEvent[];
  nextPageToken?: string;
  nextSyncToken?: string;
}

// Google Calendar API client wrapper
export class GoogleCalendarService {
  private calendar: any; // Google Calendar API client
  private auth: any; // Google Auth client

  constructor() {
    // Will initialize Google Calendar API client once googleapis is installed
    this.initializeClient();
  }

  private initializeClient() {
    try {
      // TODO: Uncomment once googleapis is installed
      // const { google } = require('googleapis');
      // this.auth = new google.auth.OAuth2(
      //   process.env.GOOGLE_CLIENT_ID,
      //   process.env.GOOGLE_CLIENT_SECRET,
      //   process.env.GOOGLE_REDIRECT_URI
      // );
      // this.calendar = google.calendar({ version: 'v3', auth: this.auth });
      
      console.log('GoogleCalendarService initialized - ready for googleapis integration');
    } catch (error) {
      console.warn('GoogleCalendarService: googleapis not available, using mock mode');
    }
  }

  // Initialize OAuth2 client with stored tokens
  async initializeAuth(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        throw new Error('Google Calendar service should only be used on the server side');
      }

      // TODO: Uncomment once googleapis is installed
      // const { google } = require('googleapis');
      // 
      // if (!this.auth) {
      //   this.auth = new google.auth.OAuth2(
      //     process.env.GOOGLE_CLIENT_ID,
      //     process.env.GOOGLE_CLIENT_SECRET,
      //     process.env.GOOGLE_REDIRECT_URI
      //   );
      // }
      // 
      // this.auth.setCredentials({
      //   access_token: accessToken,
      //   refresh_token: refreshToken,
      // });
      // 
      // // Test the credentials by making a simple API call
      // try {
      //   const oauth2 = google.oauth2({ version: 'v2', auth: this.auth });
      //   await oauth2.userinfo.get();
      // } catch (authError) {
      //   console.error('Invalid credentials:', authError);
      //   throw new Error('Invalid or expired credentials');
      // }
      // 
      // this.calendar = google.calendar({ version: 'v3', auth: this.auth });

      console.log('Google Calendar auth initialized (mock mode)');
    } catch (error) {
      console.error('Error initializing Google Calendar auth:', error);
      throw new Error('Failed to initialize Google Calendar authentication');
    }
  }

  // Get list of user's calendars
  async getCalendarList(): Promise<CalendarListResponse> {
    try {
      // TODO: Uncomment once googleapis is installed
      // if (!this.calendar) {
      //   throw new Error('Google Calendar client not initialized');
      // }
      // 
      // const response = await this.calendar.calendarList.list({
      //   maxResults: 250,
      // });
      // 
      // const calendars = response.data.items?.map((cal: any) => ({
      //   id: cal.id,
      //   summary: cal.summary,
      //   description: cal.description,
      //   timeZone: cal.timeZone,
      //   primary: cal.primary,
      //   accessRole: cal.accessRole,
      // })) || [];
      // 
      // return {
      //   calendars,
      //   nextPageToken: response.data.nextPageToken,
      // };

      // Mock data for development
      return {
        calendars: [
          {
            id: 'primary',
            summary: 'Primary Calendar',
            timeZone: 'America/Denver',
            primary: true,
            accessRole: 'owner',
          },
          {
            id: 'business@honeyrae.com',
            summary: 'Business Calendar',
            timeZone: 'America/Denver',
            accessRole: 'owner',
          },
        ],
      };
    } catch (error) {
      console.error('Error fetching calendar list:', error);
      throw new Error('Failed to fetch calendar list');
    }
  }

  // Get events from a specific calendar
  async getCalendarEvents(
    calendarId: string,
    options: {
      timeMin?: Date;
      timeMax?: Date;
      maxResults?: number;
      singleEvents?: boolean;
      orderBy?: 'startTime' | 'updated';
      syncToken?: string;
    } = {}
  ): Promise<EventListResponse> {
    try {
      const {
        timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days ahead
        maxResults = 2500,
        singleEvents = true,
        orderBy = 'startTime',
        syncToken,
      } = options;

      // TODO: Uncomment once googleapis is installed
      // if (!this.calendar) {
      //   throw new Error('Google Calendar client not initialized');
      // }
      // 
      // const response = await this.calendar.events.list({
      //   calendarId,
      //   timeMin: timeMin.toISOString(),
      //   timeMax: timeMax.toISOString(),
      //   maxResults,
      //   singleEvents,
      //   orderBy,
      //   syncToken,
      // });
      // 
      // const events = response.data.items?.map((event: any) => ({
      //   id: event.id,
      //   summary: event.summary,
      //   description: event.description,
      //   start: event.start,
      //   end: event.end,
      //   attendees: event.attendees,
      //   location: event.location,
      //   status: event.status,
      //   created: event.created,
      //   updated: event.updated,
      //   htmlLink: event.htmlLink,
      //   hangoutLink: event.hangoutLink,
      //   conferenceData: event.conferenceData,
      //   recurrence: event.recurrence,
      //   recurringEventId: event.recurringEventId,
      // })) || [];
      // 
      // return {
      //   events,
      //   nextPageToken: response.data.nextPageToken,
      //   nextSyncToken: response.data.nextSyncToken,
      // };

      // For now, return mock data
      return {
        events: [
          {
            id: 'mock-event-1',
            summary: 'Botox Appointment - Sarah Johnson',
            start: {
              dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
              timeZone: 'America/Denver',
            },
            end: {
              dateTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
              timeZone: 'America/Denver',
            },
            status: 'confirmed',
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            htmlLink: 'https://calendar.google.com/event?eid=mock-event-1',
            description: 'Botox treatment appointment',
            attendees: [
              {
                email: 'sarah.johnson@example.com',
                displayName: 'Sarah Johnson',
                responseStatus: 'accepted',
              },
            ],
          },
          {
            id: 'mock-event-2',
            summary: 'Filler Consultation - Michael Chen',
            start: {
              dateTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
              timeZone: 'America/Denver',
            },
            end: {
              dateTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
              timeZone: 'America/Denver',
            },
            status: 'confirmed',
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            htmlLink: 'https://calendar.google.com/event?eid=mock-event-2',
            description: 'Initial consultation for dermal fillers',
          },
        ],
      };
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw new Error('Failed to fetch calendar events');
    }
  }

  // Create a new calendar event
  async createEvent(
    calendarId: string,
    event: Partial<GoogleCalendarEvent>
  ): Promise<GoogleCalendarEvent> {
    try {
      // TODO: Implement actual Google Calendar API call
      // const response = await this.calendar.events.insert({
      //   calendarId,
      //   resource: event,
      // });

      // For now, return mock data
      return {
        id: 'mock-created-event',
        summary: event.summary || 'New Appointment',
        start: event.start!,
        end: event.end!,
        status: 'confirmed',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        htmlLink: 'https://calendar.google.com/event?eid=mock-created-event',
        ...event,
      } as GoogleCalendarEvent;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  // Update an existing calendar event
  async updateEvent(
    calendarId: string,
    eventId: string,
    event: Partial<GoogleCalendarEvent>
  ): Promise<GoogleCalendarEvent> {
    try {
      // TODO: Implement actual Google Calendar API call
      // const response = await this.calendar.events.update({
      //   calendarId,
      //   eventId,
      //   resource: event,
      // });

      // For now, return mock data
      return {
        id: eventId,
        summary: event.summary || 'Updated Appointment',
        start: event.start!,
        end: event.end!,
        status: 'confirmed',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        htmlLink: `https://calendar.google.com/event?eid=${eventId}`,
        ...event,
      } as GoogleCalendarEvent;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw new Error('Failed to update calendar event');
    }
  }

  // Delete a calendar event
  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    try {
      // TODO: Implement actual Google Calendar API call
      // await this.calendar.events.delete({
      //   calendarId,
      //   eventId,
      // });

      console.log(`Mock: Deleted event ${eventId} from calendar ${calendarId}`);
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw new Error('Failed to delete calendar event');
    }
  }

  // Set up webhook for calendar changes
  async setupCalendarWebhook(
    calendarId: string,
    webhookUrl: string
  ): Promise<{ id: string; resourceId: string; expiration: number }> {
    try {
      // TODO: Implement actual Google Calendar API webhook setup
      // const response = await this.calendar.events.watch({
      //   calendarId,
      //   resource: {
      //     id: uuidv4(),
      //     type: 'web_hook',
      //     address: webhookUrl,
      //   },
      // });

      // For now, return mock data
      return {
        id: 'mock-webhook-id',
        resourceId: 'mock-resource-id',
        expiration: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
      };
    } catch (error) {
      console.error('Error setting up calendar webhook:', error);
      throw new Error('Failed to setup calendar webhook');
    }
  }

  // Cancel webhook subscription
  async cancelWebhook(channelId: string, resourceId: string): Promise<void> {
    try {
      // TODO: Implement actual Google Calendar API webhook cancellation
      // await this.calendar.channels.stop({
      //   resource: {
      //     id: channelId,
      //     resourceId: resourceId,
      //   },
      // });

      console.log(`Mock: Cancelled webhook ${channelId} for resource ${resourceId}`);
    } catch (error) {
      console.error('Error cancelling webhook:', error);
      throw new Error('Failed to cancel webhook');
    }
  }

  // Refresh access token if needed
  async refreshTokenIfNeeded(): Promise<{ accessToken?: string; refreshToken?: string }> {
    try {
      // TODO: Implement token refresh logic
      // if (this.auth.credentials.expiry_date && this.auth.credentials.expiry_date <= Date.now()) {
      //   const { credentials } = await this.auth.refreshAccessToken();
      //   return {
      //     accessToken: credentials.access_token,
      //     refreshToken: credentials.refresh_token,
      //   };
      // }

      return {}; // No refresh needed (mock)
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }
}

// Utility functions for calendar service
export async function getCalendarConnection(orgId: number, calendarId: string) {
  const connection = await db
    .select()
    .from(calendarConnections)
    .where(
      and(
        eq(calendarConnections.orgId, orgId),
        eq(calendarConnections.calendarId, calendarId),
        eq(calendarConnections.isActive, true)
      )
    )
    .limit(1);

  return connection[0] || null;
}

export async function createCalendarServiceForConnection(connection: any): Promise<GoogleCalendarService> {
  const service = new GoogleCalendarService();
  await service.initializeAuth(connection.accessToken, connection.refreshToken);
  return service;
}

// Extract client information from calendar event
export function extractClientInfoFromEvent(event: GoogleCalendarEvent): {
  name: string | null;
  email: string | null;
  service: string;
} {
  // Extract client name from event summary
  // Common patterns: "Service - Client Name", "Client Name - Service", "Service: Client Name"
  let clientName: string | null = null;
  let service = 'General Appointment';

  if (event.summary) {
    // Try different patterns to extract client name
    const patterns = [
      /^([^-]+)\s*-\s*(.+)$/, // "Service - Client Name"
      /^(.+)\s*-\s*([^-]+)$/, // "Client Name - Service"
      /^([^:]+):\s*(.+)$/, // "Service: Client Name"
      /^(.+?)\s*\|\s*(.+)$/, // "Service | Client Name"
    ];

    for (const pattern of patterns) {
      const match = event.summary.match(pattern);
      if (match) {
        // Determine which part is likely the client name vs service
        const part1 = match[1].trim();
        const part2 = match[2].trim();

        // Common service terms
        const serviceTerms = [
          'botox', 'filler', 'consultation', 'follow-up', 'treatment',
          'injection', 'facial', 'laser', 'peel', 'microneedling',
          'hydrafacial', 'dermaplaning', 'appointment', 'visit'
        ];

        const part1IsService = serviceTerms.some(term => 
          part1.toLowerCase().includes(term)
        );
        const part2IsService = serviceTerms.some(term => 
          part2.toLowerCase().includes(term)
        );

        if (part1IsService && !part2IsService) {
          service = part1;
          clientName = part2;
        } else if (part2IsService && !part1IsService) {
          service = part2;
          clientName = part1;
        } else {
          // Default: assume first part is service, second is name
          service = part1;
          clientName = part2;
        }
        break;
      }
    }

    // If no pattern matched, use the whole summary as service
    if (!clientName) {
      service = event.summary;
    }
  }

  // Extract email from attendees
  let email: string | null = null;
  if (event.attendees && event.attendees.length > 0) {
    // Find the first attendee that's not the organizer
    const attendee = event.attendees.find(a => a.email && a.responseStatus !== 'declined');
    email = attendee?.email || null;
  }

  return {
    name: clientName,
    email,
    service: service || 'General Appointment',
  };
}

// Calculate duration between start and end times
export function calculateEventDuration(start: any, end: any): number {
  const startTime = new Date(start.dateTime || start.date);
  const endTime = new Date(end.dateTime || end.date);
  return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // Duration in minutes
}

// Check if event is in the future
export function isUpcomingEvent(event: GoogleCalendarEvent): boolean {
  const eventTime = new Date(event.start.dateTime || event.start.date!);
  return eventTime.getTime() > Date.now();
}

// Format event for display
export function formatEventForDisplay(event: GoogleCalendarEvent): {
  title: string;
  dateTime: string;
  duration: string;
  status: string;
} {
  const startTime = new Date(event.start.dateTime || event.start.date!);
  const duration = calculateEventDuration(event.start, event.end);

  return {
    title: event.summary,
    dateTime: startTime.toLocaleString(),
    duration: `${duration} minutes`,
    status: event.status,
  };
}