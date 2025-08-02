import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const envVars = {
      GOOGLE_CLIENT_ID: {
        exists: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        value: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
          ? `${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.substring(0, 20)}...`
          : "Not set",
        valid:
          process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID &&
          process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID !==
            "your_google_client_id" &&
          process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.length > 10,
      },
      GOOGLE_CLIENT_SECRET: {
        exists: !!process.env.GOOGLE_CLIENT_SECRET,
        value: process.env.GOOGLE_CLIENT_SECRET
          ? `${process.env.GOOGLE_CLIENT_SECRET.substring(0, 20)}...`
          : "Not set",
        valid:
          process.env.GOOGLE_CLIENT_SECRET &&
          process.env.GOOGLE_CLIENT_SECRET !== "your_google_client_secret" &&
          process.env.GOOGLE_CLIENT_SECRET.length > 10,
      },
      NEXT_PUBLIC_APP_URL: {
        exists: !!process.env.NEXT_PUBLIC_APP_URL,
        value: process.env.NEXT_PUBLIC_APP_URL || "Not set",
        valid:
          process.env.NEXT_PUBLIC_APP_URL &&
          process.env.NEXT_PUBLIC_APP_URL !== "http://localhost:3000",
      },
    };

    return NextResponse.json({
      success: true,
      environment: envVars,
      timestamp: new Date().toISOString(),
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
