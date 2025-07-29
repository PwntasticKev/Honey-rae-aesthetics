import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

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

// Hook to perform global search
export function useGlobalSearch(
	orgId: Id<"orgs">,
	query: string,
	types?: string[],
	limit?: number
) {
	return useQuery(api.search.globalSearch, {
		orgId,
		query,
		types,
		limit,
	});
}

// Hook to search by specific type
export function useSearchByType(
	orgId: Id<"orgs">,
	query: string,
	type: 'client' | 'appointment' | 'workflow' | 'template' | 'file',
	limit?: number
) {
	return useQuery(api.search.searchByType, {
		orgId,
		query,
		type,
		limit,
	});
}

// Hook to get search suggestions
export function useSearchSuggestions(orgId: Id<"orgs">, query: string) {
	return useQuery(api.search.getSearchSuggestions, {
		orgId,
		query,
	});
}

// Utility functions for search
export const searchHelpers = {
	// Get search result icon
	getIcon: (type: SearchResult['type']) => {
		switch (type) {
			case 'client':
				return '👤';
			case 'appointment':
				return '📅';
			case 'workflow':
				return '⚡';
			case 'message':
				return '💬';
			case 'file':
				return '📸';
			case 'template':
				return '📝';
			default:
				return '📄';
		}
	},

	// Get search result color
	getColor: (type: SearchResult['type']) => {
		switch (type) {
			case 'client':
				return 'bg-blue-100 text-blue-800';
			case 'appointment':
				return 'bg-green-100 text-green-800';
			case 'workflow':
				return 'bg-purple-100 text-purple-800';
			case 'message':
				return 'bg-orange-100 text-orange-800';
			case 'file':
				return 'bg-pink-100 text-pink-800';
			case 'template':
				return 'bg-gray-100 text-gray-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	},

	// Get search result label
	getLabel: (type: SearchResult['type']) => {
		switch (type) {
			case 'client':
				return 'Client';
			case 'appointment':
				return 'Appointment';
			case 'workflow':
				return 'Workflow';
			case 'message':
				return 'Message';
			case 'file':
				return 'File';
			case 'template':
				return 'Template';
			default:
				return type;
		}
	},

	// Format search result metadata
	formatMetadata: (metadata?: Record<string, any>) => {
		if (!metadata) return null;
		
		const formatted: Record<string, string> = {};
		
		if (metadata.email) formatted.email = metadata.email;
		if (metadata.phone) formatted.phone = metadata.phone;
		if (metadata.date) formatted.date = metadata.date;
		if (metadata.time) formatted.time = metadata.time;
		if (metadata.status) formatted.status = metadata.status;
		if (metadata.type) formatted.type = metadata.type;
		if (metadata.uploadDate) formatted.uploadDate = metadata.uploadDate;
		if (metadata.lastVisit) formatted.lastVisit = metadata.lastVisit;
		
		return formatted;
	},
}; 