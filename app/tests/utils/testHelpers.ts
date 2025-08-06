import { Page, expect } from "@playwright/test";

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for the application to be fully loaded
   */
  async waitForAppLoad() {
    // Wait for the main layout to be visible
    await this.page.waitForSelector('[data-testid="app-layout"]', {
      timeout: 10000,
    });

    // Wait for any loading spinners to disappear
    await this.page
      .waitForSelector('[data-testid="loading-spinner"]', {
        state: "hidden",
        timeout: 5000,
      })
      .catch(() => {
        // Loading spinner might not exist, that's OK
      });
  }

  /**
   * Login with test credentials
   */
  async login(email = "test@honeyrae.com", password = "testpassword") {
    await this.page.goto("/login");
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    await this.waitForAppLoad();
  }

  /**
   * Navigate to a specific page and wait for it to load
   */
  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.waitForAppLoad();
  }

  /**
   * Wait for Convex queries to complete
   */
  async waitForConvexQueries() {
    // Wait for any pending network requests to complete
    await this.page.waitForLoadState("networkidle");

    // Wait a bit more for Convex subscriptions to settle
    await this.page.waitForTimeout(1000);
  }

  /**
   * Check if an element exists without throwing
   */
  async elementExists(selector: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get element text content safely
   */
  async getTextContent(selector: string): Promise<string | null> {
    try {
      const element = await this.page.waitForSelector(selector, {
        timeout: 5000,
      });
      return await element.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Take a screenshot with a descriptive name
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }

  /**
   * Wait for theme to be applied
   */
  async waitForThemeApplication() {
    // Wait for CSS custom properties to be set
    await this.page.waitForFunction(
      () => {
        const root = document.documentElement;
        const primary = root.style.getPropertyValue("--primary");
        return primary && primary !== "";
      },
      { timeout: 5000 },
    );
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      // Check for authenticated user indicators
      await this.page.waitForSelector('[data-testid="user-menu"]', {
        timeout: 2000,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Mock Convex functions for testing
   */
  async mockConvexFunction(functionName: string, mockData: any) {
    await this.page.route("**/api/convex/**", async (route) => {
      const url = route.request().url();
      if (url.includes(functionName)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockData),
        });
      } else {
        await route.continue();
      }
    });
  }

  /**
   * Clear all local storage and cookies
   */
  async clearSession() {
    try {
      await this.page.evaluate(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          // Ignore storage access errors in test environment
          console.log("Storage access denied, skipping clear");
        }
      });
      await this.page.context().clearCookies();
    } catch (error) {
      // Ignore storage access errors
      console.log("Session clear failed, continuing test");
    }
  }

  /**
   * Set up test data in localStorage
   */
  async setTestData(key: string, value: any) {
    try {
      await this.page.evaluate(
        ({ key, value }) => {
          try {
            localStorage.setItem(key, JSON.stringify(value));
          } catch (e) {
            console.log("Storage access denied, skipping setTestData");
          }
        },
        { key, value },
      );
    } catch (error) {
      console.log("setTestData failed, continuing test");
    }
  }

  /**
   * Get data from localStorage
   */
  async getTestData(key: string): Promise<any> {
    try {
      return await this.page.evaluate((key) => {
        try {
          const data = localStorage.getItem(key);
          return data ? JSON.parse(data) : null;
        } catch (e) {
          console.log("Storage access denied, returning null");
          return null;
        }
      }, key);
    } catch (error) {
      console.log("getTestData failed, returning null");
      return null;
    }
  }
}
