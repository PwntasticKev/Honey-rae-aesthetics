#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables manually from .env.local
try {
  const envPath = join(__dirname, '../../../.env.local');
  const envContent = readFileSync(envPath, 'utf8');
  
  // Parse .env file content
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
        process.env[key] = value;
      }
    }
  });
  
  console.log('✅ Environment variables loaded successfully');
} catch (error) {
  console.error('❌ Failed to load .env.local file:', error);
}

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE')));
  process.exit(1);
}

console.log('Database URL loaded:', process.env.DATABASE_URL?.substring(0, 30) + '...');

import { testDataGenerator } from "./auth-test-data";
import { runAuthUnitTests } from "./auth-utils.test";
import { runApiAuthTests } from "./api-auth.test";

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

class TestRunner {
  private results: TestResult[] = [];

  async runTest(name: string, testFn: () => Promise<boolean>): Promise<void> {
    console.log(`\n🧪 Running ${name}...`);
    const start = Date.now();
    
    try {
      const passed = await testFn();
      const duration = Date.now() - start;
      
      this.results.push({ name, passed, duration });
      
      if (passed) {
        console.log(`✅ ${name} passed (${duration}ms)`);
      } else {
        console.log(`❌ ${name} failed (${duration}ms)`);
      }
    } catch (error) {
      const duration = Date.now() - start;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.results.push({ name, passed: false, duration, error: errorMessage });
      console.log(`❌ ${name} failed with error (${duration}ms): ${errorMessage}`);
    }
  }

  printSummary(): void {
    console.log("\n" + "=".repeat(60));
    console.log("📊 TEST SUMMARY");
    console.log("=".repeat(60));
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    console.log(`\nOverall: ${passed}/${total} tests passed`);
    console.log(`Total time: ${totalTime}ms`);
    
    console.log("\nDetailed Results:");
    this.results.forEach(result => {
      const status = result.passed ? "✅ PASS" : "❌ FAIL";
      console.log(`  ${status} ${result.name} (${result.duration}ms)`);
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
    });
    
    if (passed === total) {
      console.log("\n🎉 ALL TESTS PASSED!");
    } else {
      console.log(`\n⚠️  ${total - passed} tests failed`);
    }
  }

  hasFailures(): boolean {
    return this.results.some(r => !r.passed);
  }
}

