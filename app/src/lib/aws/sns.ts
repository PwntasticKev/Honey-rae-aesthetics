import {
  PublishCommand,
  PublishBatchCommand,
  CreateTopicCommand,
  SubscribeCommand,
  UnsubscribeCommand,
  ListTopicsCommand,
  SetSMSAttributesCommand,
  GetSMSAttributesCommand,
} from "@aws-sdk/client-sns";
import { snsClient, SNS_CONFIG, isDevelopment } from "./config";

export interface SMSOptions {
  phoneNumber: string;
  message: string;
  senderName?: string;
  messageType?: "Promotional" | "Transactional";
  maxPrice?: string; // Maximum price willing to pay for SMS in USD
}

export interface BulkSMSOptions {
  recipients: Array<{
    phoneNumber: string;
    message: string;
    messageAttributes?: Record<string, any>;
  }>;
  senderName?: string;
  messageType?: "Promotional" | "Transactional";
}

export interface NotificationOptions {
  topicArn: string;
  message: string;
  subject?: string;
  messageAttributes?: Record<string, any>;
}

export interface TopicSubscription {
  protocol: "sms" | "email" | "http" | "https" | "sqs" | "lambda";
  endpoint: string;
}

export class SNSService {
  private senderName: string;
  private defaultRegion: string;

  constructor() {
    this.senderName = SNS_CONFIG.sms.senderName;
    this.defaultRegion = SNS_CONFIG.sms.defaultRegion;
  }

  /**
   * Send a single SMS message
   */
  async sendSMS(options: SMSOptions): Promise<{ messageId: string }> {
    try {
      // In development mode, log SMS instead of sending
      if (isDevelopment && !process.env.AWS_ACCESS_KEY_ID) {
        return this.mockSendSMS(options);
      }

      const {
        phoneNumber,
        message,
        senderName = this.senderName,
        messageType = "Transactional",
        maxPrice = "1.00",
      } = options;

      // Format phone number (ensure it starts with country code)
      const formattedNumber = this.formatPhoneNumber(phoneNumber);

      const params = {
        PhoneNumber: formattedNumber,
        Message: message,
        MessageAttributes: {
          "AWS.SNS.SMS.SenderID": {
            DataType: "String",
            StringValue: senderName,
          },
          "AWS.SNS.SMS.SMSType": {
            DataType: "String",
            StringValue: messageType,
          },
          "AWS.SNS.SMS.MaxPrice": {
            DataType: "String",
            StringValue: maxPrice,
          },
        },
      };

      const result = await snsClient.send(new PublishCommand(params));
      
      return {
        messageId: result.MessageId || "",
      };
    } catch (error) {
      console.error("SNS send SMS error:", error);
      throw new Error(`Failed to send SMS: ${error}`);
    }
  }

  /**
   * Send bulk SMS messages
   */
  async sendBulkSMS(options: BulkSMSOptions): Promise<{ successful: number; failed: number; failedNumbers?: string[] }> {
    try {
      if (isDevelopment && !process.env.AWS_ACCESS_KEY_ID) {
        return this.mockSendBulkSMS(options);
      }

      const { recipients, senderName = this.senderName, messageType = "Transactional" } = options;
      const results = { successful: 0, failed: 0, failedNumbers: [] as string[] };

      // SNS doesn't have a bulk SMS API, so we send individual messages
      // In production, consider using Amazon Pinpoint for bulk SMS
      const promises = recipients.map(async (recipient) => {
        try {
          await this.sendSMS({
            phoneNumber: recipient.phoneNumber,
            message: recipient.message,
            senderName,
            messageType,
          });
          results.successful++;
        } catch (error) {
          results.failed++;
          results.failedNumbers.push(recipient.phoneNumber);
          console.error(`Failed to send SMS to ${recipient.phoneNumber}:`, error);
        }
      });

      await Promise.all(promises);
      
      return results;
    } catch (error) {
      console.error("SNS send bulk SMS error:", error);
      throw new Error(`Failed to send bulk SMS: ${error}`);
    }
  }

