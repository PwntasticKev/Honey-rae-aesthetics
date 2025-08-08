import { z } from "zod";

// Organization Profile Validation
export const organizationProfileSchema = z.object({
  name: z.string()
    .min(1, "Organization name is required")
    .max(100, "Organization name must be less than 100 characters")
    .trim(),
  email: z.string()
    .email("Invalid email format")
    .min(1, "Organization email is required"),
  phone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^[\+]?[1-9][\d\s\-\(\)]{9,15}$/, "Invalid phone number format"),
  address: z.string()
    .min(1, "Address is required")
    .max(500, "Address must be less than 500 characters")
    .trim(),
  website: z.string()
    .url("Invalid website URL")
    .optional()
    .or(z.literal("")),
  industry: z.string()
    .min(1, "Industry selection is required"),
  description: z.string()
    .max(1000, "Description must be less than 1000 characters")
    .trim()
    .optional(),
  timezone: z.string()
    .min(1, "Timezone is required"),
  currency: z.string()
    .min(3, "Currency code is required")
    .max(3, "Invalid currency code"),
  employeeCount: z.string().optional(),
  established: z.string().optional(),
});

// User Registration/Profile Validation
export const userProfileSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .trim(),
  email: z.string()
    .email("Invalid email format")
    .min(1, "Email is required"),
  phone: z.string()
    .regex(/^[\+]?[1-9][\d\s\-\(\)]{9,15}$/, "Invalid phone number format")
    .optional()
    .or(z.literal("")),
  role: z.enum(["admin", "editor", "viewer"]),
});

// Client Profile Validation
export const clientProfileSchema = z.object({
  fullName: z.string()
    .min(1, "Full name is required")
    .max(100, "Name must be less than 100 characters")
    .trim(),
  firstName: z.string()
    .max(50, "First name must be less than 50 characters")
    .trim()
    .optional(),
  lastName: z.string()
    .max(50, "Last name must be less than 50 characters")
    .trim()
    .optional(),
  email: z.string()
    .email("Invalid email format")
    .optional()
    .or(z.literal("")),
  phones: z.array(z.string().regex(/^[\+]?[1-9][\d\s\-\(\)]{9,15}$/, "Invalid phone number format")),
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional()
    .or(z.literal("")),
  address: z.object({
    street: z.string().min(1, "Street address is required"),
    addressLine2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().optional(),
    zip: z.string().min(1, "ZIP code is required"),
  }).optional(),
  referralSource: z.string().optional(),
  membershipType: z.string().optional(),
  tags: z.array(z.string()),
});

// Message Template Validation
export const messageTemplateSchema = z.object({
  name: z.string()
    .min(1, "Template name is required")
    .max(100, "Template name must be less than 100 characters")
    .trim(),
  type: z.enum(["sms", "email"]),
  subject: z.string()
    .max(200, "Subject must be less than 200 characters")
    .optional(),
  content: z.string()
    .min(1, "Message content is required")
    .max(5000, "Message content must be less than 5000 characters"),
  mergeTags: z.array(z.string()),
});

// Workflow Validation
export const workflowSchema = z.object({
  name: z.string()
    .min(1, "Workflow name is required")
    .max(100, "Workflow name must be less than 100 characters")
    .trim(),
  description: z.string()
    .max(500, "Description must be less than 500 characters")
    .trim()
    .optional(),
  trigger: z.enum([
    "new_client",
    "appointment_completed", 
    "appointment_scheduled",
    "manual",
    "morpheus8",
    "toxins",
    "filler",
    "consultation"
  ]),
  conditions: z.array(z.object({
    field: z.string().min(1, "Field is required"),
    operator: z.enum([
      "equals",
      "contains", 
      "greater_than",
      "less_than",
      "greater_than_or_equal",
      "less_than_or_equal",
      "not_equals",
      "is_empty",
      "is_not_empty",
      "date_before",
      "date_after",
      "days_ago",
      "has_tag",
      "not_has_tag"
    ]),
    value: z.string(),
  })),
});

// Appointment Validation
export const appointmentSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  dateTime: z.number().min(Date.now(), "Appointment must be in the future"),
  type: z.string().min(1, "Appointment type is required"),
  provider: z.string().min(1, "Provider is required"),
  notes: z.string()
    .max(1000, "Notes must be less than 1000 characters")
    .optional(),
  status: z.enum(["scheduled", "completed", "cancelled", "no_show"]),
});

// Team Member Invitation
export const teamInviteSchema = z.object({
  email: z.string()
    .email("Invalid email format")
    .min(1, "Email is required"),
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .trim(),
  role: z.enum(["admin", "editor", "viewer"]),
  message: z.string()
    .max(500, "Message must be less than 500 characters")
    .optional(),
});

