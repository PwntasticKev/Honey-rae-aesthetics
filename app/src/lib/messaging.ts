// Multi-channel messaging system with AWS SNS/SES and MailChimp integration
import { db } from "@/lib/db";
import { 
  messageDeliveries, 
  enhancedMessageTemplates, 
  templateVariables,
  clientCommunicationPreferences,
  clients 
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

// AWS SDK imports - these will be available once installed
// import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
// import { SESClient, SendEmailCommand, SendTemplatedEmailCommand } from "@aws-sdk/client-ses";

// Message delivery interfaces
export interface MessageTemplate {
  id: number;
  name: string;
  type: 'sms' | 'email';
  subject?: string;
  content: string;
  variables: string[];
}

export interface MessageContext {
  orgId: number;
  clientId: number;
  templateId: number;
  variables: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledFor?: Date;
  metadata?: Record<string, any>;
}

export interface MessageDeliveryResult {
  success: boolean;
  messageId?: string;
  provider: 'aws-sns' | 'aws-ses' | 'mailchimp' | 'resend';
  error?: string;
  deliveryId: number;
}

export interface MessageProvider {
  name: string;
  type: 'sms' | 'email';
  priority: number; // Lower number = higher priority
  isAvailable: () => Promise<boolean>;
  sendMessage: (content: string, recipient: string, context: any) => Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// Enhanced messaging service with multi-provider support
export class EnhancedMessagingService {
  private smsProviders: MessageProvider[] = [];
  private emailProviders: MessageProvider[] = [];

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize SMS providers
    this.smsProviders = [
      {
        name: 'aws-sns',
        type: 'sms',
        priority: 1,
        isAvailable: async () => {
          return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
        },
        sendMessage: this.sendSMSviaAWS.bind(this),
      },
    ];

    // Initialize Email providers
    this.emailProviders = [
      {
        name: 'aws-ses',
        type: 'email',
        priority: 1,
        isAvailable: async () => {
          return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
        },
        sendMessage: this.sendEmailviaAWS.bind(this),
      },
      {
        name: 'resend',
        type: 'email',
        priority: 2,
        isAvailable: async () => {
          return !!process.env.RESEND_API_KEY;
        },
        sendMessage: this.sendEmailviaResend.bind(this),
      },
      {
        name: 'mailchimp',
        type: 'email',
        priority: 3,
        isAvailable: async () => {
          return !!process.env.MAILCHIMP_API_KEY;
        },
        sendMessage: this.sendEmailviaMailChimp.bind(this),
      },
    ];
  }

  // Main method to send messages with automatic provider fallback
  async sendMessage(context: MessageContext): Promise<MessageDeliveryResult> {
    try {
      // Get message template
      const template = await this.getMessageTemplate(context.templateId, context.orgId);
      if (!template) {
        throw new Error(`Template ${context.templateId} not found`);
      }

      // Get client information and preferences
      const client = await this.getClientWithPreferences(context.clientId, context.orgId);
      if (!client) {
        throw new Error(`Client ${context.clientId} not found`);
      }

      // Check if client has opted out of this communication type
      if (this.hasOptedOut(client, template.type)) {
        return this.logDeliveryResult(context, {
          success: false,
          provider: 'none' as any,
          error: 'Client has opted out of this communication type',
          deliveryId: await this.createDeliveryRecord(context, 'opted_out'),
        });
      }

      // Get recipient information
      const recipient = this.getRecipientInfo(client, template.type);
      if (!recipient) {
        return this.logDeliveryResult(context, {
          success: false,
          provider: 'none' as any,
          error: `No ${template.type} address found for client`,
          deliveryId: await this.createDeliveryRecord(context, 'no_recipient'),
        });
      }

      // Process template variables
      const processedContent = await this.processTemplateVariables(
        template.content,
        context.variables,
        context.orgId
      );

      const processedSubject = template.subject 
        ? await this.processTemplateVariables(template.subject, context.variables, context.orgId)
        : undefined;

      // Get appropriate providers for message type
      const providers = template.type === 'sms' ? this.smsProviders : this.emailProviders;
      
      // Try providers in priority order
      for (const provider of providers.sort((a, b) => a.priority - b.priority)) {
        try {
          const isAvailable = await provider.isAvailable();
          if (!isAvailable) {
            console.log(`Provider ${provider.name} not available, trying next...`);
            continue;
          }

          console.log(`Attempting to send ${template.type} via ${provider.name}`);

          const result = await provider.sendMessage(
            template.type === 'email' && processedSubject 
              ? `${processedSubject}\n\n${processedContent}`
              : processedContent,
            recipient,
            {
              subject: processedSubject,
              template,
              client,
              context,
            }
          );

          if (result.success) {
            return this.logDeliveryResult(context, {
              success: true,
              messageId: result.messageId,
              provider: provider.name as any,
              deliveryId: await this.createDeliveryRecord(context, 'sent', provider.name, result.messageId),
            });
          } else {
            console.error(`Provider ${provider.name} failed:`, result.error);
            // Continue to next provider
          }

        } catch (error) {
          console.error(`Error with provider ${provider.name}:`, error);
          // Continue to next provider
        }
      }

      // All providers failed
      return this.logDeliveryResult(context, {
        success: false,
        provider: 'none' as any,
        error: 'All message providers failed',
        deliveryId: await this.createDeliveryRecord(context, 'failed'),
      });

    } catch (error) {
      console.error('Error in sendMessage:', error);
      return {
        success: false,
        provider: 'none' as any,
        error: error instanceof Error ? error.message : 'Unknown error',
        deliveryId: await this.createDeliveryRecord(context, 'error'),
      };
    }
  }

  // AWS SNS SMS provider
  private async sendSMSviaAWS(content: string, recipient: string, context: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // TODO: Uncomment once AWS SDK is installed
      // const snsClient = new SNSClient({
      //   region: process.env.AWS_REGION || 'us-east-1',
      //   credentials: {
      //     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      //   },
      // });

      // const command = new PublishCommand({
      //   PhoneNumber: recipient,
      //   Message: content,
      //   MessageAttributes: {
      //     'AWS.SNS.SMS.SMSType': {
      //       DataType: 'String',
      //       StringValue: 'Transactional',
      //     },
      //   },
      // });

      // const result = await snsClient.send(command);
      // return {
      //   success: true,
      //   messageId: result.MessageId,
      // };

      // Mock implementation for development
      console.log(`[AWS SNS] Sending SMS to ${recipient}: ${content}`);
      return {
        success: true,
        messageId: `mock-sns-${Date.now()}`,
      };

    } catch (error) {
      console.error('AWS SNS error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AWS SNS error',
      };
    }
  }

  // AWS SES email provider
  private async sendEmailviaAWS(content: string, recipient: string, context: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // TODO: Uncomment once AWS SDK is installed
      // const sesClient = new SESClient({
      //   region: process.env.AWS_REGION || 'us-east-1',
      //   credentials: {
      //     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      //   },
      // });

      // const command = new SendEmailCommand({
      //   Source: process.env.EMAIL_FROM || 'noreply@honeyraeaesthetics.com',
      //   Destination: {
      //     ToAddresses: [recipient],
      //   },
      //   Message: {
      //     Subject: {
      //       Data: context.subject || 'Message from Honey Rae Aesthetics',
      //       Charset: 'UTF-8',
      //     },
      //     Body: {
      //       Text: {
      //         Data: content,
      //         Charset: 'UTF-8',
      //       },
      //       Html: {
      //         Data: this.convertToHTML(content),
      //         Charset: 'UTF-8',
      //       },
      //     },
      //   },
      // });

      // const result = await sesClient.send(command);
      // return {
      //   success: true,
      //   messageId: result.MessageId,
      // };

      // Mock implementation for development
      console.log(`[AWS SES] Sending email to ${recipient}: ${context.subject || 'No Subject'}`);
      console.log(`Content: ${content}`);
      return {
        success: true,
        messageId: `mock-ses-${Date.now()}`,
      };

    } catch (error) {
      console.error('AWS SES error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AWS SES error',
      };
    }
  }

  // Resend email provider (backup)
  private async sendEmailviaResend(content: string, recipient: string, context: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // TODO: Implement Resend API call
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@honeyraeaesthetics.com',
          to: [recipient],
          subject: context.subject || 'Message from Honey Rae Aesthetics',
          text: content,
          html: this.convertToHTML(content),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          messageId: result.id,
        };
      } else {
        const error = await response.text();
        return {
          success: false,
          error: `Resend API error: ${error}`,
        };
      }

    } catch (error) {
      console.error('Resend error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Resend error',
      };
    }
  }

  // MailChimp email provider (fallback)
  private async sendEmailviaMailChimp(content: string, recipient: string, context: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // TODO: Implement MailChimp Transactional API call
      console.log(`[MailChimp] Sending email to ${recipient}: ${context.subject || 'No Subject'}`);
      console.log(`Content: ${content}`);
      
      // Mock implementation - replace with actual MailChimp API
      return {
        success: true,
        messageId: `mock-mailchimp-${Date.now()}`,
      };

    } catch (error) {
      console.error('MailChimp error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'MailChimp error',
      };
    }
  }

  // Helper methods
  private async getMessageTemplate(templateId: number, orgId: number): Promise<MessageTemplate | null> {
    const template = await db
      .select()
      .from(enhancedMessageTemplates)
      .where(
        and(
          eq(enhancedMessageTemplates.id, templateId),
          eq(enhancedMessageTemplates.orgId, orgId),
          eq(enhancedMessageTemplates.isActive, true)
        )
      )
      .limit(1);

    return template.length > 0 ? template[0] as MessageTemplate : null;
  }

  private async getClientWithPreferences(clientId: number, orgId: number): Promise<any> {
    const result = await db
      .select({
        client: clients,
        preferences: clientCommunicationPreferences,
      })
      .from(clients)
      .leftJoin(
        clientCommunicationPreferences,
        eq(clients.id, clientCommunicationPreferences.clientId)
      )
      .where(
        and(
          eq(clients.id, clientId),
          eq(clients.orgId, orgId)
        )
      )
      .limit(1);

    return result.length > 0 ? { ...result[0].client, preferences: result[0].preferences } : null;
  }

  private hasOptedOut(client: any, messageType: 'sms' | 'email'): boolean {
    if (!client.preferences) return false;

    switch (messageType) {
      case 'sms':
        return client.preferences.smsOptOut || false;
      case 'email':
        return client.preferences.emailOptOut || false;
      default:
        return false;
    }
  }

  private getRecipientInfo(client: any, messageType: 'sms' | 'email'): string | null {
    switch (messageType) {
      case 'sms':
        return client.phones?.[0] || null;
      case 'email':
        return client.email || null;
      default:
        return null;
    }
  }

  private async processTemplateVariables(
    template: string,
    variables: Record<string, any>,
    orgId: number
  ): Promise<string> {
    let processed = template;

    // Replace variables in the format {variableName}
    const variableRegex = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
    const matches = template.match(variableRegex);

    if (matches) {
      for (const match of matches) {
        const variableName = match.slice(1, -1); // Remove { and }
        const value = variables[variableName] || `{${variableName}}`;
        processed = processed.replace(new RegExp(`\\{${variableName}\\}`, 'g'), value);
      }
    }

    return processed;
  }

  private convertToHTML(text: string): string {
    return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }

  private async createDeliveryRecord(
    context: MessageContext,
    status: string,
    provider?: string,
    externalId?: string
  ): Promise<number> {
    const result = await db.insert(messageDeliveries).values({
      orgId: context.orgId,
      templateId: context.templateId,
      clientId: context.clientId,
      status,
      provider,
      externalId,
      scheduledFor: context.scheduledFor,
      metadata: context.metadata ? JSON.stringify(context.metadata) : null,
    });

    return result.insertId;
  }

  private logDeliveryResult(context: MessageContext, result: MessageDeliveryResult): MessageDeliveryResult {
    console.log(`Message delivery result:`, {
      clientId: context.clientId,
      templateId: context.templateId,
      success: result.success,
      provider: result.provider,
      error: result.error,
      deliveryId: result.deliveryId,
    });

    return result;
  }
}

// Create global instance
export const messagingService = new EnhancedMessagingService();

// Helper function to send messages from workflows
export async function sendWorkflowMessage(
  orgId: number,
  clientId: number,
  templateId: number,
  variables: Record<string, any> = {},
  priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
  scheduledFor?: Date,
  metadata?: Record<string, any>
): Promise<MessageDeliveryResult> {
  return messagingService.sendMessage({
    orgId,
    clientId,
    templateId,
    variables,
    priority,
    scheduledFor,
    metadata,
  });
}