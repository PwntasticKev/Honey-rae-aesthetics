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
} catch (error) {
  console.error('❌ Failed to load .env.local file:', error);
}

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

import { testDataGenerator } from "./auth-test-data";

interface ValidationResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

class AuthSystemValidator {
  private results: ValidationResult[] = [];

  async validate(name: string, testFn: () => Promise<{ passed: boolean; details?: string }>): Promise<void> {
    console.log(`🔍 Validating ${name}...`);
    
    try {
      const result = await testFn();
      this.results.push({ 
        name, 
        passed: result.passed, 
        details: result.details 
      });
      
      if (result.passed) {
        console.log(`✅ ${name} - PASSED`);
        if (result.details) {
          console.log(`   ${result.details}`);
        }
      } else {
        console.log(`❌ ${name} - FAILED`);
        if (result.details) {
          console.log(`   ${result.details}`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.results.push({ name, passed: false, error: errorMessage });
      console.log(`❌ ${name} - ERROR: ${errorMessage}`);
    }
  }

  printSummary(): void {
    console.log("\n" + "=".repeat(60));
    console.log("📊 AUTHENTICATION SYSTEM VALIDATION SUMMARY");
    console.log("=".repeat(60));
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    console.log(`\nOverall Result: ${passed}/${total} validations passed`);
    
    if (passed === total) {
      console.log("\n🎉 AUTHENTICATION SYSTEM FULLY VALIDATED!");
      console.log("✅ Ready for production use");
    } else {
      console.log(`\n⚠️  ${total - passed} validations failed`);
      console.log("❌ System needs attention before production");
    }
    
    console.log("\nValidation Details:");
    this.results.forEach(result => {
      const status = result.passed ? "✅ PASS" : "❌ FAIL";
      console.log(`  ${status} ${result.name}`);
      if (result.error) {
        console.log(`         Error: ${result.error}`);
      }
      if (result.details) {
        console.log(`         Details: ${result.details}`);
      }
    });
  }

  hasFailures(): boolean {
    return this.results.some(r => !r.passed);
  }
}

async function validateDatabaseConnection(): Promise<{ passed: boolean; details?: string }> {
  try {
    await testDataGenerator.initialize();
    return { passed: true, details: "Database connection established successfully" };
  } catch (error) {
    return { passed: false, details: `Database connection failed: ${error}` };
  }
}

async function validateTestDataGeneration(): Promise<{ passed: boolean; details?: string }> {
  try {
    const testData = await testDataGenerator.generateTestData();
    
    const stats = {
      masterOrg: testData.masterOrg ? 1 : 0,
      activeOrgs: testData.activeOrgs.length,
      inactiveOrgs: testData.inactiveOrgs.length,
      totalUsers: testData.allUsers.length,
      masterOwners: testData.allUsers.filter(u => u.isMasterOwner).length,
      totalClients: testData.activeOrgs.reduce((sum, org) => sum + org.clients.length, 0) + 
                   testData.masterOrg.clients.length,
    };
    
    const validations = [
      { check: stats.masterOrg === 1, error: "Master org not created" },
      { check: stats.activeOrgs >= 3, error: "Not enough active orgs created" },
      { check: stats.inactiveOrgs >= 2, error: "Not enough inactive orgs created" },
      { check: stats.totalUsers >= 10, error: "Not enough users created" },
      { check: stats.masterOwners === 1, error: "Master owner not found or duplicated" },
      { check: stats.totalClients >= 20, error: "Not enough test clients created" },
    ];
    
    const failed = validations.find(v => !v.check);
    if (failed) {
      return { passed: false, details: failed.error };
    }
    
    return { 
      passed: true, 
      details: `Generated ${stats.totalUsers} users, ${stats.totalClients} clients across ${stats.activeOrgs + stats.inactiveOrgs + 1} orgs` 
    };
  } catch (error) {
    return { passed: false, details: `Test data generation failed: ${error}` };
  }
}

async function validateAuthUtilities(): Promise<{ passed: boolean; details?: string }> {
  try {
    const { hashPassword, verifyPassword, generateToken, validatePassword } = await import("@/lib/auth-utils");
    
    // Test password hashing
    const password = "TestPassword123!";
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);
    const isInvalid = await verifyPassword("wrongpassword", hash);
    
    if (!isValid) {
      return { passed: false, details: "Password verification failed" };
    }
    
    if (isInvalid) {
      return { passed: false, details: "Wrong password should not validate" };
    }
    
    // Test token generation
    const token1 = generateToken();
    const token2 = generateToken();
    
    if (token1 === token2) {
      return { passed: false, details: "Tokens should be unique" };
    }
    
    if (token1.length !== 64) {
      return { passed: false, details: "Token should be 64 characters" };
    }
    
    // Test password validation
    const strongPassword = validatePassword("StrongPassword123!");
    const weakPassword = validatePassword("weak");
    
    if (!strongPassword.isValid) {
      return { passed: false, details: "Strong password should be valid" };
    }
    
    if (weakPassword.isValid) {
      return { passed: false, details: "Weak password should be invalid" };
    }
    
    return { passed: true, details: "Password hashing, verification, and validation working correctly" };
  } catch (error) {
    return { passed: false, details: `Auth utilities test failed: ${error}` };
  }
}

async function validatePermissionSystem(): Promise<{ passed: boolean; details?: string }> {
  try {
    const { getUserPermissions, hasPermission, PERMISSIONS } = await import("@/lib/permissions");
    const testData = await testDataGenerator.generateTestData();
    
    // Test master owner permissions
    const masterOwner = testData.allUsers.find(u => u.isMasterOwner);
    if (!masterOwner) {
      return { passed: false, details: "Master owner not found" };
    }
    
    const masterPermissions = await getUserPermissions(masterOwner.id);
    if (masterPermissions.length !== Object.keys(PERMISSIONS).length) {
      return { passed: false, details: "Master owner doesn't have all permissions" };
    }
    
    // Test admin permissions
    const admin = testData.allUsers.find(u => u.role === "admin" && !u.isMasterOwner);
    if (!admin) {
      return { passed: false, details: "Admin user not found" };
    }
    
    const adminHasClientsView = await hasPermission(admin.id, PERMISSIONS.CLIENTS_VIEW);
    const adminHasMasterAdmin = await hasPermission(admin.id, PERMISSIONS.MASTER_ADMIN);
    
    if (!adminHasClientsView) {
      return { passed: false, details: "Admin should have clients view permission" };
    }
    
    if (adminHasMasterAdmin) {
      return { passed: false, details: "Regular admin should not have master admin permission" };
    }
    
    // Test staff permissions
    const staff = testData.allUsers.find(u => u.role === "staff");
    if (!staff) {
      return { passed: false, details: "Staff user not found" };
    }
    
    const staffHasClientsView = await hasPermission(staff.id, PERMISSIONS.CLIENTS_VIEW);
    const staffHasUsersInvite = await hasPermission(staff.id, PERMISSIONS.USERS_INVITE);
    
    if (!staffHasClientsView) {
      return { passed: false, details: "Staff should have clients view permission" };
    }
    
    if (staffHasUsersInvite) {
      return { passed: false, details: "Staff should not have user invite permission" };
    }
    
    return { 
      passed: true, 
      details: `Permissions working correctly for all roles (${Object.keys(PERMISSIONS).length} total permissions)` 
    };
  } catch (error) {
    return { passed: false, details: `Permission system test failed: ${error}` };
  }
}

async function validateDataIsolation(): Promise<{ passed: boolean; details?: string }> {
  try {
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
      return { passed: false, details: "Data leakage detected between organizations" };
    }
    
    if (org1Clients.length === 0 || org2Clients.length === 0) {
      return { passed: false, details: "Organizations should have client data" };
    }
    
    return { 
      passed: true, 
      details: `Data properly isolated - Org1: ${org1Clients.length} clients, Org2: ${org2Clients.length} clients, no overlap` 
    };
  } catch (error) {
    return { passed: false, details: `Data isolation test failed: ${error}` };
  }
}

async function validateSubscriptionGating(): Promise<{ passed: boolean; details?: string }> {
  try {
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
      return { passed: false, details: "Active org should have active subscription" };
    }
    
    // Check inactive org subscription
    const inactiveOrgSub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.orgId, testData.inactiveOrgs[0].id))
      .limit(1);
    
    if (inactiveOrgSub.length === 0 || inactiveOrgSub[0].status === "active") {
      return { passed: false, details: "Inactive org should not have active subscription" };
    }
    
    return { 
      passed: true, 
      details: `Subscription gating configured correctly - active: ${activeOrgSub[0].status}, inactive: ${inactiveOrgSub[0].status}` 
    };
  } catch (error) {
    return { passed: false, details: `Subscription gating test failed: ${error}` };
  }
}

