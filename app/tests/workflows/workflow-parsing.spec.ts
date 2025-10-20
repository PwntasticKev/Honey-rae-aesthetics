import { test, expect } from '@playwright/test';

test.describe('Workflow Pages Parsing and Compilation', () => {
  test('workflow editor page loads without parsing errors', async ({ page }) => {
    // Capture any console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate to workflow editor
    await page.goto('/workflow-editor');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check that the page title is correct
    await expect(page.getByText('Workflow Editor')).toBeVisible();
    
    // Check that React Flow is loaded (look for controls)
    await expect(page.locator('.react-flow__controls')).toBeVisible();
    
    // Check that the node palette is visible
    await expect(page.getByText('Add Nodes')).toBeVisible();
    
    // Verify no parsing errors in console
    expect(errors.filter(error => 
      error.includes('Parsing ecmascript') || 
      error.includes('Unterminated') ||
      error.includes('SyntaxError')
    )).toHaveLength(0);
  });

  test('workflows list page loads without parsing errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/workflows');
    await page.waitForLoadState('networkidle');
    
    // Check basic page elements load
    await expect(page.getByText('Workflows')).toBeVisible();
    
    // Verify no parsing errors
    expect(errors.filter(error => 
      error.includes('Parsing ecmascript') || 
      error.includes('Unterminated') ||
      error.includes('SyntaxError')
    )).toHaveLength(0);
  });

  test('workflow components can be interacted with', async ({ page }) => {
    await page.goto('/workflow-editor');
    await page.waitForLoadState('networkidle');
    
    // Test adding a new trigger node
    await page.getByText('Trigger').click();
    
    // Wait a moment for the node to be added
    await page.waitForTimeout(500);
    
    // Check that a trigger node was added to the flow
    await expect(page.locator('.react-flow__node')).toHaveCount(4); // 3 initial + 1 new
  });
});