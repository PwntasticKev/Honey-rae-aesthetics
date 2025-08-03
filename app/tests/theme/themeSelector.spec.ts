import { test, expect } from "@playwright/test";
import { TestHelpers } from "../utils/testHelpers";
import { mockOrg, mockUser } from "../fixtures/mockData";

test.describe("Theme Selector", () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);

    // Mock Convex queries for theme testing
    await helpers.mockConvexFunction("users.getByEmail", mockUser);
    await helpers.mockConvexFunction("orgs.get", mockOrg);

    await helpers.clearSession();
  });

  test("should load saved theme on page load", async ({ page }) => {
    // Navigate to settings page
    await helpers.navigateTo("/settings");
    await helpers.waitForConvexQueries();

    // Check that the saved theme is applied
    await helpers.waitForThemeApplication();

    const primaryColor = await page.evaluate(() => {
      return document.documentElement.style.getPropertyValue("--primary");
    });

    expect(primaryColor).toBeTruthy();
  });

  test("should persist font selection across page navigation", async ({
    page,
  }) => {
    // Navigate to settings page
    await helpers.navigateTo("/settings");
    await helpers.waitForConvexQueries();

    // Select a different font
    await page.click('[data-testid="font-selector"]');
    await page.click('[data-testid="font-option-poppins"]');

    // Wait for font to be applied
    await page.waitForTimeout(1000);

    // Verify font is applied
    const fontFamily = await page.evaluate(() => {
      return document.body.style.fontFamily;
    });
    expect(fontFamily).toContain("Poppins");

    // Navigate to another page
    await helpers.navigateTo("/clients");
    await helpers.waitForConvexQueries();

    // Verify font persists
    const persistedFont = await page.evaluate(() => {
      return document.body.style.fontFamily;
    });
    expect(persistedFont).toContain("Poppins");
  });

  test("should apply theme colors to UI elements", async ({ page }) => {
    // Navigate to settings page
    await helpers.navigateTo("/settings");
    await helpers.waitForConvexQueries();

    // Select ocean theme
    await page.click('[data-testid="theme-selector"]');
    await page.click('[data-testid="theme-option-ocean"]');

    // Wait for theme to be applied
    await helpers.waitForThemeApplication();

    // Check that theme colors are applied to CSS variables
    const primaryColor = await page.evaluate(() => {
      return document.documentElement.style.getPropertyValue("--primary");
    });

    expect(primaryColor).toContain("oklch(0.6 0.2 240)");
  });

  test("should save theme changes to database", async ({ page }) => {
    let updateThemeCalled = false;
    let savedThemeData: any = null;

    // Mock the updateTheme mutation
    await page.route("**/api/convex/**", async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData?.path === "orgs:updateTheme") {
        updateThemeCalled = true;
        savedThemeData = postData.args;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to settings page
    await helpers.navigateTo("/settings");
    await helpers.waitForConvexQueries();

    // Change theme
    await page.click('[data-testid="theme-selector"]');
    await page.click('[data-testid="theme-option-sunset"]');

    // Wait for save operation
    await page.waitForTimeout(2000);

    // Verify that updateTheme was called
    expect(updateThemeCalled).toBe(true);
    expect(savedThemeData).toBeTruthy();
    expect(savedThemeData.theme.themeId).toBe("sunset");
  });

  test("should handle theme loading errors gracefully", async ({ page }) => {
    // Mock a failed org query
    await helpers.mockConvexFunction("orgs.get", null);

    // Navigate to settings page
    await helpers.navigateTo("/settings");
    await helpers.waitForConvexQueries();

    // Should still load with default theme
    const primaryColor = await page.evaluate(() => {
      return document.documentElement.style.getPropertyValue("--primary");
    });

    // Should have some default color applied
    expect(primaryColor).toBeTruthy();
  });
});
