interface GoogleCalendarEvent {
	id: string;
	summary: string;
	description?: string;
	start: {
		dateTime: string;
		timeZone: string;
	};
	end: {
		dateTime: string;
		timeZone: string;
	};
	attendees?: Array<{
		email: string;
		displayName?: string;
		responseStatus?: string;
	}>;
	organizer?: {
		email: string;
		displayName?: string;
	};
}

interface CalendarProvider {
	id: string;
	name: string;
	email: string;
	color: string;
	isConnected: boolean;
	googleCalendarId?: string;
	lastSync?: Date;
	accessToken?: string;
	refreshToken?: string;
}

interface SyncResult {
	success: boolean;
	eventsAdded: number;
	eventsUpdated: number;
	eventsDeleted: number;
	error?: string;
}

class GoogleCalendarService {
	private static instance: GoogleCalendarService;
	private providers: Map<string, CalendarProvider> = new Map();
	private isInitialized = false;
	private syncCallbacks: Array<() => void> = [];

	private constructor() {}

	static getInstance(): GoogleCalendarService {
		if (!GoogleCalendarService.instance) {
			GoogleCalendarService.instance = new GoogleCalendarService();
		}
		return GoogleCalendarService.instance;
	}

	async initialize(): Promise<void> {
		if (this.isInitialized) return;

		// Load saved providers from localStorage
		if (typeof window !== 'undefined') {
			const savedProviders = localStorage.getItem('googleCalendarProviders');
			if (savedProviders) {
				const providers = JSON.parse(savedProviders);
				providers.forEach((provider: CalendarProvider) => {
					this.providers.set(provider.id, provider);
				});
			}
		}

		this.isInitialized = true;
	}

	// Subscribe to sync events
	onSync(callback: () => void): () => void {
		this.syncCallbacks.push(callback);
		return () => {
			const index = this.syncCallbacks.indexOf(callback);
			if (index > -1) {
				this.syncCallbacks.splice(index, 1);
			}
		};
	}

	// Notify subscribers of sync events
	private notifySync(): void {
		this.syncCallbacks.forEach(callback => callback());
	}

	async connectProvider(providerId: string, email: string, name: string): Promise<boolean> {
		try {
			// Simulate Google OAuth flow
			console.log(`Connecting provider ${name} (${email}) to Google Calendar...`);
			
			// In a real implementation, this would:
			// 1. Redirect to Google OAuth
			// 2. Get authorization code
			// 3. Exchange for access/refresh tokens
			// 4. Store tokens securely
			
			const mockAccessToken = `mock_access_token_${providerId}`;
			const mockRefreshToken = `mock_refresh_token_${providerId}`;
			
			const provider: CalendarProvider = {
				id: providerId,
				name,
				email,
				color: this.getNextAvailableColor(),
				isConnected: true,
				googleCalendarId: email,
				lastSync: new Date(),
				accessToken: mockAccessToken,
				refreshToken: mockRefreshToken
			};

			this.providers.set(providerId, provider);
			this.saveProviders();
			
			// Initial sync
			await this.syncProvider(providerId);
			
			// Notify subscribers
			this.notifySync();
			
			return true;
		} catch (error) {
			console.error('Failed to connect provider:', error);
			return false;
		}
	}

	async disconnectProvider(providerId: string): Promise<boolean> {
		try {
			const provider = this.providers.get(providerId);
			if (!provider) return false;

			provider.isConnected = false;
			provider.accessToken = undefined;
			provider.refreshToken = undefined;
			provider.lastSync = undefined;

			this.providers.set(providerId, provider);
			this.saveProviders();
			
			// Notify subscribers
			this.notifySync();
			
			return true;
		} catch (error) {
			console.error('Failed to disconnect provider:', error);
			return false;
		}
	}