async function testDatabaseConnection(): Promise<boolean> {
  try {
    console.log("Testing database connection...");
    await testDataGenerator.initialize();
    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

async function testDataGeneration(): Promise<boolean> {
  try {
    console.log("Testing comprehensive data generation...");
    
    const testData = await testDataGenerator.generateTestData();
    
    // Verify data structure
    if (!testData.masterOrg) {
      throw new Error("Master org not created");
    }
    
    if (testData.activeOrgs.length === 0) {
      throw new Error("No active orgs created");
    }
    
    if (testData.inactiveOrgs.length === 0) {
      throw new Error("No inactive orgs created");
    }
    
    if (testData.allUsers.length === 0) {
      throw new Error("No users created");
    }
    
    // Verify master owner exists
    const masterOwner = testData.allUsers.find(u => u.isMasterOwner);
    if (!masterOwner) {
      throw new Error("Master owner not found");
    }
    
    // Verify different roles exist
    const roles = new Set(testData.allUsers.map(u => u.role));
    if (!roles.has("admin") || !roles.has("manager") || !roles.has("staff")) {
      throw new Error("Not all user roles created");
    }
    
    // Verify clients were created
    const totalClients = testData.activeOrgs.reduce((sum, org) => sum + org.clients.length, 0) +
                        testData.masterOrg.clients.length;
    
    if (totalClients === 0) {
      throw new Error("No clients created");
    }
    
    console.log(`✅ Generated test data:
      - Master org: ${testData.masterOrg.name}
      - Active orgs: ${testData.activeOrgs.length}
      - Inactive orgs: ${testData.inactiveOrgs.length}
      - Total users: ${testData.allUsers.length}
      - Total clients: ${totalClients}`);
    
    return true;
  } catch (error) {
    console.error("❌ Data generation failed:", error);
    return false;
  }
}

async function testPermissionSystem(): Promise<boolean> {
  try {
    console.log("Testing permission system...");
    
    const { getUserPermissions, hasPermission, PERMISSIONS } = await import("@/lib/permissions");
    const testData = await testDataGenerator.generateTestData();
    
    // Test master owner permissions
    const masterOwner = testData.allUsers.find(u => u.isMasterOwner)!;
    const masterPermissions = await getUserPermissions(masterOwner.id);
    
    if (masterPermissions.length !== Object.keys(PERMISSIONS).length) {
      throw new Error("Master owner doesn't have all permissions");
    }
    
    // Test admin permissions
    const admin = testData.allUsers.find(u => u.role === "admin" && !u.isMasterOwner)!;
    const adminHasClientsView = await hasPermission(admin.id, PERMISSIONS.CLIENTS_VIEW);
    const adminHasMasterAdmin = await hasPermission(admin.id, PERMISSIONS.MASTER_ADMIN);
    
    if (!adminHasClientsView) {
      throw new Error("Admin should have clients view permission");
    }
    
    if (adminHasMasterAdmin) {
      throw new Error("Regular admin should not have master admin permission");
    }
    
    // Test staff permissions
    const staff = testData.allUsers.find(u => u.role === "staff")!;
    const staffHasClientsView = await hasPermission(staff.id, PERMISSIONS.CLIENTS_VIEW);
    const staffHasUsersInvite = await hasPermission(staff.id, PERMISSIONS.USERS_INVITE);
    
    if (!staffHasClientsView) {
      throw new Error("Staff should have clients view permission");
    }
    
    if (staffHasUsersInvite) {
      throw new Error("Staff should not have user invite permission");
    }
    
    console.log("✅ Permission system working correctly");
    return true;
  } catch (error) {
    console.error("❌ Permission system test failed:", error);
    return false;
  }
}

async function testAuthUtilities(): Promise<boolean> {
  try {
    console.log("Testing authentication utilities...");
    
    const { 
      hashPassword, 
      verifyPassword, 
      generateToken,
      validatePassword 
    } = await import("@/lib/auth-utils");
    
    // Test password hashing
    const password = "TestPassword123!";
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);
    const isInvalid = await verifyPassword("wrongpassword", hash);
    
    if (!isValid) {
      throw new Error("Password verification failed");
    }
    
    if (isInvalid) {
      throw new Error("Wrong password should not validate");
    }
    
    // Test token generation
    const token1 = generateToken();
    const token2 = generateToken();
    
    if (token1 === token2) {
      throw new Error("Tokens should be unique");
    }
    
    if (token1.length !== 64) {
      throw new Error("Token should be 64 characters");
    }
    
    // Test password validation
    const strongPassword = validatePassword("StrongPassword123!");
    const weakPassword = validatePassword("weak");
    
    if (!strongPassword.isValid) {
      throw new Error("Strong password should be valid");
    }
    
    if (weakPassword.isValid) {
      throw new Error("Weak password should be invalid");
    }
    
    console.log("✅ Authentication utilities working correctly");
    return true;
  } catch (error) {
    console.error("❌ Authentication utilities test failed:", error);
    return false;
  }
}

async function testDataIsolation(): Promise<boolean> {
  try {
    console.log("Testing cross-org data isolation...");
    
    const { db } = await import("@/lib/db");
    const { clients } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    
    const testData = await testDataGenerator.generateTestData();
    
    // Get clients from different orgs
    const org1Clients = await db
      .select()
      .from(clients)
      .where(eq(clients.orgId, testData.masterOrg.id));
    
    const org2Clients = await db
      .select()
      .from(clients)
      .where(eq(clients.orgId, testData.activeOrgs[0].id));
    
    // Verify no data leakage
    const org1ClientEmails = org1Clients.map(c => c.email);
    const org2ClientEmails = org2Clients.map(c => c.email);
    
    const hasOverlap = org1ClientEmails.some(email => org2ClientEmails.includes(email));
    
    if (hasOverlap) {
      throw new Error("Data leakage detected between organizations");
    }
    
    // Verify each org has data
    if (org1Clients.length === 0 || org2Clients.length === 0) {
      throw new Error("Organizations should have client data");
    }
    
    console.log(`✅ Data isolation verified:
      - Org 1 clients: ${org1Clients.length}
      - Org 2 clients: ${org2Clients.length}
      - No cross-org data leakage`);
    
    return true;
  } catch (error) {
    console.error("❌ Data isolation test failed:", error);
    return false;
  }
}

async function testSubscriptionGating(): Promise<boolean> {
  try {
    console.log("Testing subscription gating...");
    
    const { db } = await import("@/lib/db");
    const { subscriptions } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    
    const testData = await testDataGenerator.generateTestData();
    
    // Check active org subscription
    const activeOrgSub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.orgId, testData.activeOrgs[0].id))
      .limit(1);
    
    if (activeOrgSub.length === 0 || activeOrgSub[0].status !== "active") {
      throw new Error("Active org should have active subscription");
    }
    
    // Check inactive org subscription
    const inactiveOrgSub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.orgId, testData.inactiveOrgs[0].id))
      .limit(1);
    
    if (inactiveOrgSub.length === 0 || inactiveOrgSub[0].status === "active") {
      throw new Error("Inactive org should not have active subscription");
    }
    
    console.log("✅ Subscription gating configured correctly");
    return true;
  } catch (error) {
    console.error("❌ Subscription gating test failed:", error);
    return false;
  }
}

