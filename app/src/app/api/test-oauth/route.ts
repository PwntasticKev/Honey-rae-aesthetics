import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    // Test the exact parameters that would be sent to Google
    const testParams = {
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${appUrl || "http://localhost:3000"}/api/auth/google/callback`,
    };

    return NextResponse.json({
      success: true,
      environment: {
        clientId: {
          exists: !!clientId,
          length: clientId?.length || 0,
          preview: clientId ? `${clientId.substring(0, 20)}...` : "Not set",
        },
        clientSecret: {
          exists: !!clientSecret,
          length: clientSecret?.length || 0,
          preview: clientSecret
            ? `${clientSecret.substring(0, 20)}...`
            : "Not set",
        },
        appUrl: {
          exists: !!appUrl,
          value: appUrl || "Not set",
        },
      },
      testParams,
      message:
        "Check if these parameters match your Google Cloud Console configuration",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
