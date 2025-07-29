export interface Notification {
	id: string;
	title: string;
	message: string;
	type: 'info' | 'success' | 'warning' | 'error' | 'update' | 'message';
	read: boolean;
	createdAt: Date;
	actionUrl?: string;
	actionText?: string;
	metadata?: Record<string, any>;
}

export interface NotificationSettings {
	email: boolean;
	sms: boolean;
	push: boolean;
	inApp: boolean;
	appUpdates: boolean;
	workflowAlerts: boolean;
	appointmentReminders: boolean;
	messageNotifications: boolean;
}

class NotificationService {
	private static instance: NotificationService;
	private notifications: Notification[] = [];
	private subscribers: Array<(notifications: Notification[]) => void> = [];
	private settings: NotificationSettings = {
		email: true,
		sms: true,
		push: false,
		inApp: true,
		appUpdates: true,
		workflowAlerts: true,
		appointmentReminders: true,
		messageNotifications: true
	};

	private constructor() {
		this.loadNotifications();
		this.loadSettings();
	}

	static getInstance(): NotificationService {
		if (!NotificationService.instance) {
			NotificationService.instance = new NotificationService();
		}
		return NotificationService.instance;
	}

	// Subscribe to notification changes
	subscribe(callback: (notifications: Notification[]) => void): () => void {
		this.subscribers.push(callback);
		callback(this.notifications);
		
		return () => {
			const index = this.subscribers.indexOf(callback);
			if (index > -1) {
				this.subscribers.splice(index, 1);
			}
		};
	}

	// Notify subscribers
	private notifySubscribers(): void {
		this.subscribers.forEach(callback => callback(this.notifications));
	}

	// Get all notifications
	getNotifications(): Notification[] {
		return this.notifications;
	}

	// Get unread notifications count
	getUnreadCount(): number {
		return this.notifications.filter(n => !n.read).length;
	}

	// Get notifications by type
	getNotificationsByType(type: Notification['type']): Notification[] {
		return this.notifications.filter(n => n.type === type);
	}

	// Add a new notification
	addNotification(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>): void {
		const newNotification: Notification = {
			...notification,
			id: Date.now().toString(),
			read: false,
			createdAt: new Date()
		};

		this.notifications.unshift(newNotification);
		this.saveNotifications();
		this.notifySubscribers();
	}

	// Mark notification as read
	markAsRead(notificationId: string): void {
		const notification = this.notifications.find(n => n.id === notificationId);
		if (notification) {
			notification.read = true;
			this.saveNotifications();
			this.notifySubscribers();
		}
	}

	// Mark all notifications as read
	markAllAsRead(): void {
		this.notifications.forEach(n => n.read = true);
		this.saveNotifications();
		this.notifySubscribers();
	}

	// Delete notification
	deleteNotification(notificationId: string): void {
		this.notifications = this.notifications.filter(n => n.id !== notificationId);
		this.saveNotifications();
		this.notifySubscribers();
	}

	// Clear all notifications
	clearAllNotifications(): void {
		this.notifications = [];
		this.saveNotifications();
		this.notifySubscribers();
	}

	// Get notification settings
	getSettings(): NotificationSettings {
		return this.settings;
	}

	// Update notification settings
	updateSettings(settings: Partial<NotificationSettings>): void {
		this.settings = { ...this.settings, ...settings };
		this.saveSettings();
	}

	// Create specific notification types
	createAppUpdateNotification(version: string, features: string[]): void {
		this.addNotification({
			title: 'App Update Available',
			message: `Version ${version} is now available with new features: ${features.join(', ')}`,
			type: 'update',
			actionUrl: '/settings/updates',
			actionText: 'View Details'
		});
	}

	createWorkflowNotification(workflowName: string, action: string): void {
		this.addNotification({
			title: 'Workflow Alert',
			message: `Workflow "${workflowName}" ${action}`,
			type: 'info',
			actionUrl: '/workflows',
			actionText: 'View Workflow'
		});
	}

	createAppointmentNotification(clientName: string, appointmentTime: Date, type: 'reminder' | 'confirmation' | 'cancellation'): void {
		const messages = {
			reminder: `Reminder: You have an appointment with ${clientName} in 1 hour`,
			confirmation: `Appointment with ${clientName} has been confirmed`,
			cancellation: `Appointment with ${clientName} has been cancelled`
		};

		this.addNotification({
			title: 'Appointment Notification',
			message: messages[type],
			type: 'info',
			actionUrl: '/appointments',
			actionText: 'View Appointment'
		});
	}

	createMessageNotification(senderName: string, messagePreview: string): void {
		this.addNotification({
			title: `New message from ${senderName}`,
			message: messagePreview,
			type: 'message',
			actionUrl: '/messaging',
			actionText: 'Reply'
		});
	}

	createClientNotification(clientName: string, action: string): void {
		this.addNotification({
			title: 'Client Update',
			message: `${clientName} ${action}`,
			type: 'success',
			actionUrl: '/clients',
			actionText: 'View Client'
		});
	}

	createSystemNotification(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
		this.addNotification({
			title,
			message,
			type
		});
	}

	// Load notifications from localStorage
	private loadNotifications(): void {
		if (typeof window === 'undefined') return;
		
		const saved = localStorage.getItem('notifications');
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				this.notifications = parsed.map((n: any) => ({
					...n,
					createdAt: new Date(n.createdAt)
				}));
			} catch (error) {
				console.error('Failed to load notifications:', error);
				this.notifications = [];
			}
		}
	}

	// Save notifications to localStorage
	private saveNotifications(): void {
		if (typeof window === 'undefined') return;
		localStorage.setItem('notifications', JSON.stringify(this.notifications));
	}

	// Load settings from localStorage
	private loadSettings(): void {
		if (typeof window === 'undefined') return;
		
		const saved = localStorage.getItem('notificationSettings');
		if (saved) {
			try {
				this.settings = JSON.parse(saved);
			} catch (error) {
				console.error('Failed to load notification settings:', error);
			}
		}
	}

	// Save settings to localStorage
	private saveSettings(): void {
		if (typeof window === 'undefined') return;
		localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
	}
}

export const notificationService = NotificationService.getInstance(); 