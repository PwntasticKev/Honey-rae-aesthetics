describe('Calendar Sync Functionality', () => {
	beforeEach(() => {
		cy.visit('/appointments');
	});

	it('should show empty state when no calendars are added', () => {
		cy.contains('No Calendars Connected').should('be.visible');
		cy.contains('Add your first Google Calendar to start managing appointments').should('be.visible');
		cy.contains('Add Calendar').should('be.visible');
	});

	it('should allow adding a calendar and connecting it', () => {
		// Add a calendar
		cy.contains('Add Calendar').click({ force: true });
		cy.get('#provider-name').type('Kendra');
		cy.get('#provider-email').type('kendra@honeyrae.com');
		cy.contains('Add Calendar').click({ force: true });
		
		// Should now show the provider card
		cy.contains('Kendra').should('be.visible');
		cy.contains('kendra@honeyrae.com').should('be.visible');
		cy.contains('Disconnected').should('be.visible');
		
		// Connect the calendar
		cy.contains('Connect').first().click();
		
		// Should show connected status
		cy.contains('Connected').should('be.visible');
	});

	it('should show calendar view only when calendars are connected', () => {
		// Initially should show empty state
		cy.contains('No Calendars Connected').should('be.visible');
		
		// Add and connect a calendar
		cy.contains('Add Calendar').click({ force: true });
		cy.get('#provider-name').type('Kendra');
		cy.get('#provider-email').type('kendra@honeyrae.com');
		cy.contains('Add Calendar').click({ force: true });
		cy.contains('Connect').first().click();
		
		// Should now show the calendar view
		cy.contains('Multi-Calendar View').should('be.visible');
		cy.contains('Manage appointments across all providers').should('be.visible');
		cy.contains('Sync Calendars').should('be.visible');
		cy.contains('Add Appointment').should('be.visible');
	});

	it('should sync calendars automatically', () => {
		// Add and connect a calendar
		cy.contains('Add Calendar').click({ force: true });
		cy.get('#provider-name').type('Kendra');
		cy.get('#provider-email').type('kendra@honeyrae.com');
		cy.contains('Add Calendar').click({ force: true });
		cy.contains('Connect').first().click();
		
		// Wait for sync to complete
		cy.contains('Sync completed!').should('be.visible', { timeout: 10000 });
		
		// Should show appointment events
		cy.get('[class*="bg-blue-500"]').should('exist');
	});

	it('should handle multiple calendars', () => {
		// Add first calendar
		cy.contains('Add Calendar').click({ force: true });
		cy.get('#provider-name').type('Kendra');
		cy.get('#provider-email').type('kendra@honeyrae.com');
		cy.contains('Add Calendar').click({ force: true });
		cy.contains('Connect').first().click();
		
		// Add second calendar
		cy.contains('Add Calendar').click({ force: true });
		cy.get('#provider-name').clear().type('Sage');
		cy.get('#provider-email').clear().type('sage@honeyrae.com');
		cy.contains('Add Calendar').click({ force: true });
		cy.contains('Connect').last().click();
		
		// Should show both calendars
		cy.contains('Kendra').should('be.visible');
		cy.contains('Sage').should('be.visible');
		cy.contains('Connected').should('have.length', 2);
	});

	it('should disconnect calendars', () => {
		// Add and connect a calendar
		cy.contains('Add Calendar').click({ force: true });
		cy.get('#provider-name').type('Kendra');
		cy.get('#provider-email').type('kendra@honeyrae.com');
		cy.contains('Add Calendar').click({ force: true });
		cy.contains('Connect').first().click();
		
		// Disconnect the calendar
		cy.contains('Disconnect').first().click();
		
		// Should show disconnected status
		cy.contains('Disconnected').should('be.visible');
	});

	it('should show sync status during sync operations', () => {
		// Add and connect a calendar
		cy.contains('Add Calendar').click({ force: true });
		cy.get('#provider-name').type('Kendra');
		cy.get('#provider-email').type('kendra@honeyrae.com');
		cy.contains('Add Calendar').click({ force: true });
		cy.contains('Connect').first().click();
		
		// Manual sync
		cy.contains('Sync Calendars').click();
		cy.contains('Syncing calendars...').should('be.visible');
		cy.contains('Sync completed!').should('be.visible', { timeout: 10000 });
	});
}); 