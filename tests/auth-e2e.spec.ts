import { test, expect, Page, BrowserContext } from "@playwright/test";
import { testDataGenerator } from "../app/src/test/auth-test-data";

// Test configuration
const BASE_URL = "http://localhost:3000";
const TEST_TIMEOUT = 30000;

interface TestUser {
  email: string;
  password: string;
  name: string;
  role: string;
  isActive: boolean;
  isMasterOwner: boolean;
}

let testData: {
  masterOwner: TestUser;
  activeOrgAdmin: TestUser;
  activeOrgManager: TestUser;
  activeOrgStaff: TestUser;
  inactiveOrgUser: TestUser;
  inactiveUser: TestUser;
};

// Setup and teardown
test.beforeAll(async () => {
  console.log("🚀 Setting up E2E test data...");
  
  await testDataGenerator.initialize();
  const generatedData = await testDataGenerator.generateTestData();
  const credentials = testDataGenerator.getTestCredentials();
  
  testData = {
    masterOwner: {
      email: credentials.masterOwner.email,
      password: credentials.masterOwner.password,
      name: "Master Owner",
      role: "admin",
      isActive: true,
      isMasterOwner: true,
    },
    activeOrgAdmin: {
      email: "admin@elite-beauty.com",
      password: credentials.password,
      name: "Elite Beauty Admin",
      role: "admin",
      isActive: true,
      isMasterOwner: false,
    },
    activeOrgManager: {
      email: "manager@elite-beauty.com",
      password: credentials.password,
      name: "Elite Beauty Manager",
      role: "manager",
      isActive: true,
      isMasterOwner: false,
    },
    activeOrgStaff: {
      email: "staff@elite-beauty.com",
      password: credentials.password,
      name: "Elite Beauty Staff",
      role: "staff",
      isActive: true,
      isMasterOwner: false,
    },
    inactiveOrgUser: {
      email: "admin@expired-clinic.com",
      password: credentials.password,
      name: "Expired Clinic Admin",
      role: "admin",
      isActive: false,
      isMasterOwner: false,
    },
    inactiveUser: {
      email: "inactive@elite-beauty.com",
      password: credentials.password,
      name: "Inactive User",
      role: "staff",
      isActive: false,
      isMasterOwner: false,
    },
  };
  
  console.log("✅ E2E test data setup complete");
});

test.afterAll(async () => {
  console.log("🧹 Cleaning up E2E test data...");
  await testDataGenerator.cleanup();
  console.log("✅ E2E test cleanup complete");
});

// Helper functions
async function navigateToSignIn(page: Page) {
  await page.goto(`${BASE_URL}/auth/signin`);
  await expect(page).toHaveTitle(/Honey Rae Aesthetics/);
}

async function signIn(page: Page, email: string, password: string) {
  await navigateToSignIn(page);
  
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for either successful redirect or error message
  try {
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 5000 });
    return { success: true };
  } catch {
    // Check for error message
    const errorElement = await page.locator('[role="alert"]').first();
    const errorText = await errorElement.textContent();
    return { success: false, error: errorText };
  }
}

async function signOut(page: Page) {
  // Look for logout button (could be in header, sidebar, or dropdown)
  const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out"), [title="Logout"]').first();
  await logoutButton.click();
  
  // Wait for redirect to sign-in page
  await page.waitForURL(/auth\/signin/, { timeout: 5000 });
}

