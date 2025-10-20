import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    // Test database connection and user lookup
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.password) {
      return NextResponse.json({ error: "Password not set for this user" }, { status: 400 });
    }

    // Test password verification
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Return user info (excluding password)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: user.orgId,
        isMasterOwner: user.isMasterOwner,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Test auth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Test database connection
    const userCount = await db.select().from(users).limit(1);
    
    return NextResponse.json({
      message: "Auth system test endpoint",
      databaseConnected: true,
      usersTableAccessible: true,
      userCount: userCount.length,
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json({
      message: "Auth system test endpoint",
      databaseConnected: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}