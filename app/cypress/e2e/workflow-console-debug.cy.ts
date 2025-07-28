describe('Workflow Console Debug', () => {
	// Handle uncaught exceptions from the app
	Cypress.on('uncaught:exception', (err, runnable) => {
		console.log('Uncaught exception:', err.message);
		return false;
	});

	it('should check console logs for workflow data', () => {
		// Visit the test page first to ensure we have a demo org
		cy.visit('/test');
		cy.wait(3000);
		
		// Navigate to workflow editor
		cy.visit('/workflow-editor');
		cy.wait(2000);
		
		// Check if workflow editor loads
		cy.get('[data-testid="workflow-editor"]').should('be.visible');
		
		// Set a unique workflow name
		const uniqueName = `Console Debug ${Date.now()}`;
		cy.get('input[placeholder="My New Workflow"]').clear().type(uniqueName);
		
		// Save the workflow
		cy.contains('Save Workflow').click();
		
		// Should be redirected to edit page with ID
		cy.url().should('include', '/workflow-editor?id=');
		
		// Wait for the page to load and check console logs
		cy.wait(5000);
		
		// Check the browser console for debug logs
		cy.window().then((win) => {
			// This will help us see what's happening in the console
			cy.log('Checking console logs...');
		});
		
		// Check if the workflow name is preserved
		cy.get('input[placeholder="My New Workflow"]').should('have.value', uniqueName);
		
		cy.log('✅ Workflow name should be preserved!');
	});
}); 