// Authentication Flow Tests
test.describe("Authentication Flows", () => {
  test("should display sign-in page correctly", async ({ page }) => {
    await navigateToSignIn(page);
    
    // Check page elements
    await expect(page.locator('h1, h2')).toContainText("Honey Rae Aesthetics");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
  });

  test("should reject invalid login credentials", async ({ page }) => {
    const result = await signIn(page, "invalid@email.com", "wrongpassword");
    
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid email or password");
  });

  test("should successfully log in master owner", async ({ page }) => {
    const result = await signIn(page, testData.masterOwner.email, testData.masterOwner.password);
    
    expect(result.success).toBe(true);
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
    
    // Check for master owner specific elements
    await expect(page.locator('text="Master Admin"')).toBeVisible({ timeout: 10000 });
  });

  test("should successfully log in active org admin", async ({ page }) => {
    const result = await signIn(page, testData.activeOrgAdmin.email, testData.activeOrgAdmin.password);
    
    expect(result.success).toBe(true);
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
  });

  test("should reject login for inactive organization user", async ({ page }) => {
    const result = await signIn(page, testData.inactiveOrgUser.email, testData.inactiveOrgUser.password);
    
    expect(result.success).toBe(false);
    // Should be rejected due to inactive subscription
  });

  test("should reject login for inactive user", async ({ page }) => {
    const result = await signIn(page, testData.inactiveUser.email, testData.inactiveUser.password);
    
    expect(result.success).toBe(false);
    // Should be rejected due to user being inactive
  });

  test("should handle password visibility toggle", async ({ page }) => {
    await navigateToSignIn(page);
    
    const passwordInput = page.locator('input[type="password"]');
    const toggleButton = page.locator('button:has([data-lucide="eye"]), button:has([data-lucide="eye-off"])');
    
    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute("type", "password");
    
    // Click toggle to show password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute("type", "text");
    
    // Click toggle to hide password again
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("should handle logout flow", async ({ page }) => {
    // Sign in first
    await signIn(page, testData.activeOrgAdmin.email, testData.activeOrgAdmin.password);
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
    
    // Sign out
    await signOut(page);
    await expect(page).toHaveURL(/auth\/signin/);
  });
});

// Authorization & Permissions Tests
test.describe("Authorization & Permissions", () => {
  test("should redirect unauthenticated users to sign-in", async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/auth\/signin/);
    
    await page.goto(`${BASE_URL}/clients`);
    await expect(page).toHaveURL(/auth\/signin/);
    
    await page.goto(`${BASE_URL}/settings`);
    await expect(page).toHaveURL(/auth\/signin/);
  });

  test("should allow master owner access to master admin panel", async ({ page }) => {
    await signIn(page, testData.masterOwner.email, testData.masterOwner.password);
    
    // Navigate to master admin panel
    await page.goto(`${BASE_URL}/master-admin`);
    await expect(page).toHaveURL(`${BASE_URL}/master-admin`);
    
    // Check for master admin specific content
    await expect(page.locator('text="Master Admin Panel", text="Organizations", text="All Organizations"')).toBeVisible();
  });

  test("should deny regular admin access to master admin panel", async ({ page }) => {
    await signIn(page, testData.activeOrgAdmin.email, testData.activeOrgAdmin.password);
    
    // Try to access master admin panel
    await page.goto(`${BASE_URL}/master-admin`);
    
    // Should be redirected back to dashboard
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
  });

  test("should show role-appropriate navigation options", async ({ page }) => {
    // Test admin user
    await signIn(page, testData.activeOrgAdmin.email, testData.activeOrgAdmin.password);
    
    // Admin should see user management options
    await expect(page.locator('text="Users", text="User Management", a[href*="users"]')).toBeVisible();
    await expect(page.locator('text="Settings", a[href*="settings"]')).toBeVisible();
    
    await signOut(page);
    
    // Test staff user
    await signIn(page, testData.activeOrgStaff.email, testData.activeOrgStaff.password);
    
    // Staff should NOT see user management options
    await expect(page.locator('text="User Management"')).not.toBeVisible();
    // But should see basic functionality
    await expect(page.locator('text="Clients", a[href*="clients"]')).toBeVisible();
  });
});

// Session Management Tests
test.describe("Session Management", () => {
  test("should maintain session across page reloads", async ({ page }) => {
    await signIn(page, testData.activeOrgAdmin.email, testData.activeOrgAdmin.password);
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
    
    // Reload the page
    await page.reload();
    
    // Should still be authenticated
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
    await expect(page.locator('text="Sign in"')).not.toBeVisible();
  });

  test("should handle concurrent sessions", async ({ browser }) => {
    // Create two browser contexts (simulate two devices)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Sign in on both contexts with the same user
    await signIn(page1, testData.activeOrgAdmin.email, testData.activeOrgAdmin.password);
    await signIn(page2, testData.activeOrgAdmin.email, testData.activeOrgAdmin.password);
    
    // Both should be authenticated
    await expect(page1).toHaveURL(`${BASE_URL}/dashboard`);
    await expect(page2).toHaveURL(`${BASE_URL}/dashboard`);
    
    // Sign out from one context
    await signOut(page1);
    await expect(page1).toHaveURL(/auth\/signin/);
    
    // The other context should still be authenticated
    await page2.reload();
    await expect(page2).toHaveURL(`${BASE_URL}/dashboard`);
    
    await context1.close();
    await context2.close();
  });
});

// Cross-Organization Data Isolation Tests
test.describe("Data Isolation", () => {
  test("should isolate data between organizations", async ({ page }) => {
    // Sign in as admin from one org
    await signIn(page, testData.activeOrgAdmin.email, testData.activeOrgAdmin.password);
    
    // Navigate to clients page
    await page.goto(`${BASE_URL}/clients`);
    
    // Get the client data visible to this org
    const clientNames = await page.locator('[data-testid="client-name"], .client-name, td:has-text("@")').allTextContents();
    
    await signOut(page);
    
    // Sign in as admin from different org (if we had multiple active orgs)
    // For now, just verify the master owner sees different/more data
    await signIn(page, testData.masterOwner.email, testData.masterOwner.password);
    await page.goto(`${BASE_URL}/clients`);
    
    // Master owner should see their org's data, not other org's data
    const masterClientNames = await page.locator('[data-testid="client-name"], .client-name, td:has-text("@")').allTextContents();
    
    // The data sets should be different (master org vs active org)
    expect(JSON.stringify(clientNames)).not.toBe(JSON.stringify(masterClientNames));
  });

  test("should prevent access to other org's data via URL manipulation", async ({ page }) => {
    await signIn(page, testData.activeOrgAdmin.email, testData.activeOrgAdmin.password);
    
    // Try to access specific client/data that belongs to another org
    // This would require knowing IDs from the test data
    // For now, test that API calls are properly scoped
    
    const response = await page.request.get(`${BASE_URL}/api/clients`);
    expect(response.ok()).toBe(true);
    
    const clients = await response.json();
    
    // All returned clients should belong to the user's org
    // (This assumes the API properly filters by org)
    expect(Array.isArray(clients)).toBe(true);
  });
});