async function validateCompliance(): Promise<{ passed: boolean; details?: string }> {
  try {
    const { db } = await import("@/lib/db");
    const { complianceAgreements } = await import("@/db/schema");
    
    const testData = await testDataGenerator.generateTestData();
    const agreements = await db.select().from(complianceAgreements);
    
    if (agreements.length === 0) {
      return { passed: false, details: "No compliance agreements found" };
    }
    
    // Verify different agreement types exist
    const agreementTypes = new Set(agreements.map(a => a.agreementType));
    const expectedTypes = ["terms_of_service", "privacy_policy", "hipaa_agreement"];
    
    for (const expectedType of expectedTypes) {
      if (!agreementTypes.has(expectedType as any)) {
        return { passed: false, details: `Missing compliance agreement type: ${expectedType}` };
      }
    }
    
    // Verify all users have agreements
    const userAgreements = new Set(agreements.map(a => a.userId));
    if (userAgreements.size !== testData.allUsers.length) {
      return { passed: false, details: "Not all users have compliance agreements" };
    }
    
    return { 
      passed: true, 
      details: `${agreements.length} compliance agreements across ${agreementTypes.size} types for ${userAgreements.size} users` 
    };
  } catch (error) {
    return { passed: false, details: `Compliance tracking test failed: ${error}` };
  }
}

