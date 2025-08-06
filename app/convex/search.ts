import { query } from "./_generated/server";
import { v } from "convex/values";

export const clients = query({
  args: {
    orgId: v.id("orgs"),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const searchTerm = args.query.toLowerCase();
    
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const filtered = clients.filter((client) => {
      const fullName = client.fullName.toLowerCase();
      const email = client.email?.toLowerCase() || "";
      const phones = client.phones.join(" ").toLowerCase();
      
      return (
        fullName.includes(searchTerm) ||
        email.includes(searchTerm) ||
        phones.includes(searchTerm) ||
        client.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    });

    return filtered.slice(0, args.limit || 20);
  },
});

export const appointments = query({
  args: {
    orgId: v.id("orgs"),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const searchTerm = args.query.toLowerCase();
    
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    // Get client names for search
    const clientIds = [...new Set(appointments.map(a => a.clientId))];
    const clients = await Promise.all(
      clientIds.map(id => ctx.db.get(id))
    );
    const clientMap = new Map();
    clients.forEach(c => {
      if (c) clientMap.set(c._id, c);
    });

    const filtered = appointments.filter((appointment) => {
      const client = clientMap.get(appointment.clientId);
      const clientName = client?.fullName.toLowerCase() || "";
      const type = appointment.type.toLowerCase();
      const provider = appointment.provider.toLowerCase();
      const notes = appointment.notes?.toLowerCase() || "";
      
      return (
        clientName.includes(searchTerm) ||
        type.includes(searchTerm) ||
        provider.includes(searchTerm) ||
        notes.includes(searchTerm)
      );
    });

    return filtered.slice(0, args.limit || 20);
  },
});

export const workflows = query({
  args: {
    orgId: v.id("orgs"),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const searchTerm = args.query.toLowerCase();
    
    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const filtered = workflows.filter((workflow) => {
      const name = workflow.name.toLowerCase();
      const description = workflow.description?.toLowerCase() || "";
      const trigger = workflow.trigger.toLowerCase();
      
      return (
        name.includes(searchTerm) ||
        description.includes(searchTerm) ||
        trigger.includes(searchTerm)
      );
    });

    return filtered.slice(0, args.limit || 20);
  },
});

export const global = query({
  args: {
    orgId: v.id("orgs"),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const searchLimit = Math.ceil(limit / 3);

    const [clients, appointments, workflows] = await Promise.all([
      ctx.runQuery("search:clients" as any, { 
        orgId: args.orgId, 
        query: args.query, 
        limit: searchLimit 
      }),
      ctx.runQuery("search:appointments" as any, { 
        orgId: args.orgId, 
        query: args.query, 
        limit: searchLimit 
      }),
      ctx.runQuery("search:workflows" as any, { 
        orgId: args.orgId, 
        query: args.query, 
        limit: searchLimit 
      }),
    ]);

    return {
      clients: clients.slice(0, searchLimit),  
      appointments: appointments.slice(0, searchLimit),
      workflows: workflows.slice(0, searchLimit),
      total: clients.length + appointments.length + workflows.length,
    };
  },
});

// Additional functions for convexSearchService
export const globalSearch = global;

export const searchByType = query({
  args: {
    orgId: v.id("orgs"),
    query: v.string(),
    type: v.union(v.literal("clients"), v.literal("appointments"), v.literal("workflows")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    switch (args.type) {
      case "clients":
        return await ctx.runQuery("search:clients" as any, args);
      case "appointments":
        return await ctx.runQuery("search:appointments" as any, args);
      case "workflows":
        return await ctx.runQuery("search:workflows" as any, args);
      default:
        return [];
    }
  },
});

export const getSearchSuggestions = query({
  args: {
    orgId: v.id("orgs"),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;
    const searchTerm = args.query.toLowerCase();
    
    // Get recent client names as suggestions
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .take(20);
    
    const suggestions = clients
      .filter(client => client.fullName.toLowerCase().includes(searchTerm))
      .map(client => client.fullName)
      .slice(0, limit);
    
    return suggestions;
  },
});