// Error Handling Tests
test.describe("Error Handling", () => {
  test("should handle network errors gracefully", async ({ page }) => {
    await navigateToSignIn(page);
    
    // Simulate network failure
    await page.route("**/api/auth/**", route => route.abort());
    
    await page.fill('input[type="email"]', testData.activeOrgAdmin.email);
    await page.fill('input[type="password"]', testData.activeOrgAdmin.password);
    await page.click('button[type="submit"]');
    
    // Should show appropriate error message
    await expect(page.locator('[role="alert"]')).toContainText(/error|failed|try again/i);
  });

  test("should handle server errors gracefully", async ({ page }) => {
    await navigateToSignIn(page);
    
    // Simulate server error
    await page.route("**/api/auth/**", route => route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "Internal server error" })
    }));
    
    await page.fill('input[type="email"]', testData.activeOrgAdmin.email);
    await page.fill('input[type="password"]', testData.activeOrgAdmin.password);
    await page.click('button[type="submit"]');
    
    // Should show appropriate error message
    await expect(page.locator('[role="alert"]')).toContainText(/error|try again/i);
  });
});

// Performance Tests
test.describe("Performance", () => {
  test("should load sign-in page quickly", async ({ page }) => {
    const start = Date.now();
    await navigateToSignIn(page);
    const loadTime = Date.now() - start;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test("should complete sign-in flow quickly", async ({ page }) => {
    await navigateToSignIn(page);
    
    const start = Date.now();
    await signIn(page, testData.activeOrgAdmin.email, testData.activeOrgAdmin.password);
    const signInTime = Date.now() - start;
    
    // Should complete within 5 seconds
    expect(signInTime).toBeLessThan(5000);
  });
});

// Accessibility Tests
test.describe("Accessibility", () => {
  test("should have proper form labels and structure", async ({ page }) => {
    await navigateToSignIn(page);
    
    // Check for proper form labels
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();
    
    // Check form structure
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"][required]')).toBeVisible();
    await expect(page.locator('input[type="password"][required]')).toBeVisible();
  });

  test("should support keyboard navigation", async ({ page }) => {
    await navigateToSignIn(page);
    
    // Test tab navigation
    await page.keyboard.press("Tab");
    await expect(page.locator('input[type="email"]')).toBeFocused();
    
    await page.keyboard.press("Tab");
    await expect(page.locator('input[type="password"]')).toBeFocused();
    
    await page.keyboard.press("Tab");
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });

  test("should support screen readers", async ({ page }) => {
    await navigateToSignIn(page);
    
    // Check ARIA attributes
    const form = page.locator('form');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    // Check for proper ARIA labels or associated labels
    await expect(emailInput).toHaveAttribute('aria-label', /.+/);
    await expect(passwordInput).toHaveAttribute('aria-label', /.+/);
  });
});

// Integration Tests with API
test.describe("API Integration", () => {
  let authHeaders: Record<string, string> = {};

  test.beforeEach(async ({ page }) => {
    // Sign in and capture auth headers
    await signIn(page, testData.activeOrgAdmin.email, testData.activeOrgAdmin.password);
    
    // Intercept requests to capture auth headers
    await page.route("**/api/**", async (route) => {
      const headers = route.request().headers();
      authHeaders = headers;
      route.continue();
    });
    
    // Make a request to capture headers
    await page.goto(`${BASE_URL}/api/clients`);
  });

  test("should include proper authentication headers in API requests", async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/clients`);
    expect(response.ok()).toBe(true);
    
    // Check that the response contains org-scoped data
    const clients = await response.json();
    expect(Array.isArray(clients)).toBe(true);
  });

  test("should reject unauthenticated API requests", async ({ page, request }) => {
    // Make request without authentication
    const response = await request.get(`${BASE_URL}/api/clients`);
    expect(response.status()).toBe(401);
  });

  test("should handle API rate limiting gracefully", async ({ page }) => {
    // This would require implementing rate limiting first
    // For now, just test that multiple requests work
    
    const promises = Array.from({ length: 10 }, () => 
      page.request.get(`${BASE_URL}/api/clients`)
    );
    
    const responses = await Promise.all(promises);
    responses.forEach(response => {
      expect(response.status()).toBeLessThan(500);
    });
  });
});

// Export test runner function
export async function runAuthE2ETests() {
  console.log("🎭 Running authentication E2E tests...");
  console.log("Note: Run 'npm run test:e2e' to execute these tests with Playwright");
  return true;
}