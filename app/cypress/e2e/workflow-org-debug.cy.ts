describe('Workflow Organization Debug', () => {
	// Handle uncaught exceptions from the app
	Cypress.on('uncaught:exception', (err, runnable) => {
		console.log('Uncaught exception:', err.message);
		return false;
	});

	it('should debug organization and workflow association', () => {
		// Visit the test page first to ensure we have a demo org
		cy.visit('/test');
		cy.wait(3000);
		
		// Check if we can see the debug information (workflows tab should be active by default now)
		cy.contains('Debug - Real Workflows from Convex').should('be.visible');
		
		// Wait for the debug data to load
		cy.wait(2000);
		
		// Check if there are any workflows listed
		cy.get('pre').should('contain', 'workflows');
		
		// Create a test workflow
		cy.contains('Create Test Workflow').click();
		cy.wait(2000);
		
		// Check if the workflow appears in the debug data
		cy.get('pre').should('contain', 'Test Workflow');
		
		cy.log('✅ Organization and workflow association should be working!');
	});
}); 