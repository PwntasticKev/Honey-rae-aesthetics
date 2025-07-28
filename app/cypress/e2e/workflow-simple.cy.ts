describe('Workflow Simple Test', () => {
	// Handle uncaught exceptions from the app
	Cypress.on('uncaught:exception', (err, runnable) => {
		console.log('Uncaught exception:', err.message);
		return false;
	});

	it('should click save button', () => {
		// Visit the test page first to ensure we have a demo org
		cy.visit('/test');
		cy.wait(3000);
		
		// Navigate to workflow editor
		cy.visit('/workflow-editor');
		cy.wait(2000);
		
		// Check if workflow editor loads
		cy.get('[data-testid="workflow-editor"]').should('be.visible');
		
		// Check if save button exists
		cy.contains('Save Workflow').should('be.visible');
		
		// Click save button
		cy.contains('Save Workflow').click();
		
		// Check if we get redirected (should go to edit page with ID)
		cy.url().should('include', '/workflow-editor?id=');
		
		cy.log('✅ Save button works and redirects to edit page!');
	});
}); 