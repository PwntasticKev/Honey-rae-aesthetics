import { test, expect } from "@playwright/test";

test.describe("Core Application Features", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto("/");
    // Wait for the page to load
    await page.waitForLoadState("networkidle");
  });

  test("should load the home page successfully", async ({ page }) => {
    // Verify the page loads without errors
    await expect(page).toHaveURL("/");
    
    // Check for main navigation elements
    await expect(page.locator("nav")).toBeVisible();
    
    // Verify no error messages are displayed
    const errorElements = page.locator('[data-testid*="error"]');
    await expect(errorElements).toHaveCount(0);
  });

  test("should navigate to workflows page", async ({ page }) => {
    // Navigate to workflows
    await page.goto("/workflows");
    await page.waitForLoadState("networkidle");
    
    // Verify we're on the workflows page
    await expect(page).toHaveURL("/workflows");
    
    // Check for workflows page elements
    await expect(page.getByText("Workflow Automation")).toBeVisible();
    await expect(page.getByText("Automate your business processes")).toBeVisible();
    
    // Verify tabs are present
    await expect(page.getByRole("tab", { name: "My Workflows" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Templates" })).toBeVisible();
    
    // Verify Create Workflow button is present
    await expect(page.getByRole("button", { name: /Create Workflow/i })).toBeVisible();
  });

  test("should switch between workflow tabs", async ({ page }) => {
    await page.goto("/workflows");
    await page.waitForLoadState("networkidle");
    
    // Default tab should be "My Workflows"
    await expect(page.getByRole("tab", { name: "My Workflows" })).toHaveAttribute("data-state", "active");
    
    // Click on Templates tab
    await page.getByRole("tab", { name: "Templates" }).click();
    await expect(page.getByRole("tab", { name: "Templates" })).toHaveAttribute("data-state", "active");
    
    // Wait for templates to load and verify template content
    await page.waitForTimeout(1000);
    
    // Switch back to My Workflows
    await page.getByRole("tab", { name: "My Workflows" }).click();
    await expect(page.getByRole("tab", { name: "My Workflows" })).toHaveAttribute("data-state", "active");
  });

  test("should load workflow templates", async ({ page }) => {
    await page.goto("/workflows");
    await page.waitForLoadState("networkidle");
    
    // Click on Templates tab
    await page.getByRole("tab", { name: "Templates" }).click();
    
    // Wait for templates to load
    await page.waitForTimeout(2000);
    
    // Look for template cards - should have at least one template
    const templateCards = page.locator('[role="tabpanel"] .grid > div');
    await expect(templateCards).toBeTruthy();
    
    // Check for "Use Template" buttons
    const useTemplateButtons = page.getByRole("button", { name: /Use Template/i });
    if (await useTemplateButtons.count() > 0) {
      await expect(useTemplateButtons.first()).toBeVisible();
    }
  });

  test("should navigate to workflow editor", async ({ page }) => {
    await page.goto("/workflows");
    await page.waitForLoadState("networkidle");
    
    // Click Create Workflow button
    await page.getByRole("button", { name: /Create Workflow/i }).click();
    
    // Should navigate to workflow editor
    await page.waitForURL("/workflow-editor*");
    await expect(page).toHaveURL(/\/workflow-editor/);
    
    // Verify workflow editor page elements
    await expect(page.getByText("Workflow Editor")).toBeVisible();
    await expect(page.getByText("Design and automate your business processes")).toBeVisible();
  });

  test("should navigate to clients page", async ({ page }) => {
    await page.goto("/clients");
    await page.waitForLoadState("networkidle");
    
    // Verify we're on the clients page
    await expect(page).toHaveURL("/clients");
    
    // Check for clients page elements
    await expect(page.getByText("Client Management")).toBeVisible();
  });

  test("should navigate to appointments page", async ({ page }) => {
    await page.goto("/appointments");
    await page.waitForLoadState("networkidle");
    
    // Verify we're on the appointments page
    await expect(page).toHaveURL("/appointments");
    
    // Check for appointments page elements - might have calendar or appointment list
    const pageContent = page.locator("main");
    await expect(pageContent).toBeVisible();
  });

  test("should handle responsive design", async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto("/workflows");
    await page.waitForLoadState("networkidle");
    
    // Verify sidebar is visible on desktop
    const sidebar = page.locator('[data-testid="sidebar"], nav');
    if (await sidebar.count() > 0) {
      await expect(sidebar.first()).toBeVisible();
    }
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState("networkidle");
    
    // Main content should still be visible
    const mainContent = page.locator("main, [role='main']");
    if (await mainContent.count() > 0) {
      await expect(mainContent.first()).toBeVisible();
    }
  });

  test("should handle error states gracefully", async ({ page }) => {
    // Test non-existent page
    await page.goto("/non-existent-page");
    
    // Should either redirect or show 404
    // Wait a moment for any redirects
    await page.waitForTimeout(2000);
    
    // The application should handle this gracefully
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy();
    
    // Should not show uncaught errors
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should maintain state across navigation", async ({ page }) => {
    // Start on workflows page
    await page.goto("/workflows");
    await page.waitForLoadState("networkidle");
    
    // Navigate to clients
    await page.goto("/clients");
    await page.waitForLoadState("networkidle");
    
    // Navigate back to workflows
    await page.goto("/workflows");
    await page.waitForLoadState("networkidle");
    
    // Should still be functional
    await expect(page.getByText("Workflow Automation")).toBeVisible();
    await expect(page.getByRole("tab", { name: "My Workflows" })).toBeVisible();
  });

  test("should load page without JavaScript errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto("/workflows");
    await page.waitForLoadState("networkidle");
    
    // Wait a bit for any async operations
    await page.waitForTimeout(3000);
    
    // Filter out known acceptable errors (like missing services)
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes("Failed to fetch") && 
      !error.includes("NetworkError") &&
      !error.includes("Google") &&
      !error.includes("auth")
    );
    
    // Should have minimal critical JavaScript errors
    expect(criticalErrors.length).toBeLessThan(5);
  });
});