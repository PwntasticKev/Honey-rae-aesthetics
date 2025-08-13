import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

const auditActionValidator = v.union(
  // Authentication
  v.literal("login"),
  v.literal("logout"),
  v.literal("login_failed"),
  v.literal("password_reset"),
  v.literal("two_factor_enabled"),
  v.literal("two_factor_disabled"),
  // User management
  v.literal("user_created"),
  v.literal("user_updated"),
  v.literal("user_deactivated"),
  v.literal("user_invited"),
  // Permissions
  v.literal("permission_granted"),
  v.literal("permission_revoked"),
  v.literal("role_changed"),
  v.literal("user_role_changed"),
  // Data operations
  v.literal("client_created"),
  v.literal("client_updated"),
  v.literal("client_deleted"),
  v.literal("workflow_created"),
  v.literal("workflow_updated"),
  v.literal("workflow_deleted"),
  v.literal("workflow_executed"),
  // Settings changes
  v.literal("settings_updated"),
  v.literal("integration_connected"),
  v.literal("integration_disconnected"),
  v.literal("billing_updated"),
  // Security events
  v.literal("suspicious_activity"),
  v.literal("vpn_detected"),
  v.literal("multiple_failed_logins"),
  v.literal("data_export"),
);

const riskLevelValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("critical"),
);

const otpMethodValidator = v.union(v.literal("email"), v.literal("sms"));

// Get audit logs for organization
export const getAuditLogs = query({
  args: {
    orgId: v.id("orgs"),
    limit: v.optional(v.number()),
    riskLevel: v.optional(riskLevelValidator),
    action: v.optional(auditActionValidator),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("auditLogs")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .order("desc");

    if (args.riskLevel) {
      query = query.filter((q) => q.eq(q.field("riskLevel"), args.riskLevel));
    }

    if (args.action) {
      query = query.filter((q) => q.eq(q.field("action"), args.action));
    }

    const logs = await query.take(args.limit || 100);

    return logs;
  },
});

// Create audit log entry
export const createAuditLog = mutation({
  args: {
    orgId: v.id("orgs"),
    userId: v.optional(v.id("users")),
    action: auditActionValidator,
    target: v.optional(v.string()),
    details: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    deviceInfo: v.optional(
      v.object({
        browser: v.optional(v.string()),
        os: v.optional(v.string()),
        device: v.optional(v.string()),
      }),
    ),
    location: v.optional(
      v.object({
        country: v.optional(v.string()),
        region: v.optional(v.string()),
        city: v.optional(v.string()),
        timezone: v.optional(v.string()),
      }),
    ),
    riskLevel: v.optional(riskLevelValidator),
    isVpnDetected: v.optional(v.boolean()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("auditLogs", {
      orgId: args.orgId,
      userId: args.userId,
      action: args.action,
      target: args.target,
      details: args.details,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      deviceInfo: args.deviceInfo,
      location: args.location,
      riskLevel: args.riskLevel || "low",
      isVpnDetected: args.isVpnDetected,
      sessionId: args.sessionId,
      createdAt: Date.now(),
    });
  },
});

// Get security statistics
export const getSecurityStats = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
    const last7Days = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const recentLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.gt(q.field("createdAt"), last24Hours))
      .collect();

    const weekLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.gt(q.field("createdAt"), last7Days))
      .collect();

    const highRiskEvents = recentLogs.filter(
      (log) => log.riskLevel === "high" || log.riskLevel === "critical",
    );

    const vpnDetections = recentLogs.filter((log) => log.isVpnDetected);

    const failedLogins = recentLogs.filter(
      (log) => log.action === "login_failed",
    );

    const suspiciousActivity = recentLogs.filter(
      (log) =>
        log.action === "suspicious_activity" ||
        log.action === "multiple_failed_logins",
    );

    return {
      totalEvents24h: recentLogs.length,
      totalEventsWeek: weekLogs.length,
      highRiskEvents: highRiskEvents.length,
      vpnDetections: vpnDetections.length,
      failedLogins: failedLogins.length,
      suspiciousActivity: suspiciousActivity.length,
      recentHighRiskEvents: highRiskEvents.slice(0, 5),
      topActions: getTopActions(recentLogs),
      riskDistribution: getRiskDistribution(recentLogs),
    };
  },
});

// Enable/disable 2FA for user
export const updateTwoFactorAuth = mutation({
  args: {
    userId: v.id("users"),
    enabled: v.boolean(),
    method: v.optional(otpMethodValidator),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      twoFactorEnabled: args.enabled,
      preferredOtpMethod: args.method,
      updatedAt: Date.now(),
    });

    // Create audit log for 2FA change
    await ctx.db.insert("auditLogs", {
      orgId: user.orgId,
      userId: args.userId,
      action: args.enabled ? "two_factor_enabled" : "two_factor_disabled",
      details: { method: args.method },
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return true;
  },
});

// Get active user sessions
export const getActiveSessions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db
      .query("userSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();
  },
});

// Revoke user session
export const revokeSession = mutation({
  args: {
    sessionId: v.id("userSessions"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== args.userId) {
      throw new Error("Session not found or unauthorized");
    }

    await ctx.db.patch(args.sessionId, {
      isActive: false,
    });

    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.insert("auditLogs", {
        orgId: user.orgId,
        userId: args.userId,
        action: "logout",
        details: { sessionRevoked: true },
        riskLevel: "low",
        createdAt: Date.now(),
      });
    }

    return true;
  },
});

// Helper functions
function getTopActions(logs: Doc<"auditLogs">[]) {
  const actionCounts = logs.reduce(
    (acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return Object.entries(actionCounts)
    .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
    .slice(0, 5)
    .map(([action, count]) => ({ action, count }));
}

function getRiskDistribution(logs: Doc<"auditLogs">[]) {
  const riskCounts = logs.reduce(
    (acc, log) => {
      acc[log.riskLevel] = (acc[log.riskLevel] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return riskCounts;
}
