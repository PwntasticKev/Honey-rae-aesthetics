import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@/db/schema";
import { 
  orgs, 
  users, 
  subscriptions, 
  clients, 
  permissions, 
  userPermissions,
  orgPermissions,
  complianceAgreements,
  usageTracking,
  appointments,
  workflows,
  files
} from "@/db/schema";
import { hashPassword } from "@/lib/auth-utils";
import { PERMISSIONS, initializePermissions } from "@/lib/permissions";
import { eq } from "drizzle-orm";

export interface TestOrg {
  id: number;
  name: string;
  slug: string;
  hasActiveSubscription: boolean;
  users: TestUser[];
  clients: TestClient[];
}

export interface TestUser {
  id: number;
  orgId: number;
  email: string;
  password: string;
  name: string;
  role: "admin" | "manager" | "staff";
  isMasterOwner: boolean;
  isActive: boolean;
}

export interface TestClient {
  id: number;
  orgId: number;
  fullName: string;
  email: string;
  phones: string[];
  gender: string;
  referralSource: string;
}

export class AuthTestDataGenerator {
  private testPassword = "TestPassword123!";
  private hashedPassword: string | null = null;
  private db: ReturnType<typeof drizzle> | null = null;

  private getDb(): ReturnType<typeof drizzle> {
    if (!this.db) {
      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is not set");
      }
      this.db = drizzle(
        mysql.createPool({
          uri: process.env.DATABASE_URL,
        }),
        { schema, mode: "default" }
      );
    }
    return this.db;
  }

  async initialize() {
    console.log("🔧 Initializing test data generator...");
    
    // Initialize permissions in database
    await initializePermissions();
    
    // Hash test password once
    this.hashedPassword = await hashPassword(this.testPassword);
    
    console.log("✅ Test data generator initialized");
  }

  async cleanup() {
    console.log("🧹 Cleaning up test data...");
    
    try {
      const db = this.getDb();
      // Delete in reverse dependency order
      await db.delete(usageTracking);
      await db.delete(complianceAgreements);
      await db.delete(appointments);
      await db.delete(files);
      await db.delete(workflows);
      await db.delete(clients);
      await db.delete(userPermissions);
      await db.delete(orgPermissions);
      await db.delete(subscriptions);
      await db.delete(users);
      await db.delete(orgs);
      
      console.log("✅ Test data cleaned up");
    } catch (error) {
      console.error("❌ Error cleaning up test data:", error);
    }
  }

  async generateTestData(): Promise<{
    masterOrg: TestOrg;
    activeOrgs: TestOrg[];
    inactiveOrgs: TestOrg[];
    allUsers: TestUser[];
  }> {
    console.log("🏗️ Generating comprehensive test data...");

    if (!this.hashedPassword) {
      throw new Error("Test data generator not initialized");
    }

    // 1. Create Master Organization (Honey Rae Aesthetics)
    const masterOrg = await this.createMasterOrg();

    // 2. Create Active Subscription Organizations
    const activeOrgs = await Promise.all([
      this.createTestOrg("Elite Beauty Clinic", "elite-beauty", true),
      this.createTestOrg("Radiant Aesthetics", "radiant-aesthetics", true),
      this.createTestOrg("Glow Medical Spa", "glow-medical", true),
    ]);

    // 3. Create Inactive Organizations (no subscription)
    const inactiveOrgs = await Promise.all([
      this.createTestOrg("Expired Clinic", "expired-clinic", false),
      this.createTestOrg("Suspended Spa", "suspended-spa", false),
    ]);

    const allOrgs = [masterOrg, ...activeOrgs, ...inactiveOrgs];
    const allUsers = allOrgs.flatMap(org => org.users);

    // 4. Generate usage tracking data
    await this.generateUsageData(allOrgs);

    // 5. Generate compliance agreements
    await this.generateComplianceData(allUsers);

    console.log(`✅ Generated test data:
      - ${allOrgs.length} organizations
      - ${allUsers.length} users
      - ${allOrgs.reduce((sum, org) => sum + org.clients.length, 0)} clients
    `);

    return {
      masterOrg,
      activeOrgs,
      inactiveOrgs,
      allUsers,
    };
  }

  private async createMasterOrg(): Promise<TestOrg> {
    const db = this.getDb();
    
    // Create Honey Rae Aesthetics org
    await db.insert(orgs).values({
      name: "Honey Rae Aesthetics",
      slug: "honey-rae-aesthetics",
      logo: "https://example.com/honey-rae-logo.png",
      settings: { theme: "pink", branding: "premium" },
    });

    // Get the created org
    const [org] = await db
      .select()
      .from(orgs)
      .where(eq(orgs.slug, "honey-rae-aesthetics"))
      .limit(1);

    // Create active subscription
    await db.insert(subscriptions).values({
      orgId: org.id,
      stripeCustomerId: "cus_test_master",
      stripeSubscriptionId: "sub_test_master",
      stripePriceId: "price_test_master",
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    // Create master owner user
    await db.insert(users).values({
      orgId: org.id,
      email: "owner@honeyraeaesthetics.com",
      emailVerifiedAt: new Date(),
      password: this.hashedPassword,
      name: "Master Owner",
      role: "admin",
      isMasterOwner: true,
      isActive: true,
    });

    // Create additional test users for master org
    await db.insert(users).values({
      orgId: org.id,
      email: "admin@honeyraeaesthetics.com",
      emailVerifiedAt: new Date(),
      password: this.hashedPassword,
      name: "Master Admin",
      role: "admin",
      isActive: true,
    });

    await db.insert(users).values({
      orgId: org.id,
      email: "manager@honeyraeaesthetics.com",
      emailVerifiedAt: new Date(),
      password: this.hashedPassword,
      name: "Master Manager",
      role: "manager",
      isActive: true,
    });

    // Get the created users
    const [masterUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, "owner@honeyraeaesthetics.com"))
      .limit(1);

    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, "admin@honeyraeaesthetics.com"))
      .limit(1);

    const [managerUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, "manager@honeyraeaesthetics.com"))
      .limit(1);

    const users = [
      { ...masterUser, password: this.testPassword },
      { ...adminUser, password: this.testPassword },
      { ...managerUser, password: this.testPassword },
    ];

    // Create test clients for master org
    const clients = await this.createTestClients(org.id, 5);

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      hasActiveSubscription: true,
      users,
      clients,
    };
  }

  private async createTestOrg(name: string, slug: string, hasActiveSubscription: boolean): Promise<TestOrg> {
    const db = this.getDb();
    
    // Create organization
    await db.insert(orgs).values({
      name,
      slug,
      logo: `https://example.com/${slug}-logo.png`,
      settings: { theme: "default", branding: "standard" },
    });

    // Get the created org
    const [org] = await db
      .select()
      .from(orgs)
      .where(eq(orgs.slug, slug))
      .limit(1);

    // Create subscription (active or inactive)
    await db.insert(subscriptions).values({
      orgId: org.id,
      stripeCustomerId: `cus_test_${slug}`,
      stripeSubscriptionId: `sub_test_${slug}`,
      stripePriceId: "price_test_standard",
      status: hasActiveSubscription ? "active" : "canceled",
      currentPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      currentPeriodEnd: hasActiveSubscription 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        : new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // expired yesterday
    });

    // Create users with different roles
    await db.insert(users).values([
      {
        orgId: org.id,
        email: `admin@${slug}.com`,
        emailVerifiedAt: new Date(),
        password: this.hashedPassword,
        name: `${name} Admin`,
        role: "admin",
        isActive: hasActiveSubscription,
      },
      {
        orgId: org.id,
        email: `manager@${slug}.com`,
        emailVerifiedAt: new Date(),
        password: this.hashedPassword,
        name: `${name} Manager`,
        role: "manager",
        isActive: hasActiveSubscription,
      },
      {
        orgId: org.id,
        email: `staff@${slug}.com`,
        emailVerifiedAt: new Date(),
        password: this.hashedPassword,
        name: `${name} Staff`,
        role: "staff",
        isActive: hasActiveSubscription,
      },
      {
        orgId: org.id,
        email: `inactive@${slug}.com`,
        emailVerifiedAt: new Date(),
        password: this.hashedPassword,
        name: `${name} Inactive`,
        role: "staff",
        isActive: false,
      }
    ]);

    // Get the created users
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, `admin@${slug}.com`))
      .limit(1);

    const [managerUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, `manager@${slug}.com`))
      .limit(1);

    const [staffUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, `staff@${slug}.com`))
      .limit(1);

    const [inactiveUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, `inactive@${slug}.com`))
      .limit(1);

    const users = [
      { ...adminUser, password: this.testPassword },
      { ...managerUser, password: this.testPassword },
      { ...staffUser, password: this.testPassword },
      { ...inactiveUser, password: this.testPassword },
    ];

    // Create test clients
    const clientCount = hasActiveSubscription ? 10 : 3;
    const clients = await this.createTestClients(org.id, clientCount);

    // Set some org-level permission restrictions for testing
    if (slug === "glow-medical") {
      // Disable social media features for this org
      await this.disableOrgPermissions(org.id, [
        PERMISSIONS.SOCIAL_POST,
        PERMISSIONS.SOCIAL_SCHEDULE,
      ]);
    }

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      hasActiveSubscription,
      users,
      clients,
    };
  }

  private async createTestClients(orgId: number, count: number): Promise<TestClient[]> {
    const db = this.getDb();
    const clients: TestClient[] = [];
    
    const firstNames = ["Emma", "Olivia", "Sophia", "Isabella", "Mia", "Charlotte", "Amelia", "Harper", "Evelyn", "Abigail"];
    const lastNames = ["Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez"];
    const genders = ["Female", "Male", "Non-binary"];
    const referralSources = ["Google", "Instagram", "Friend Referral", "Website", "Walk-in"];

    for (let i = 0; i < count; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      const fullName = `${firstName} ${lastName}`;
      
      const clientData = {
        orgId,
        fullName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
        phones: [`555-010-${String(i).padStart(4, '0')}`],
        gender: genders[i % genders.length],
        dateOfBirth: `${1980 + (i % 25)}-${String((i % 12) + 1).padStart(2, '0')}-15`,
        address: `${100 + i} Main St, City, State 12345`,
        referralSource: referralSources[i % referralSources.length],
        tags: i % 3 === 0 ? ["VIP", "Botox"] : i % 2 === 0 ? ["New Client"] : [],
        clientPortalStatus: "active",
        notes: `Test client ${i + 1} for org ${orgId}`,
      };

      await db.insert(clients).values(clientData);

      // Get the created client (simpler approach - use a unique field like email)
      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.email, clientData.email))
        .limit(1);

      clients.push({
        id: client.id,
        orgId: client.orgId,
        fullName: client.fullName,
        email: client.email,
        phones: client.phones as string[],
        gender: client.gender,
        referralSource: client.referralSource,
      });
    }

    return clients;
  }

  private async disableOrgPermissions(orgId: number, permissionNames: string[]) {
    const db = this.getDb();
    
    for (const permissionName of permissionNames) {
      const [permission] = await db
        .select()
        .from(permissions)
        .where(eq(permissions.name, permissionName))
        .limit(1);

      if (permission) {
        await db.insert(orgPermissions).values({
          orgId,
          permissionId: permission.id,
          enabled: false,
          disabledBy: 1, // Master owner
          disabledAt: new Date(),
        });
      }
    }
  }

  private async generateUsageData(orgs: TestOrg[]) {
    const db = this.getDb();
    console.log("📊 Generating usage tracking data...");
    
    for (const org of orgs) {
      if (!org.hasActiveSubscription) continue;

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Generate various usage metrics
      const usageMetrics = [
        { metric: "api_calls", value: Math.floor(Math.random() * 1000) + 100 },
        { metric: "storage_used", value: Math.floor(Math.random() * 5000) + 1000 }, // MB
        { metric: "sms_sent", value: Math.floor(Math.random() * 50) + 10 },
        { metric: "emails_sent", value: Math.floor(Math.random() * 200) + 50 },
        { metric: "workflows_executed", value: Math.floor(Math.random() * 30) + 5 },
        { metric: "files_uploaded", value: Math.floor(Math.random() * 20) + 2 },
      ];

      for (const metric of usageMetrics) {
        // Today's usage
        await db.insert(usageTracking).values({
          orgId: org.id,
          userId: org.users[0].id, // Admin user
          metric: metric.metric,
          value: metric.value,
          date: today,
          metadata: { test: true },
        });

        // Yesterday's usage
        await db.insert(usageTracking).values({
          orgId: org.id,
          userId: org.users[0].id,
          metric: metric.metric,
          value: Math.floor(metric.value * 0.8), // Slightly less yesterday
          date: yesterday,
          metadata: { test: true },
        });
      }
    }
  }

  private async generateComplianceData(users: TestUser[]) {
    const db = this.getDb();
    console.log("📋 Generating compliance agreements...");
    
    const agreementTypes = ["terms_of_service", "privacy_policy", "hipaa_agreement"] as const;
    
    for (const user of users) {
      for (const agreementType of agreementTypes) {
        await db.insert(complianceAgreements).values({
          userId: user.id,
          orgId: user.orgId,
          agreementType,
          version: "1.0",
          ipAddress: "127.0.0.1",
          userAgent: "Mozilla/5.0 (Test Browser)",
        });
      }
    }
  }

  getTestCredentials() {
    return {
      password: this.testPassword,
      masterOwner: {
        email: "owner@honeyraeaesthetics.com",
        password: this.testPassword,
      },
      activeOrgAdmin: {
        email: "admin@elite-beauty.com",
        password: this.testPassword,
      },
      inactiveOrgUser: {
        email: "admin@expired-clinic.com",
        password: this.testPassword,
      },
    };
  }
}

// Export singleton instance
export const testDataGenerator = new AuthTestDataGenerator();