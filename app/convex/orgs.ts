import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("orgs").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    logo: v.optional(v.string()),
    domain: v.optional(v.string()),
    qrKey: v.optional(v.string()),
    limits: v.object({
      clients: v.number(),
      storage_gb: v.number(),
      messages_per_month: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const orgId = await ctx.db.insert("orgs", {
      name: args.name,
      logo: args.logo,
      domain: args.domain,
      qrKey: args.qrKey,
      limits: args.limits,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return orgId;
  },
});

export const update = mutation({
  args: {
    id: v.id("orgs"),
    name: v.optional(v.string()),
    logo: v.optional(v.string()),
    domain: v.optional(v.string()),
    qrKey: v.optional(v.string()),
    limits: v.optional(
      v.object({
        clients: v.number(),
        storage_gb: v.number(),
        messages_per_month: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("orgs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const get = query({
  args: { id: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const updateTheme = mutation({
  args: {
    orgId: v.id("orgs"),
    theme: v.object({
      themeId: v.string(),
      fontFamily: v.optional(v.string()),
      appliedAt: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orgId, {
      theme: args.theme,
      updatedAt: Date.now(),
    });
  },
});

// Create demo organization for testing
export const createDemoOrg = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if demo org already exists
    const existingOrgs = await ctx.db.query("orgs").collect();
    if (existingOrgs.length > 0) {
      return existingOrgs[0]._id;
    }

    // Create demo organization
    const orgId = await ctx.db.insert("orgs", {
      name: "Honey Rae Aesthetics - Demo",
      logo: "",
      domain: "demo.honeyrae.com",
      qrKey: "demo-qr-key",
      limits: {
        clients: 1000,
        storage_gb: 100,
        messages_per_month: 10000,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create demo user
    await ctx.db.insert("users", {
      orgId,
      name: "Dr. Kevin Rae",
      email: "demo@honeyrae.com",
      role: "admin",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create demo clients
    const client1 = await ctx.db.insert("clients", {
      orgId,
      fullName: "Sarah Johnson",
      gender: "female",
      dateOfBirth: "1990-05-15",
      phones: ["+15551234567"],
      email: "sarah.johnson@email.com",
      tags: ["new", "consultation"],
      clientPortalStatus: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const client2 = await ctx.db.insert("clients", {
      orgId,
      fullName: "Michael Chen",
      gender: "male",
      dateOfBirth: "1985-08-22",
      phones: ["+15559876543"],
      email: "michael.chen@email.com",
      tags: ["returning", "treatment"],
      clientPortalStatus: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create demo appointments
    await ctx.db.insert("appointments", {
      orgId,
      clientId: client1,
      dateTime: Date.now() + 24 * 60 * 60 * 1000, // Tomorrow
      type: "Consultation",
      provider: "Dr. Rae",
      status: "scheduled",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("appointments", {
      orgId,
      clientId: client2,
      dateTime: Date.now() + 2 * 24 * 60 * 60 * 1000, // Day after tomorrow
      type: "Treatment",
      provider: "Dr. Rae",
      status: "scheduled",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create demo message templates
    await ctx.db.insert("messageTemplates", {
      orgId,
      name: "Welcome New Client",
      type: "sms",
      content:
        "Hi {{first_name}}! Welcome to Honey Rae Aesthetics. We're excited to help you on your beauty journey. Your consultation is scheduled for {{appointment_date}} at {{appointment_time}}. See you soon!",
      mergeTags: ["first_name", "appointment_date", "appointment_time"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("messageTemplates", {
      orgId,
      name: "Appointment Reminder",
      type: "email",
      subject: "Appointment Reminder - {{appointment_date}}",
      content:
        "Dear {{first_name}},\n\nThis is a friendly reminder about your upcoming appointment on {{appointment_date}} at {{appointment_time}}.\n\nPlease arrive 15 minutes early to complete any necessary paperwork.\n\nIf you need to reschedule, please call us at (555) 123-4567.\n\nBest regards,\nHoney Rae Aesthetics Team",
      mergeTags: ["first_name", "appointment_date", "appointment_time"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create demo workflow
    await ctx.db.insert("workflows", {
      orgId,
      name: "Welcome New Client",
      description: "Automatically welcome new clients with SMS and email",
      trigger: "new_client",
      conditions: [],
      actions: [
        {
          type: "send_sms",
          config: {
            templateId: "welcome_sms",
            delay: 0,
          },
          order: 1,
        },
        {
          type: "delay",
          config: {
            hours: 24,
          },
          order: 2,
        },
        {
          type: "send_email",
          config: {
            templateId: "welcome_email",
          },
          order: 3,
        },
      ],
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return orgId;
  },
});
