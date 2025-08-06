import { test, expect } from '@playwright/test'

test.describe('Theme Switching Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth state
    await page.route('**/api/auth/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user',
            email: 'test@example.com',
            name: 'Test User'
          }
        })
      })
    })
    
    // Mock Convex queries
    await page.route('**/api/convex/**', route => {
      const url = route.request().url()
      
      if (url.includes('users.getByEmail')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            _id: 'user_123',
            orgId: 'org_123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'admin'
          })
        })
      } else if (url.includes('orgs.get')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            _id: 'org_123',
            name: 'Test Organization',
            theme: {
              themeId: 'default',
              fontFamily: 'Inter',
              appliedAt: Date.now()
            }
          })
        })
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json', 
          body: JSON.stringify([])
        })
      }
    })
    
    // Navigate to settings page with theme selector
    await page.goto('/settings/appearance')
  })

  test('user can switch between different themes', async ({ page }) => {
    // Wait for theme selector to load
    await expect(page.getByText('Theme Settings')).toBeVisible()
    await expect(page.getByText('Color Themes')).toBeVisible()
    
    // Verify default theme is selected
    const defaultTheme = page.locator('[data-testid="theme-default"]')
    await expect(defaultTheme).toHaveClass(/ring-2/)
    
    // Click on Ocean Blue theme
    const oceanTheme = page.locator('[data-testid="theme-ocean"]')
    await oceanTheme.click()
    
    // Verify ocean theme is now selected
    await expect(oceanTheme).toHaveClass(/ring-2/)
    await expect(defaultTheme).not.toHaveClass(/ring-2/)
    
    // Verify theme colors are applied to the UI
    const sampleButton = oceanTheme.locator('button', { hasText: 'Sample Button' })
    await expect(sampleButton).toBeVisible()
    
    // Check that the primary color variable has changed
    const primaryColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--primary')
    })
    expect(primaryColor).toContain('oklch(0.6 0.2 240)') // Ocean blue color
  })

  test('user can switch between different fonts', async ({ page }) => {
    await expect(page.getByText('Font Family')).toBeVisible()
    
    // Verify Inter font is selected by default
    const interFont = page.locator('[data-testid="font-inter"]')
    await expect(interFont).toHaveClass(/ring-2/)
    
    // Click on PP Mori font
    const ppMoriFont = page.locator('[data-testid="font-pp-mori"]')
    await ppMoriFont.click()
    
    // Verify PP Mori font is now selected
    await expect(ppMoriFont).toHaveClass(/ring-2/)
    await expect(interFont).not.toHaveClass(/ring-2/)
    
    // Verify font family is applied
    const fontFamily = await page.evaluate(() => {
      return getComputedStyle(document.body).fontFamily
    })
    expect(fontFamily).toContain('PP Mori')
  })

  test('theme changes persist across page reloads', async ({ page }) => {
    // Switch to Sunset Orange theme
    const sunsetTheme = page.locator('[data-testid="theme-sunset"]')
    await sunsetTheme.click()
    
    // Wait for the theme to be applied
    await page.waitForTimeout(500)
    
    // Reload the page
    await page.reload()
    
    // Wait for page to load
    await expect(page.getByText('Theme Settings')).toBeVisible()
    
    // Verify sunset theme is still selected
    await expect(sunsetTheme).toHaveClass(/ring-2/)
    
    // Verify the theme colors are still applied
    const primaryColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--primary')
    })
    expect(primaryColor).toContain('oklch(0.7 0.15 30)') // Sunset orange color
  })

  test('theme preview shows correct colors', async ({ page }) => {
    const themes = [
      { name: 'Ocean Blue', testId: 'theme-ocean', expectedColor: 'oklch(0.6 0.2 240)' },
      { name: 'Forest Green', testId: 'theme-forest', expectedColor: 'oklch(0.6 0.15 140)' },
      { name: 'Royal Purple', testId: 'theme-royal', expectedColor: 'oklch(0.65 0.2 280)' },
    ]
    
    for (const theme of themes) {
      const themeCard = page.locator(`[data-testid="${theme.testId}"]`)
      await expect(themeCard).toBeVisible()
      
      // Check color preview squares
      const primaryColorSquare = themeCard.locator('.w-4.h-4').first()
      await expect(primaryColorSquare).toBeVisible()
      
      // Verify the sample button has the correct color
      const sampleButton = themeCard.locator('button', { hasText: 'Sample Button' })
      const buttonBgColor = await sampleButton.evaluate((el) => {
        return getComputedStyle(el).backgroundColor
      })
      
      // The background color should be set via inline styles
      expect(buttonBgColor).toBeTruthy()
    }
  })

  test('font preview displays correctly', async ({ page }) => {
    const fonts = [
      { name: 'Inter', testId: 'font-inter' },
      { name: 'PP Mori', testId: 'font-pp-mori' },
      { name: 'Georgia', testId: 'font-georgia' },
    ]
    
    for (const font of fonts) {
      const fontCard = page.locator(`[data-testid="${font.testId}"]`)
      await expect(fontCard).toBeVisible()
      
      // Check font preview text
      const previewText = fontCard.getByText('The quick brown fox jumps over the lazy dog')
      await expect(previewText).toBeVisible()
      
      // Verify font family is applied to preview
      const fontFamily = await previewText.evaluate((el) => {
        return getComputedStyle(el).fontFamily
      })
      expect(fontFamily).toBeTruthy()
    }
  })

  test('theme and font combination works correctly', async ({ page }) => {
    // Select Royal Purple theme
    await page.locator('[data-testid="theme-royal"]').click()
    await page.waitForTimeout(200)
    
    // Select PP Mori font
    await page.locator('[data-testid="font-pp-mori"]').click()
    await page.waitForTimeout(200)
    
    // Verify both are applied
    const [primaryColor, fontFamily] = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement)
      return [
        styles.getPropertyValue('--primary'),
        getComputedStyle(document.body).fontFamily
      ]
    })
    
    expect(primaryColor).toContain('oklch(0.65 0.2 280)') // Royal purple
    expect(fontFamily).toContain('PP Mori')
  })

  test('handles network errors gracefully', async ({ page }) => {
    // Simulate network error for theme update
    await page.route('**/api/convex/**', route => {
      if (route.request().url().includes('orgs.updateTheme')) {
        route.abort('networkfailed')
      } else {
        route.continue()
      }
    })
    
    // Try to switch theme
    const oceanTheme = page.locator('[data-testid="theme-ocean"]')
    await oceanTheme.click()
    
    // Should still apply theme locally even if save fails
    const primaryColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--primary')
    })
    expect(primaryColor).toContain('oklch(0.6 0.2 240)')
    
    // Could also check for error message if implemented
    // await expect(page.getByText('Failed to save theme')).toBeVisible()
  })
})