describe('Multi-Calendar Appointments', () => {
	beforeEach(() => {
		cy.visit('/appointments');
	});

	it('should display multi-calendar view', () => {
		cy.contains('Multi-Calendar View').should('be.visible');
		cy.contains('Connect your Google Calendars to get started').should('be.visible');
	});

	it('should show empty state when no calendars are added', () => {
		cy.contains('No Calendars Connected').should('be.visible');
		cy.contains('Add your first Google Calendar to start managing appointments').should('be.visible');
		cy.contains('Add Calendar').should('be.visible');
	});

	it('should allow adding a new calendar', () => {
		cy.contains('Add Calendar').click({ force: true });
		cy.contains('Add New Calendar').should('be.visible');
		
		// Fill in the form
		cy.get('#provider-name').type('Kendra');
		cy.get('#provider-email').type('kendra@honeyrae.com');
		
		// Submit the form
		cy.contains('Add Calendar').click({ force: true });
		
		// Should now show the provider card
		cy.contains('Kendra').should('be.visible');
		cy.contains('kendra@honeyrae.com').should('be.visible');
	});

	it('should show provider status cards after adding calendars', () => {
		// Add a calendar first
		cy.contains('Add Calendar').click({ force: true });
		cy.get('#provider-name').type('Kendra');
		cy.get('#provider-email').type('kendra@honeyrae.com');
		cy.contains('Add Calendar').click({ force: true });
		
		// Check provider card
		cy.contains('Kendra').should('be.visible');
		cy.contains('kendra@honeyrae.com').should('be.visible');
		cy.contains('Disconnected').should('be.visible');
	});

	it('should allow connecting providers', () => {
		// Add a calendar first
		cy.contains('Add Calendar').click({ force: true });
		cy.get('#provider-name').type('Kendra');
		cy.get('#provider-email').type('kendra@honeyrae.com');
		cy.contains('Add Calendar').click({ force: true });
		
		// Connect the provider
		cy.contains('Connect').first().click();
		cy.contains('Connected').should('be.visible');
	});

	it('should allow disconnecting providers', () => {
		// Add a calendar first
		cy.contains('Add Calendar').click({ force: true });
		cy.get('#provider-name').type('Kendra');
		cy.get('#provider-email').type('kendra@honeyrae.com');
		cy.contains('Add Calendar').click({ force: true });
		
		// First connect a provider
		cy.contains('Connect').first().click();
		cy.contains('Connected').should('be.visible');
		
		// Then disconnect
		cy.contains('Disconnect').first().click();
		cy.contains('Disconnected').should('be.visible');
	});

	it('should display calendar view when providers are connected', () => {
		// Add and connect a calendar
		cy.contains('Add Calendar').click({ force: true });
		cy.get('#provider-name').type('Kendra');
		cy.get('#provider-email').type('kendra@honeyrae.com');
		cy.contains('Add Calendar').click({ force: true });
		cy.contains('Connect').first().click();
		
		// Should now show the calendar view
		cy.contains('Week').should('be.visible');
		cy.contains('Month').should('be.visible');
		cy.contains('Today').should('be.visible');
	});

	it('should show today\'s appointments when providers are connected', () => {
		// Add and connect a calendar
		cy.contains('Add Calendar').click({ force: true });
		cy.get('#provider-name').type('Kendra');
		cy.get('#provider-email').type('kendra@honeyrae.com');
		cy.contains('Add Calendar').click({ force: true });
		cy.contains('Connect').first().click();
		
		cy.contains("Today's Appointments").should('be.visible');
	});

	it('should allow adding appointments when providers are connected', () => {
		// Add and connect a calendar
		cy.contains('Add Calendar').click({ force: true });
		cy.get('#provider-name').type('Kendra');
		cy.get('#provider-email').type('kendra@honeyrae.com');
		cy.contains('Add Calendar').click({ force: true });
		cy.contains('Connect').first().click();
		
		cy.contains('Add Appointment').click();
		// This would open a modal or form in a real implementation
	});

	it('should display appointment events in calendar when connected', () => {
		// Add and connect a calendar
		cy.contains('Add Calendar').click({ force: true });
		cy.get('#provider-name').type('Kendra');
		cy.get('#provider-email').type('kendra@honeyrae.com');
		cy.contains('Add Calendar').click({ force: true });
		cy.contains('Connect').first().click();
		
		// Check for appointment events in the calendar grid
		cy.get('[class*="bg-blue-500"]').should('exist');
	});

	it('should show appointment details on click when connected', () => {
		// Add and connect a calendar
		cy.contains('Add Calendar').click({ force: true });
		cy.get('#provider-name').type('Kendra');
		cy.get('#provider-email').type('kendra@honeyrae.com');
		cy.contains('Add Calendar').click({ force: true });
		cy.contains('Connect').first().click();
		
		// Click on an appointment event
		cy.get('[class*="bg-blue-500"]').first().click();
		// This would open appointment details in a real implementation
	});

	it('should navigate between weeks when connected', () => {
		// Add and connect a calendar
		cy.contains('Add Calendar').click({ force: true });
		cy.get('#provider-name').type('Kendra');
		cy.get('#provider-email').type('kendra@honeyrae.com');
		cy.contains('Add Calendar').click({ force: true });
		cy.contains('Connect').first().click();
		
		cy.contains('←').click();
		cy.contains('→').click();
		cy.contains('Today').click();
	});

	it('should show provider colors in calendar when connected', () => {
		// Add and connect a calendar
		cy.contains('Add Calendar').click({ force: true });
		cy.get('#provider-name').type('Kendra');
		cy.get('#provider-email').type('kendra@honeyrae.com');
		cy.contains('Add Calendar').click({ force: true });
		cy.contains('Connect').first().click();
		
		// Verify that the provider has a color
		cy.get('[class*="bg-blue-500"]').should('exist');
	});

	it('should display appointment information correctly when connected', () => {
		// Add and connect a calendar
		cy.contains('Add Calendar').click({ force: true });
		cy.get('#provider-name').type('Kendra');
		cy.get('#provider-email').type('kendra@honeyrae.com');
		cy.contains('Add Calendar').click({ force: true });
		cy.contains('Connect').first().click();
		
		cy.contains('Sarah Johnson').should('be.visible');
		cy.contains('Consultation').should('be.visible');
		cy.contains('Kendra').should('be.visible');
	});

	it('should maintain provider connections', () => {
		// Add a calendar
		cy.contains('Add Calendar').click({ force: true });
		cy.get('#provider-name').type('Kendra');
		cy.get('#provider-email').type('kendra@honeyrae.com');
		cy.contains('Add Calendar').click({ force: true });
		
		// Connect the provider
		cy.contains('Connect').first().click();
		cy.contains('Connected').should('be.visible');
		
		// Refresh page and check if connection persists
		cy.reload();
		cy.contains('Connected').should('be.visible');
	});

	it('should have sync functionality when connected', () => {
		// Add and connect a calendar
		cy.contains('Add Calendar').click({ force: true });
		cy.get('#provider-name').type('Kendra');
		cy.get('#provider-email').type('kendra@honeyrae.com');
		cy.contains('Add Calendar').click({ force: true });
		cy.contains('Connect').first().click();
		
		cy.contains('Sync Calendars').should('be.visible');
		cy.contains('Sync Calendars').click();
		// The sync functionality exists and can be triggered
	});

	it('should show provider connection status', () => {
		// Add a calendar
		cy.contains('Add Calendar').click({ force: true });
		cy.get('#provider-name').type('Kendra');
		cy.get('#provider-email').type('kendra@honeyrae.com');
		cy.contains('Add Calendar').click({ force: true });
		
		cy.contains('Disconnected').should('be.visible');
		cy.contains('Connect').should('be.visible');
	});

	it('should allow adding multiple calendars', () => {
		// Add first calendar
		cy.contains('Add Calendar').click({ force: true });
		cy.get('#provider-name').type('Kendra');
		cy.get('#provider-email').type('kendra@honeyrae.com');
		cy.contains('Add Calendar').click({ force: true });
		
		// Add second calendar
		cy.contains('Add Calendar').click({ force: true });
		cy.get('#provider-name').clear().type('Sage');
		cy.get('#provider-email').clear().type('sage@honeyrae.com');
		cy.contains('Add Calendar').click({ force: true });
		
		// Should show both providers
		cy.contains('Kendra').should('be.visible');
		cy.contains('Sage').should('be.visible');
	});

	it('should show add calendar button in header when connected', () => {
		// Add and connect a calendar
		cy.contains('Add Calendar').click({ force: true });
		cy.get('#provider-name').type('Kendra');
		cy.get('#provider-email').type('kendra@honeyrae.com');
		cy.contains('Add Calendar').click({ force: true });
		cy.contains('Connect').first().click();
		
		// Should show add calendar button in header
		cy.contains('Add Calendar').should('be.visible');
	});
}); 