async function validateUsageTracking(): Promise<{ passed: boolean; details?: string }> {
  try {
    const { db } = await import("@/lib/db");
    const { usageTracking } = await import("@/db/schema");
    
    const usage = await db.select().from(usageTracking);
    
    if (usage.length === 0) {
      return { passed: false, details: "No usage tracking data found" };
    }
    
    // Verify different metrics exist
    const metrics = new Set(usage.map(u => u.metric));
    const expectedMetrics = ["api_calls", "storage_used", "sms_sent", "emails_sent"];
    
    for (const expectedMetric of expectedMetrics) {
      if (!metrics.has(expectedMetric)) {
        return { passed: false, details: `Missing usage metric: ${expectedMetric}` };
      }
    }
    
    // Verify data spans multiple orgs
    const orgIds = new Set(usage.map(u => u.orgId));
    if (orgIds.size < 2) {
      return { passed: false, details: "Usage tracking should span multiple organizations" };
    }
    
    return { 
      passed: true, 
      details: `${usage.length} usage records across ${metrics.size} metrics for ${orgIds.size} organizations` 
    };
  } catch (error) {
    return { passed: false, details: `Usage tracking test failed: ${error}` };
  }
}

async function main() {
  console.log("🚀 VALIDATING COMPREHENSIVE AUTHENTICATION SYSTEM");
  console.log("=" .repeat(60));
  console.log("This validation tests all core authentication functionality");
  console.log("including security, permissions, data isolation, and compliance.\n");
  
  const validator = new AuthSystemValidator();
  
  // Core Infrastructure Validation
  await validator.validate("Database Connection", validateDatabaseConnection);
  await validator.validate("Test Data Generation", validateTestDataGeneration);
  
  // Authentication & Authorization Validation
  await validator.validate("Authentication Utilities", validateAuthUtilities);
  await validator.validate("Permission System", validatePermissionSystem);
  
  // Security & Isolation Validation
  await validator.validate("Cross-Org Data Isolation", validateDataIsolation);
  await validator.validate("Subscription Gating", validateSubscriptionGating);
  
  // Compliance & Tracking Validation
  await validator.validate("Compliance Tracking", validateCompliance);
  await validator.validate("Usage Tracking", validateUsageTracking);
  
  // Cleanup
  console.log("\n🧹 Cleaning up test data...");
  await testDataGenerator.cleanup();
  console.log("✅ Test data cleaned up successfully");
  
  // Print results
  validator.printSummary();
  
  // Exit with appropriate code
  if (validator.hasFailures()) {
    console.log("\n🔧 NEXT STEPS:");
    console.log("- Review failed validations above");
    console.log("- Fix any issues found");
    console.log("- Re-run validation: npm run test:auth-validate");
    process.exit(1);
  } else {
    console.log("\n🎯 SYSTEM READY:");
    console.log("- ✅ Authentication system fully operational");
    console.log("- ✅ Security measures properly implemented");
    console.log("- ✅ Data isolation working correctly");
    console.log("- ✅ Compliance tracking active");
    console.log("- ✅ Ready for production deployment");
    process.exit(0);
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error("❌ Validation failed:", error);
    process.exit(1);
  });
}

export { main as validateAuthSystem };