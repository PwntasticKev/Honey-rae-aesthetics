import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orgs, users } from "@/db/schema";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    // First check if test org exists, if not create it
    let existingOrg = await db.select().from(orgs).where().limit(1);
    
    if (existingOrg.length === 0) {
      await db.insert(orgs).values({
        name: "Test Organization", 
        slug: "test-org",
        domain: "test-org.honeyraeaesthetics.com",
        settings: JSON.stringify({
          branding: { primaryColor: "#007bff" },
          features: { aiSuggestions: true }
        }),
        isActive: true,
        isTrial: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Get the created org
      existingOrg = await db.select().from(orgs).where().limit(1);
    }
    
    const orgId = existingOrg[0].id;

    // Hash a test password
    const hashedPassword = await bcrypt.hash("password123", 12);

    // Create a test user
    await db.insert(users).values({
      orgId: orgId,
      email: "test@honeyraeaesthetics.com",
      password: hashedPassword,
      name: "Test User",
      role: "admin",
      isMasterOwner: false,
      isActive: true,
      loginAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: "Test user created successfully",
      org: { id: orgId, name: "Test Organization" },
      user: {
        email: "test@honeyraeaesthetics.com",
        password: "password123",
        role: "admin"
      }
    });
  } catch (error) {
    console.error("Create test user error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}