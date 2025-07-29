describe('Notification System', () => {
	beforeEach(() => {
		cy.visit('/');
	});

	it('should display notification badge with count', () => {
		cy.get('[data-testid="notifications-badge"]').should('be.visible');
		cy.get('[data-testid="notifications-badge"]').should('contain.text', '5');
	});

	it('should open notification dropdown when clicked', () => {
		cy.get('[data-testid="notifications-button"]').click();
		cy.contains('Notifications').should('be.visible');
		cy.contains('App Update Available').should('be.visible');
		cy.contains('Workflow Alert').should('be.visible');
		cy.contains('Appointment Notification').should('be.visible');
	});

	it('should mark notifications as read when clicked', () => {
		cy.get('[data-testid="notifications-button"]').click();
		cy.contains('App Update Available').click();
		cy.get('[data-testid="notifications-badge"]').should('contain.text', '4');
	});

	it('should mark all notifications as read', () => {
		cy.get('[data-testid="notifications-button"]').click();
		cy.contains('Mark all read').click();
		cy.get('[data-testid="notifications-badge"]').should('not.exist');
	});

	it('should clear all notifications', () => {
		cy.get('[data-testid="notifications-button"]').click();
		cy.get('button').contains('🗑️').click();
		cy.contains('No notifications').should('be.visible');
	});

	it('should navigate to settings when settings button is clicked', () => {
		cy.get('[data-testid="notifications-button"]').click();
		cy.get('button').contains('⚙️').click();
		cy.url().should('include', '/settings');
	});

	it('should show different notification types with appropriate styling', () => {
		cy.get('[data-testid="notifications-button"]').click();
		
		// Check for different notification types
		cy.contains('App Update Available').should('be.visible');
		cy.contains('Workflow Alert').should('be.visible');
		cy.contains('Appointment Notification').should('be.visible');
		cy.contains('New message from Michael Chen').should('be.visible');
		cy.contains('Client Update').should('be.visible');
	});

	it('should show notification timestamps', () => {
		cy.get('[data-testid="notifications-button"]').click();
		cy.get('.text-xs.text-gray-500').should('be.visible');
	});

	it('should close dropdown when clicking outside', () => {
		cy.get('[data-testid="notifications-button"]').click();
		cy.contains('Notifications').should('be.visible');
		cy.get('body').click(0, 0);
		cy.contains('Notifications').should('not.exist');
	});

	it('should show action buttons for notifications with actions', () => {
		cy.get('[data-testid="notifications-button"]').click();
		cy.contains('View Details').should('be.visible');
		cy.contains('View Workflow').should('be.visible');
		cy.contains('View Appointment').should('be.visible');
		cy.contains('Reply').should('be.visible');
		cy.contains('View Client').should('be.visible');
	});
}); 