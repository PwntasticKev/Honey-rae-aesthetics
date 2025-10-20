import { db } from "./lib/db";
import { permissions, userPermissions, orgPermissions, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Define all available permissions
export const PERMISSIONS = {
  // Clients
  CLIENTS_VIEW: "clients.view",
  CLIENTS_CREATE: "clients.create",
  CLIENTS_EDIT: "clients.edit",
  CLIENTS_DELETE: "clients.delete",
  CLIENTS_EXPORT: "clients.export",

  // Workflows
  WORKFLOWS_VIEW: "workflows.view",
  WORKFLOWS_CREATE: "workflows.create",
  WORKFLOWS_EDIT: "workflows.edit",
  WORKFLOWS_DELETE: "workflows.delete",
  WORKFLOWS_EXECUTE: "workflows.execute",

  // Appointments
  APPOINTMENTS_VIEW: "appointments.view",
  APPOINTMENTS_CREATE: "appointments.create",
  APPOINTMENTS_EDIT: "appointments.edit",
  APPOINTMENTS_DELETE: "appointments.delete",

  // Files
  FILES_VIEW: "files.view",
  FILES_UPLOAD: "files.upload",
  FILES_DELETE: "files.delete",
  FILES_DOWNLOAD: "files.download",

  // Messages & Communication
  MESSAGES_VIEW: "messages.view",
  MESSAGES_SEND: "messages.send",
  MESSAGES_SEND_BULK: "messages.send_bulk",
  MESSAGES_TEMPLATES: "messages.templates",
  MESSAGES_TEMPLATES_CREATE: "messages.templates.create",
  MESSAGES_TEMPLATES_EDIT: "messages.templates.edit",
  MESSAGES_TEMPLATES_DELETE: "messages.templates.delete",
  MESSAGES_VARIABLES: "messages.variables",
  MESSAGES_VARIABLES_CREATE: "messages.variables.create",
  MESSAGES_VARIABLES_EDIT: "messages.variables.edit",
  MESSAGES_VARIABLES_DELETE: "messages.variables.delete",
  MESSAGES_DELIVERY_LOG: "messages.delivery_log",
  MESSAGES_OPT_OUT_MANAGE: "messages.opt_out.manage",

  // Calendar Integration
  CALENDAR_VIEW: "calendar.view",
  CALENDAR_CONNECT: "calendar.connect",
  CALENDAR_SYNC: "calendar.sync",
  CALENDAR_DISCONNECT: "calendar.disconnect",
  CALENDAR_WEBHOOKS: "calendar.webhooks",
  CALENDAR_SETTINGS: "calendar.settings",

  // Appointment Check-in
  CHECKIN_VIEW: "checkin.view",
  CHECKIN_PROCESS: "checkin.process",
  CHECKIN_UPDATE: "checkin.update",
  CHECKIN_REPORTS: "checkin.reports",

  // Enhanced Workflows
  WORKFLOWS_TRIGGERS: "workflows.triggers",
  WORKFLOWS_TRIGGERS_CREATE: "workflows.triggers.create",
  WORKFLOWS_TRIGGERS_EDIT: "workflows.triggers.edit",
  WORKFLOWS_TRIGGERS_DELETE: "workflows.triggers.delete",
  WORKFLOWS_ENROLLMENTS: "workflows.enrollments",
  WORKFLOWS_ENROLLMENTS_MANAGE: "workflows.enrollments.manage",
  WORKFLOWS_ANALYTICS: "workflows.analytics",

  // Client Management Enhanced
  CLIENTS_DUPLICATES: "clients.duplicates",
  CLIENTS_DUPLICATES_RESOLVE: "clients.duplicates.resolve",
  CLIENTS_COMMUNICATION_PREFS: "clients.communication_prefs",
  CLIENTS_IMPORT: "clients.import",
  CLIENTS_MERGE: "clients.merge",

  // Social Media
  SOCIAL_VIEW: "social.view",
  SOCIAL_POST: "social.post",
  SOCIAL_SCHEDULE: "social.schedule",
  SOCIAL_ANALYTICS: "social.analytics",

  // Users (within org)
  USERS_VIEW: "users.view",
  USERS_INVITE: "users.invite",
  USERS_EDIT: "users.edit",
  USERS_DELETE: "users.delete",
  USERS_PERMISSIONS: "users.permissions",

  // Organization Settings
  ORG_SETTINGS: "org.settings",
  ORG_BILLING: "org.billing",
  ORG_THEMES: "org.themes",

  // Analytics
  ANALYTICS_VIEW: "analytics.view",
  ANALYTICS_EXPORT: "analytics.export",

  // Master Owner Only
  MASTER_ADMIN: "master.admin",
  MASTER_ORGS: "master.orgs",
  MASTER_USERS: "master.users",
  MASTER_BILLING: "master.billing",
  MASTER_ANALYTICS: "master.analytics",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Default permissions by role
export const DEFAULT_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    // Client Management
    PERMISSIONS.CLIENTS_VIEW,
    PERMISSIONS.CLIENTS_CREATE,
    PERMISSIONS.CLIENTS_EDIT,
    PERMISSIONS.CLIENTS_DELETE,
    PERMISSIONS.CLIENTS_EXPORT,
    PERMISSIONS.CLIENTS_DUPLICATES,
    PERMISSIONS.CLIENTS_DUPLICATES_RESOLVE,
    PERMISSIONS.CLIENTS_COMMUNICATION_PREFS,
    PERMISSIONS.CLIENTS_IMPORT,
    PERMISSIONS.CLIENTS_MERGE,
    
    // Workflows
    PERMISSIONS.WORKFLOWS_VIEW,
    PERMISSIONS.WORKFLOWS_CREATE,
    PERMISSIONS.WORKFLOWS_EDIT,
    PERMISSIONS.WORKFLOWS_DELETE,
    PERMISSIONS.WORKFLOWS_EXECUTE,
    PERMISSIONS.WORKFLOWS_TRIGGERS,
    PERMISSIONS.WORKFLOWS_TRIGGERS_CREATE,
    PERMISSIONS.WORKFLOWS_TRIGGERS_EDIT,
    PERMISSIONS.WORKFLOWS_TRIGGERS_DELETE,
    PERMISSIONS.WORKFLOWS_ENROLLMENTS,
    PERMISSIONS.WORKFLOWS_ENROLLMENTS_MANAGE,
    PERMISSIONS.WORKFLOWS_ANALYTICS,
    
    // Appointments & Check-in
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.APPOINTMENTS_EDIT,
    PERMISSIONS.APPOINTMENTS_DELETE,
    PERMISSIONS.CHECKIN_VIEW,
    PERMISSIONS.CHECKIN_PROCESS,
    PERMISSIONS.CHECKIN_UPDATE,
    PERMISSIONS.CHECKIN_REPORTS,
    
    // Calendar Integration
    PERMISSIONS.CALENDAR_VIEW,
    PERMISSIONS.CALENDAR_CONNECT,
    PERMISSIONS.CALENDAR_SYNC,
    PERMISSIONS.CALENDAR_DISCONNECT,
    PERMISSIONS.CALENDAR_WEBHOOKS,
    PERMISSIONS.CALENDAR_SETTINGS,
    
    // Files
    PERMISSIONS.FILES_VIEW,
    PERMISSIONS.FILES_UPLOAD,
    PERMISSIONS.FILES_DELETE,
    PERMISSIONS.FILES_DOWNLOAD,
    
    // Messages & Communication
    PERMISSIONS.MESSAGES_VIEW,
    PERMISSIONS.MESSAGES_SEND,
    PERMISSIONS.MESSAGES_SEND_BULK,
    PERMISSIONS.MESSAGES_TEMPLATES,
    PERMISSIONS.MESSAGES_TEMPLATES_CREATE,
    PERMISSIONS.MESSAGES_TEMPLATES_EDIT,
    PERMISSIONS.MESSAGES_TEMPLATES_DELETE,
    PERMISSIONS.MESSAGES_VARIABLES,
    PERMISSIONS.MESSAGES_VARIABLES_CREATE,
    PERMISSIONS.MESSAGES_VARIABLES_EDIT,
    PERMISSIONS.MESSAGES_VARIABLES_DELETE,
    PERMISSIONS.MESSAGES_DELIVERY_LOG,
    PERMISSIONS.MESSAGES_OPT_OUT_MANAGE,
    
    // Social Media
    PERMISSIONS.SOCIAL_VIEW,
    PERMISSIONS.SOCIAL_POST,
    PERMISSIONS.SOCIAL_SCHEDULE,
    PERMISSIONS.SOCIAL_ANALYTICS,
    
    // User Management
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_INVITE,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.USERS_PERMISSIONS,
    
    // Organization
    PERMISSIONS.ORG_SETTINGS,
    PERMISSIONS.ORG_BILLING,
    PERMISSIONS.ORG_THEMES,
    
    // Analytics
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
  ],
  manager: [
    // Client Management
    PERMISSIONS.CLIENTS_VIEW,
    PERMISSIONS.CLIENTS_CREATE,
    PERMISSIONS.CLIENTS_EDIT,
    PERMISSIONS.CLIENTS_EXPORT,
    PERMISSIONS.CLIENTS_DUPLICATES,
    PERMISSIONS.CLIENTS_DUPLICATES_RESOLVE,
    PERMISSIONS.CLIENTS_COMMUNICATION_PREFS,
    PERMISSIONS.CLIENTS_IMPORT,
    
    // Workflows
    PERMISSIONS.WORKFLOWS_VIEW,
    PERMISSIONS.WORKFLOWS_CREATE,
    PERMISSIONS.WORKFLOWS_EDIT,
    PERMISSIONS.WORKFLOWS_EXECUTE,
    PERMISSIONS.WORKFLOWS_TRIGGERS,
    PERMISSIONS.WORKFLOWS_TRIGGERS_CREATE,
    PERMISSIONS.WORKFLOWS_TRIGGERS_EDIT,
    PERMISSIONS.WORKFLOWS_ENROLLMENTS,
    PERMISSIONS.WORKFLOWS_ENROLLMENTS_MANAGE,
    PERMISSIONS.WORKFLOWS_ANALYTICS,
    
    // Appointments & Check-in
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.APPOINTMENTS_EDIT,
    PERMISSIONS.CHECKIN_VIEW,
    PERMISSIONS.CHECKIN_PROCESS,
    PERMISSIONS.CHECKIN_UPDATE,
    PERMISSIONS.CHECKIN_REPORTS,
    
    // Calendar Integration
    PERMISSIONS.CALENDAR_VIEW,
    PERMISSIONS.CALENDAR_CONNECT,
    PERMISSIONS.CALENDAR_SYNC,
    PERMISSIONS.CALENDAR_SETTINGS,
    
    // Files
    PERMISSIONS.FILES_VIEW,
    PERMISSIONS.FILES_UPLOAD,
    PERMISSIONS.FILES_DOWNLOAD,
    
    // Messages & Communication
    PERMISSIONS.MESSAGES_VIEW,
    PERMISSIONS.MESSAGES_SEND,
    PERMISSIONS.MESSAGES_SEND_BULK,
    PERMISSIONS.MESSAGES_TEMPLATES,
    PERMISSIONS.MESSAGES_TEMPLATES_CREATE,
    PERMISSIONS.MESSAGES_TEMPLATES_EDIT,
    PERMISSIONS.MESSAGES_VARIABLES,
    PERMISSIONS.MESSAGES_DELIVERY_LOG,
    PERMISSIONS.MESSAGES_OPT_OUT_MANAGE,
    
    // Social Media
    PERMISSIONS.SOCIAL_VIEW,
    PERMISSIONS.SOCIAL_POST,
    PERMISSIONS.SOCIAL_SCHEDULE,
    PERMISSIONS.SOCIAL_ANALYTICS,
    
    // User Management
    PERMISSIONS.USERS_VIEW,
    
    // Organization
    PERMISSIONS.ORG_SETTINGS,
    PERMISSIONS.ORG_THEMES,
    
    // Analytics
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  staff: [
    // Client Management
    PERMISSIONS.CLIENTS_VIEW,
    PERMISSIONS.CLIENTS_CREATE,
    PERMISSIONS.CLIENTS_EDIT,
    PERMISSIONS.CLIENTS_COMMUNICATION_PREFS,
    
    // Workflows
    PERMISSIONS.WORKFLOWS_VIEW,
    PERMISSIONS.WORKFLOWS_EXECUTE,
    PERMISSIONS.WORKFLOWS_ENROLLMENTS,
    
    // Appointments & Check-in
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.APPOINTMENTS_EDIT,
    PERMISSIONS.CHECKIN_VIEW,
    PERMISSIONS.CHECKIN_PROCESS,
    PERMISSIONS.CHECKIN_UPDATE,
    
    // Calendar Integration
    PERMISSIONS.CALENDAR_VIEW,
    PERMISSIONS.CALENDAR_SYNC,
    
    // Files
    PERMISSIONS.FILES_VIEW,
    PERMISSIONS.FILES_UPLOAD,
    PERMISSIONS.FILES_DOWNLOAD,
    
    // Messages & Communication
    PERMISSIONS.MESSAGES_VIEW,
    PERMISSIONS.MESSAGES_SEND,
    PERMISSIONS.MESSAGES_TEMPLATES,
    PERMISSIONS.MESSAGES_DELIVERY_LOG,
    
    // Social Media
    PERMISSIONS.SOCIAL_VIEW,
    PERMISSIONS.SOCIAL_POST,
    
    // Organization
    PERMISSIONS.ORG_THEMES,
  ],
};

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: number): Promise<Permission[]> {
  try {
    // Get user's role and org
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return [];
    }

    // If master owner, return all permissions
    if (user.isMasterOwner && user.orgId === 1) {
      return Object.values(PERMISSIONS);
    }

    // Start with default permissions for role
    let userPermissionsList = [...(DEFAULT_PERMISSIONS[user.role] || [])];

    // Get org-level permission restrictions
    const orgRestrictions = await db
      .select({
        permission: permissions.name,
        enabled: orgPermissions.enabled,
      })
      .from(orgPermissions)
      .innerJoin(permissions, eq(permissions.id, orgPermissions.permissionId))
      .where(
        and(
          eq(orgPermissions.orgId, user.orgId),
          eq(orgPermissions.enabled, false)
        )
      );

    // Remove disabled org-level permissions
    const disabledOrgPermissions = orgRestrictions.map(r => r.permission as Permission);
    userPermissionsList = userPermissionsList.filter(p => !disabledOrgPermissions.includes(p));

    // Get user-specific permission overrides
    const userOverrides = await db
      .select({
        permission: permissions.name,
        granted: userPermissions.granted,
      })
      .from(userPermissions)
      .innerJoin(permissions, eq(permissions.id, userPermissions.permissionId))
      .where(eq(userPermissions.userId, userId));

    // Apply user-specific overrides
    for (const override of userOverrides) {
      const permission = override.permission as Permission;
      if (override.granted && !userPermissionsList.includes(permission)) {
        userPermissionsList.push(permission);
      } else if (!override.granted && userPermissionsList.includes(permission)) {
        userPermissionsList = userPermissionsList.filter(p => p !== permission);
      }
    }

    return userPermissionsList;
  } catch (error) {
    console.error("Error getting user permissions:", error);
    return [];
  }
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(userId: number, permission: Permission): Promise<boolean> {
  const userPermissionsList = await getUserPermissions(userId);
  return userPermissionsList.includes(permission);
}

