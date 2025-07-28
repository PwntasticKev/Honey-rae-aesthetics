describe('Workflow Debug Test', () => {
	// Handle uncaught exceptions from the app
	Cypress.on('uncaught:exception', (err, runnable) => {
		console.log('Uncaught exception:', err.message);
		return false;
	});

	it('should debug workflow saving', () => {
		// Visit the test page first to ensure we have a demo org
		cy.visit('/test');
		cy.wait(3000);
		
		// Navigate to workflow editor
		cy.visit('/workflow-editor');
		cy.wait(2000);
		
		// Check if workflow editor loads
		cy.get('[data-testid="workflow-editor"]').should('be.visible');
		
		// Check the initial workflow name
		cy.get('input[placeholder="My New Workflow"]').should('have.value', 'New Workflow');
		
		// Change the workflow name
		cy.get('input[placeholder="My New Workflow"]').clear().type('Debug Workflow');
		
		// Verify the name changed
		cy.get('input[placeholder="My New Workflow"]').should('have.value', 'Debug Workflow');
		
		// Save the workflow
		cy.contains('Save Workflow').click();
		
		// Handle the alert
		cy.on('window:alert', (text) => {
			cy.log('Alert received:', text);
			expect(text).to.include('✅ Workflow saved successfully!');
		});
		
		// Check if we're redirected to edit page
		cy.url().should('include', '/workflow-editor?id=');
		
		// Wait and check if the workflow name is preserved
		cy.wait(3000);
		cy.get('input[placeholder="My New Workflow"]').should('have.value', 'Debug Workflow');
		
		cy.log('✅ Workflow saving appears to be working!');
	});
}); 