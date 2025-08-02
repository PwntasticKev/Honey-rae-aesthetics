import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    // Basic Information
    fullName: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    gender: v.union(v.literal("male"), v.literal("female"), v.literal("other")),
    dateOfBirth: v.optional(v.string()),
    nickName: v.optional(v.string()),

    // Contact Information
    email: v.optional(v.string()),
    phones: v.array(v.string()),
    phone2: v.optional(v.string()),

    // Address Information
    address: v.optional(
      v.object({
        street: v.string(),
        addressLine2: v.optional(v.string()),
        city: v.string(),
        state: v.string(),
        country: v.optional(v.string()),
        zip: v.string(),
      }),
    ),

    // Business Information
    referralSource: v.optional(v.string()),
    membershipType: v.optional(v.string()),
    totalSales: v.optional(v.number()),
    relationship: v.optional(v.string()),

    // Status and Tracking
    clientPortalStatus: v.optional(
      v.union(v.literal("active"), v.literal("inactive"), v.literal("pending")),
    ),
    visited: v.optional(v.boolean()),
    fired: v.optional(v.boolean()),
    upcomingAppointment: v.optional(v.number()),

    // Additional Fields
    tags: v.optional(v.array(v.string())),
    profileImageUrl: v.optional(v.string()),
    externalId: v.optional(v.string()),
    importSource: v.optional(v.string()),
    clientCreatedDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const clientId = await ctx.db.insert("clients", {
      ...args,
      tags: args.tags || [],
      clientPortalStatus: args.clientPortalStatus || "active",
      createdAt: now,
      updatedAt: now,
    });
    return clientId;
  },
});

