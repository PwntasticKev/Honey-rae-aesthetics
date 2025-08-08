import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const roleValidator = v.union(
  v.literal("admin"),
  v.literal("manager"),
  v.literal("staff"),
);
const resourceValidator = v.union(
  v.literal("clients"),
  v.literal("appointments"),
  v.literal("create_appointment"),
  v.literal("workflows"),
  v.literal("messages"),
  v.literal("dashboard"),
  v.literal("gallery"),
  v.literal("templates"),
  v.literal("social_media"),
  v.literal("analytics"),
  v.literal("team"),
  v.literal("inventory"),
  v.literal("reviews"),
  v.literal("settings"),
  v.literal("create_workflow"),
  v.literal("edit_workflow"),
  v.literal("delete_workflow"),
  v.literal("create_client"),
  v.literal("edit_client"),
  v.literal("delete_client"),
  v.literal("send_messages"),
  v.literal("manage_team"),
  v.literal("manage_integrations"),
  v.literal("export_data"),
);
const actionValidator = v.union(
  v.literal("read"),
  v.literal("create"),
  v.literal("update"),
  v.literal("delete"),
  v.literal("execute"),
  v.literal("manage"),
);

// Get all team members for an organization
export const getTeamMembers = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    // Get user details for each team member
    const membersWithDetails = await Promise.all(
      teamMembers.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          ...member,
          user,
        };
      }),
    );

    return membersWithDetails;
  },
});

