import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export interface NotificationData {
	_id: Id<"notifications">;
	orgId: Id<"orgs">;
	userId?: Id<"users">;
	title: string;
	message: string;
	type: 'info' | 'success' | 'warning' | 'error' | 'update' | 'message' | 'appointment' | 'workflow' | 'client';
	read: boolean;
	actionUrl?: string;
	actionText?: string;
	metadata?: Record<string, any>;
	createdAt: number;
	updatedAt: number;
}

// Hook to get notifications for an organization
export function useNotifications(orgId: Id<"orgs">, userId?: Id<"users">, limit?: number) {
	return useQuery(api.notifications.getNotifications, {
		orgId,
		userId,
		limit,
	});
}

// Hook to get unread notifications count
export function useUnreadCount(orgId: Id<"orgs">, userId?: Id<"users">) {
	return useQuery(api.notifications.getUnreadCount, {
		orgId,
		userId,
	});
}

// Hook to mark notification as read
export function useMarkAsRead() {
	return useMutation(api.notifications.markAsRead);
}

// Hook to mark all notifications as read
export function useMarkAllAsRead() {
	return useMutation(api.notifications.markAllAsRead);
}

// Hook to delete notification
export function useDeleteNotification() {
	return useMutation(api.notifications.deleteNotification);
}

// Hook to clear all notifications
export function useClearAllNotifications() {
	return useMutation(api.notifications.clearAllNotifications);
}

// Hook to create notification
export function useCreateNotification() {
	return useMutation(api.notifications.createNotification);
}

// Hook to create specific notification types
export function useCreateAppUpdateNotification() {
	return useMutation(api.notifications.createAppUpdateNotification);
}

export function useCreateWorkflowNotification() {
	return useMutation(api.notifications.createWorkflowNotification);
}

export function useCreateAppointmentNotification() {
	return useMutation(api.notifications.createAppointmentNotification);
}

export function useCreateClientNotification() {
	return useMutation(api.notifications.createClientNotification);
}

export function useCreateMessageNotification() {
	return useMutation(api.notifications.createMessageNotification);
}

// Utility functions for creating notifications
export const createNotificationHelpers = {
	// Create app update notification
	appUpdate: (orgId: Id<"orgs">, version: string, features: string[]) => {
		return {
			orgId,
			version,
			features,
		};
	},

	// Create workflow notification
	workflow: (orgId: Id<"orgs">, workflowName: string, action: string, workflowId?: Id<"workflows">) => {
		return {
			orgId,
			workflowName,
			action,
			workflowId,
		};
	},

	// Create appointment notification
	appointment: (
		orgId: Id<"orgs">,
		clientName: string,
		appointmentTime: number,
		type: 'reminder' | 'confirmation' | 'cancellation',
		appointmentId?: Id<"appointments">
	) => {
		return {
			orgId,
			clientName,
			appointmentTime,
			type,
			appointmentId,
		};
	},

	// Create client notification
	client: (orgId: Id<"orgs">, clientName: string, action: string, clientId?: Id<"clients">) => {
		return {
			orgId,
			clientName,
			action,
			clientId,
		};
	},

	// Create message notification
	message: (orgId: Id<"orgs">, senderName: string, messagePreview: string, messageId?: string) => {
		return {
			orgId,
			senderName,
			messagePreview,
			messageId,
		};
	},

	// Create custom notification
	custom: (
		orgId: Id<"orgs">,
		title: string,
		message: string,
		type: NotificationData['type'],
		actionUrl?: string,
		actionText?: string,
		metadata?: Record<string, any>
	) => {
		return {
			orgId,
			title,
			message,
			type,
			actionUrl,
			actionText,
			metadata,
		};
	},
}; 