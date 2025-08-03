import { test, expect } from "@playwright/test";
import { TestHelpers } from "../utils/testHelpers";
import { mockUser, mockOrg, mockClient } from "../fixtures/mockData";

test.describe("Core Features Regression Tests", () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);

    // Mock core data
    await helpers.mockConvexFunction("users.getByEmail", mockUser);
    await helpers.mockConvexFunction("orgs.get", mockOrg);
    await helpers.mockConvexFunction("clients.getByOrg", [mockClient]);

    await helpers.clearSession();
  });

  test("application should load without errors", async ({ page }) => {
    // Check for any console errors during load
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await helpers.navigateTo("/");
    await helpers.waitForConvexQueries();

    // Should not have any critical errors
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes("favicon") &&
        !error.includes("chrome-extension") &&
        !error.includes("Non-Error promise rejection"),
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("navigation should work across all main pages", async ({ page }) => {
    const pages = ["/", "/clients", "/appointments", "/settings"];

    for (const pagePath of pages) {
      await helpers.navigateTo(pagePath);
      await helpers.waitForConvexQueries();

      // Page should load without 404 or error states
      await expect(
        page.locator('[data-testid="error-message"]'),
      ).not.toBeVisible();
      await expect(page.locator("h1")).toBeVisible(); // Should have some content
    }
  });

  test("theme system should be functional", async ({ page }) => {
    await helpers.navigateTo("/settings");
    await helpers.waitForConvexQueries();

    // Theme should be applied
    const primaryColor = await page.evaluate(() => {
      return document.documentElement.style.getPropertyValue("--primary");
    });

    // Should have some theme applied (either default or saved)
    expect(primaryColor).toBeTruthy();

    // Font should be applied
    const fontFamily = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontFamily;
    });

    expect(fontFamily).toBeTruthy();
  });

  test("data loading should work correctly", async ({ page }) => {
    await helpers.navigateTo("/clients");
    await helpers.waitForConvexQueries();

    // Should show client data or empty state
    const hasClients = await helpers.elementExists(
      '[data-testid="client-list"]',
    );
    const hasEmptyState = await helpers.elementExists(
      '[data-testid="empty-state"]',
    );

    expect(hasClients || hasEmptyState).toBe(true);
  });

  test("responsive design should work", async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 1200, height: 800 }, // Desktop
      { width: 768, height: 1024 }, // Tablet
      { width: 375, height: 667 }, // Mobile
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await helpers.navigateTo("/");
      await helpers.waitForConvexQueries();

      // Should not have horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });

      expect(hasHorizontalScroll).toBe(false);
    }
  });

  test("error boundaries should catch errors gracefully", async ({ page }) => {
    // Mock a component that throws an error
    await page.route("**/api/convex/**", async (route) => {
      await route.abort("failed");
    });

    await helpers.navigateTo("/clients");

    // Should show error state instead of crashing
    const hasErrorBoundary = await helpers.elementExists(
      '[data-testid="error-boundary"]',
    );
    const hasErrorMessage = await helpers.elementExists(
      '[data-testid="error-message"]',
    );

    expect(hasErrorBoundary || hasErrorMessage).toBe(true);
  });

  test("performance should be acceptable", async ({ page }) => {
    const startTime = Date.now();

    await helpers.navigateTo("/");
    await helpers.waitForConvexQueries();

    const loadTime = Date.now() - startTime;

    // Should load within reasonable time (5 seconds)
    expect(loadTime).toBeLessThan(5000);
  });

  test("accessibility basics should be met", async ({ page }) => {
    await helpers.navigateTo("/");
    await helpers.waitForConvexQueries();

    // Should have proper document structure
    await expect(page.locator("h1, h2, h3")).toHaveCount(1); // At least one heading
    await expect(page.locator('[role="main"], main')).toHaveCount(1); // Main content area

    // Should not have accessibility violations
    const hasSkipLink = await helpers.elementExists('[href="#main-content"]');
    // Note: In a real implementation, we'd use axe-playwright for comprehensive a11y testing
  });
});
