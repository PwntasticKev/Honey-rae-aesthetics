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
              platformId: 'tiktok',
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
              platformId: 'tiktok',
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
      "https://open-api.tiktok.com/oauth/access_token/",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_key: process.env.NEXT_PUBLIC_TIKTOK_CLIENT_ID || "",
          client_secret: process.env.TIKTOK_CLIENT_SECRET || "",
          code: code,
          grant_type: "authorization_code",
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/tiktok/callback`,
        }),
      },
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(
        tokenData.error_description || "Failed to exchange code for token",
      );
    }

    // Get user info
    const userResponse = await fetch(
      `https://open-api.tiktok.com/user/info/?access_token=${tokenData.access_token}`,
    );
    const userData = await userResponse.json();

    return new Response(
      `
      <html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'OAUTH_SUCCESS',
              platformId: 'tiktok',
              accountName: '${userData.data?.display_name || "TikTok User"}',
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
    console.error("TikTok OAuth error:", error);
    return new Response(
      `
      <html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'OAUTH_ERROR',
              platformId: 'tiktok',
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
