import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return new Response(
      `
      <html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'OAUTH_ERROR',
              platformId: 'instagram',
              error: '${error}'
            }, '${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}');
            window.close();
          </script>
        </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      },
    );
  }

  if (!code) {
    return new Response(
      `
      <html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'OAUTH_ERROR',
              platformId: 'instagram',
              error: 'No authorization code received'
            }, '${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}');
            window.close();
          </script>
        </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      },
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://graph.facebook.com/v18.0/oauth/access_token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID || "",
          client_secret: process.env.FACEBOOK_CLIENT_SECRET || "",
          code: code,
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/instagram/callback`,
        }),
      },
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(
        tokenData.error.message || "Failed to exchange code for token",
      );
    }

    // Get user info
    const userResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${tokenData.access_token}`,
    );
    const userData = await userResponse.json();

    return new Response(
      `
      <html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'OAUTH_SUCCESS',
              platformId: 'instagram',
              accountName: '${userData.name || "Instagram User"}',
              accessToken: '${tokenData.access_token}',
              refreshToken: '${tokenData.refresh_token || ""}',
              expiresAt: ${Date.now() + tokenData.expires_in * 1000}
            }, '${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}');
            window.close();
          </script>
        </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      },
    );
  } catch (error) {
    console.error("Instagram OAuth error:", error);
    return new Response(
      `
      <html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'OAUTH_ERROR',
              platformId: 'instagram',
              error: '${error instanceof Error ? error.message : "Unknown error"}'
            }, '${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}');
            window.close();
          </script>
        </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      },
    );
  }
}
