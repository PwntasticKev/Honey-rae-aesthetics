import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    return NextResponse.json({
      success: true,
      environment: {
        clientId: {
          exists: !!clientId,
          length: clientId?.length || 0,
          value: clientId || "NOT_SET",
          preview: clientId ? `${clientId.substring(0, 20)}...` : "NOT_SET",
        },
        clientSecret: {
          exists: !!clientSecret,
          length: clientSecret?.length || 0,
          value: clientSecret ? "SET (hidden)" : "NOT_SET",
          preview: clientSecret
            ? `${clientSecret.substring(0, 10)}...`
            : "NOT_SET",
        },
        appUrl: {
          exists: !!appUrl,
          value: appUrl || "NOT_SET",
        },
      },
      message: "Check if these match your .env.local file",
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
