import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { internal } from "./_generated/api";

// Password hashing utility (would use bcrypt in production)
function hashPassword(password: string): string {
  // In production, use bcrypt or similar
  // For now, simple hash simulation
  return `hashed_${password}_${Date.now()}`;
}

function verifyPassword(password: string, hash: string): boolean {
  // In production, use bcrypt.compare
  // This is just for development
  return hash.includes(password);
}

// Generate OTP code
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create user account with email/password
export const createAccount = mutation({
  args: {
    orgId: v.id("orgs"),
    email: v.string(),
    password: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("manager"), v.literal("staff"))),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    const now = Date.now();
    const passwordHash = hashPassword(args.password);

    // Create user
    const userId = await ctx.db.insert("users", {
      orgId: args.orgId,
      email: args.email,
      name: args.name,
      role: args.role || "staff",
      passwordHash,
      phone: args.phone,
      twoFactorEnabled: true, // Always enabled for email signups
      preferredOtpMethod: args.phone ? "sms" : "email",
      isActive: true,
      emailVerified: false,
      phoneVerified: false,
      lastLogin: undefined,
      createdAt: now,
      updatedAt: now,
    });

    // Log account creation
    await ctx.db.insert("authEvents", {
      userId,
      email: args.email,
      eventType: "account_created",
      method: "email",
      createdAt: now,
    });

    // Send verification OTP (placeholder - would use scheduler in production)
    console.log(`Would send verification OTP to user ${userId}`);

    return { userId, requiresVerification: true };
  },
});

// Create user account via Google OAuth
export const createAccountFromGoogle = mutation({
  args: {
    orgId: v.id("orgs"),
    email: v.string(),
    name: v.string(),
    googleId: v.string(),
    profileImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      // Update with Google info if not already linked
      if (!existingUser.googleId) {
        await ctx.db.patch(existingUser._id, {
          googleId: args.googleId,
          profileImageUrl: args.profileImageUrl,
          emailVerified: true, // Google emails are verified
          updatedAt: Date.now(),
        });
      }
      return { userId: existingUser._id, requiresVerification: false };
    }

    const now = Date.now();

    // Create user
    const userId = await ctx.db.insert("users", {
      orgId: args.orgId,
      email: args.email,
      name: args.name,
      role: "staff",
      googleId: args.googleId,
      profileImageUrl: args.profileImageUrl,
      twoFactorEnabled: false, // Google OAuth doesn't require 2FA
      preferredOtpMethod: "email",
      isActive: true,
      emailVerified: true, // Google emails are verified
      phoneVerified: false,
      lastLogin: now,
      createdAt: now,
      updatedAt: now,
    });

    // Log account creation
    await ctx.db.insert("authEvents", {
      userId,
      email: args.email,
      eventType: "account_created",
      method: "google",
      createdAt: now,
    });

    return { userId, requiresVerification: false };
  },
});

// Login with email/password
export const loginWithEmail = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    deviceInfo: v.optional(v.object({
      userAgent: v.string(),
      ip: v.string(),
      deviceName: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user || !user.passwordHash || !verifyPassword(args.password, user.passwordHash)) {
      // Log failed login
      await ctx.db.insert("authEvents", {
        email: args.email,
        eventType: "login_failed",
        method: "email",
        deviceInfo: args.deviceInfo,
        createdAt: Date.now(),
      });
      throw new Error("Invalid credentials");
    }

    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    const now = Date.now();

    // Update last login
    await ctx.db.patch(user._id, {
      lastLogin: now,
      updatedAt: now,
    });

    // If 2FA is enabled, send OTP
    if (user.twoFactorEnabled) {
      // Send OTP (placeholder - would use scheduler in production)
      const otpMethod = user.preferredOtpMethod || "email";
      console.log(`Would send OTP to user ${user._id} via ${otpMethod}`);

      // Log OTP sent
      await ctx.db.insert("authEvents", {
        userId: user._id,
        email: args.email,
        eventType: "otp_sent",
        method: "email",
        deviceInfo: args.deviceInfo,
        createdAt: now,
      });

      return {
        userId: user._id,
        orgId: user.orgId,
        requiresOTP: true,
        otpMethod,
      };
    }

    // Create session
    const sessionToken = `session_${user._id}_${now}_${Math.random()}`;
    await ctx.db.insert("userSessions", {
      userId: user._id,
      sessionToken,
      deviceInfo: args.deviceInfo,
      isActive: true,
      expiresAt: now + (7 * 24 * 60 * 60 * 1000), // 7 days
      lastUsedAt: now,
      createdAt: now,
    });

    // Log successful login
    await ctx.db.insert("authEvents", {
      userId: user._id,
      email: args.email,
      eventType: "login_success",
      method: "email",
      deviceInfo: args.deviceInfo,
      createdAt: now,
    });

    return {
      userId: user._id,
      orgId: user.orgId,
      sessionToken,
      requiresOTP: false,
    };
  },
});

