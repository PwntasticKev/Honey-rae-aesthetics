// Messaging service for real email and SMS sending
export interface MessageConfig {
  to: string;
  subject?: string;
  body: string;
  type: "email" | "sms";
  orgId?: string;
  clientId?: string;
}

export class MessagingService {
  private static instance: MessagingService;

  private constructor() {}

  static getInstance(): MessagingService {
    if (!MessagingService.instance) {
      MessagingService.instance = new MessagingService();
    }
    return MessagingService.instance;
  }

  async sendEmail(
    config: MessageConfig,
  ): Promise<{ success: boolean; message: string; messageId?: string }> {
    try {
      console.log("📧 Sending email via API:", {
        to: config.to,
        subject: config.subject,
        bodyLength: config.body.length,
      });

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: config.to,
          subject: config.subject || "Workflow Test Email",
          body: config.body,
          orgId: config.orgId,
          clientId: config.clientId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("📧 Email sent successfully:", result);
        return {
          success: true,
          message: result.message || "Email sent successfully",
          messageId: result.messageId,
        };
      } else {
        console.error("📧 Email sending failed:", result);
        return {
          success: false,
          message: result.error || "Failed to send email",
        };
      }
    } catch (error) {
      console.error("📧 Email sending error:", error);
      return { success: false, message: "Failed to send email" };
    }
  }

  async sendSMS(
    config: MessageConfig,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // For now, we'll use a simple fetch to a mock endpoint
      // In production, this would integrate with AWS SNS or similar
      const response = await fetch("/api/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: config.to,
          body: config.body,
        }),
      });

      if (response.ok) {
        return { success: true, message: "SMS sent successfully" };
      } else {
        const error = await response.json();
        return {
          success: false,
          message: error.message || "Failed to send SMS",
        };
      }
    } catch (error) {
      console.error("SMS sending error:", error);
      return { success: false, message: "Failed to send SMS" };
    }
  }

  // Mock implementation for development/testing
  async sendMockEmail(
    config: MessageConfig,
  ): Promise<{ success: boolean; message: string }> {
    console.log("📧 Mock Email Sent:", {
      to: config.to,
      subject: config.subject,
      body: config.body,
    });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return { success: true, message: "Mock email sent successfully" };
  }

  async sendMockSMS(
    config: MessageConfig,
  ): Promise<{ success: boolean; message: string }> {
    console.log("📱 Mock SMS Sent:", {
      to: config.to,
      body: config.body,
    });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return { success: true, message: "Mock SMS sent successfully" };
  }
}
