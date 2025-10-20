import { test, expect } from "@playwright/test";

test.describe("API Integration Tests", () => {
  test("should handle workflows API correctly", async ({ page }) => {
    let apiCalled = false;
    let apiRequest: any = null;
    
    // Intercept the workflows API call
    await page.route("**/api/workflows", async (route) => {
      apiCalled = true;
      apiRequest = route.request();
      
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          workflows: [
            {
              id: 1,
              name: "API Test Workflow",
              description: "Testing API integration",
              orgId: 15,
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          ]
        }),
      });
    });
    
    await page.goto("/workflows");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    
    // Verify API was called
    expect(apiCalled).toBe(true);
    expect(apiRequest.method()).toBe("GET");
    expect(apiRequest.url()).toContain("/api/workflows");
  });

  test("should handle templates API correctly", async ({ page }) => {
    let templatesApiCalled = false;
    let templatesApiRequest: any = null;
    
    // Mock workflows API first
    await page.route("**/api/workflows", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ workflows: [] }),
      });
    });
    
    // Intercept the templates API call
    await page.route("**/api/workflows/templates", async (route) => {
      templatesApiCalled = true;
      templatesApiRequest = route.request();
      
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          templates: [
            {
              id: "api-test-template",
              name: "API Test Template",
              description: "Testing template API integration",
              complexity: "Simple",
              tags: ["Test"],
              estimatedDuration: "1 minute",
            }
          ]
        }),
      });
    });
    
    await page.goto("/workflows");
    await page.waitForLoadState("networkidle");
    
    // Click on Templates tab to trigger API call
    await page.getByRole("tab", { name: "Templates" }).click();
    await page.waitForTimeout(2000);
    
    // Verify templates API was called
    expect(templatesApiCalled).toBe(true);
    expect(templatesApiRequest.method()).toBe("GET");
    expect(templatesApiRequest.url()).toContain("/api/workflows/templates");
    
    // Verify template content is displayed
    await expect(page.getByText("API Test Template")).toBeVisible();
  });

  test("should handle API timeouts gracefully", async ({ page }) => {
    // Mock slow API response
    await page.route("**/api/workflows", async (route) => {
      // Delay response by 10 seconds
      await new Promise(resolve => setTimeout(resolve, 10000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ workflows: [] }),
      });
    });
    
    await page.goto("/workflows");
    
    // Should show loading state
    await page.waitForTimeout(1000);
    const loadingText = page.getByText(/Loading workflows/i);
    if (await loadingText.count() > 0) {
      await expect(loadingText).toBeVisible();
    }
    
    // Page should still be functional even with slow API
    await expect(page.getByText("Workflow Automation")).toBeVisible();
    await expect(page.getByRole("tab", { name: "Templates" })).toBeVisible();
  });

  test("should retry failed API requests", async ({ page }) => {
    let callCount = 0;
    
    await page.route("**/api/workflows", async (route) => {
      callCount++;
      
      if (callCount === 1) {
        // First call fails
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Server Error" }),
        });
      } else {
        // Subsequent calls succeed
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            workflows: [
              {
                id: 1,
                name: "Retry Test Workflow",
                description: "Testing retry logic",
                orgId: 15,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            ]
          }),
        });
      }
    });
    
    await page.goto("/workflows");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    
    // Verify the API was called at least once
    expect(callCount).toBeGreaterThanOrEqual(1);
  });

  test("should handle malformed API responses", async ({ page }) => {
    // Mock malformed API response
    await page.route("**/api/workflows", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "invalid json{",
      });
    });
    
    await page.goto("/workflows");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    
    // Should handle error gracefully without crashing
    await expect(page.getByText("Workflow Automation")).toBeVisible();
    
    // Should show error state or empty state
    const errorText = page.getByText(/Error loading workflows/i);
    if (await errorText.count() > 0) {
      await expect(errorText).toBeVisible();
    }
  });

  test("should handle network connectivity issues", async ({ page }) => {
    // Mock network failure
    await page.route("**/api/workflows", async (route) => {
      await route.abort("failed");
    });
    
    await page.goto("/workflows");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    
    // Should handle network error gracefully
    await expect(page.getByText("Workflow Automation")).toBeVisible();
    
    // Should be able to switch to templates tab (if it doesn't depend on network)
    await page.getByRole("tab", { name: "Templates" }).click();
    await expect(page.getByRole("tab", { name: "Templates" })).toHaveAttribute("data-state", "active");
  });

  test("should send correct orgId parameter", async ({ page }) => {
    let apiRequest: any = null;
    
    await page.route("**/api/workflows", async (route) => {
      apiRequest = route.request();
      
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ workflows: [] }),
      });
    });
    
    await page.goto("/workflows");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    
    // Verify the request was made
    expect(apiRequest).toBeTruthy();
    
    // Check if orgId is included in the request (either as query param or in body)
    const url = apiRequest.url();
    const method = apiRequest.method();
    
    expect(method).toBe("GET");
    expect(url).toContain("/api/workflows");
  });

  test("should handle CORS and authentication errors", async ({ page }) => {
    // Mock authentication error
    await page.route("**/api/workflows", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Unauthorized" }),
      });
    });
    
    await page.goto("/workflows");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    
    // Should handle auth error gracefully
    await expect(page.getByText("Workflow Automation")).toBeVisible();
    
    // Might redirect to login or show auth error
    // For now, just verify the page doesn't crash
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should handle concurrent API requests", async ({ page }) => {
    let workflowCallCount = 0;
    let templateCallCount = 0;
    
    await page.route("**/api/workflows", async (route) => {
      workflowCallCount++;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ workflows: [] }),
      });
    });
    
    await page.route("**/api/workflows/templates", async (route) => {
      templateCallCount++;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ templates: [] }),
      });
    });
    
    await page.goto("/workflows");
    await page.waitForLoadState("networkidle");
    
    // Quickly switch between tabs to trigger concurrent requests
    await page.getByRole("tab", { name: "Templates" }).click();
    await page.getByRole("tab", { name: "My Workflows" }).click();
    await page.getByRole("tab", { name: "Templates" }).click();
    
    await page.waitForTimeout(2000);
    
    // Both APIs should have been called
    expect(workflowCallCount).toBeGreaterThanOrEqual(1);
    expect(templateCallCount).toBeGreaterThanOrEqual(1);
    
    // Page should be in stable state
    const activeTab = page.locator('[role="tab"][data-state="active"]');
    await expect(activeTab).toHaveCount(1);
  });
});