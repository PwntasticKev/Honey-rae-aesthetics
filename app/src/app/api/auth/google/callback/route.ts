import { NextRequest, NextResponse } from "next/server";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/google/callback`;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("OAuth error:", error);
      const errorHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Connection Failed</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 40px; 
                background: #f8f9fa;
              }
              .error { 
                background: white; 
                padding: 30px; 
                border-radius: 8px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                max-width: 400px;
                margin: 0 auto;
              }
              .xmark { 
                color: #dc3545; 
                font-size: 48px; 
                margin-bottom: 20px;
              }
              h1 { color: #333; margin-bottom: 10px; }
              p { color: #666; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="error">
              <div class="xmark">✗</div>
              <h1>Connection Failed</h1>
              <p>Failed to connect Google Calendar: ${error}</p>
              <button onclick="window.close()">Close</button>
            </div>
          </body>
        </html>
      `;
      return new NextResponse(errorHtml, {
        headers: { "Content-Type": "text/html" },
      });
    }

    if (!code) {
      const errorHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Connection Failed</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 40px; 
                background: #f8f9fa;
              }
              .error { 
                background: white; 
                padding: 30px; 
                border-radius: 8px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                max-width: 400px;
                margin: 0 auto;
              }
              .xmark { 
                color: #dc3545; 
                font-size: 48px; 
                margin-bottom: 20px;
              }
              h1 { color: #333; margin-bottom: 10px; }
              p { color: #666; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="error">
              <div class="xmark">✗</div>
              <h1>Connection Failed</h1>
              <p>No authorization code received from Google.</p>
              <button onclick="window.close()">Close</button>
            </div>
          </body>
        </html>
      `;
      return new NextResponse(errorHtml, {
        headers: { "Content-Type": "text/html" },
      });
    }

    console.log("Exchanging authorization code for access token...");
    console.log("🔍 Debug info:");
    console.log("- Client ID exists:", !!GOOGLE_CLIENT_ID);
    console.log("- Client Secret exists:", !!GOOGLE_CLIENT_SECRET);
    console.log("- Authorization code length:", code?.length);
    console.log("- Redirect URI:", REDIRECT_URI);

    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      const errorHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Connection Failed</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 40px; 
                background: #f8f9fa;
              }
              .error { 
                background: white; 
                padding: 30px; 
                border-radius: 8px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                max-width: 400px;
                margin: 0 auto;
              }
              .xmark { 
                color: #dc3545; 
                font-size: 48px; 
                margin-bottom: 20px;
              }
              h1 { color: #333; margin-bottom: 10px; }
              p { color: #666; margin-bottom: 20px; }
              .details { 
                background: #f8f9fa; 
                padding: 10px; 
                border-radius: 4px; 
                font-family: monospace; 
                font-size: 12px; 
                margin-top: 10px;
                text-align: left;
                max-height: 100px;
                overflow-y: auto;
              }
            </style>
          </head>
          <body>
            <div class="error">
              <div class="xmark">✗</div>
              <h1>Token Exchange Failed</h1>
              <p>Failed to exchange authorization code for access token.</p>
              <div class="details">
                <strong>Error Details:</strong><br/>
                ${errorText}
              </div>
              <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
            </div>
          </body>
        </html>
      `;
      return new NextResponse(errorHtml, {
        headers: { "Content-Type": "text/html" },
      });
    }

    const tokenData = await tokenResponse.json();
    console.log("Access token received successfully");

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    // Create a success page that will store tokens in localStorage and close the popup
    const successHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Calendar Connected</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 40px; 
              background: #f8f9fa;
            }
            .success { 
              background: white; 
              padding: 30px; 
              border-radius: 8px; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              max-width: 400px;
              margin: 0 auto;
            }
            .checkmark { 
              color: #28a745; 
              font-size: 48px; 
              margin-bottom: 20px;
            }
            h1 { color: #333; margin-bottom: 10px; }
            p { color: #666; margin-bottom: 20px; }
            .spinner { 
              border: 3px solid #f3f3f3; 
              border-top: 3px solid #3498db; 
              border-radius: 50%; 
              width: 30px; 
              height: 30px; 
              animation: spin 1s linear infinite;
              margin: 20px auto;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="success">
            <div class="checkmark">✓</div>
            <h1>Success!</h1>
            <p>Your Google Calendar has been connected successfully.</p>
            <div class="spinner"></div>
            <p>Closing window...</p>
          </div>
          <script>
            // Store tokens in localStorage
            localStorage.setItem('google_calendar_access_token', '${accessToken}');
            ${refreshToken ? `localStorage.setItem('google_calendar_refresh_token', '${refreshToken}');` : ""}
            
            // Close the popup after a short delay
            setTimeout(() => {
              window.close();
            }, 2000);
          </script>
        </body>
      </html>
    `;

    return new NextResponse(successHtml, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("OAuth callback error:", error);
    const errorHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Connection Failed</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 40px; 
                background: #f8f9fa;
              }
              .error { 
                background: white; 
                padding: 30px; 
                border-radius: 8px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                max-width: 400px;
                margin: 0 auto;
              }
              .xmark { 
                color: #dc3545; 
                font-size: 48px; 
                margin-bottom: 20px;
              }
              h1 { color: #333; margin-bottom: 10px; }
              p { color: #666; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="error">
              <div class="xmark">✗</div>
              <h1>Connection Failed</h1>
              <p>An error occurred while connecting to Google Calendar: ${error instanceof Error ? error.message : String(error)}</p>
              <button onclick="window.close()">Close</button>
            </div>
          </body>
        </html>
      `;
    return new NextResponse(errorHtml, {
      headers: { "Content-Type": "text/html" },
    });
  }
}
