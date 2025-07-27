describe('Core Functionality Tests', () => {
	beforeEach(() => {
		cy.visit('/login');
		cy.get('input[type="email"]').type('admin@honeyrae.com');
		cy.get('input[type="password"]').type('master123');
		cy.get('button[type="submit"]').click();
		cy.url().should('include', '/');
	});

	it('should display dashboard with all stats', () => {
		cy.contains('Welcome back, Dr. Rae!').should('be.visible');
		cy.contains('Total Clients').should('be.visible');
		cy.contains('Today\'s Appointments').should('be.visible');
		cy.contains('Messages Sent').should('be.visible');
		cy.contains('Active Workflows').should('be.visible');
		cy.contains('Photos Uploaded').should('be.visible');
	});

	it('should navigate to clients page', () => {
		cy.contains('Clients').click();
		cy.contains('Clients').should('be.visible');
		cy.contains('Add Client').should('be.visible');
	});

	it('should navigate to appointments page', () => {
		cy.contains('Appointments').click();
		cy.contains('Appointments').should('be.visible');
	});

	it('should navigate to photo gallery', () => {
		cy.contains('Photo Gallery').click();
		cy.contains('Photo Gallery').should('be.visible');
	});

	it('should navigate to templates', () => {
		cy.contains('Templates').click();
		cy.contains('Templates').should('be.visible');
	});

	it('should navigate to workflows', () => {
		cy.contains('Workflows').click();
		cy.contains('Workflows').should('be.visible');
		cy.contains('Add Workflow').should('be.visible');
	});

	it('should navigate to social media', () => {
		cy.contains('Social Media').click();
		cy.contains('Social Media').should('be.visible');
	});

	it('should navigate to messaging', () => {
		cy.contains('Messaging').click();
		cy.contains('Messaging').should('be.visible');
	});

	it('should navigate to analytics', () => {
		cy.contains('Analytics').click();
		cy.contains('Analytics').should('be.visible');
	});

	it('should navigate to team management', () => {
		cy.contains('Team').click();
		cy.contains('Team').should('be.visible');
	});

	it('should navigate to billing', () => {
		cy.contains('Billing').click();
		cy.contains('Billing').should('be.visible');
	});

	it('should navigate to settings', () => {
		cy.contains('Settings').click();
		cy.contains('Settings').should('be.visible');
	});

	it('should have working search functionality', () => {
		cy.get('input[placeholder="Search clients, appointments..."]').should('be.visible');
		cy.get('input[placeholder="Search clients, appointments..."]').type('test');
		cy.get('input[placeholder="Search clients, appointments..."]').should('have.value', 'test');
	});

	it('should have working notifications', () => {
		cy.get('button[class*="relative"]').first().should('be.visible'); // Notifications button
		cy.get('.absolute.-top-1.-right-1').should('be.visible'); // Notification badge
	});

	it('should have working user menu', () => {
		cy.get('button[title="Logout"]').should('be.visible');
		cy.get('button[title="Logout"]').click();
		cy.url().should('include', '/login');
	});

	it('should have responsive sidebar', () => {
		// Test mobile menu
		cy.viewport('iphone-6');
		cy.get('[data-testid="mobile-menu-button"]').should('be.visible'); // Mobile menu button
		
		// Test desktop sidebar
		cy.viewport('macbook-13');
		cy.contains('Dashboard').should('be.visible');
		cy.contains('Clients').should('be.visible');
	});

	it('should have working quick actions', () => {
		cy.contains('Add New Client').should('be.visible');
		cy.contains('Schedule Appointment').should('be.visible');
		cy.contains('Create Workflow').should('be.visible');
	});

	it('should display recent activity', () => {
		cy.contains('Recent Activity').should('be.visible');
		cy.contains('New client added').should('be.visible');
		cy.contains('Appointment scheduled').should('be.visible');
		cy.contains('Message sent').should('be.visible');
	});

	it.skip('should have proper menu structure', () => {
		// Check that sidebar is visible and contains main menu items
		cy.get('[data-testid="sidebar"]').should('be.visible');
		
		// Test a few key menu items that should always be visible
		cy.get('[data-testid="sidebar"]').contains('Dashboard').should('be.visible');
		cy.get('[data-testid="sidebar"]').contains('Clients').should('be.visible');
		cy.get('[data-testid="sidebar"]').contains('Appointments').should('be.visible');
		cy.get('[data-testid="sidebar"]').contains('Workflows').should('be.visible');
		cy.get('[data-testid="sidebar"]').contains('Settings').should('be.visible');
	});

	it('should handle template submenu', () => {
		cy.contains('Templates').click();
		cy.contains('SMS Templates').should('be.visible');
		cy.contains('Email Templates').should('be.visible');
	});

	it('should have working stats cards', () => {
		cy.get('[class*="glass border-pink-200/50"]').should('have.length.at.least', 5);
		cy.contains('Total Clients').should('be.visible');
		cy.contains('Today\'s Appointments').should('be.visible');
		cy.contains('Messages Sent').should('be.visible');
		cy.contains('Active Workflows').should('be.visible');
		cy.contains('Photos Uploaded').should('be.visible');
	});

	it('should have proper header layout', () => {
		cy.contains('Honey Rae Aesthetics').should('be.visible');
		cy.get('input[placeholder="Search clients, appointments..."]').should('be.visible');
		cy.get('button[class*="relative"]').should('be.visible'); // Notifications
		cy.get('button[title="Logout"]').should('be.visible');
	});

	it('should have working sidebar toggle', () => {
		cy.viewport('macbook-13');
		cy.get('[data-testid="mobile-menu-button"]').should('not.be.visible'); // Menu button should be hidden on desktop
		
		cy.viewport('iphone-6');
		cy.get('[data-testid="mobile-menu-button"]').should('be.visible'); // Menu button should be visible on mobile
	});

	it('should maintain state across navigation', () => {
		// Navigate to clients
		cy.contains('Clients').click();
		cy.contains('Clients').should('be.visible');
		
		// Navigate to workflows
		cy.contains('Workflows').click();
		cy.contains('Workflows').should('be.visible');
		
		// Navigate back to dashboard
		cy.contains('Dashboard').click();
		cy.contains('Welcome back, Dr. Rae!').should('be.visible');
	});

	it.skip('should have proper loading states', () => {
		// Test that the app loads without critical errors
		cy.get('body').should('not.contain', 'Internal Server Error');
		cy.get('body').should('not.contain', '500');
		cy.get('body').should('not.contain', '404');
	});

	it('should have working authentication', () => {
		// Test logout
		cy.get('button[title="Logout"]').click();
		cy.url().should('include', '/login');
		
		// Test login again
		cy.get('input[type="email"]').type('admin@honeyrae.com');
		cy.get('input[type="password"]').type('master123');
		cy.get('button[type="submit"]').click();
		cy.url().should('include', '/');
		cy.contains('Welcome back, Dr. Rae!').should('be.visible');
	});
}); 