import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { awsService, isAWSConfigured, isDevelopment } from "@/lib/aws";

// GET /api/aws/health - Check AWS services health
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Perform health check
    const healthStatus = await awsService.healthCheck();

    // Get configuration status
    const configStatus = {
      configured: isAWSConfigured(),
      developmentMode: isDevelopment,
      environment: process.env.NODE_ENV,
      services: {
        s3: {
          configured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.S3_BUCKET_NAME),
          bucket: process.env.S3_BUCKET_NAME || "not-configured",
          region: process.env.AWS_REGION || "us-east-1",
        },
        ses: {
          configured: !!(process.env.AWS_ACCESS_KEY_ID),
          fromEmail: process.env.SES_FROM_EMAIL || "not-configured",
          fromName: process.env.SES_FROM_NAME || "Honey Rae Aesthetics",
        },
        sns: {
          configured: !!(process.env.AWS_ACCESS_KEY_ID),
          senderName: process.env.SNS_SENDER_NAME || "HoneyRae",
          defaultRegion: process.env.SNS_DEFAULT_REGION || "US",
        },
        cloudfront: {
          configured: !!process.env.CLOUDFRONT_DOMAIN,
          domain: process.env.CLOUDFRONT_DOMAIN || "not-configured",
        },
      },
    };

    // Test basic functionality in development mode
    let testResults = null;
    if (isDevelopment) {
      testResults = {
        s3: {
          upload: "Mock upload successful",
          listFiles: "Mock file listing successful",
          generateUrl: "Mock URL generation successful",
        },
        ses: {
          sendEmail: "Mock email send successful",
          listTemplates: "Mock template listing successful",
        },
        sns: {
          sendSMS: "Mock SMS send successful",
          getAttributes: "Mock attribute retrieval successful",
        },
      };
    }

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      health: healthStatus,
      configuration: configStatus,
      ...(testResults && { tests: testResults }),
      recommendations: generateRecommendations(configStatus),
    });

  } catch (error: any) {
    console.error("Error checking AWS health:", error);
    return NextResponse.json(
      { 
        status: "unhealthy",
        error: "Health check failed",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Helper function to generate configuration recommendations
function generateRecommendations(configStatus: any): string[] {
  const recommendations: string[] = [];

  if (!configStatus.configured) {
    recommendations.push("Configure AWS credentials (AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY) for production use");
  }

  if (!configStatus.services.s3.configured) {
    recommendations.push("Set S3_BUCKET_NAME environment variable for file storage");
  }

  if (!configStatus.services.ses.configured) {
    recommendations.push("Configure AWS SES for email delivery");
  }

  if (!configStatus.services.cloudfront.configured) {
    recommendations.push("Consider setting up CloudFront CDN for faster file delivery");
  }

  if (configStatus.developmentMode) {
    recommendations.push("Running in development mode - AWS services are mocked");
    recommendations.push("Set up production AWS credentials for live deployment");
  }

  if (configStatus.services.s3.region !== "us-east-1") {
    recommendations.push("Consider using us-east-1 region for S3 to reduce costs");
  }

  return recommendations;
}