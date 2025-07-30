import { googleCalendarService } from "./googleCalendarService";
import { workflowTriggerService } from "./workflowTriggerService";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export interface AppointmentData {
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  service: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
  location?: string;
}

export interface WorkflowTrigger {
  type: "appointment_created" | "appointment_completed";
  appointmentId: string;
  clientId: string;
  data: any;
}

class AppointmentService {
  private defaultCalendarId: string = "primary"; // Default to primary calendar

  /**
   * Create a new appointment and trigger workflows
   */
  async createAppointment(appointmentData: AppointmentData): Promise<{
    success: boolean;
    calendarEventId?: string;
    appointmentId?: string;
    error?: string;
  }> {
    try {
      // 1. Create calendar event
      const calendarEvent = await googleCalendarService.createEvent(
        this.defaultCalendarId,
        {
          title: `${appointmentData.service} - ${appointmentData.clientName}`,
          start: appointmentData.startTime,
          end: appointmentData.endTime,
          description: appointmentData.notes || "",
          location: appointmentData.location || "",
          attendees: [appointmentData.clientEmail],
        },
      );

      if (!calendarEvent) {
        return {
          success: false,
          error: "Failed to create calendar event",
        };
      }

      // 2. Store appointment in database
      // TODO: Add appointment table to Convex schema
      const appointmentId = "temp-id"; // Replace with actual database insert

      // 3. Trigger "appointment_created" workflows
      await workflowTriggerService.triggerWorkflows({
        type: "appointment_created",
        appointmentId,
        clientId: appointmentData.clientId,
        data: {
          appointment: appointmentData,
          calendarEvent: calendarEvent,
        },
      });

      return {
        success: true,
        calendarEventId: calendarEvent.id,
        appointmentId,
      };
    } catch (error) {
      console.error("Failed to create appointment:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Mark appointment as completed and trigger workflows
   */
  async completeAppointment(appointmentId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // 1. Update appointment status in database
      // TODO: Update appointment status

      // 2. Trigger "appointment_completed" workflows
      await workflowTriggerService.triggerWorkflows({
        type: "appointment_completed",
        appointmentId,
        clientId: "temp-client-id", // Get from appointment
        data: {
          appointmentId,
          completedAt: new Date(),
        },
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to complete appointment:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get upcoming appointments
   */
  async getUpcomingAppointments(days: number = 7): Promise<any[]> {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const events = await googleCalendarService.getEvents(
        this.defaultCalendarId,
        startDate,
        endDate,
      );

      return events.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        description: event.description,
        location: event.location,
        attendees: event.attendees,
      }));
    } catch (error) {
      console.error("Failed to get upcoming appointments:", error);
      return [];
    }
  }

  /**
   * Set the default calendar for appointments
   */
  setDefaultCalendar(calendarId: string): void {
    this.defaultCalendarId = calendarId;
  }

  /**
   * Get the default calendar ID
   */
  getDefaultCalendar(): string {
    return this.defaultCalendarId;
  }
}

export const appointmentService = new AppointmentService();