// Login with Google OAuth
export const loginWithGoogle = mutation({
  args: {
    email: v.string(),
    googleId: v.string(),
    name: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    deviceInfo: v.optional(v.object({
      userAgent: v.string(),
      ip: v.string(),
      deviceName: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_google_id", (q) => q.eq("googleId", args.googleId))
      .first();

    if (!user) {
      // Log failed login
      await ctx.db.insert("authEvents", {
        email: args.email,
        eventType: "login_failed",
        method: "google",
        deviceInfo: args.deviceInfo,
        createdAt: Date.now(),
      });
      throw new Error("No account found with this Google account");
    }

    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    const now = Date.now();

    // Update user info and last login
    await ctx.db.patch(user._id, {
      name: args.name || user.name,
      profileImageUrl: args.profileImageUrl || user.profileImageUrl,
      lastLogin: now,
      updatedAt: now,
    });

    // Create session
    const sessionToken = `session_${user._id}_${now}_${Math.random()}`;
    await ctx.db.insert("userSessions", {
      userId: user._id,
      sessionToken,
      deviceInfo: args.deviceInfo,
      isActive: true,
      expiresAt: now + (7 * 24 * 60 * 60 * 1000), // 7 days
      lastUsedAt: now,
      createdAt: now,
    });

    // Log successful login
    await ctx.db.insert("authEvents", {
      userId: user._id,
      email: args.email,
      eventType: "login_success",
      method: "google",
      deviceInfo: args.deviceInfo,
      createdAt: now,
    });

    return {
      userId: user._id,
      orgId: user.orgId,
      sessionToken,
      requiresOTP: false,
    };
  },
});

// Verify OTP and complete login
export const verifyOTP = mutation({
  args: {
    userId: v.id("users"),
    code: v.string(),
    deviceInfo: v.optional(v.object({
      userAgent: v.string(),
      ip: v.string(),
      deviceName: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Find valid OTP
    const otp = await ctx.db
      .query("otpCodes")
      .withIndex("by_user_type", (q) => q.eq("userId", args.userId).eq("type", "login"))
      .filter((q) => 
        q.and(
          q.eq(q.field("code"), args.code),
          q.eq(q.field("isUsed"), false),
          q.gt(q.field("expiresAt"), Date.now())
        )
      )
      .first();

    if (!otp) {
      // Log failed OTP
      await ctx.db.insert("authEvents", {
        userId: args.userId,
        email: user.email,
        eventType: "otp_failed",
        method: "otp",
        deviceInfo: args.deviceInfo,
        createdAt: Date.now(),
      });
      throw new Error("Invalid or expired OTP code");
    }

    // Check attempt limits
    if (otp.attempts >= otp.maxAttempts) {
      throw new Error("Too many failed attempts. Please request a new code.");
    }

    const now = Date.now();

    // Mark OTP as used
    await ctx.db.patch(otp._id, {
      isUsed: true,
      usedAt: now,
    });

    // Create session
    const sessionToken = `session_${user._id}_${now}_${Math.random()}`;
    await ctx.db.insert("userSessions", {
      userId: user._id,
      sessionToken,
      deviceInfo: args.deviceInfo,
      isActive: true,
      expiresAt: now + (7 * 24 * 60 * 60 * 1000), // 7 days
      lastUsedAt: now,
      createdAt: now,
    });

    // Log successful OTP verification
    await ctx.db.insert("authEvents", {
      userId: args.userId,
      email: user.email,
      eventType: "otp_verified",
      method: "otp",
      deviceInfo: args.deviceInfo,
      createdAt: now,
    });

    return {
      userId: user._id,
      orgId: user.orgId,
      sessionToken,
    };
  },
});

// Send OTP code (simplified for now)
export const sendOTP = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(v.literal("login"), v.literal("verification"), v.literal("password_reset")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Generate OTP
    const code = generateOTP();
    const now = Date.now();
    const expiresAt = now + (10 * 60 * 1000); // 10 minutes

    // Invalidate existing OTPs
    const existingOtps = await ctx.db
      .query("otpCodes")
      .withIndex("by_user_type", (q) => q.eq("userId", args.userId).eq("type", args.type))
      .filter((q) => q.eq(q.field("isUsed"), false))
      .collect();

    for (const otp of existingOtps) {
      await ctx.db.patch(otp._id, { isUsed: true });
    }

    // Create new OTP
    const deliveryMethod = user.preferredOtpMethod || "email";
    const deliveryTarget = deliveryMethod === "sms" ? user.phone : user.email;

    if (!deliveryTarget) {
      throw new Error(`No ${deliveryMethod} configured for user`);
    }

    await ctx.db.insert("otpCodes", {
      userId: args.userId,
      code,
      type: args.type,
      deliveryMethod,
      deliveryTarget,
      isUsed: false,
      attempts: 0,
      maxAttempts: 3,
      expiresAt,
      createdAt: now,
    });

    // Send OTP via SMS or Email
    if (deliveryMethod === "sms") {
      // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
      console.log(`SMS OTP to ${deliveryTarget}: ${code}`);
    } else {
      // In production, integrate with email service (AWS SES, SendGrid, etc.)
      console.log(`Email OTP to ${deliveryTarget}: ${code}`);
    }

    return { success: true, deliveryMethod, deliveryTarget: deliveryTarget.replace(/(.{3}).*(.{2})/, '$1***$2') };
  },
});

// Get current user by session token
export const getCurrentUser = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session || !session.isActive || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user || !user.isActive) {
      return null;
    }

    // Note: In production, update last used time
    console.log(`Session ${session._id} accessed`);

    // Get organization
    const organization = await ctx.db.get(user.orgId);

    return {
      userId: user._id,
      orgId: user.orgId,
      email: user.email,
      name: user.name,
      role: user.role,
      profileImageUrl: user.profileImageUrl,
      organization: organization ? {
        name: organization.name,
        logo: organization.logo,
      } : null,
    };
  },
});

