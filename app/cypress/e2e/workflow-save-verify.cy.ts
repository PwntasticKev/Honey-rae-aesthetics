describe('Workflow Save Verification', () => {
	// Handle uncaught exceptions from the app
	Cypress.on('uncaught:exception', (err, runnable) => {
		console.log('Uncaught exception:', err.message);
		return false;
	});

	it('should create and verify workflow in database', () => {
		// Visit the test page first to ensure we have a demo org
		cy.visit('/test');
		cy.wait(3000);
		
		// Navigate to workflow editor
		cy.visit('/workflow-editor');
		cy.wait(2000);
		
		// Check if workflow editor loads
		cy.get('[data-testid="workflow-editor"]').should('be.visible');
		
		// Set a unique workflow name
		const uniqueName = `Test Workflow ${Date.now()}`;
		cy.get('input[placeholder="My New Workflow"]').clear().type(uniqueName);
		
		// Save the workflow
		cy.contains('Save Workflow').click();
		
		// Should be redirected to edit page with ID
		cy.url().should('include', '/workflow-editor?id=');
		
		// Wait for the page to load
		cy.wait(3000);
		
		// Verify the workflow name is preserved
		cy.get('input[placeholder="My New Workflow"]').should('have.value', uniqueName);
		
		// Navigate back to test page
		cy.visit('/test');
		cy.wait(2000);
		
		// Check if the workflow appears in the list
		cy.contains(uniqueName).should('exist');
		
		cy.log('✅ Workflow was successfully saved and appears in the list!');
	});
}); 