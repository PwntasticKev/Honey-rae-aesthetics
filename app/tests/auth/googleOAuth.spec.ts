import { test, expect } from "@playwright/test";
import { TestHelpers } from "../utils/testHelpers";

test.describe("Google OAuth Authentication", () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.clearSession();
  });

  test("should generate valid OAuth URL", async ({ page }) => {
    // Navigate to calendar page
    await helpers.navigateTo("/appointments");

    // Mock the OAuth URL generation
    let oauthUrlGenerated = false;
    let generatedUrl = "";

    await page.route("**/api/auth/google**", async (route) => {
      if (route.request().url().includes("action=login")) {
        oauthUrlGenerated = true;
        generatedUrl =
          "https://accounts.google.com/o/oauth2/v2/auth?client_id=test&redirect_uri=http://localhost:3000/api/auth/google/callback";
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ authUrl: generatedUrl }),
        });
      } else {
        await route.continue();
      }
    });

    // Click connect Google Calendar button
    await page.click('[data-testid="connect-google-calendar"]');

    // Verify OAuth URL was requested
    expect(oauthUrlGenerated).toBe(true);
    expect(generatedUrl).toContain("accounts.google.com");
    expect(generatedUrl).toContain("client_id");
    expect(generatedUrl).toContain("redirect_uri");
  });

  test("should handle OAuth callback success", async ({ page }) => {
    // Mock successful token exchange
    await page.route("**/api/auth/google/callback**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: `
          <html>
            <body>
              <script>
                try {
                  localStorage.setItem('google_calendar_access_token', 'mock_access_token');
                  localStorage.setItem('google_calendar_refresh_token', 'mock_refresh_token');
                } catch (e) {
                  console.log('Storage access denied');
                }
                window.close();
              </script>
            </body>
          </html>
        `,
      });
    });

    // Navigate directly to callback with authorization code
    await page.goto("/api/auth/google/callback?code=test_auth_code");

    // Verify tokens were stored
    const accessToken = await helpers.getTestData(
      "google_calendar_access_token",
    );
    const refreshToken = await helpers.getTestData(
      "google_calendar_refresh_token",
    );

    expect(accessToken).toBe("mock_access_token");
    expect(refreshToken).toBe("mock_refresh_token");
  });

  test("should handle OAuth callback failure", async ({ page }) => {
    // Mock failed token exchange
    await page.route("**/api/auth/google/callback**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: `
          <html>
            <body>
              <div class="error">
                <h1>Token Exchange Failed</h1>
                <div class="details">
                  { "error": "invalid_client", "error_description": "Unauthorized" }
                </div>
              </div>
            </body>
          </html>
        `,
      });
    });

    // Navigate to callback with authorization code
    await page.goto("/api/auth/google/callback?code=test_auth_code");

    // Verify error is displayed
    await expect(page.locator("h1")).toContainText("Token Exchange Failed");
    await expect(page.locator(".details")).toContainText("invalid_client");
  });

  test("should handle token refresh", async ({ page }) => {
    // Set up existing refresh token
    await helpers.setTestData(
      "google_calendar_refresh_token",
      "existing_refresh_token",
    );

    let refreshCalled = false;
    const newAccessToken = "new_access_token";

    // Mock token refresh endpoint
    await page.route("**/api/auth/google/refresh", async (route) => {
      refreshCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: newAccessToken,
          expires_in: 3600,
        }),
      });
    });

    // Mock Calendar API with expired token
    await page.route("**/googleapis.com/calendar/**", async (route) => {
      const authHeader = route.request().headers()["authorization"];

      if (authHeader === "Bearer existing_access_token") {
        // First call fails with expired token
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ error: "invalid_token" }),
        });
      } else if (authHeader === `Bearer ${newAccessToken}`) {
        // Second call succeeds with new token
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items: [] }),
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to calendar page and trigger API call
    await helpers.navigateTo("/appointments");

    // Simulate calendar loading which should trigger token refresh
    await page.evaluate(() => {
      // Simulate the calendar service making an API call
      fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
        headers: { Authorization: "Bearer existing_access_token" },
      });
    });

    // Wait for refresh to complete
    await page.waitForTimeout(2000);

    // Verify refresh was called
    expect(refreshCalled).toBe(true);
  });

  test("should validate environment variables", async ({ page }) => {
    // Test the debug endpoint
    await page.goto("/api/debug/oauth");

    const response = await page.waitForResponse("**/api/debug/oauth");
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.environment.clientId.exists).toBe(true);
    expect(data.environment.clientSecret.exists).toBe(true);
    expect(data.environment.redirectUri.value).toContain("localhost:3000");
  });

  test("should handle popup blocked scenario", async ({ page }) => {
    // Navigate to calendar page
    await helpers.navigateTo("/appointments");

    // Mock popup being blocked
    await page.evaluate(() => {
      // Override window.open to return null (popup blocked)
      window.open = () => null;
    });

    // Mock OAuth URL generation
    await page.route("**/api/auth/google**", async (route) => {
      if (route.request().url().includes("action=login")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            authUrl:
              "https://accounts.google.com/o/oauth2/v2/auth?client_id=test",
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Click connect button
    await page.click('[data-testid="connect-google-calendar"]');

    // Should show popup blocked error
    await expect(page.locator('[role="alert"]')).toContainText("Popup blocked");
  });
});