// Logout
export const logout = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        isActive: false,
      });

      const user = await ctx.db.get(session.userId);
      if (user) {
        await ctx.db.insert("authEvents", {
          userId: user._id,
          email: user.email,
          eventType: "logout",
          method: "email",
          createdAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

// Create test organization (for development/testing)
export const createTestOrg = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if test org already exists
    const existing = await ctx.db
      .query("orgs")
      .filter((q) => q.eq(q.field("name"), "Test Aesthetics Clinic"))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create test organization
    const now = Date.now();
    const orgId = await ctx.db.insert("orgs", {
      name: "Test Aesthetics Clinic",
      logo: undefined,
      domain: "test.aesthetics.local",
      qrKey: undefined,
      stripe_customer_id: undefined,
      limits: {
        clients: 1000,
        storage_gb: 10,
        messages_per_month: 5000,
      },
      createdAt: now,
      updatedAt: now,
    });

    // Create test admin user
    await ctx.db.insert("users", {
      orgId,
      email: "admin@test.local",
      name: "Test Admin",
      role: "admin",
      passwordHash: hashPassword("testpassword123"),
      phone: "+1234567890",
      twoFactorEnabled: false, // Disabled for easier testing
      preferredOtpMethod: "email",
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`Created test organization with ID: ${orgId}`);
    return orgId;
  },
});