/**
 * Check if user has any of the given permissions
 */
export async function hasAnyPermission(userId: number, permissionsList: Permission[]): Promise<boolean> {
  const userPermissionsList = await getUserPermissions(userId);
  return permissionsList.some(p => userPermissionsList.includes(p));
}

/**
 * Check if user has all of the given permissions
 */
export async function hasAllPermissions(userId: number, permissionsList: Permission[]): Promise<boolean> {
  const userPermissionsList = await getUserPermissions(userId);
  return permissionsList.every(p => userPermissionsList.includes(p));
}

/**
 * Initialize default permissions in database
 */
export async function initializePermissions() {
  const allPermissions = Object.entries(PERMISSIONS);
  
  for (const [key, permission] of allPermissions) {
    try {
      await db.insert(permissions).values({
        name: permission,
        description: `Permission to ${key.toLowerCase().replace(/_/g, " ")}`,
        category: permission.split(".")[0],
        isDefault: DEFAULT_PERMISSIONS.staff.includes(permission),
      }).onDuplicateKeyUpdate({
        set: {
          description: `Permission to ${key.toLowerCase().replace(/_/g, " ")}`,
        },
      });
    } catch (error) {
      // Permission already exists, skip
    }
  }
}

/**
 * Middleware helper to check permissions on API routes
 */
export function withPermission(permission: Permission) {
  return async (userId: number): Promise<boolean> => {
    return await hasPermission(userId, permission);
  };
}