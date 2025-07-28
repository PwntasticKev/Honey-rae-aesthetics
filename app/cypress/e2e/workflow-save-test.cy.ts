describe('Workflow Save Test', () => {
	// Handle uncaught exceptions from the app
	Cypress.on('uncaught:exception', (err, runnable) => {
		// Return false to prevent Cypress from failing the test
		console.log('Uncaught exception:', err.message);
		return false;
	});

	beforeEach(() => {
		// Visit the test page first to ensure we have a demo org
		cy.visit('/test');
		cy.wait(3000); // Wait for demo org creation
	});

	it('should create and save a workflow with actual data', () => {
		// Navigate to workflow editor
		cy.visit('/workflow-editor');
		cy.wait(2000);
		
		// Verify the workflow editor loads
		cy.get('[data-testid="workflow-editor"]').should('be.visible');
		
		// Set workflow name and description
		cy.get('input[placeholder="My New Workflow"]').clear().type('Test Workflow');
		cy.get('textarea[placeholder="Describe your workflow"]').clear().type('A test workflow for saving');
		
		// Save the workflow
		cy.contains('Save Workflow').click();
		
		// Handle the alert
		cy.on('window:alert', (text) => {
			expect(text).to.include('✅ Workflow saved successfully!');
		});
		
		// Should be redirected to edit the new workflow
		cy.url().should('include', '/workflow-editor?id=');
		
		// Wait for the page to load with the new workflow
		cy.wait(3000);
		
		// Verify the workflow name and description are loaded
		cy.get('input[placeholder="My New Workflow"]').should('have.value', 'Test Workflow');
		cy.get('textarea[placeholder="Describe your workflow"]').should('have.value', 'A test workflow for saving');
		
		// Navigate back to test page to see if workflow appears in list
		cy.visit('/test');
		cy.wait(2000);
		
		// Check if the workflow appears in the workflows list
		cy.contains('Test Workflow').should('exist');
		cy.contains('A test workflow for saving').should('exist');
	});

	it('should edit an existing workflow', () => {
		// First create a workflow
		cy.visit('/workflow-editor');
		cy.wait(2000);
		
		cy.get('input[placeholder="My New Workflow"]').clear().type('Editable Workflow');
		cy.get('textarea[placeholder="Describe your workflow"]').clear().type('This workflow can be edited');
		
		cy.contains('Save Workflow').click();
		
		cy.on('window:alert', (text) => {
			expect(text).to.include('✅ Workflow saved successfully!');
		});
		
		// Get the workflow ID from URL
		cy.url().then((url) => {
			const workflowId = url.split('id=')[1];
			cy.log('Created workflow ID:', workflowId);
			
			// Navigate back to test page
			cy.visit('/test');
			cy.wait(2000);
			
			// Click edit on the workflow
			cy.contains('Editable Workflow').parent().parent().within(() => {
				cy.get('button').contains('Edit').click();
			});
			
			// Should navigate to edit page with the workflow ID
			cy.url().should('include', `/workflow-editor?id=${workflowId}`);
			
			// Wait for the workflow to load
			cy.wait(3000);
			
			// Verify the workflow data is loaded
			cy.get('input[placeholder="My New Workflow"]').should('have.value', 'Editable Workflow');
			cy.get('textarea[placeholder="Describe your workflow"]').should('have.value', 'This workflow can be edited');
			
			// Edit the workflow
			cy.get('input[placeholder="My New Workflow"]').clear().type('Updated Workflow');
			cy.get('textarea[placeholder="Describe your workflow"]').clear().type('This workflow has been updated');
			
			// Save the changes
			cy.contains('Save Workflow').click();
			
			cy.on('window:alert', (text) => {
				expect(text).to.include('✅ Workflow saved successfully!');
			});
			
			// Should stay on the edit page
			cy.url().should('include', `/workflow-editor?id=${workflowId}`);
			
			// Verify the changes are saved
			cy.get('input[placeholder="My New Workflow"]').should('have.value', 'Updated Workflow');
			cy.get('textarea[placeholder="Describe your workflow"]').should('have.value', 'This workflow has been updated');
		});
	});
}); 