  /**
   * Send notification to a topic
   */
  async sendTopicNotification(options: NotificationOptions): Promise<{ messageId: string }> {
    try {
      if (isDevelopment && !process.env.AWS_ACCESS_KEY_ID) {
        return this.mockSendTopicNotification(options);
      }

      const { topicArn, message, subject, messageAttributes = {} } = options;

      const params = {
        TopicArn: topicArn,
        Message: message,
        Subject: subject,
        MessageAttributes: Object.entries(messageAttributes).reduce((acc, [key, value]) => {
          acc[key] = {
            DataType: "String",
            StringValue: String(value),
          };
          return acc;
        }, {} as Record<string, any>),
      };

      const result = await snsClient.send(new PublishCommand(params));
      
      return {
        messageId: result.MessageId || "",
      };
    } catch (error) {
      console.error("SNS send topic notification error:", error);
      throw new Error(`Failed to send topic notification: ${error}`);
    }
  }

  /**
   * Create a new topic
   */
  async createTopic(name: string): Promise<string> {
    try {
      if (isDevelopment && !process.env.AWS_ACCESS_KEY_ID) {
        return `arn:aws:sns:${this.defaultRegion}:123456789012:${name}`;
      }

      const result = await snsClient.send(new CreateTopicCommand({
        Name: name,
      }));
      
      return result.TopicArn || "";
    } catch (error) {
      console.error("SNS create topic error:", error);
      throw new Error(`Failed to create topic: ${error}`);
    }
  }

  /**
   * Subscribe to a topic
   */
  async subscribeToTopic(
    topicArn: string,
    subscription: TopicSubscription
  ): Promise<string> {
    try {
      if (isDevelopment && !process.env.AWS_ACCESS_KEY_ID) {
        return `arn:aws:sns:${this.defaultRegion}:123456789012:${topicArn.split(':').pop()}:${Date.now()}`;
      }

      const result = await snsClient.send(new SubscribeCommand({
        TopicArn: topicArn,
        Protocol: subscription.protocol,
        Endpoint: subscription.endpoint,
      }));
      
      return result.SubscriptionArn || "";
    } catch (error) {
      console.error("SNS subscribe error:", error);
      throw new Error(`Failed to subscribe to topic: ${error}`);
    }
  }

  /**
   * Unsubscribe from a topic
   */
  async unsubscribeFromTopic(subscriptionArn: string): Promise<void> {
    try {
      if (isDevelopment && !process.env.AWS_ACCESS_KEY_ID) {
        console.log(`Mock: Unsubscribed from ${subscriptionArn}`);
        return;
      }

      await snsClient.send(new UnsubscribeCommand({
        SubscriptionArn: subscriptionArn,
      }));
    } catch (error) {
      console.error("SNS unsubscribe error:", error);
      throw new Error(`Failed to unsubscribe: ${error}`);
    }
  }

  /**
   * List all topics
   */
  async listTopics(): Promise<Array<{ name: string; arn: string }>> {
    try {
      if (isDevelopment && !process.env.AWS_ACCESS_KEY_ID) {
        return [
          { name: "appointments", arn: "arn:aws:sns:us-east-1:123456789012:appointments" },
          { name: "system-alerts", arn: "arn:aws:sns:us-east-1:123456789012:system-alerts" },
          { name: "marketing", arn: "arn:aws:sns:us-east-1:123456789012:marketing" },
        ];
      }

      const result = await snsClient.send(new ListTopicsCommand({}));
      
      return (result.Topics || []).map(topic => ({
        name: topic.TopicArn?.split(':').pop() || "",
        arn: topic.TopicArn || "",
      }));
    } catch (error) {
      console.error("SNS list topics error:", error);
      throw new Error(`Failed to list topics: ${error}`);
    }
  }

  /**
   * Configure SMS attributes
   */
  async configureSMSAttributes(attributes: Record<string, string>): Promise<void> {
    try {
      if (isDevelopment && !process.env.AWS_ACCESS_KEY_ID) {
        console.log("Mock: Configured SMS attributes:", attributes);
        return;
      }

      await snsClient.send(new SetSMSAttributesCommand({
        attributes,
      }));
    } catch (error) {
      console.error("SNS configure SMS attributes error:", error);
      throw new Error(`Failed to configure SMS attributes: ${error}`);
    }
  }

