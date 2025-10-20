import {
  SendEmailCommand,
  SendTemplatedEmailCommand,
  SendBulkTemplatedEmailCommand,
  CreateTemplateCommand,
  UpdateTemplateCommand,
  DeleteTemplateCommand,
  ListTemplatesCommand,
  GetTemplateCommand,
} from "@aws-sdk/client-ses";
import { sesClient, SES_CONFIG, isDevelopment } from "./config";

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailOptions {
  to: EmailAddress | EmailAddress[];
  from?: EmailAddress;
  replyTo?: EmailAddress;
  subject: string;
  htmlBody?: string;
  textBody?: string;
  attachments?: EmailAttachment[];
  tags?: Record<string, string>;
  metadata?: Record<string, string>;
}

export interface TemplatedEmailOptions {
  to: EmailAddress | EmailAddress[];
  from?: EmailAddress;
  replyTo?: EmailAddress;
  templateName: string;
  templateData: Record<string, any>;
  tags?: Record<string, string>;
}

export interface BulkEmailOptions {
  templateName: string;
  from?: EmailAddress;
  replyTo?: EmailAddress;
  recipients: Array<{
    email: string;
    templateData: Record<string, any>;
  }>;
  tags?: Record<string, string>;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  description?: string;
}

export class SESService {
  private fromEmail: string;
  private fromName: string;
  private replyToEmail: string;

  constructor() {
    this.fromEmail = SES_CONFIG.fromEmail;
    this.fromName = SES_CONFIG.fromName;
    this.replyToEmail = SES_CONFIG.replyToEmail;
  }