// Security Settings
export const securitySettingsSchema = z.object({
  twoFactorEnabled: z.boolean(),
  preferredOtpMethod: z.enum(["sms", "email"]).optional(),
  sessionTimeoutMinutes: z.number()
    .min(5, "Session timeout must be at least 5 minutes")
    .max(480, "Session timeout cannot exceed 8 hours")
    .optional(),
  allowedIpRanges: z.array(z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?:\/[0-9]{1,2})?$/, "Invalid IP address or range")).optional(),
  requireStrongPasswords: z.boolean().optional(),
  passwordExpiryDays: z.number()
    .min(30, "Password expiry must be at least 30 days")
    .max(365, "Password expiry cannot exceed 365 days")
    .optional(),
});

// Integration Configuration
export const integrationConfigSchema = z.object({
  platform: z.enum([
    "instagram",
    "facebook", 
    "youtube",
    "linkedin",
    "tiktok",
    "google_business",
    "apple_business",
    "google_calendar",
    "stripe",
    "twilio",
    "mailchimp",
    "aws_s3"
  ]),
  accessToken: z.string().min(1, "Access token is required"),
  refreshToken: z.string().optional(),
  accountId: z.string().optional(),
  accountName: z.string().optional(),
  scopes: z.array(z.string()).optional(),
  expiresAt: z.number().optional(),
});

// API Key Configuration (for non-OAuth integrations)
export const apiKeyConfigSchema = z.object({
  platform: z.string().min(1, "Platform is required"),
  apiKey: z.string().min(1, "API key is required"),
  apiSecret: z.string().optional(),
  webhookUrl: z.string().url("Invalid webhook URL").optional(),
  environment: z.enum(["production", "sandbox", "test"]).optional(),
});

// Search Query Validation
export const searchQuerySchema = z.object({
  query: z.string()
    .min(1, "Search query is required")
    .max(100, "Search query must be less than 100 characters")
    .trim(),
  filters: z.object({
    type: z.enum(["clients", "workflows", "appointments", "messages"]).optional(),
    dateRange: z.object({
      start: z.number(),
      end: z.number(),
    }).optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
});

// File Upload Validation
export const fileUploadSchema = z.object({
  fileName: z.string()
    .min(1, "File name is required")
    .max(255, "File name must be less than 255 characters"),
  fileSize: z.number()
    .min(1, "File size must be greater than 0")
    .max(50 * 1024 * 1024, "File size must be less than 50MB"), // 50MB limit
  mimeType: z.string()
    .regex(/^(image|video|application|text)\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*$/, "Invalid file type"),
  tag: z.enum(["before", "after", "reference", "raw", "document"]),
});

// Bulk Operation Validation
export const bulkOperationSchema = z.object({
  action: z.enum(["delete", "archive", "tag", "export", "message"]),
  resourceType: z.enum(["clients", "workflows", "appointments", "messages"]),
  resourceIds: z.array(z.string()).min(1, "At least one resource must be selected"),
  options: z.record(z.any()).optional(), // Additional options per operation type
});

// Export request validation
export const exportRequestSchema = z.object({
  resourceType: z.enum(["clients", "workflows", "appointments", "messages", "analytics"]),
  format: z.enum(["csv", "xlsx", "json", "pdf"]),
  dateRange: z.object({
    start: z.number(),
    end: z.number(),
  }).optional(),
  filters: z.record(z.any()).optional(),
  includeFields: z.array(z.string()).optional(),
});

// Utility function to sanitize HTML content
export const sanitizeHtml = (input: string): string => {
  // Basic XSS prevention - remove script tags, event handlers, etc.
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<applet[^>]*>.*?<\/applet>/gi, '');
};

// Utility function to validate and sanitize URLs
export const validateAndSanitizeUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
};

// Type exports for TypeScript
export type OrganizationProfile = z.infer<typeof organizationProfileSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type ClientProfile = z.infer<typeof clientProfileSchema>;
export type MessageTemplate = z.infer<typeof messageTemplateSchema>;
export type WorkflowData = z.infer<typeof workflowSchema>;
export type AppointmentData = z.infer<typeof appointmentSchema>;
export type TeamInvite = z.infer<typeof teamInviteSchema>;
export type SecuritySettings = z.infer<typeof securitySettingsSchema>;
export type IntegrationConfig = z.infer<typeof integrationConfigSchema>;
export type ApiKeyConfig = z.infer<typeof apiKeyConfigSchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type FileUpload = z.infer<typeof fileUploadSchema>;
export type BulkOperation = z.infer<typeof bulkOperationSchema>;
export type ExportRequest = z.infer<typeof exportRequestSchema>;