async function testCompliance(): Promise<boolean> {
  try {
    console.log("Testing compliance tracking...");
    
    const { db } = await import("@/lib/db");
    const { complianceAgreements } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    
    const testData = await testDataGenerator.generateTestData();
    
    // Check that compliance agreements were created
    const agreements = await db.select().from(complianceAgreements);
    
    if (agreements.length === 0) {
      throw new Error("No compliance agreements found");
    }
    
    // Verify different agreement types exist
    const agreementTypes = new Set(agreements.map(a => a.agreementType));
    const expectedTypes = ["terms_of_service", "privacy_policy", "hipaa_agreement"];
    
    for (const expectedType of expectedTypes) {
      if (!agreementTypes.has(expectedType as any)) {
        throw new Error(`Missing compliance agreement type: ${expectedType}`);
      }
    }
    
    // Verify all users have agreements
    const userAgreements = new Set(agreements.map(a => a.userId));
    if (userAgreements.size !== testData.allUsers.length) {
      throw new Error("Not all users have compliance agreements");
    }
    
    console.log(`✅ Compliance tracking working:
      - Total agreements: ${agreements.length}
      - Agreement types: ${agreementTypes.size}
      - Users with agreements: ${userAgreements.size}`);
    
    return true;
  } catch (error) {
    console.error("❌ Compliance tracking test failed:", error);
    return false;
  }
}

async function testUsageTracking(): Promise<boolean> {
  try {
    console.log("Testing usage tracking...");
    
    const { db } = await import("@/lib/db");
    const { usageTracking } = await import("@/db/schema");
    
    const usage = await db.select().from(usageTracking);
    
    if (usage.length === 0) {
      throw new Error("No usage tracking data found");
    }
    
    // Verify different metrics exist
    const metrics = new Set(usage.map(u => u.metric));
    const expectedMetrics = ["api_calls", "storage_used", "sms_sent", "emails_sent"];
    
    for (const expectedMetric of expectedMetrics) {
      if (!metrics.has(expectedMetric)) {
        throw new Error(`Missing usage metric: ${expectedMetric}`);
      }
    }
    
    // Verify data spans multiple orgs
    const orgIds = new Set(usage.map(u => u.orgId));
    if (orgIds.size < 2) {
      throw new Error("Usage tracking should span multiple organizations");
    }
    
    console.log(`✅ Usage tracking working:
      - Total usage records: ${usage.length}
      - Unique metrics: ${metrics.size}
      - Organizations tracked: ${orgIds.size}`);
    
    return true;
  } catch (error) {
    console.error("❌ Usage tracking test failed:", error);
    return false;
  }
}

async function main() {
  console.log("🚀 Starting Comprehensive Authentication Tests");
  console.log("=" .repeat(60));
  
  const runner = new TestRunner();
  
  // Core Infrastructure Tests
  await runner.runTest("Database Connection", testDatabaseConnection);
  await runner.runTest("Test Data Generation", testDataGeneration);
  
  // Authentication & Authorization Tests
  await runner.runTest("Permission System", testPermissionSystem);
  await runner.runTest("Authentication Utilities", testAuthUtilities);
  
  // Security & Isolation Tests
  await runner.runTest("Cross-Org Data Isolation", testDataIsolation);
  await runner.runTest("Subscription Gating", testSubscriptionGating);
  
  // Compliance & Tracking Tests
  await runner.runTest("Compliance Tracking", testCompliance);
  await runner.runTest("Usage Tracking", testUsageTracking);
  
  // Additional Test Suites (would be run separately)
  await runner.runTest("Auth Unit Tests", runAuthUnitTests);
  await runner.runTest("API Auth Tests", runApiAuthTests);
  
  // Cleanup
  console.log("\n🧹 Cleaning up test data...");
  await testDataGenerator.cleanup();
  
  // Print results
  runner.printSummary();
  
  // Exit with appropriate code
  if (runner.hasFailures()) {
    process.exit(1);
  } else {
    console.log("\n🎉 All authentication tests completed successfully!");
    process.exit(0);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error("❌ Test runner failed:", error);
    process.exit(1);
  });
}

export { main as runAllAuthTests };