// Invite new team member
export const inviteTeamMember = mutation({
  args: {
    orgId: v.id("orgs"),
    email: v.string(),
    name: v.string(),
    role: roleValidator,
    invitedBy: v.id("users"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    let userId: Id<"users">;

    if (existingUser) {
      // User exists, check if already a team member
      const existingMember = await ctx.db
        .query("teamMembers")
        .withIndex("by_user", (q) => q.eq("userId", existingUser._id))
        .filter((q) => q.eq(q.field("orgId"), args.orgId))
        .first();

      if (existingMember) {
        throw new Error("User is already a team member");
      }
      userId = existingUser._id;
    } else {
      // Create new user
      const now = Date.now();
      userId = await ctx.db.insert("users", {
        orgId: args.orgId,
        name: args.name,
        email: args.email,
        role: args.role,
        isActive: false, // Will be activated when they accept invite
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Generate invite token
    const inviteToken =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const inviteExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    // Create team member record
    const teamMemberId = await ctx.db.insert("teamMembers", {
      orgId: args.orgId,
      userId,
      role: args.role,
      status: "invited",
      invitedBy: args.invitedBy,
      invitedAt: Date.now(),
      inviteToken,
      inviteExpiresAt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create default permissions for the role
    await createDefaultPermissions(ctx, args.orgId, userId, args.role);

    return { teamMemberId, inviteToken };
  },
});

// Update team member role
export const updateTeamMemberRole = mutation({
  args: {
    teamMemberId: v.id("teamMembers"),
    newRole: roleValidator,
    updatedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const teamMember = await ctx.db.get(args.teamMemberId);
    if (!teamMember) {
      throw new Error("Team member not found");
    }

    const oldRole = teamMember.role;

    await ctx.db.patch(args.teamMemberId, {
      role: args.newRole,
      updatedAt: Date.now(),
    });

    // Update permissions for new role
    await updatePermissionsForRole(
      ctx,
      teamMember.orgId,
      teamMember.userId,
      args.newRole,
    );

    // Log the role change
    await ctx.db.insert("auditLogs", {
      orgId: teamMember.orgId,
      userId: args.updatedBy,
      action: "role_changed",
      target: teamMember.userId.toString(),
      details: { oldRole, newRole: args.newRole },
      riskLevel: "medium",
      createdAt: Date.now(),
    });

    return true;
  },
});

// Remove team member
export const removeTeamMember = mutation({
  args: {
    teamMemberId: v.id("teamMembers"),
    removedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const teamMember = await ctx.db.get(args.teamMemberId);
    if (!teamMember) {
      throw new Error("Team member not found");
    }

    // Update status to deactivated instead of deleting
    await ctx.db.patch(args.teamMemberId, {
      status: "deactivated",
      updatedAt: Date.now(),
    });

    // Remove all permissions
    const permissions = await ctx.db
      .query("permissions")
      .withIndex("by_user", (q) => q.eq("userId", teamMember.userId))
      .filter((q) => q.eq(q.field("orgId"), teamMember.orgId))
      .collect();

    for (const permission of permissions) {
      await ctx.db.delete(permission._id);
    }

    // Log the removal
    await ctx.db.insert("auditLogs", {
      orgId: teamMember.orgId,
      userId: args.removedBy,
      action: "user_deactivated",
      target: teamMember.userId.toString(),
      details: { role: teamMember.role },
      riskLevel: "medium",
      createdAt: Date.now(),
    });

    return true;
  },
});

// Get permissions for a user
export const getUserPermissions = query({
  args: {
    userId: v.id("users"),
    orgId: v.id("orgs"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("permissions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("orgId"), args.orgId))
      .collect();
  },
});

// Update specific permission
export const updatePermission = mutation({
  args: {
    userId: v.id("users"),
    orgId: v.id("orgs"),
    resource: resourceValidator,
    action: actionValidator,
    granted: v.boolean(),
    grantedBy: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingPermission = await ctx.db
      .query("permissions")
      .withIndex("by_user_resource", (q) =>
        q.eq("userId", args.userId).eq("resource", args.resource),
      )
      .filter((q) => q.eq(q.field("orgId"), args.orgId))
      .filter((q) => q.eq(q.field("action"), args.action))
      .first();

    const now = Date.now();
    const permissionData = {
      orgId: args.orgId,
      userId: args.userId,
      resource: args.resource,
      action: args.action,
      granted: args.granted,
      grantedBy: args.grantedBy,
      reason: args.reason,
      updatedAt: now,
    };

    if (existingPermission) {
      await ctx.db.patch(existingPermission._id, permissionData);
    } else {
      await ctx.db.insert("permissions", {
        ...permissionData,
        createdAt: now,
      });
    }

    // Log the permission change
    await ctx.db.insert("auditLogs", {
      orgId: args.orgId,
      userId: args.grantedBy,
      action: args.granted ? "permission_granted" : "permission_revoked",
      target: args.userId.toString(),
      details: { resource: args.resource, action: args.action },
      riskLevel: "low",
      createdAt: now,
    });

    return true;
  },
});

// Helper function to create default permissions for a role
async function createDefaultPermissions(
  ctx: MutationCtx,
  orgId: Id<"orgs">,
  userId: Id<"users">,
  role: string,
) {
  const now = Date.now();

  // Define default permissions per role
  const rolePermissions = {
    admin: [
      // Page access
      { resource: "dashboard", action: "read" },
      { resource: "workflows", action: "read" },
      { resource: "clients", action: "read" },
      { resource: "appointments", action: "read" },
      { resource: "gallery", action: "read" },
      { resource: "messages", action: "read" },
      { resource: "templates", action: "read" },
      { resource: "social_media", action: "read" },
      { resource: "analytics", action: "read" },
      { resource: "team", action: "read" },
      { resource: "inventory", action: "read" },
      { resource: "reviews", action: "read" },
      { resource: "settings", action: "read" },
      // Feature permissions
      { resource: "create_workflow", action: "execute" },
      { resource: "edit_workflow", action: "execute" },
      { resource: "delete_workflow", action: "execute" },
      { resource: "create_client", action: "execute" },
      { resource: "edit_client", action: "execute" },
      { resource: "delete_client", action: "execute" },
      { resource: "send_messages", action: "execute" },
      { resource: "manage_team", action: "execute" },
      { resource: "manage_integrations", action: "execute" },
      { resource: "export_data", action: "execute" },
    ],
    manager: [
      // Page access (no team, settings)
      { resource: "dashboard", action: "read" },
      { resource: "workflows", action: "read" },
      { resource: "clients", action: "read" },
      { resource: "appointments", action: "read" },
      { resource: "gallery", action: "read" },
      { resource: "messages", action: "read" },
      { resource: "templates", action: "read" },
      { resource: "social_media", action: "read" },
      { resource: "inventory", action: "read" },
      { resource: "reviews", action: "read" },
      // Feature permissions (limited)
      { resource: "create_workflow", action: "execute" },
      { resource: "edit_workflow", action: "execute" },
      { resource: "create_client", action: "execute" },
      { resource: "edit_client", action: "execute" },
      { resource: "send_messages", action: "execute" },
    ],
    staff: [
      // Page access (read-only)
      { resource: "dashboard", action: "read" },
      { resource: "workflows", action: "read" },
      { resource: "clients", action: "read" },
      { resource: "appointments", action: "read" },
      { resource: "gallery", action: "read" },
      { resource: "messages", action: "read" },
      { resource: "templates", action: "read" },
      { resource: "reviews", action: "read" },
    ],
  };

  const permissions =
    rolePermissions[role as keyof typeof rolePermissions] || [];

  for (const permission of permissions) {
    await ctx.db.insert("permissions", {
      orgId,
      userId,
      resource: permission.resource as any,
      action: permission.action as any,
      granted: true,
      createdAt: now,
      updatedAt: now,
    });
  }
}

// Helper function to update permissions when role changes
async function updatePermissionsForRole(
  ctx: MutationCtx,
  orgId: Id<"orgs">,
  userId: Id<"users">,
  newRole: string,
) {
  // Remove all existing permissions
  const existingPermissions = await ctx.db
    .query("permissions")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("orgId"), orgId))
    .collect();

  for (const permission of existingPermissions) {
    await ctx.db.delete(permission._id);
  }

  // Create new permissions for the role
  await createDefaultPermissions(ctx, orgId, userId, newRole);
}
