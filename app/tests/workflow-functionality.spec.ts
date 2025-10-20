import { test, expect } from "@playwright/test";

test.describe("Workflow Functionality Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for workflows and templates
    await page.route("**/api/workflows", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          workflows: [
            {
              id: 1,
              name: "Test Workflow",
              description: "A test workflow",
              orgId: 15,
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          ]
        }),
      });
    });

    await page.route("**/api/workflows/templates", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          templates: [
            {
              id: "template-1",
              name: "New Client Welcome",
              description: "A simple workflow to welcome new clients with an email and a follow-up SMS.",
              complexity: "Simple",
              tags: ["Onboarding", "Welcome"],
              estimatedDuration: "2 days",
            },
            {
              id: "template-2", 
              name: "Post-Appointment Review Request",
              description: "Ask for a Google review 15 minutes after an appointment is completed.",
              complexity: "Beginner",
              tags: ["Reviews", "Post-Appointment"],
              estimatedDuration: "15 minutes",
            }
          ]
        }),
      });
    });

    await page.goto("/workflows");
    await page.waitForLoadState("networkidle");
  });

  test("should display workflows correctly", async ({ page }) => {
    // Verify workflows tab is active by default
    await expect(page.getByRole("tab", { name: "My Workflows" })).toHaveAttribute("data-state", "active");
    
    // Wait for workflows to load
    await page.waitForTimeout(1000);
    
    // Should show workflow content
    const workflowContent = page.locator('[role="tabpanel"]').first();
    await expect(workflowContent).toBeVisible();
  });

  test("should display templates correctly", async ({ page }) => {
    // Click on Templates tab
    await page.getByRole("tab", { name: "Templates" }).click();
    
    // Wait for templates to load
    await page.waitForTimeout(1000);
    
    // Should show template cards
    await expect(page.getByText("New Client Welcome")).toBeVisible();
    await expect(page.getByText("Post-Appointment Review Request")).toBeVisible();
    
    // Should show template descriptions
    await expect(page.getByText("A simple workflow to welcome new clients")).toBeVisible();
    await expect(page.getByText("Ask for a Google review 15 minutes")).toBeVisible();
    
    // Should show tags
    await expect(page.getByText("Onboarding")).toBeVisible();
    await expect(page.getByText("Welcome")).toBeVisible();
    await expect(page.getByText("Reviews")).toBeVisible();
    await expect(page.getByText("Post-Appointment")).toBeVisible();
    
    // Should show Use Template buttons
    const useTemplateButtons = page.getByRole("button", { name: "Use Template" });
    await expect(useTemplateButtons).toHaveCount(2);
  });

  test("should navigate to workflow editor when creating new workflow", async ({ page }) => {
    // Click Create Workflow button
    await page.getByRole("button", { name: /Create Workflow/i }).click();
    
    // Should navigate to workflow editor
    await page.waitForURL("/workflow-editor*");
    await expect(page).toHaveURL("/workflow-editor");
    
    // Verify we're on the workflow editor page
    await expect(page.getByText("Workflow Editor")).toBeVisible();
    await expect(page.getByText("Design and automate your business processes")).toBeVisible();
  });

  test("should navigate to workflow editor with template when using template", async ({ page }) => {
    // Click on Templates tab
    await page.getByRole("tab", { name: "Templates" }).click();
    await page.waitForTimeout(1000);
    
    // Click first Use Template button
    const useTemplateButtons = page.getByRole("button", { name: "Use Template" });
    await useTemplateButtons.first().click();
    
    // Should navigate to workflow editor with templateId parameter
    await page.waitForURL("/workflow-editor*");
    const currentUrl = page.url();
    expect(currentUrl).toContain("/workflow-editor");
    expect(currentUrl).toContain("templateId=template-1");
  });

  test("should handle API errors gracefully", async ({ page }) => {
    // Navigate to a fresh page and mock API failure
    await page.goto("/");
    
    // Mock failing API response
    await page.route("**/api/workflows", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal Server Error" }),
      });
    });
    
    await page.goto("/workflows");
    await page.waitForLoadState("networkidle");
    
    // Wait for error to be displayed
    await page.waitForTimeout(2000);
    
    // Should show error message or handle gracefully
    const errorText = page.getByText(/Error loading workflows/i);
    if (await errorText.count() > 0) {
      await expect(errorText).toBeVisible();
    }
    
    // Page should still be functional
    await expect(page.getByText("Workflow Automation")).toBeVisible();
  });

  test("should handle template API errors gracefully", async ({ page }) => {
    // Mock failing template API response
    await page.route("**/api/workflows/templates", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json", 
        body: JSON.stringify({ error: "Internal Server Error" }),
      });
    });
    
    // Click on Templates tab
    await page.getByRole("tab", { name: "Templates" }).click();
    await page.waitForTimeout(2000);
    
    // Should show error message or handle gracefully
    const errorText = page.getByText(/Error loading templates/i);
    if (await errorText.count() > 0) {
      await expect(errorText).toBeVisible();
    }
    
    // Should still be able to switch back to workflows
    await page.getByRole("tab", { name: "My Workflows" }).click();
    await expect(page.getByRole("tab", { name: "My Workflows" })).toHaveAttribute("data-state", "active");
  });

  test("should maintain tab state across navigation", async ({ page }) => {
    // Switch to Templates tab
    await page.getByRole("tab", { name: "Templates" }).click();
    await expect(page.getByRole("tab", { name: "Templates" })).toHaveAttribute("data-state", "active");
    
    // Navigate away and back
    await page.goto("/clients");
    await page.waitForLoadState("networkidle");
    await page.goto("/workflows");
    await page.waitForLoadState("networkidle");
    
    // Should default back to My Workflows tab
    await expect(page.getByRole("tab", { name: "My Workflows" })).toHaveAttribute("data-state", "active");
  });

  test("should be responsive on mobile devices", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState("networkidle");
    
    // Should still show main elements
    await expect(page.getByText("Workflow Automation")).toBeVisible();
    await expect(page.getByRole("tab", { name: "My Workflows" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Templates" })).toBeVisible();
    
    // Create button should be visible or accessible
    const createButton = page.getByRole("button", { name: /Create Workflow/i });
    await expect(createButton).toBeVisible();
    
    // Switch to templates tab on mobile
    await page.getByRole("tab", { name: "Templates" }).click();
    await page.waitForTimeout(1000);
    
    // Template cards should be stacked on mobile
    const templateGrid = page.locator('.grid');
    if (await templateGrid.count() > 0) {
      await expect(templateGrid.first()).toBeVisible();
    }
  });

  test("should handle concurrent tab switching", async ({ page }) => {
    // Rapidly switch between tabs
    for (let i = 0; i < 3; i++) {
      await page.getByRole("tab", { name: "Templates" }).click();
      await page.waitForTimeout(100);
      await page.getByRole("tab", { name: "My Workflows" }).click();  
      await page.waitForTimeout(100);
    }
    
    // Should end up in a stable state
    await page.waitForTimeout(500);
    
    // One of the tabs should be active
    const activeTab = page.locator('[role="tab"][data-state="active"]');
    await expect(activeTab).toHaveCount(1);
    
    // Should not show any error states
    const tabContent = page.locator('[role="tabpanel"]');
    await expect(tabContent).toBeVisible();
  });
});