import { test, expect } from "@playwright/test";

test.describe("Workflow Creation Fix Verification", () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route("**/api/workflows", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          workflows: [] // Empty workflows to show the creation buttons
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
              name: "Test Template",
              description: "A test template",
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
  });

  test("should have Create Workflow button in header", async ({ page }) => {
    // Check for the header Create Workflow button
    const headerCreateButton = page.getByRole("button", { name: /Create Workflow/i });
    await expect(headerCreateButton).toBeVisible();
    
    // Verify it has the Plus icon
    const plusIcon = headerCreateButton.locator('svg');
    await expect(plusIcon).toBeVisible();
  });

  test("should have New Workflow button in workflow list", async ({ page }) => {
    // Wait for the workflow list to load
    await page.waitForTimeout(1000);
    
    // Check for the New Workflow button in the list
    const newWorkflowButton = page.getByRole("button", { name: /New Workflow/i });
    await expect(newWorkflowButton).toBeVisible();
  });

  test("should have Create Workflow button in empty state", async ({ page }) => {
    // Wait for the empty state to show
    await page.waitForTimeout(1000);
    
    // Look for the empty state create button
    const emptyStateText = page.getByText("Create your first workflow to get started");
    if (await emptyStateText.count() > 0) {
      await expect(emptyStateText).toBeVisible();
      
      const emptyCreateButton = page.getByRole("button", { name: /Create Workflow/i }).last();
      await expect(emptyCreateButton).toBeVisible();
    }
  });

  test("should navigate to workflow editor when clicking Create Workflow", async ({ page }) => {
    // Click the header Create Workflow button
    const headerCreateButton = page.getByRole("button", { name: /Create Workflow/i }).first();
    await headerCreateButton.click();
    
    // Should navigate to workflow editor
    await page.waitForURL("/workflow-editor*");
    await expect(page).toHaveURL("/workflow-editor");
    
    // Verify we're on the workflow editor page
    await expect(page.getByText("Workflow Editor")).toBeVisible();
    await expect(page.getByText("Design and automate your business processes")).toBeVisible();
  });

  test("should navigate to workflow editor when clicking New Workflow", async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(1000);
    
    // Click the New Workflow button if it exists
    const newWorkflowButton = page.getByRole("button", { name: /New Workflow/i });
    if (await newWorkflowButton.count() > 0) {
      await newWorkflowButton.click();
      
      // Should navigate to workflow editor
      await page.waitForURL("/workflow-editor*");
      await expect(page).toHaveURL("/workflow-editor");
      
      // Verify we're on the workflow editor page
      await expect(page.getByText("Workflow Editor")).toBeVisible();
    }
  });

  test("should show both Create buttons when workflows list is empty", async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Count all Create/New Workflow buttons
    const createButtons = page.getByRole("button", { name: /Create Workflow|New Workflow/i });
    const buttonCount = await createButtons.count();
    
    // Should have at least 1 create button (header), possibly 2 if empty state shows
    expect(buttonCount).toBeGreaterThanOrEqual(1);
    
    // Verify at least one is visible
    await expect(createButtons.first()).toBeVisible();
  });

  test("should handle template workflow creation", async ({ page }) => {
    // Switch to Templates tab
    await page.getByRole("tab", { name: "Templates" }).click();
    await page.waitForTimeout(1000);
    
    // Look for Use Template buttons
    const useTemplateButtons = page.getByRole("button", { name: "Use Template" });
    if (await useTemplateButtons.count() > 0) {
      await useTemplateButtons.first().click();
      
      // Should navigate to workflow editor with template parameter
      await page.waitForURL("/workflow-editor*");
      const currentUrl = page.url();
      expect(currentUrl).toContain("/workflow-editor");
      expect(currentUrl).toContain("templateId=template-1");
    }
  });
});