	async syncProvider(providerId: string): Promise<SyncResult> {
		try {
			const provider = this.providers.get(providerId);
			if (!provider || !provider.isConnected) {
				throw new Error('Provider not connected');
			}

			console.log(`Syncing calendar for ${provider.name}...`);

			// Simulate API call to Google Calendar
			// In a real implementation, this would fetch events from Google Calendar API
			const mockEvents: GoogleCalendarEvent[] = [
				{
					id: 'event_1',
					summary: 'Sarah Johnson - Consultation',
					description: 'First time visit',
					start: {
						dateTime: new Date(Date.now() + 86400000).toISOString(),
						timeZone: 'America/New_York'
					},
					end: {
						dateTime: new Date(Date.now() + 86400000 + 3600000).toISOString(),
						timeZone: 'America/New_York'
					},
					attendees: [
						{ email: 'sarah@email.com', displayName: 'Sarah Johnson' }
					],
					organizer: {
						email: provider.email,
						displayName: provider.name
					}
				},
				{
					id: 'event_2',
					summary: 'Michael Chen - Treatment',
					description: 'Follow-up appointment',
					start: {
						dateTime: new Date(Date.now() + 172800000).toISOString(),
						timeZone: 'America/New_York'
					},
					end: {
						dateTime: new Date(Date.now() + 172800000 + 5400000).toISOString(),
						timeZone: 'America/New_York'
					},
					attendees: [
						{ email: 'michael@email.com', displayName: 'Michael Chen' }
					],
					organizer: {
						email: provider.email,
						displayName: provider.name
					}
				}
			];

			// Simulate detecting new events (like from mobile app)
			const shouldAddNewEvent = Math.random() > 0.7; // 30% chance of new event
			if (shouldAddNewEvent) {
				const newEvent: GoogleCalendarEvent = {
					id: `mobile_event_${Date.now()}`,
					summary: 'New Mobile Appointment',
					description: 'Added via mobile app',
					start: {
						dateTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
						timeZone: 'America/New_York'
					},
					end: {
						dateTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
						timeZone: 'America/New_York'
					},
					attendees: [
						{ email: 'newclient@email.com', displayName: 'New Client' }
					],
					organizer: {
						email: provider.email,
						displayName: provider.name
					}
				};
				mockEvents.push(newEvent);
			}

			// Update last sync time
			provider.lastSync = new Date();
			this.providers.set(providerId, provider);
			this.saveProviders();

			// Notify subscribers of sync completion
			this.notifySync();

			return {
				success: true,
				eventsAdded: mockEvents.length,
				eventsUpdated: 0,
				eventsDeleted: 0
			};
		} catch (error) {
			console.error('Failed to sync provider:', error);
			return {
				success: false,
				eventsAdded: 0,
				eventsUpdated: 0,
				eventsDeleted: 0,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}

	async syncAllProviders(): Promise<SyncResult[]> {
		const results: SyncResult[] = [];
		
		for (const [providerId, provider] of this.providers) {
			if (provider.isConnected) {
				const result = await this.syncProvider(providerId);
				results.push(result);
			}
		}
		
		return results;
	}

	// Force sync all providers (useful for manual sync)
	async forceSyncAll(): Promise<SyncResult[]> {
		console.log('Force syncing all providers...');
		return this.syncAllProviders();
	}

	getProviders(): CalendarProvider[] {
		return Array.from(this.providers.values());
	}

	getProvider(providerId: string): CalendarProvider | undefined {
		return this.providers.get(providerId);
	}

	addProvider(provider: CalendarProvider): void {
		this.providers.set(provider.id, provider);
		this.saveProviders();
	}

	async createEvent(providerId: string, event: {
		summary: string;
		description?: string;
		start: Date;
		end: Date;
		attendees?: string[];
	}): Promise<string | null> {
		try {
			const provider = this.providers.get(providerId);
			if (!provider || !provider.isConnected) {
				throw new Error('Provider not connected');
			}

			console.log(`Creating event for ${provider.name}:`, event);

			// Simulate creating event in Google Calendar
			const eventId = `event_${Date.now()}`;
			
			// In a real implementation, this would:
			// 1. Use Google Calendar API to create event
			// 2. Return the created event ID
			// 3. Handle attendees, reminders, etc.

			// Notify subscribers of new event
			this.notifySync();

			return eventId;
		} catch (error) {
			console.error('Failed to create event:', error);
			return null;
		}
	}

	async updateEvent(providerId: string, eventId: string, updates: {
		summary?: string;
		description?: string;
		start?: Date;
		end?: Date;
		attendees?: string[];
	}): Promise<boolean> {
		try {
			const provider = this.providers.get(providerId);
			if (!provider || !provider.isConnected) {
				throw new Error('Provider not connected');
			}

			console.log(`Updating event ${eventId} for ${provider.name}:`, updates);

			// Simulate updating event in Google Calendar
			// In a real implementation, this would use Google Calendar API

			// Notify subscribers of event update
			this.notifySync();

			return true;
		} catch (error) {
			console.error('Failed to update event:', error);
			return false;
		}
	}

	async deleteEvent(providerId: string, eventId: string): Promise<boolean> {
		try {
			const provider = this.providers.get(providerId);
			if (!provider || !provider.isConnected) {
				throw new Error('Provider not connected');
			}

			console.log(`Deleting event ${eventId} for ${provider.name}`);

			// Simulate deleting event in Google Calendar
			// In a real implementation, this would use Google Calendar API

			// Notify subscribers of event deletion
			this.notifySync();

			return true;
		} catch (error) {
			console.error('Failed to delete event:', error);
			return false;
		}
	}

	private getNextAvailableColor(): string {
		const colors = [
			"bg-blue-500",
			"bg-green-500", 
			"bg-purple-500",
			"bg-orange-500",
			"bg-pink-500",
			"bg-indigo-500",
			"bg-teal-500",
			"bg-red-500"
		];
		
		const usedColors = new Set(Array.from(this.providers.values()).map(p => p.color));
		const availableColor = colors.find(color => !usedColors.has(color));
		
		return availableColor || colors[0];
	}

	private saveProviders(): void {
		if (typeof window === 'undefined') return;
		const providers = Array.from(this.providers.values());
		localStorage.setItem('googleCalendarProviders', JSON.stringify(providers));
	}

	// Helper method to convert Google Calendar event to our format
	convertGoogleEventToAppointment(googleEvent: GoogleCalendarEvent, provider: CalendarProvider) {
		return {
			id: googleEvent.id,
			title: googleEvent.summary,
			start: new Date(googleEvent.start.dateTime),
			end: new Date(googleEvent.end.dateTime),
			provider: provider.name,
			clientName: googleEvent.attendees?.[0]?.displayName || 'Unknown',
			clientEmail: googleEvent.attendees?.[0]?.email,
			type: this.extractAppointmentType(googleEvent.summary),
			status: 'scheduled' as const,
			googleEventId: googleEvent.id,
			notes: googleEvent.description
		};
	}

	private extractAppointmentType(summary: string): string {
		const lowerSummary = summary.toLowerCase();
		if (lowerSummary.includes('consultation')) return 'Consultation';
		if (lowerSummary.includes('treatment')) return 'Treatment';
		if (lowerSummary.includes('follow-up')) return 'Follow-up';
		if (lowerSummary.includes('check-in')) return 'Check-in';
		return 'Appointment';
	}
}

export const googleCalendarService = GoogleCalendarService.getInstance();
export type { CalendarProvider, SyncResult, GoogleCalendarEvent }; 