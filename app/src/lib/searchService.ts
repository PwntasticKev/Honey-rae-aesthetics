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

export interface SearchFilters {
	types?: string[];
	dateRange?: {
		start: Date;
		end: Date;
	};
	status?: string[];
}

class SearchService {
	private static instance: SearchService;
	private searchIndex: Map<string, any> = new Map();

	private constructor() {
		this.initializeSearchIndex();
	}

	static getInstance(): SearchService {
		if (!SearchService.instance) {
			SearchService.instance = new SearchService();
		}
		return SearchService.instance;
	}

	// Initialize search index with mock data
	private initializeSearchIndex(): void {
		// Mock clients
		const clients = [
			{
				id: "client_1",
				title: "Sarah Johnson",
				description: "VIP client, returning customer, consultation scheduled",
				type: "client" as const,
				url: "/clients/client_1",
				icon: "👤",
				metadata: {
					email: "sarah@example.com",
					phone: "+15551234567",
					status: "active",
					lastVisit: "2024-01-15"
				}
			},
			{
				id: "client_2",
				title: "Michael Chen",
				description: "New client, consultation completed, treatment planned",
				type: "client" as const,
				url: "/clients/client_2",
				icon: "👤",
				metadata: {
					email: "michael@example.com",
					phone: "+15559876543",
					status: "active",
					lastVisit: "2024-01-20"
				}
			},
			{
				id: "client_3",
				title: "Emily Rodriguez",
				description: "Follow-up appointment scheduled, treatment in progress",
				type: "client" as const,
				url: "/clients/client_3",
				icon: "👤",
				metadata: {
					email: "emily@example.com",
					phone: "+15555555555",
					status: "active",
					lastVisit: "2024-01-18"
				}
			}
		];

		// Mock appointments
		const appointments = [
			{
				id: "apt_1",
				title: "Sarah Johnson - Consultation",
				description: "Initial consultation appointment",
				type: "appointment" as const,
				url: "/appointments/apt_1",
				icon: "📅",
				metadata: {
					date: "2024-01-25",
					time: "10:00 AM",
					provider: "Dr. Rae",
					status: "scheduled"
				}
			},
			{
				id: "apt_2",
				title: "Michael Chen - Treatment",
				description: "Follow-up treatment session",
				type: "appointment" as const,
				url: "/appointments/apt_2",
				icon: "📅",
				metadata: {
					date: "2024-01-26",
					time: "2:00 PM",
					provider: "Dr. Rae",
					status: "scheduled"
				}
			}
		];

		// Mock workflows
		const workflows = [
			{
				id: "workflow_1",
				title: "Post-Appointment Follow-up",
				description: "Automated follow-up messages after appointments",
				type: "workflow" as const,
				url: "/workflows/workflow_1",
				icon: "⚡",
				metadata: {
					status: "active",
					triggers: ["appointment_completed"],
					lastRun: "2024-01-20"
				}
			},
			{
				id: "workflow_2",
				title: "New Client Welcome",
				description: "Welcome sequence for new clients",
				type: "workflow" as const,
				url: "/workflows/workflow_2",
				icon: "⚡",
				metadata: {
					status: "active",
					triggers: ["new_client"],
					lastRun: "2024-01-22"
				}
			}
		];

		// Mock messages
		const messages = [
			{
				id: "msg_1",
				title: "Appointment Reminder",
				description: "SMS reminder sent to Sarah Johnson",
				type: "message" as const,
				url: "/messaging/msg_1",
				icon: "💬",
				metadata: {
					type: "sms",
					recipient: "Sarah Johnson",
					status: "sent",
					date: "2024-01-20"
				}
			}
		];

		// Mock files
		const files = [
			{
				id: "file_1",
				title: "Sarah Johnson - Before Photos",
				description: "Before treatment photos for Sarah Johnson",
				type: "file" as const,
				url: "/gallery/file_1",
				icon: "📸",
				metadata: {
					type: "image",
					tags: ["before", "sarah"],
					uploadDate: "2024-01-15"
				}
			}
		];

		// Mock templates
		const templates = [
			{
				id: "template_1",
				title: "Appointment Confirmation",
				description: "Standard appointment confirmation message",
				type: "template" as const,
				url: "/templates/template_1",
				icon: "📝",
				metadata: {
					type: "sms",
					usage: 15,
					lastUsed: "2024-01-20"
				}
			}
		];

		// Combine all items
		const allItems = [...clients, ...appointments, ...workflows, ...messages, ...files, ...templates];
		
		// Add to search index
		allItems.forEach(item => {
			this.searchIndex.set(item.id, item);
		});
	}

