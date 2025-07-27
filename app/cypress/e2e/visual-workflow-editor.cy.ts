describe('Form Workflow Editor', () => {
	beforeEach(() => {
		cy.visit('/login');
		cy.get('input[type="email"]').type('admin@honeyrae.com');
		cy.get('input[type="password"]').type('master123');
		cy.get('button[type="submit"]').click();
		cy.url().should('include', '/');
		
		// Navigate to workflows
		cy.contains('Workflows').click();
		
		// Open visual editor
		cy.contains('Visual Editor').click();
	});

	it('should open form workflow editor', () => {
		cy.contains('Workflow Configuration').should('be.visible');
		cy.contains('Add Workflow Steps').should('be.visible');
		cy.contains('Workflow Details').should('be.visible');
	});

	it.skip('should add steps to workflow', () => {
		// Add a trigger step
		cy.contains('Appointment Completed').click();
		cy.contains('Step 1').should('be.visible');
		
		// Add an action step
		cy.contains('Send SMS').click();
		cy.contains('Step 2').should('be.visible');
	});

	it('should configure workflow details', () => {
		// Check workflow name field
		cy.get('input[placeholder="Enter workflow name"]').should('have.value', 'Follow-up for new clients');
		
		// Update workflow name
		cy.get('input[placeholder="Enter workflow name"]').clear().type('Test Workflow');
		cy.get('input[placeholder="Enter workflow name"]').should('have.value', 'Test Workflow');
		
		// Check description field
		cy.get('textarea[placeholder="Enter workflow description"]').should('be.visible');
	});

	it.skip('should configure different step types', () => {
		// Add SMS step
		cy.contains('Send SMS').click();
		cy.contains('Message Template').should('be.visible');
		cy.get('textarea[placeholder="Enter your SMS message template..."]').type('Thank you for your appointment!');
		
		// Add email step
		cy.contains('Send Email').click();
		cy.contains('Subject').should('be.visible');
		cy.get('input[placeholder="Email subject"]').type('Follow-up Email');
		
		// Add wait step
		cy.contains('Wait/Delay').click();
		cy.contains('Delay (minutes)').should('be.visible');
		cy.get('input[type="number"]').first().clear().type('30');
		
		// Add tag step
		cy.contains('Add Tag').click();
		cy.contains('Tag to Add').should('be.visible');
		cy.get('input[placeholder="Enter tag name"]').type('VIP');
		
		// Add if statement
		cy.contains('If Statement').click();
		cy.get('[role="combobox"]').should('be.visible');
	});

	it('should delete steps', () => {
		// Add a step
		cy.contains('Send SMS').click();
		cy.contains('Step 1').should('be.visible');
		
		// Delete the step
		cy.get('button[class*="h-6"]').first().click();
		cy.contains('Step 1').should('not.exist');
	});

	it('should show empty state when no steps', () => {
		cy.contains('No steps added yet').should('be.visible');
		cy.contains('Click "Add Step" to get started').should('be.visible');
	});

	it('should add step using Add Step button', () => {
		cy.contains('Add Step').click();
		cy.contains('Step 1').should('be.visible');
		cy.contains('Send SMS').should('be.visible');
	});

	it('should save workflow', () => {
		// Add a step
		cy.contains('Send SMS').click();
		
		// Configure the step
		cy.get('textarea[placeholder="Enter your SMS message template..."]').type('Test message');
		
		// Save workflow
		cy.contains('Save Workflow').click();
		
		// Should return to workflow list
		cy.contains('Workflows').should('be.visible');
	});

	it('should cancel workflow editing', () => {
		// Add a step
		cy.contains('Send SMS').click();
		
		// Cancel editing
		cy.contains('Cancel').click();
		
		// Should return to workflow list
		cy.contains('Workflows').should('be.visible');
	});

	it('should show different step categories', () => {
		// Check triggers section
		cy.contains('Triggers').should('be.visible');
		cy.contains('Appointment Completed').should('be.visible');
		cy.contains('New Client Added').should('be.visible');
		
		// Check conditions section
		cy.contains('Conditions').should('be.visible');
		cy.contains('If Statement').should('be.visible');
		cy.contains('Wait/Delay').should('be.visible');
		
		// Check actions section
		cy.contains('Actions').should('be.visible');
		cy.contains('Send SMS').should('be.visible');
		cy.contains('Send Email').should('be.visible');
		cy.contains('Add Tag').should('be.visible');
	});

	it('should configure step parameters', () => {
		// Add SMS step
		cy.contains('Send SMS').click();
		
		// Configure message
		cy.get('textarea[placeholder="Enter your SMS message template..."]').type('Hello {first_name}, thank you for your appointment!', { parseSpecialCharSequences: false });
		
		// Verify message
		cy.get('textarea[placeholder="Enter your SMS message template..."]').should('have.value', 'Hello {first_name}, thank you for your appointment!');
	});
}); 