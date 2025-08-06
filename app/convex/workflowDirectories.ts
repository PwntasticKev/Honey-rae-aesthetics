import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all directories for an org (with hierarchy)
export const getDirectories = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    const directories = await ctx.db
      .query("workflowDirectories")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .order("asc")
      .collect();

    // Build hierarchical structure
    const directoryMap = new Map();
    const rootDirectories: any[] = [];

    // First pass: create directory objects
    directories.forEach((dir) => {
      directoryMap.set(dir._id, { ...dir, children: [] });
    });

    // Second pass: build hierarchy
    directories.forEach((dir) => {
      const dirObj = directoryMap.get(dir._id);
      if (dir.parentId) {
        const parent = directoryMap.get(dir.parentId);
        if (parent) {
          parent.children.push(dirObj);
        }
      } else {
        rootDirectories.push(dirObj);
      }
    });

    return rootDirectories;
  },
});

// Get workflows in a specific directory
export const getWorkflowsInDirectory = query({
  args: {
    orgId: v.id("orgs"),
    directoryId: v.optional(v.id("workflowDirectories")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workflows")
      .withIndex("by_directory", (q) => {
        if (args.directoryId) {
          return q.eq("directoryId", args.directoryId);
        }
        return q.eq("directoryId", undefined);
      })
      .filter((q) => q.eq(q.field("orgId"), args.orgId))
      .order("desc")
      .collect();
  },
});

// Create a new directory
export const createDirectory = mutation({
  args: {
    orgId: v.id("orgs"),
    name: v.string(),
    parentId: v.optional(v.id("workflowDirectories")),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("workflowDirectories", {
      orgId: args.orgId,
      name: args.name,
      parentId: args.parentId,
      description: args.description,
      color: args.color,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update directory
export const updateDirectory = mutation({
  args: {
    directoryId: v.id("workflowDirectories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    parentId: v.optional(v.id("workflowDirectories")),
  },
  handler: async (ctx, args) => {
    const { directoryId, ...updates } = args;

    // Prevent circular references
    if (updates.parentId) {
      const directory = await ctx.db.get(directoryId);
      if (!directory) throw new Error("Directory not found");

      // Check if the new parent is a descendant
      const isDescendant = await checkIfDescendant(
        ctx,
        directoryId,
        updates.parentId,
      );
      if (isDescendant) {
        throw new Error("Cannot move directory into its own descendant");
      }
    }

    await ctx.db.patch(directoryId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete directory (and move workflows to root)
export const deleteDirectory = mutation({
  args: { directoryId: v.id("workflowDirectories") },
  handler: async (ctx, args) => {
    // Move all workflows in this directory to root
    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_directory", (q) => q.eq("directoryId", args.directoryId))
      .collect();

    for (const workflow of workflows) {
      await ctx.db.patch(workflow._id, { directoryId: undefined });
    }

    // Move child directories to parent or root
    const directory = await ctx.db.get(args.directoryId);
    if (directory) {
      const childDirectories = await ctx.db
        .query("workflowDirectories")
        .withIndex("by_parent", (q) => q.eq("parentId", args.directoryId))
        .collect();

      for (const child of childDirectories) {
        await ctx.db.patch(child._id, {
          parentId: directory.parentId,
        });
      }
    }

    await ctx.db.delete(args.directoryId);
  },
});

// Move workflow to directory
export const moveWorkflowToDirectory = mutation({
  args: {
    workflowId: v.id("workflows"),
    directoryId: v.optional(v.id("workflowDirectories")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.workflowId, {
      directoryId: args.directoryId,
      updatedAt: Date.now(),
    });
  },
});

// Helper function to check if a directory is a descendant of another
async function checkIfDescendant(
  ctx: any,
  ancestorId: any,
  potentialDescendantId: any,
): Promise<boolean> {
  if (ancestorId === potentialDescendantId) return true;

  const descendants = await ctx.db
    .query("workflowDirectories")
    .withIndex("by_parent", (q: any) => q.eq("parentId", ancestorId))
    .collect();

  for (const descendant of descendants) {
    if (await checkIfDescendant(ctx, descendant._id, potentialDescendantId)) {
      return true;
    }
  }

  return false;
}