	// Search across all content
	search(query: string, filters?: SearchFilters): SearchResult[] {
		if (!query.trim()) {
			return [];
		}

		const searchTerm = query.toLowerCase();
		const results: SearchResult[] = [];

		// Search through all items in the index
		for (const [id, item] of this.searchIndex) {
			// Apply type filter
			if (filters?.types && !filters.types.includes(item.type)) {
				continue;
			}

			// Calculate search score
			let score = 0;
			const titleMatch = item.title.toLowerCase().includes(searchTerm);
			const descriptionMatch = item.description.toLowerCase().includes(searchTerm);

			if (titleMatch) score += 10;
			if (descriptionMatch) score += 5;

			// Check metadata fields
			if (item.metadata) {
				Object.values(item.metadata).forEach(value => {
					if (typeof value === 'string' && value.toLowerCase().includes(searchTerm)) {
						score += 3;
					}
				});
			}

			// Apply date range filter
			if (filters?.dateRange && item.metadata?.date) {
				const itemDate = new Date(item.metadata.date);
				if (itemDate < filters.dateRange.start || itemDate > filters.dateRange.end) {
					continue;
				}
			}

			// Apply status filter
			if (filters?.status && item.metadata?.status) {
				if (!filters.status.includes(item.metadata.status)) {
					continue;
				}
			}

			if (score > 0) {
				results.push({
					...item,
					score
				});
			}
		}

		// Sort by score (highest first)
		return results.sort((a, b) => b.score - a.score);
	}

	// Search by type
	searchByType(query: string, type: string): SearchResult[] {
		return this.search(query, { types: [type] });
	}

	// Get recent searches (mock data)
	getRecentSearches(): string[] {
		if (typeof window === 'undefined') return [];
		const saved = localStorage.getItem('recentSearches');
		return saved ? JSON.parse(saved) : [];
	}

	// Add to recent searches
	addToRecentSearches(query: string): void {
		if (typeof window === 'undefined') return;
		const recent = this.getRecentSearches();
		const filtered = recent.filter(q => q !== query);
		const updated = [query, ...filtered].slice(0, 10);
		localStorage.setItem('recentSearches', JSON.stringify(updated));
	}

	// Get search suggestions
	getSearchSuggestions(query: string): string[] {
		if (!query.trim()) {
			return this.getRecentSearches();
		}

		const suggestions: string[] = [];
		const searchTerm = query.toLowerCase();

		// Add recent searches that match
		const recent = this.getRecentSearches();
		recent.forEach(recentQuery => {
			if (recentQuery.toLowerCase().includes(searchTerm)) {
				suggestions.push(recentQuery);
			}
		});

		// Add common search terms
		const commonTerms = [
			'sarah johnson',
			'michael chen',
			'appointment',
			'consultation',
			'treatment',
			'workflow',
			'message',
			'photo',
			'template'
		];

		commonTerms.forEach(term => {
			if (term.includes(searchTerm) && !suggestions.includes(term)) {
				suggestions.push(term);
			}
		});

		return suggestions.slice(0, 5);
	}

	// Update search index with new data
	updateIndex(items: any[]): void {
		items.forEach(item => {
			this.searchIndex.set(item.id, item);
		});
	}

	// Remove item from search index
	removeFromIndex(id: string): void {
		this.searchIndex.delete(id);
	}

	// Clear search index
	clearIndex(): void {
		this.searchIndex.clear();
		this.initializeSearchIndex();
	}
}

export const searchService = SearchService.getInstance(); 