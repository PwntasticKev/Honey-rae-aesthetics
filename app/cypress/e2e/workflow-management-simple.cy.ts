describe('Workflow Management - Simple', () => {
	beforeEach(() => {
		// Login first
		cy.visit('/login');
		cy.get('input[type="email"]').type('admin@honeyrae.com');
		cy.get('input[type="password"]').type('master123');
		cy.get('button[type="submit"]').click();
		
		// Wait for page to load
		cy.url().should('include', '/');
	});

	it('should navigate to workflows tab', () => {
		// Check if we're on the dashboard
		cy.contains('Welcome back, Dr. Rae').should('be.visible');
		
		// Look for the workflows tab in the sidebar
		cy.contains('Workflows').should('be.visible');
		
		// Click on workflows
		cy.contains('Workflows').click();
		
		// Should show workflows content
		cy.contains('Workflows').should('be.visible');
		cy.contains('Automate your practice with Zapier-like workflows').should('be.visible');
	});

	it('should display workflow cards', () => {
		// Navigate to workflows
		cy.contains('Workflows').click();
		
		// Should see workflow cards
		cy.contains('Google Review Request').should('be.visible');
		cy.contains('Welcome New Client').should('be.visible');
	});

	it('should show workflow details', () => {
		// Navigate to workflows
		cy.contains('Workflows').click();
		
		// Check workflow details
		cy.contains('Google Review Request').should('be.visible');
		cy.contains('Send a Google review request 15 minutes after appointment completion').should('be.visible');
		cy.contains('Triggers on: Appointment Completed').should('be.visible');
		cy.contains('Active').should('be.visible');
		cy.contains('Runs: 12').should('be.visible');
	});
}); 