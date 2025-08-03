import { test, expect } from "@playwright/test";
import { TestHelpers } from "../utils/testHelpers";
import { mockUser, mockOrg, mockClient } from "../fixtures/mockData";

test.describe("Complete User Journey", () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);

    // Mock all necessary Convex queries
    await helpers.mockConvexFunction("users.getByEmail", mockUser);
    await helpers.mockConvexFunction("orgs.get", mockOrg);
    await helpers.mockConvexFunction("clients.getByOrg", [mockClient]);

    await helpers.clearSession();
  });

  test("should complete full onboarding flow", async ({ page }) => {
    // 1. User lands on login page
    await helpers.navigateTo("/login");

    // 2. User logs in
    await helpers.login();

    // 3. Verify user is redirected to dashboard
    await expect(page).toHaveURL("/");
    await helpers.waitForConvexQueries();

    // 4. User navigates to settings to customize theme
    await helpers.navigateTo("/settings");

    // 5. User selects a theme
    await page.click('[data-testid="theme-selector"]');
    await page.click('[data-testid="theme-option-ocean"]');

    // 6. User selects a font
    await page.click('[data-testid="font-selector"]');
    await page.click('[data-testid="font-option-poppins"]');

    // 7. Verify theme is applied
    await helpers.waitForThemeApplication();
    const fontFamily = await page.evaluate(
      () => document.body.style.fontFamily,
    );
    expect(fontFamily).toContain("Poppins");

    // 8. User navigates to clients page
    await helpers.navigateTo("/clients");

    // 9. Verify theme persists across navigation
    const persistedFont = await page.evaluate(
      () => document.body.style.fontFamily,
    );
    expect(persistedFont).toContain("Poppins");

    // 10. User views client list
    await expect(page.locator('[data-testid="client-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="client-item"]')).toHaveCount(1);
  });

  test("should handle calendar integration workflow", async ({ page }) => {
    // Mock successful OAuth flow
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

    // Mock calendar API
    await page.route("**/googleapis.com/calendar/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: "primary",
              summary: "Test Calendar",
              primary: true,
            },
          ],
        }),
      });
    });

    // 1. User logs in
    await helpers.login();

    // 2. User navigates to appointments
    await helpers.navigateTo("/appointments");

    // 3. User connects Google Calendar
    await page.click('[data-testid="connect-google-calendar"]');

    // 4. Mock popup window interaction
    await page.evaluate(() => {
      // Simulate successful OAuth
      localStorage.setItem("google_calendar_access_token", "mock_token");
      window.dispatchEvent(new Event("storage"));
    });

    // 5. Verify calendar is connected
    await expect(
      page.locator('[data-testid="calendar-connected"]'),
    ).toBeVisible();

    // 6. Verify calendar events are loaded
    await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();
  });

  test("should handle error states gracefully", async ({ page }) => {
    // Mock failed Convex queries
    await helpers.mockConvexFunction("users.getByEmail", null);

    // 1. User tries to access protected page
    await helpers.navigateTo("/clients");

    // 2. Should be redirected to login or show error
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test("should maintain state across page refreshes", async ({ page }) => {
    // 1. User logs in and customizes theme
    await helpers.login();
    await helpers.navigateTo("/settings");

    // 2. Select theme and font
    await page.click('[data-testid="theme-selector"]');
    await page.click('[data-testid="theme-option-sunset"]');
    await page.click('[data-testid="font-selector"]');
    await page.click('[data-testid="font-option-roboto"]');

    // 3. Wait for changes to be applied
    await helpers.waitForThemeApplication();

    // 4. Refresh the page
    await page.reload();
    await helpers.waitForConvexQueries();

    // 5. Verify theme and font are still applied
    const fontFamily = await page.evaluate(
      () => document.body.style.fontFamily,
    );
    expect(fontFamily).toContain("Roboto");

    const primaryColor = await page.evaluate(() => {
      return document.documentElement.style.getPropertyValue("--primary");
    });
    expect(primaryColor).toBeTruthy();
  });

  test("should handle network connectivity issues", async ({ page }) => {
    // 1. User logs in successfully
    await helpers.login();

    // 2. Simulate network failure
    await page.route("**/api/convex/**", async (route) => {
      await route.abort("failed");
    });

    // 3. User tries to navigate to clients
    await helpers.navigateTo("/clients");

    // 4. Should show appropriate error state
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();

    // 5. Restore network
    await page.unroute("**/api/convex/**");
    await helpers.mockConvexFunction("clients.getByOrg", [mockClient]);

    // 6. User retries
    await page.click('[data-testid="retry-button"]');

    // 7. Should load successfully
    await expect(page.locator('[data-testid="client-list"]')).toBeVisible();
  });

  test("should support responsive design", async ({ page }) => {
    // 1. Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await helpers.login();

    // 2. Verify sidebar is visible
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();

    // 3. Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });

    // 4. Verify mobile navigation
    await expect(
      page.locator('[data-testid="mobile-menu-button"]'),
    ).toBeVisible();

    // 5. Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });

    // 6. Verify layout adapts appropriately
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
  });
});
