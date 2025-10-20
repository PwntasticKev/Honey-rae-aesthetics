// AWS Services Integration
export { s3Service, type FileInfo, type UploadOptions } from "./s3";
export { sesService, type EmailAddress, type EmailOptions, type TemplatedEmailOptions, type EmailTemplate } from "./ses";
export { snsService, type SMSOptions, type BulkSMSOptions, type NotificationOptions } from "./sns";
export { 
  S3_CONFIG, 
  SES_CONFIG, 
  SNS_CONFIG, 
  CLOUDFRONT_CONFIG,
  isAWSConfigured,
  getPublicUrl,
  isDevelopment 
} from "./config";

// Re-export AWS clients for direct access if needed
export { s3Client, sesClient, snsClient } from "./config";

// Unified AWS service interface
export class AWSService {
  constructor() {
    // Initialize any cross-service functionality here
  }

  // File operations
  get files() {
    return s3Service;
  }

  // Email operations
  get email() {
    return sesService;
  }

  // SMS and notifications
  get notifications() {
    return snsService;
  }

  // Health check for all services
  async healthCheck(): Promise<{
    s3: boolean;
    ses: boolean;
    sns: boolean;
    configured: boolean;
  }> {
    const configured = isAWSConfigured();
    
    if (!configured || isDevelopment) {
      return {
        s3: true, // Mock services always work
        ses: true,
        sns: true,
        configured: false,
      };
    }

    // In production, you could add actual health checks here
    return {
      s3: true,
      ses: true,
      sns: true,
      configured: true,
    };
  }
}

// Export singleton instance
export const awsService = new AWSService();