  /**
   * Get current SMS attributes
   */
  async getSMSAttributes(): Promise<Record<string, string>> {
    try {
      if (isDevelopment && !process.env.AWS_ACCESS_KEY_ID) {
        return {
          DefaultSMSType: "Transactional",
          MonthlySpendLimit: "1.00",
          DeliveryStatusLogging: "false",
        };
      }

      const result = await snsClient.send(new GetSMSAttributesCommand({}));
      
      return result.attributes || {};
    } catch (error) {
      console.error("SNS get SMS attributes error:", error);
      throw new Error(`Failed to get SMS attributes: ${error}`);
    }
  }

  /**
   * Send common SMS types
   */
  async sendAppointmentReminder(phoneNumber: string, appointmentData: Record<string, any>): Promise<{ messageId: string }> {
    const message = `Hi ${appointmentData.clientName}! Reminder: You have a ${appointmentData.service} appointment tomorrow at ${appointmentData.time}. Reply CONFIRM to confirm or call ${appointmentData.clinicPhone} to reschedule.`;
    
    return this.sendSMS({
      phoneNumber,
      message,
      messageType: "Transactional",
    });
  }

  async sendAppointmentConfirmation(phoneNumber: string, appointmentData: Record<string, any>): Promise<{ messageId: string }> {
    const message = `Appointment confirmed! ${appointmentData.service} on ${appointmentData.date} at ${appointmentData.time}. Address: ${appointmentData.address}. See you soon!`;
    
    return this.sendSMS({
      phoneNumber,
      message,
      messageType: "Transactional",
    });
  }

  async sendWelcomeSMS(phoneNumber: string, clientData: Record<string, any>): Promise<{ messageId: string }> {
    const message = `Welcome to Honey Rae Aesthetics, ${clientData.firstName}! We're excited to help you on your beauty journey. Questions? Reply or call ${clientData.clinicPhone}.`;
    
    return this.sendSMS({
      phoneNumber,
      message,
      messageType: "Promotional",
    });
  }

  async sendBirthdaySMS(phoneNumber: string, clientData: Record<string, any>): Promise<{ messageId: string }> {
    const message = `🎉 Happy Birthday ${clientData.firstName}! Celebrate with 20% off any treatment this month. Use code BIRTHDAY20. Book now: ${clientData.bookingUrl}`;
    
    return this.sendSMS({
      phoneNumber,
      message,
      messageType: "Promotional",
    });
  }

  async sendFollowUpSMS(phoneNumber: string, followUpData: Record<string, any>): Promise<{ messageId: string }> {
    const message = `Hi ${followUpData.clientName}! How are you feeling after your ${followUpData.treatment}? Any questions about aftercare? Feel free to reach out!`;
    
    return this.sendSMS({
      phoneNumber,
      message,
      messageType: "Transactional",
    });
  }

  // Private helper methods
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, "");
    
    // If it doesn't start with a country code, assume US (+1)
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    
    // If it starts with 1 and has 11 digits, add +
    if (digits.length === 11 && digits.startsWith("1")) {
      return `+${digits}`;
    }
    
    // If it already has a country code, ensure it starts with +
    if (!phoneNumber.startsWith("+")) {
      return `+${digits}`;
    }
    
    return phoneNumber;
  }

  // Mock implementations for development
  private async mockSendSMS(options: SMSOptions): Promise<{ messageId: string }> {
    console.log("📱 Mock SMS Sent:");
    console.log(`To: ${options.phoneNumber}`);
    console.log(`Message: ${options.message}`);
    console.log(`Sender: ${options.senderName || this.senderName}`);
    console.log(`Type: ${options.messageType || "Transactional"}`);
    
    return { messageId: `mock-sms-${Date.now()}-${Math.random().toString(36).substring(7)}` };
  }

  private async mockSendBulkSMS(options: BulkSMSOptions): Promise<{ successful: number; failed: number }> {
    console.log("📱 Mock Bulk SMS Sent:");
    console.log(`Recipients: ${options.recipients.length}`);
    console.log(`Sample:`, options.recipients[0]);
    
    return {
      successful: options.recipients.length,
      failed: 0,
    };
  }

  private async mockSendTopicNotification(options: NotificationOptions): Promise<{ messageId: string }> {
    console.log("🔔 Mock Topic Notification Sent:");
    console.log(`Topic: ${options.topicArn}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message: ${options.message}`);
    
    return { messageId: `mock-topic-${Date.now()}-${Math.random().toString(36).substring(7)}` };
  }
}

// Export singleton instance
export const snsService = new SNSService();