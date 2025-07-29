import { v } from "convex/values";
import { query } from "./_generated/server";

export interface SearchResult {
	id: string;
	title: string;
	description: string;
	type: 'client' | 'appointment' | 'workflow' | 'message' | 'file' | 'template';
	url: string;
	icon: string;
	metadata?: Record<string, any>;
	score: number;
}

// Global search across all content types
export const globalSearch = query({
	args: {
		orgId: v.id("orgs"),
		query: v.string(),
		types: v.optional(v.array(v.string())),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const searchTerm = args.query.toLowerCase();
		const results: SearchResult[] = [];
		const limit = args.limit || 20;

		// Search clients
		if (!args.types || args.types.includes('client')) {
			const clients = await ctx.db
				.query("clients")
				.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
				.collect();

			for (const client of clients) {
				let score = 0;
				const nameMatch = client.fullName.toLowerCase().includes(searchTerm);
				const emailMatch = client.email.toLowerCase().includes(searchTerm);

				if (nameMatch) score += 10;
				if (emailMatch) score += 5;

				if (score > 0) {
					results.push({
						id: client._id,
						title: client.fullName,
						description: `Client - ${client.email}`,
						type: 'client',
						url: `/clients/${client._id}`,
						icon: '👤',
						metadata: {
							email: client.email,
							phone: client.phones[0],
							status: 'active',
							lastVisit: new Date(client.createdAt).toLocaleDateString()
						},
						score
					});
				}
			}
		}

		// Search appointments
		if (!args.types || args.types.includes('appointment')) {
			const appointments = await ctx.db
				.query("appointments")
				.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
				.collect();

			for (const appointment of appointments) {
				let score = 0;
				const serviceMatch = appointment.service.toLowerCase().includes(searchTerm);
				const statusMatch = appointment.status.toLowerCase().includes(searchTerm);

				if (serviceMatch) score += 8;
				if (statusMatch) score += 3;

				if (score > 0) {
					results.push({
						id: appointment._id,
						title: `${appointment.service} Appointment`,
						description: `Scheduled for ${new Date(appointment.dateTime).toLocaleDateString()}`,
						type: 'appointment',
						url: `/appointments/${appointment._id}`,
						icon: '📅',
						metadata: {
							date: new Date(appointment.dateTime).toLocaleDateString(),
							time: new Date(appointment.dateTime).toLocaleTimeString(),
							status: appointment.status
						},
						score
					});
				}
			}
		}

		// Search workflows
		if (!args.types || args.types.includes('workflow')) {
			const workflows = await ctx.db
				.query("workflows")
				.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
				.collect();

			for (const workflow of workflows) {
				let score = 0;
				const nameMatch = workflow.name.toLowerCase().includes(searchTerm);
				const descriptionMatch = workflow.description.toLowerCase().includes(searchTerm);

				if (nameMatch) score += 10;
				if (descriptionMatch) score += 5;

				if (score > 0) {
					results.push({
						id: workflow._id,
						title: workflow.name,
						description: workflow.description,
						type: 'workflow',
						url: `/workflows/${workflow._id}`,
						icon: '⚡',
						metadata: {
							status: workflow.enabled ? 'active' : 'inactive',
							trigger: workflow.trigger,
							lastRun: workflow.lastRun ? new Date(workflow.lastRun).toLocaleDateString() : 'Never'
						},
						score
					});
				}
			}
		}

		// Search message templates
		if (!args.types || args.types.includes('template')) {
			const templates = await ctx.db
				.query("messageTemplates")
				.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
				.collect();

			for (const template of templates) {
				let score = 0;
				const nameMatch = template.name.toLowerCase().includes(searchTerm);
				const contentMatch = template.content.toLowerCase().includes(searchTerm);

				if (nameMatch) score += 10;
				if (contentMatch) score += 3;

				if (score > 0) {
					results.push({
						id: template._id,
						title: template.name,
						description: `${template.type.toUpperCase()} template`,
						type: 'template',
						url: `/templates/${template._id}`,
						icon: '📝',
						metadata: {
							type: template.type,
							variables: template.variables.length
						},
						score
					});
				}
			}
		}

		// Search files
		if (!args.types || args.types.includes('file')) {
			const files = await ctx.db
				.query("files")
				.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
				.collect();

			for (const file of files) {
				let score = 0;
				const filenameMatch = file.filename.toLowerCase().includes(searchTerm);
				const tagMatch = file.tags.some(tag => tag.toLowerCase().includes(searchTerm));

				if (filenameMatch) score += 8;
				if (tagMatch) score += 5;

				if (score > 0) {
					results.push({
						id: file._id,
						title: file.filename,
						description: `${file.type} file`,
						type: 'file',
						url: `/gallery/${file._id}`,
						icon: '📸',
						metadata: {
							type: file.type,
							tags: file.tags,
							uploadDate: new Date(file.createdAt).toLocaleDateString()
						},
						score
					});
				}
			}
		}

		// Sort by score and return top results
		return results
			.sort((a, b) => b.score - a.score)
			.slice(0, limit);
	},
});

// Search by specific type
export const searchByType = query({
	args: {
		orgId: v.id("orgs"),
		query: v.string(),
		type: v.union(
			v.literal("client"),
			v.literal("appointment"),
			v.literal("workflow"),
			v.literal("template"),
			v.literal("file")
		),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		return await ctx.runQuery(api.search.globalSearch, {
			orgId: args.orgId,
			query: args.query,
			types: [args.type],
			limit: args.limit,
		});
	},
});

// Get search suggestions
export const getSearchSuggestions = query({
	args: {
		orgId: v.id("orgs"),
		query: v.string(),
	},
	handler: async (ctx, args) => {
		const suggestions: string[] = [];
		const searchTerm = args.query.toLowerCase();

		// Get client names
		const clients = await ctx.db
			.query("clients")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.collect();

		for (const client of clients) {
			if (client.fullName.toLowerCase().includes(searchTerm)) {
				suggestions.push(client.fullName);
			}
		}

		// Get workflow names
		const workflows = await ctx.db
			.query("workflows")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.collect();

		for (const workflow of workflows) {
			if (workflow.name.toLowerCase().includes(searchTerm)) {
				suggestions.push(workflow.name);
			}
		}

		// Get template names
		const templates = await ctx.db
			.query("messageTemplates")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.collect();

		for (const template of templates) {
			if (template.name.toLowerCase().includes(searchTerm)) {
				suggestions.push(template.name);
			}
		}

		// Add common terms
		const commonTerms = [
			'appointment',
			'consultation',
			'treatment',
			'workflow',
			'message',
			'photo',
			'template',
			'client',
			'scheduled',
			'completed'
		];

		for (const term of commonTerms) {
			if (term.includes(searchTerm) && !suggestions.includes(term)) {
				suggestions.push(term);
			}
		}

		return suggestions.slice(0, 10);
	},
}); 