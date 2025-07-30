import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MessagingService } from "./messagingService";

export interface WorkflowTrigger {
  type: "appointment_created" | "appointment_completed";
  appointmentId: string;
  clientId: string;
  data: any;
}

export interface WorkflowAction {
  type: "send_email" | "send_sms" | "add_tag" | "delay";
  config: any;
}

class WorkflowTriggerService {
  private messagingService = MessagingService.getInstance();

  /**
   * Trigger workflows based on appointment events
   */
  async triggerWorkflows(trigger: WorkflowTrigger): Promise<void> {
    try {
      console.log("🔔 Triggering workflows for:", trigger);

      // TODO: Find workflows that match the trigger type
      // For now, we'll implement basic email/SMS sending

      if (trigger.type === "appointment_created") {
        await this.handleAppointmentCreated(trigger);
      } else if (trigger.type === "appointment_completed") {
        await this.handleAppointmentCompleted(trigger);
      }
    } catch (error) {
      console.error("Failed to trigger workflows:", error);
    }
  }

  /**
   * Handle appointment created event
   */
  private async handleAppointmentCreated(
    trigger: WorkflowTrigger,
  ): Promise<void> {
    const { appointmentId, clientId, data } = trigger;

    // Send confirmation email to client
    if (data.appointment?.clientEmail) {
      await this.messagingService.sendEmail({
        to: data.appointment.clientEmail,
        subject: "Appointment Confirmation",
        body: `Hi ${data.appointment.clientName},\n\nYour appointment for ${data.appointment.service} has been scheduled for ${new Date(data.appointment.startTime).toLocaleString()}.\n\nWe look forward to seeing you!\n\nBest regards,\nHoney Rae Aesthetics`,
        type: "email",
        orgId: "demo-org-id", // Will be replaced with actual org ID
        clientId,
      });
    }

    // Send SMS reminder if phone number is available
    if (data.appointment?.clientPhone) {
      await this.messagingService.sendMockSMS({
        to: data.appointment.clientPhone,
        body: `Your appointment for ${data.appointment.service} is confirmed for ${new Date(data.appointment.startTime).toLocaleString()}. Reply STOP to unsubscribe.`,
        type: "sms",
      });
    }

    console.log("✅ Appointment created workflows executed");
  }

  /**
   * Handle appointment completed event
   */
  private async handleAppointmentCompleted(
    trigger: WorkflowTrigger,
  ): Promise<void> {
    const { appointmentId, clientId, data } = trigger;

    // Send follow-up email
    // TODO: Get client email from database
    const clientEmail = "client@example.com"; // Replace with actual client email

    await this.messagingService.sendEmail({
      to: clientEmail,
      subject: "Thank you for your visit!",
      body: `Hi there,\n\nThank you for visiting Honey Rae Aesthetics today. We hope you had a great experience!\n\nPlease don't hesitate to reach out if you have any questions or would like to schedule your next appointment.\n\nBest regards,\nHoney Rae Aesthetics`,
      type: "email",
      orgId: "demo-org-id", // Will be replaced with actual org ID
      clientId,
    });

    console.log("✅ Appointment completed workflows executed");
  }

  /**
   * Execute a specific workflow action
   */
  async executeWorkflowAction(
    action: WorkflowAction,
    clientData: any,
  ): Promise<boolean> {
    try {
      switch (action.type) {
        case "send_email":
          if (clientData.email) {
            await this.messagingService.sendEmail({
              to: clientData.email,
              subject: action.config.subject || "Message from Honey Rae",
              body: action.config.body || "You have a new message.",
              type: "email",
              orgId: "demo-org-id", // Will be replaced with actual org ID
              clientId: clientData.id,
            });
            return true;
          }
          break;

        case "send_sms":
          if (clientData.phone) {
            await this.messagingService.sendMockSMS({
              to: clientData.phone,
              body: action.config.message || "You have a new message.",
              type: "sms",
            });
            return true;
          }
          break;

        case "add_tag":
          // TODO: Add tag to client in database
          console.log(
            "Adding tag:",
            action.config.tag,
            "to client:",
            clientData.id,
          );
          return true;

        case "delay":
          // TODO: Implement delay logic
          console.log("Delay action:", action.config.duration);
          return true;

        default:
          console.warn("Unknown workflow action type:", action.type);
          return false;
      }
    } catch (error) {
      console.error("Failed to execute workflow action:", error);
      return false;
    }

    return false;
  }
}

export const workflowTriggerService = new WorkflowTriggerService();
