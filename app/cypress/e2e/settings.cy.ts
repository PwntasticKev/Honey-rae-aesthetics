describe('Settings Page', () => {
	beforeEach(() => {
		cy.visit('/settings');
	});

	it('should display settings page with tabs', () => {
		cy.contains('Settings').should('be.visible');
		cy.contains('Organization Profile').should('be.visible');
		cy.contains('API Integrations').should('be.visible');
		cy.contains('Team Management').should('be.visible');
		cy.contains('Billing & Plans').should('be.visible');
		cy.contains('Security').should('be.visible');
		cy.contains('Notifications').should('be.visible');
		cy.contains('Appearance').should('be.visible');
	});

	it('should show organization profile by default', () => {
		cy.contains('Organization Profile').should('be.visible');
		cy.contains('Manage your organization').should('be.visible');
		cy.get('input[value="Honey Rae Aesthetics"]').should('be.visible');
		cy.get('input[value="info@honeyrae.com"]').should('be.visible');
	});

	it('should allow editing organization settings', () => {
		cy.contains('Edit').click();
		cy.get('input[value="Honey Rae Aesthetics"]').clear().type('Updated Practice Name');
		cy.get('input[value="info@honeyrae.com"]').clear().type('updated@honeyrae.com');
		cy.contains('Save Changes').click();
		cy.contains('Edit').should('be.visible');
	});

	it('should cancel editing', () => {
		cy.contains('Edit').click();
		cy.get('input[value="Honey Rae Aesthetics"]').clear().type('Test Name');
		cy.contains('Cancel').click();
		cy.get('input[value="Honey Rae Aesthetics"]').should('be.visible');
	});

	it('should navigate to API Integrations tab', () => {
		cy.contains('API Integrations').click();
		cy.contains('Connect and manage third-party services').should('be.visible');
		cy.contains('Google Calendar').should('be.visible');
		cy.contains('Stripe').should('be.visible');
		cy.contains('Twilio').should('be.visible');
	});

	it('should show connected integrations', () => {
		cy.contains('API Integrations').click();
		cy.contains('Connected').should('be.visible');
		cy.contains('Google Calendar').should('be.visible');
		cy.contains('Stripe').should('be.visible');
		cy.contains('Twilio').should('be.visible');
		cy.contains('AWS S3').should('be.visible');
	});

	it('should show disconnected integrations', () => {
		cy.contains('API Integrations').click();
		cy.contains('Disconnected').should('be.visible');
		cy.contains('Mailchimp').should('be.visible');
		cy.contains('Instagram').should('be.visible');
	});

	it('should connect and disconnect integrations', () => {
		cy.contains('API Integrations').click();
		
		// Disconnect an integration
		cy.contains('Google Calendar').parent().parent().contains('Disconnect').click();
		cy.contains('Disconnected').should('be.visible');
		
		// Connect an integration
		cy.contains('Mailchimp').parent().parent().contains('Connect').click();
		cy.contains('Connected').should('be.visible');
	});

	it('should show integration details', () => {
		cy.contains('API Integrations').click();
		cy.contains('Sync appointments and events').should('be.visible');
		cy.contains('Payment processing and billing').should('be.visible');
		cy.contains('SMS and voice messaging').should('be.visible');
		cy.contains('File storage and media management').should('be.visible');
	});

	it('should show last sync times', () => {
		cy.contains('API Integrations').click();
		cy.contains('Last sync:').should('be.visible');
	});

	it('should navigate to other tabs', () => {
		cy.contains('Team Management').click();
		cy.contains('Manage team members and their permissions').should('be.visible');
		cy.contains('Team management features coming soon').should('be.visible');
		
		cy.contains('Billing & Plans').click();
		cy.contains('Manage your subscription and billing information').should('be.visible');
		cy.contains('Billing features coming soon').should('be.visible');
		
		cy.contains('Security').click();
		cy.contains('Manage security settings and access controls').should('be.visible');
		cy.contains('Security features coming soon').should('be.visible');
		
		cy.contains('Notifications').click();
		cy.contains('Configure how you receive notifications').should('be.visible');
		cy.contains('Notification settings coming soon').should('be.visible');
		
		cy.contains('Appearance').click();
		cy.contains('Customize the look and feel of your application').should('be.visible');
		cy.contains('Appearance settings coming soon').should('be.visible');
	});

	it('should have working form fields in organization profile', () => {
		cy.contains('Edit').click();
		
		// Test all form fields
		cy.get('input[value="Honey Rae Aesthetics"]').should('be.visible');
		cy.get('input[value="info@honeyrae.com"]').should('be.visible');
		cy.get('input[value="+1 (555) 123-4567"]').should('be.visible');
		cy.get('input[value="https://honeyrae.com"]').should('be.visible');
		cy.get('textarea').should('be.visible');
		cy.get('input[value="America/Los_Angeles"]').should('be.visible');
		cy.get('input[value="USD"]').should('be.visible');
	});

	it('should show integration status badges', () => {
		cy.contains('API Integrations').click();
		cy.get('.bg-green-100').should('be.visible'); // Connected status
		cy.get('.bg-gray-100').should('be.visible'); // Disconnected status
	});

	it('should have settings button in integration cards', () => {
		cy.contains('API Integrations').click();
		cy.get('button').contains('⚙️').should('be.visible');
	});

	it('should maintain tab state when switching', () => {
		cy.contains('API Integrations').click();
		cy.contains('Connect and manage third-party services').should('be.visible');
		cy.reload();
		cy.contains('Organization Profile').should('be.visible');
	});
}); 