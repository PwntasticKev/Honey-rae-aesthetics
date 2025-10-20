import { S3Client } from "@aws-sdk/client-s3";
import { SESClient } from "@aws-sdk/client-ses";
import { SNSClient } from "@aws-sdk/client-sns";

// AWS Configuration
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

// Validate AWS credentials
if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.warn("AWS credentials not found. Some features may not work in production.");
}

// AWS Client configurations
const awsConfig = {
  region: AWS_REGION,
  credentials: AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  } : undefined,
};

// Initialize AWS clients
export const s3Client = new S3Client(awsConfig);
export const sesClient = new SESClient(awsConfig);
export const snsClient = new SNSClient(awsConfig);

// S3 Configuration
export const S3_CONFIG = {
  bucket: process.env.S3_BUCKET_NAME || "honey-rae-aesthetics",
  region: AWS_REGION,
  // Different folders for different types of files
  folders: {
    profiles: "profiles/",
    treatments: "treatments/",
    beforeAfter: "before-after/",
    documents: "documents/",
    marketing: "marketing/",
    temp: "temp/",
  },
  // File size limits (in bytes)
  limits: {
    image: 10 * 1024 * 1024, // 10MB
    document: 50 * 1024 * 1024, // 50MB
    video: 100 * 1024 * 1024, // 100MB
  },
  // Allowed file types
  allowedTypes: {
    images: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    documents: ["application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    videos: ["video/mp4", "video/mpeg", "video/quicktime"],
  },
};

// SES Configuration
export const SES_CONFIG = {
  fromEmail: process.env.SES_FROM_EMAIL || "noreply@honeyraeasthetics.com",
  fromName: process.env.SES_FROM_NAME || "Honey Rae Aesthetics",
  replyToEmail: process.env.SES_REPLY_TO_EMAIL || "support@honeyraeasthetics.com",
  // Template IDs for different email types
  templates: {
    welcome: "honey-rae-welcome",
    appointmentReminder: "honey-rae-appointment-reminder", 
    appointmentConfirmation: "honey-rae-appointment-confirmation",
    aftercare: "honey-rae-aftercare",
    feedback: "honey-rae-feedback",
    birthday: "honey-rae-birthday",
    newsletter: "honey-rae-newsletter",
    passwordReset: "honey-rae-password-reset",
    accountActivation: "honey-rae-account-activation",
  },
};

// SNS Configuration
export const SNS_CONFIG = {
  // SMS settings
  sms: {
    senderName: process.env.SNS_SENDER_NAME || "HoneyRae",
    defaultRegion: process.env.SNS_DEFAULT_REGION || "US",
  },
  // Topics for different notification types
  topics: {
    appointmentAlerts: process.env.SNS_TOPIC_APPOINTMENTS,
    systemAlerts: process.env.SNS_TOPIC_SYSTEM,
    marketingAlerts: process.env.SNS_TOPIC_MARKETING,
  },
};

// CloudFront Configuration (for CDN)
export const CLOUDFRONT_CONFIG = {
  distributionDomain: process.env.CLOUDFRONT_DOMAIN,
  // Cache settings for different file types
  cachePolicies: {
    images: "max-age=31536000", // 1 year
    documents: "max-age=86400", // 1 day
    videos: "max-age=2592000", // 30 days
  },
};

// Environment checks
export const isAWSConfigured = () => {
  return !!(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && process.env.S3_BUCKET_NAME);
};

export const getPublicUrl = (key: string): string => {
  if (CLOUDFRONT_CONFIG.distributionDomain) {
    return `https://${CLOUDFRONT_CONFIG.distributionDomain}/${key}`;
  }
  return `https://${S3_CONFIG.bucket}.s3.${S3_CONFIG.region}.amazonaws.com/${key}`;
};

// Development mode fallbacks
export const isDevelopment = process.env.NODE_ENV === "development";

if (isDevelopment && !isAWSConfigured()) {
  console.log("🔧 Development mode: AWS services will use mock implementations");
}