  /**
   * Send a simple email
   */
  async sendEmail(options: EmailOptions): Promise<{ messageId: string }> {
    try {
      // In development mode, log email instead of sending
      if (isDevelopment && !process.env.AWS_ACCESS_KEY_ID) {
        return this.mockSendEmail(options);
      }

      const {
        to,
        from = { email: this.fromEmail, name: this.fromName },
        replyTo = { email: this.replyToEmail },
        subject,
        htmlBody,
        textBody,
        tags = {},
      } = options;

      // Prepare recipients
      const toAddresses = Array.isArray(to) ? to.map(addr => this.formatAddress(addr)) : [this.formatAddress(to)];

      const params = {
        Source: this.formatAddress(from),
        Destination: {
          ToAddresses: toAddresses,
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: "UTF-8",
          },
          Body: {
            ...(htmlBody && {
              Html: {
                Data: htmlBody,
                Charset: "UTF-8",
              },
            }),
            ...(textBody && {
              Text: {
                Data: textBody,
                Charset: "UTF-8",
              },
            }),
          },
        },
        ReplyToAddresses: [this.formatAddress(replyTo)],
        ...(Object.keys(tags).length > 0 && {
          Tags: Object.entries(tags).map(([key, value]) => ({
            Name: key,
            Value: value,
          })),
        }),
      };

      const result = await sesClient.send(new SendEmailCommand(params));
      
      return {
        messageId: result.MessageId || "",
      };
    } catch (error) {
      console.error("SES send email error:", error);
      throw new Error(`Failed to send email: ${error}`);
    }
  }

  /**
   * Send email using a template
   */
  async sendTemplatedEmail(options: TemplatedEmailOptions): Promise<{ messageId: string }> {
    try {
      if (isDevelopment && !process.env.AWS_ACCESS_KEY_ID) {
        return this.mockSendTemplatedEmail(options);
      }

      const {
        to,
        from = { email: this.fromEmail, name: this.fromName },
        replyTo = { email: this.replyToEmail },
        templateName,
        templateData,
        tags = {},
      } = options;

      const toAddresses = Array.isArray(to) ? to.map(addr => this.formatAddress(addr)) : [this.formatAddress(to)];

      const params = {
        Source: this.formatAddress(from),
        Destination: {
          ToAddresses: toAddresses,
        },
        Template: templateName,
        TemplateData: JSON.stringify(templateData),
        ReplyToAddresses: [this.formatAddress(replyTo)],
        ...(Object.keys(tags).length > 0 && {
          Tags: Object.entries(tags).map(([key, value]) => ({
            Name: key,
            Value: value,
          })),
        }),
      };

      const result = await sesClient.send(new SendTemplatedEmailCommand(params));
      
      return {
        messageId: result.MessageId || "",
      };
    } catch (error) {
      console.error("SES send templated email error:", error);
      throw new Error(`Failed to send templated email: ${error}`);
    }
  }

  /**
   * Send bulk emails using a template
   */
  async sendBulkTemplatedEmail(options: BulkEmailOptions): Promise<{ messageId: string; failedRecipients?: string[] }> {
    try {
      if (isDevelopment && !process.env.AWS_ACCESS_KEY_ID) {
        return this.mockSendBulkEmail(options);
      }

      const {
        templateName,
        from = { email: this.fromEmail, name: this.fromName },
        replyTo = { email: this.replyToEmail },
        recipients,
        tags = {},
      } = options;

      const params = {
        Source: this.formatAddress(from),
        Template: templateName,
        DefaultTemplateData: "{}",
        Destinations: recipients.map(recipient => ({
          Destination: {
            ToAddresses: [recipient.email],
          },
          ReplacementTemplateData: JSON.stringify(recipient.templateData),
        })),
        ReplyToAddresses: [this.formatAddress(replyTo)],
        ...(Object.keys(tags).length > 0 && {
          Tags: Object.entries(tags).map(([key, value]) => ({
            Name: key,
            Value: value,
          })),
        }),
      };

      const result = await sesClient.send(new SendBulkTemplatedEmailCommand(params));
      
      return {
        messageId: result.MessageId || "",
        failedRecipients: result.Status?.filter(status => status.Status === "Failed")
          .map(status => status.Destination?.ToAddresses?.[0]).filter(Boolean) as string[],
      };
    } catch (error) {
      console.error("SES send bulk email error:", error);
      throw new Error(`Failed to send bulk email: ${error}`);
    }
  }

  /**
   * Create an email template
   */
  async createTemplate(template: EmailTemplate): Promise<void> {
    try {
      if (isDevelopment && !process.env.AWS_ACCESS_KEY_ID) {
        console.log(`Mock: Created email template "${template.name}"`);
        return;
      }

      const params = {
        Template: {
          TemplateName: template.name,
          SubjectPart: template.subject,
          HtmlPart: template.htmlBody,
          TextPart: template.textBody,
        },
      };

      await sesClient.send(new CreateTemplateCommand(params));
    } catch (error) {
      console.error("SES create template error:", error);
      throw new Error(`Failed to create template: ${error}`);
    }
  }

  /**
   * Update an email template
   */
  async updateTemplate(template: EmailTemplate): Promise<void> {
    try {
      if (isDevelopment && !process.env.AWS_ACCESS_KEY_ID) {
        console.log(`Mock: Updated email template "${template.name}"`);
        return;
      }

      const params = {
        Template: {
          TemplateName: template.name,
          SubjectPart: template.subject,
          HtmlPart: template.htmlBody,
          TextPart: template.textBody,
        },
      };

      await sesClient.send(new UpdateTemplateCommand(params));
    } catch (error) {
      console.error("SES update template error:", error);
      throw new Error(`Failed to update template: ${error}`);
    }
  }

  /**
   * Delete an email template
   */
  async deleteTemplate(templateName: string): Promise<void> {
    try {
      if (isDevelopment && !process.env.AWS_ACCESS_KEY_ID) {
        console.log(`Mock: Deleted email template "${templateName}"`);
        return;
      }

      await sesClient.send(new DeleteTemplateCommand({
        TemplateName: templateName,
      }));
    } catch (error) {
      console.error("SES delete template error:", error);
      throw new Error(`Failed to delete template: ${error}`);
    }
  }

  /**
   * List all email templates
   */
  async listTemplates(): Promise<string[]> {
    try {
      if (isDevelopment && !process.env.AWS_ACCESS_KEY_ID) {
        return Object.keys(SES_CONFIG.templates);
      }

      const result = await sesClient.send(new ListTemplatesCommand({}));
      
      return result.TemplatesMetadata?.map(template => template.Name || "") || [];
    } catch (error) {
      console.error("SES list templates error:", error);
      throw new Error(`Failed to list templates: ${error}`);
    }
  }

  /**
   * Get template details
   */
  async getTemplate(templateName: string): Promise<EmailTemplate | null> {
    try {
      if (isDevelopment && !process.env.AWS_ACCESS_KEY_ID) {
        return this.mockGetTemplate(templateName);
      }

      const result = await sesClient.send(new GetTemplateCommand({
        TemplateName: templateName,
      }));

      const template = result.Template;
      if (!template) return null;

      return {
        name: template.TemplateName || "",
        subject: template.SubjectPart || "",
        htmlBody: template.HtmlPart || "",
        textBody: template.TextPart,
      };
    } catch (error) {
      console.error("SES get template error:", error);
      return null;
    }
  }

  /**
   * Send common email types using pre-configured templates
   */
  async sendWelcomeEmail(to: EmailAddress, data: Record<string, any>): Promise<{ messageId: string }> {
    return this.sendTemplatedEmail({
      to,
      templateName: SES_CONFIG.templates.welcome,
      templateData: data,
      tags: { type: "welcome", category: "onboarding" },
    });
  }

  async sendAppointmentReminder(to: EmailAddress, data: Record<string, any>): Promise<{ messageId: string }> {
    return this.sendTemplatedEmail({
      to,
      templateName: SES_CONFIG.templates.appointmentReminder,
      templateData: data,
      tags: { type: "appointment-reminder", category: "appointment" },
    });
  }

  async sendAppointmentConfirmation(to: EmailAddress, data: Record<string, any>): Promise<{ messageId: string }> {
    return this.sendTemplatedEmail({
      to,
      templateName: SES_CONFIG.templates.appointmentConfirmation,
      templateData: data,
      tags: { type: "appointment-confirmation", category: "appointment" },
    });
  }

  async sendAftercareInstructions(to: EmailAddress, data: Record<string, any>): Promise<{ messageId: string }> {
    return this.sendTemplatedEmail({
      to,
      templateName: SES_CONFIG.templates.aftercare,
      templateData: data,
      tags: { type: "aftercare", category: "post-treatment" },
    });
  }

  async sendBirthdayWish(to: EmailAddress, data: Record<string, any>): Promise<{ messageId: string }> {
    return this.sendTemplatedEmail({
      to,
      templateName: SES_CONFIG.templates.birthday,
      templateData: data,
      tags: { type: "birthday", category: "marketing" },
    });
  }

  async sendPasswordReset(to: EmailAddress, data: Record<string, any>): Promise<{ messageId: string }> {
    return this.sendTemplatedEmail({
      to,
      templateName: SES_CONFIG.templates.passwordReset,
      templateData: data,
      tags: { type: "password-reset", category: "security" },
    });
  }

  // Private helper methods
  private formatAddress(address: EmailAddress): string {
    return address.name ? `${address.name} <${address.email}>` : address.email;
  }

  // Mock implementations for development
  private async mockSendEmail(options: EmailOptions): Promise<{ messageId: string }> {
    console.log("📧 Mock Email Sent:");
    console.log(`To: ${Array.isArray(options.to) ? options.to.map(t => t.email).join(", ") : options.to.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`HTML Body: ${options.htmlBody?.substring(0, 100)}...`);
    console.log(`Text Body: ${options.textBody?.substring(0, 100)}...`);
    
    return { messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(7)}` };
  }

  private async mockSendTemplatedEmail(options: TemplatedEmailOptions): Promise<{ messageId: string }> {
    console.log("📧 Mock Templated Email Sent:");
    console.log(`To: ${Array.isArray(options.to) ? options.to.map(t => t.email).join(", ") : options.to.email}`);
    console.log(`Template: ${options.templateName}`);
    console.log(`Data:`, options.templateData);
    
    return { messageId: `mock-template-${Date.now()}-${Math.random().toString(36).substring(7)}` };
  }

  private async mockSendBulkEmail(options: BulkEmailOptions): Promise<{ messageId: string }> {
    console.log("📧 Mock Bulk Email Sent:");
    console.log(`Template: ${options.templateName}`);
    console.log(`Recipients: ${options.recipients.length}`);
    console.log(`Sample recipient:`, options.recipients[0]);
    
    return { messageId: `mock-bulk-${Date.now()}-${Math.random().toString(36).substring(7)}` };
  }

  private mockGetTemplate(templateName: string): EmailTemplate | null {
    const mockTemplates: Record<string, EmailTemplate> = {
      [SES_CONFIG.templates.welcome]: {
        name: SES_CONFIG.templates.welcome,
        subject: "Welcome to Honey Rae Aesthetics, {{firstName}}!",
        htmlBody: "<h1>Welcome {{firstName}}!</h1><p>We're excited to have you as a client.</p>",
        textBody: "Welcome {{firstName}}! We're excited to have you as a client.",
      },
      [SES_CONFIG.templates.appointmentReminder]: {
        name: SES_CONFIG.templates.appointmentReminder,
        subject: "Appointment Reminder - {{appointmentDate}}",
        htmlBody: "<h1>Appointment Reminder</h1><p>Your {{service}} appointment is scheduled for {{appointmentDate}}.</p>",
        textBody: "Your {{service}} appointment is scheduled for {{appointmentDate}}.",
      },
    };

    return mockTemplates[templateName] || null;
  }
}

// Export singleton instance
export const sesService = new SESService();