// Create demo clients for testing
export const createDemoClients = mutation({
  args: {
    orgId: v.id("orgs"),
  },
  handler: async (ctx, args) => {
    const demoClients = [
      {
        fullName: "Sarah Johnson",
        gender: "female" as const,
        dateOfBirth: "1985-03-15",
        phones: ["+1-555-0123"],
        email: "sarah.johnson@example.com",
        tags: ["botox", "filler"],
        address: {
          street: "123 Main St",
          city: "Beverly Hills",
          state: "CA",
          zip: "90210",
        },
        referralSource: "Instagram",
        clientPortalStatus: "active" as const,
      },
      {
        fullName: "Michael Chen",
        gender: "male" as const,
        dateOfBirth: "1990-07-22",
        phones: ["+1-555-0456"],
        email: "michael.chen@example.com",
        tags: ["consultation"],
        address: {
          street: "456 Oak Ave",
          city: "Los Angeles",
          state: "CA",
          zip: "90024",
        },
        referralSource: "Google",
        clientPortalStatus: "active" as const,
      },
      {
        fullName: "Emily Rodriguez",
        gender: "female" as const,
        dateOfBirth: "1988-11-08",
        phones: ["+1-555-0789"],
        email: "emily.rodriguez@example.com",
        tags: ["morpheus8", "filler"],
        address: {
          street: "789 Sunset Blvd",
          city: "West Hollywood",
          state: "CA",
          zip: "90069",
        },
        referralSource: "Referral",
        clientPortalStatus: "active" as const,
      },
    ];

    const clientIds = [];
    for (const clientData of demoClients) {
      const clientId = await ctx.db.insert("clients", {
        orgId: args.orgId,
        ...clientData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      clientIds.push(clientId);
    }

    return clientIds;
  },
});

export const get = query({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByOrg = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clients")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clients")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const update = mutation({
  args: {
    id: v.id("clients"),
    fullName: v.optional(v.string()),
    gender: v.optional(
      v.union(v.literal("male"), v.literal("female"), v.literal("other")),
    ),
    dateOfBirth: v.optional(v.string()),
    phones: v.optional(v.array(v.string())),
    email: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    address: v.optional(
      v.object({
        street: v.string(),
        city: v.string(),
        state: v.string(),
        zip: v.string(),
      }),
    ),
    referralSource: v.optional(v.string()),
    clientPortalStatus: v.optional(
      v.union(v.literal("active"), v.literal("inactive"), v.literal("pending")),
    ),
    profileImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const addTag = mutation({
  args: {
    id: v.id("clients"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.id);
    if (!client) {
      throw new Error("Client not found");
    }

    const updatedTags = [...(client.tags || []), args.tag];
    await ctx.db.patch(args.id, {
      tags: updatedTags,
      updatedAt: Date.now(),
    });
  },
});

export const removeTag = mutation({
  args: {
    id: v.id("clients"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.id);
    if (!client) {
      throw new Error("Client not found");
    }

    const updatedTags = (client.tags || []).filter((tag) => tag !== args.tag);
    await ctx.db.patch(args.id, {
      tags: updatedTags,
      updatedAt: Date.now(),
    });
  },
});

// Add tag to multiple clients
export const addTagToMultiple = mutation({
  args: {
    orgId: v.id("orgs"),
    clientIds: v.array(v.id("clients")),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    for (const clientId of args.clientIds) {
      const client = await ctx.db.get(clientId);
      if (client && client.orgId === args.orgId) {
        const currentTags = client.tags || [];
        if (!currentTags.includes(args.tag)) {
          await ctx.db.patch(clientId, {
            tags: [...currentTags, args.tag],
            updatedAt: Date.now(),
          });
        }
      }
    }
  },
});

// Remove tag from multiple clients
export const removeTagFromMultiple = mutation({
  args: {
    orgId: v.id("orgs"),
    clientIds: v.array(v.id("clients")),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    for (const clientId of args.clientIds) {
      const client = await ctx.db.get(clientId);
      if (client && client.orgId === args.orgId) {
        const currentTags = client.tags || [];
        const updatedTags = currentTags.filter((tag) => tag !== args.tag);
        await ctx.db.patch(clientId, {
          tags: updatedTags,
          updatedAt: Date.now(),
        });
      }
    }
  },
});

export const remove = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Delete multiple clients
export const removeMultiple = mutation({
  args: {
    clientIds: v.array(v.id("clients")),
    orgId: v.id("orgs"),
  },
  handler: async (ctx, args) => {
    let deletedCount = 0;
    for (const clientId of args.clientIds) {
      const client = await ctx.db.get(clientId);
      if (client && client.orgId === args.orgId) {
        await ctx.db.delete(clientId);
        deletedCount++;
      }
    }
    return { deletedCount };
  },
});

// Import clients from CSV
export const importClients = mutation({
  args: {
    orgId: v.id("orgs"),
    csvData: v.string(),
    importSource: v.string(),
  },
  handler: async (ctx, args) => {
    const lines = args.csvData.split("\n").filter((line) => line.trim());

    // Try to detect delimiter - check if it's tab or comma separated
    const firstLine = lines[0];
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;

    const delimiter = tabCount > commaCount ? "\t" : ",";
    const headers = lines[0].split(delimiter);
    const dataLines = lines.slice(1);

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };

    console.log(
      `Importing ${dataLines.length} lines with delimiter: ${delimiter}`,
    );
    console.log("Headers:", headers);

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      const values = line.split(delimiter);

      if (values.length < headers.length) {
        results.errors.push(`Line ${i + 2}: Invalid data format`);
        continue;
      }

      const row: any = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || "";
      });

      try {
        // Check for duplicates
        const email = row["Email"] || row["email"];
        const phone = row["Phone"] || row["phone"];
        const firstName = row["First Name"] || row["firstName"];
        const lastName = row["Last Name"] || row["lastName"];

        let existingClient = null;

        if (email) {
          existingClient = await ctx.db
            .query("clients")
            .withIndex("by_email", (q) => q.eq("email", email))
            .filter((q) => q.eq(q.field("orgId"), args.orgId))
            .first();
        }

        if (!existingClient && phone) {
          existingClient = await ctx.db
            .query("clients")
            .withIndex("by_phone", (q) => q.eq("phones", phone))
            .filter((q) => q.eq(q.field("orgId"), args.orgId))
            .first();
        }

        if (!existingClient && firstName && lastName) {
          const fullName = `${firstName} ${lastName}`;
          existingClient = await ctx.db
            .query("clients")
            .withIndex("by_name", (q) => q.eq("fullName", fullName))
            .filter((q) => q.eq(q.field("orgId"), args.orgId))
            .first();
        }

        if (existingClient) {
          results.skipped++;
          continue;
        }

        // Parse date
        let clientCreatedDate = undefined;
        if (row["Client Created Date"]) {
          const date = new Date(row["Client Created Date"]);
          if (!isNaN(date.getTime())) {
            clientCreatedDate = date.getTime();
          }
        }

        // Parse upcoming appointment
        let upcomingAppointment = undefined;
        if (row["Upcoming Appointment"]) {
          const date = new Date(row["Upcoming Appointment"]);
          if (!isNaN(date.getTime())) {
            upcomingAppointment = date.getTime();
          }
        }

        // Create client
        const clientData = {
          orgId: args.orgId,
          fullName:
            `${row["First Name"] || ""} ${row["Last Name"] || ""}`.trim(),
          firstName: row["First Name"] || undefined,
          lastName: row["Last Name"] || undefined,
          email: row["Email"] || undefined,
          phones: [row["Phone"] || ""].filter(Boolean),
          phone2: row["Phone 2"] || undefined,
          gender: (row["Gender"] || "other").toLowerCase() as
            | "male"
            | "female"
            | "other",
          dateOfBirth: row["DOB"] || undefined,
          nickName: row["Nick Name"] || undefined,
          address: row["Address Line 1"]
            ? {
                street: row["Address Line 1"],
                addressLine2: row["Address Line 2"] || undefined,
                city: row["City"] || "",
                state: row["State"] || "",
                country: row["Country"] || undefined,
                zip: row["Zip#"] || "",
              }
            : undefined,
          referralSource: row["Referral Source"] || undefined,
          membershipType: row["Membership Type"] || undefined,
          totalSales: row["Total Sales"]
            ? parseFloat(row["Total Sales"])
            : undefined,
          relationship: row["Relationship"] || undefined,
          visited: row["Visited"] === "true" || row["Visited"] === "1",
          fired: row["Fired"] === "true" || row["Fired"] === "1",
          upcomingAppointment,
          clientPortalStatus: (() => {
            const status = row["Client Portal Status"];
            if (
              status === "active" ||
              status === "inactive" ||
              status === "pending"
            ) {
              return status;
            }
            return "active"; // Default to active if invalid status
          })(),
          tags: [],
          externalId: row["ID"] || undefined,
          importSource: args.importSource,
          clientCreatedDate,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        await ctx.db.insert("clients", clientData);
        results.imported++;
      } catch (error) {
        console.error(`Import error on line ${i + 2}:`, error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        results.errors.push(`Line ${i + 2}: ${errorMessage}`);
      }
    }

    return results;
  },
});

// Export clients to CSV
export const exportClients = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const headers = [
      "ID",
      "First Name",
      "Last Name",
      "Email",
      "Gender",
      "Phone",
      "Phone 2",
      "DOB",
      "Address Line 1",
      "Address Line 2",
      "City",
      "State",
      "Country",
      "Zip#",
      "Visited",
      "Nick Name",
      "Fired",
      "Membership Type",
      "Total Sales",
      "Relationship",
      "Referral Source",
      "Client Created Date",
      "Client Portal Status",
      "Upcoming Appointment",
    ];

    const csvLines = [headers.join(",")];

    for (const client of clients) {
      const row = [
        client.externalId || client._id,
        client.firstName || "",
        client.lastName || "",
        client.email || "",
        client.gender || "",
        client.phones[0] || "",
        client.phone2 || "",
        client.dateOfBirth || "",
        client.address?.street || "",
        client.address?.addressLine2 || "",
        client.address?.city || "",
        client.address?.state || "",
        client.address?.country || "",
        client.address?.zip || "",
        client.visited ? "true" : "false",
        client.nickName || "",
        client.fired ? "true" : "false",
        client.membershipType || "",
        client.totalSales?.toString() || "",
        client.relationship || "",
        client.referralSource || "",
        client.clientCreatedDate
          ? new Date(client.clientCreatedDate).toISOString()
          : "",
        client.clientPortalStatus || "",
        client.upcomingAppointment
          ? new Date(client.upcomingAppointment).toISOString()
          : "",
      ];

      csvLines.push(row.join(","));
    }

    return csvLines.join("\n");
  },
});

// Export single client to CSV
export const exportSingleClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) {
      throw new Error("Client not found");
    }

    const headers = [
      "ID",
      "First Name",
      "Last Name",
      "Email",
      "Gender",
      "Phone",
      "Phone 2",
      "DOB",
      "Address Line 1",
      "Address Line 2",
      "City",
      "State",
      "Country",
      "Zip#",
      "Visited",
      "Nick Name",
      "Fired",
      "Membership Type",
      "Total Sales",
      "Relationship",
      "Referral Source",
      "Client Created Date",
      "Client Portal Status",
      "Upcoming Appointment",
    ];

    const row = [
      client.externalId || client._id,
      client.firstName || "",
      client.lastName || "",
      client.email || "",
      client.gender || "",
      client.phones[0] || "",
      client.phone2 || "",
      client.dateOfBirth || "",
      client.address?.street || "",
      client.address?.addressLine2 || "",
      client.address?.city || "",
      client.address?.state || "",
      client.address?.country || "",
      client.address?.zip || "",
      client.visited ? "true" : "false",
      client.nickName || "",
      client.fired ? "true" : "false",
      client.membershipType || "",
      client.totalSales?.toString() || "",
      client.relationship || "",
      client.referralSource || "",
      client.clientCreatedDate
        ? new Date(client.clientCreatedDate).toISOString()
        : "",
      client.clientPortalStatus || "",
      client.upcomingAppointment
        ? new Date(client.upcomingAppointment).toISOString()
        : "",
    ];

    return [headers.join(","), row.join(",")].join("\n");
  },
});
