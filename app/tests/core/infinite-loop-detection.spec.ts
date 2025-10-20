import { test, expect } from '@playwright/test';

test.describe('Infinite Loop and Performance Detection', () => {
  test('workflow editor should not have infinite re-renders or performance issues', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let renderCount = 0;
    
    // Track console errors and warnings
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        errors.push(text);
      }
      if (msg.type() === 'warn' && text.includes('Warning: Maximum update depth exceeded')) {
        warnings.push(text);
      }
    });

    // Monitor for excessive React renders by injecting tracking code
    await page.addInitScript(() => {
      const originalError = console.error;
      console.error = (...args) => {
        const message = args.join(' ');
        if (message.includes('Maximum update depth exceeded')) {
          window.__INFINITE_LOOP_DETECTED__ = true;
        }
        originalError(...args);
      };
    });

    // Navigate to workflow editor
    const startTime = Date.now();
    await page.goto('/workflow-editor');
    
    // Wait for initial load with timeout
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    const loadTime = Date.now() - startTime;
    
    // Page should load within reasonable time (10 seconds max)
    expect(loadTime).toBeLessThan(10000);
    
    // Check for React Flow components
    await expect(page.locator('.react-flow__controls')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Add Nodes')).toBeVisible();
    
    // Wait a bit more to catch any delayed infinite loops
    await page.waitForTimeout(3000);
    
    // Check if infinite loop was detected
    const infiniteLoopDetected = await page.evaluate(() => window.__INFINITE_LOOP_DETECTED__);
    expect(infiniteLoopDetected).toBeFalsy();
    
    // Check for maximum update depth errors
    const hasMaxUpdateError = errors.some(error => 
      error.includes('Maximum update depth exceeded') ||
      error.includes('infinite') ||
      error.includes('Too many re-renders')
    );
    expect(hasMaxUpdateError).toBeFalsy();
    
    // Check for React warnings about performance
    const hasPerformanceWarnings = warnings.some(warning =>
      warning.includes('Maximum update depth') ||
      warning.includes('Cannot update a component while rendering')
    );
    expect(hasPerformanceWarnings).toBeFalsy();
    
    // Test interaction doesn't cause performance issues
    const interactionStart = Date.now();
    await page.getByText('Trigger').click();
    await page.waitForTimeout(1000);
    const interactionTime = Date.now() - interactionStart;
    
    // Interactions should be responsive (under 2 seconds)
    expect(interactionTime).toBeLessThan(2000);
    
    // Final check for any new errors after interaction
    await page.waitForTimeout(2000);
    const postInteractionInfiniteLoop = await page.evaluate(() => window.__INFINITE_LOOP_DETECTED__);
    expect(postInteractionInfiniteLoop).toBeFalsy();
    
    // Log results for debugging
    console.log(`Workflow Editor Performance Test Results:
      - Load time: ${loadTime}ms
      - Interaction time: ${interactionTime}ms
      - Errors: ${errors.length}
      - Warnings: ${warnings.length}
      - Infinite loop detected: ${infiniteLoopDetected}
    `);
  });

  test('all major pages should load without infinite loops', async ({ page }) => {
    const pages = [
      '/workflows',
      '/clients', 
      '/appointments',
      '/settings'
    ];

    for (const pagePath of pages) {
      const errors: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.addInitScript(() => {
        window.__INFINITE_LOOP_DETECTED__ = false;
        const originalError = console.error;
        console.error = (...args) => {
          const message = args.join(' ');
          if (message.includes('Maximum update depth exceeded')) {
            window.__INFINITE_LOOP_DETECTED__ = true;
          }
          originalError(...args);
        };
      });

      const startTime = Date.now();
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle', { timeout: 8000 });
      const loadTime = Date.now() - startTime;

      // Page should load reasonably fast
      expect(loadTime).toBeLessThan(8000);

      // Wait for potential delayed infinite loops
      await page.waitForTimeout(2000);

      // Check for infinite loops
      const infiniteLoopDetected = await page.evaluate(() => window.__INFINITE_LOOP_DETECTED__);
      expect(infiniteLoopDetected).toBeFalsy();

      // Check for update depth errors
      const hasMaxUpdateError = errors.some(error => 
        error.includes('Maximum update depth exceeded')
      );
      expect(hasMaxUpdateError).toBeFalsy();

      console.log(`Page ${pagePath}: Load time ${loadTime}ms, No infinite loops`);
    }
  });
});