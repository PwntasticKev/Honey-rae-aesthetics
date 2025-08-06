import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
	args: {
		orgId: v.id("orgs"),
		name: v.string(),
		email: v.string(),
		role: v.union(v.literal("admin"), v.literal("manager"), v.literal("staff")),
		invited_by: v.optional(v.id("users")),
		// New required fields for auth system
		passwordHash: v.optional(v.string()),
		googleId: v.optional(v.string()),
		phone: v.optional(v.string()),
		twoFactorEnabled: v.optional(v.boolean()),
		preferredOtpMethod: v.optional(v.union(v.literal("sms"), v.literal("email"))),
		isActive: v.optional(v.boolean()),
		emailVerified: v.optional(v.boolean()),
		phoneVerified: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		const userId = await ctx.db.insert("users", {
			...args,
			// Set defaults for new required fields
			twoFactorEnabled: args.twoFactorEnabled ?? false,
			preferredOtpMethod: args.preferredOtpMethod ?? "email",
			isActive: args.isActive ?? true,
			emailVerified: args.emailVerified ?? false,
			phoneVerified: args.phoneVerified ?? false,
			createdAt: now,
			updatedAt: now,
		});
		return userId;
	},
});

export const get = query({
	args: { id: v.id("users") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const getByEmail = query({
	args: { email: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.first();
	},
});

export const getByOrg = query({
	args: { orgId: v.id("orgs") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("users")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.collect();
	},
});

export const update = mutation({
	args: {
		id: v.id("users"),
		name: v.optional(v.string()),
		email: v.optional(v.string()),
		role: v.optional(v.union(v.literal("admin"), v.literal("manager"), v.literal("staff"))),
		lastLogin: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;
		await ctx.db.patch(id, {
			...updates,
			updatedAt: Date.now(),
		});
	},
});

export const updateLastLogin = mutation({
	args: { id: v.id("users") },
	handler: async (ctx, args) => {
		await ctx.db.patch(args.id, {
			lastLogin: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

export const remove = mutation({
	args: { id: v.id("users") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	},
}); 