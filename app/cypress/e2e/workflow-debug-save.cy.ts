describe('Workflow Save Debug', () => {
	// Handle uncaught exceptions from the app
	Cypress.on('uncaught:exception', (err, runnable) => {
		console.log('Uncaught exception:', err.message);
		return false;
	});

	it('should debug workflow saving process', () => {
		// Visit the test page first to ensure we have a demo org
		cy.visit('/test');
		cy.wait(3000);
		
		// Navigate to workflow editor
		cy.visit('/workflow-editor');
		cy.wait(2000);
		
		// Check if workflow editor loads
		cy.get('[data-testid="workflow-editor"]').should('be.visible');
		
		// Set a unique workflow name
		const uniqueName = `Debug Workflow ${Date.now()}`;
		cy.get('input[placeholder="My New Workflow"]').clear().type(uniqueName);
		
		// Save the workflow
		cy.contains('Save Workflow').click();
		
		// Should be redirected to edit page with ID
		cy.url().should('include', '/workflow-editor?id=');
		
		// Get the workflow ID from URL
		cy.url().then((url) => {
			const workflowId = url.split('id=')[1];
			cy.log('Created workflow ID:', workflowId);
			
			// Wait for the page to load
			cy.wait(3000);
			
			// Check if the workflow name is preserved
			cy.get('input[placeholder="My New Workflow"]').should('have.value', uniqueName);
			
			// Now try to save again to see if it updates the existing workflow
			cy.get('input[placeholder="My New Workflow"]').clear().type('Updated Debug Workflow');
			
			// Save again
			cy.contains('Save Workflow').click();
			
			// Should stay on the same page with the same ID
			cy.url().should('include', `/workflow-editor?id=${workflowId}`);
			
			// Wait and check if the name is updated
			cy.wait(3000);
			cy.get('input[placeholder="My New Workflow"]').should('have.value', 'Updated Debug Workflow');
			
			cy.log('✅ Workflow updating appears to be working!');
		});
	});
}); 