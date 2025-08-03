import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const redirectUri = `${appUrl || "http://localhost:3000"}/api/auth/google/callback`;

    // Test the exact parameters that would be sent to Google
    const testParams = {
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    };

    // Check if we can generate a valid OAuth URL
    const oauthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    oauthUrl.searchParams.set("client_id", clientId || "");
    oauthUrl.searchParams.set("redirect_uri", redirectUri);
    oauthUrl.searchParams.set("response_type", "code");
    oauthUrl.searchParams.set(
      "scope",
      "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events",
    );
    oauthUrl.searchParams.set("access_type", "offline");
    oauthUrl.searchParams.set("prompt", "consent");

    return NextResponse.json({
      success: true,
      environment: {
        clientId: {
          exists: !!clientId,
          length: clientId?.length || 0,
          preview: clientId ? `${clientId.substring(0, 20)}...` : "Not set",
          valid:
            clientId && clientId.length > 10 && !clientId.includes("your_"),
        },
        clientSecret: {
          exists: !!clientSecret,
          length: clientSecret?.length || 0,
          preview: clientSecret
            ? `${clientSecret.substring(0, 20)}...`
            : "Not set",
          valid:
            clientSecret &&
            clientSecret.length > 10 &&
            !clientSecret.includes("your_"),
        },
        appUrl: {
          exists: !!appUrl,
          value: appUrl || "Not set",
          valid: appUrl && appUrl !== "http://localhost:3000",
        },
        redirectUri: {
          value: redirectUri,
          valid:
            redirectUri.includes("localhost:3000") ||
            redirectUri.includes("https://"),
        },
      },
      testParams,
      oauthUrl: oauthUrl.toString(),
      troubleshooting: {
        invalidClient: {
          possibleCauses: [
            "Client ID doesn't match Google Cloud Console",
            "Client Secret doesn't match Google Cloud Console",
            "Redirect URI doesn't match Google Cloud Console",
            "Environment variables not loaded correctly",
          ],
          steps: [
            "1. Go to Google Cloud Console > APIs & Services > Credentials",
            "2. Check that your OAuth 2.0 Client ID matches NEXT_PUBLIC_GOOGLE_CLIENT_ID",
            "3. Check that your Client Secret matches GOOGLE_CLIENT_SECRET",
            "4. Verify Authorized redirect URIs includes: http://localhost:3000/api/auth/google/callback",
            "5. Verify Authorized JavaScript origins includes: http://localhost:3000",
          ],
        },
      },
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
