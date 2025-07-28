describe('Workflow Editor - Add and Save', () => {
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
		
		// Navigate to workflow editor
		cy.visit('/workflow-editor');
		cy.wait(2000); // Wait for workflow editor to load
	});

	it('should save a new workflow successfully', () => {
		// Wait for the workflow editor to load
		cy.get('[data-testid="workflow-editor"]').should('be.visible');
		
		// Verify the save button is present
		cy.contains('Save Workflow').should('be.visible');
		
		// Click save to create a new workflow
		cy.contains('Save Workflow').click();
		
		// Verify save success (handled via alert)
		cy.on('window:alert', (text) => {
			expect(text).to.include('✅ Workflow saved successfully!');
		});
		
		// Should be redirected to main page
		cy.url().should('eq', Cypress.config().baseUrl + '/');
	});

	it('should handle cancel action', () => {
		// Wait for the workflow editor to load
		cy.get('[data-testid="workflow-editor"]').should('be.visible');
		
		// Click cancel
		cy.contains('Cancel').click();
		
		// Should be redirected to main page
		cy.url().should('eq', Cypress.config().baseUrl + '/');
	});

	it('should test workflow execution panel', () => {
		// Wait for the workflow editor to load
		cy.get('[data-testid="workflow-editor"]').should('be.visible');
		
		// Click test workflow button
		cy.contains('Test Workflow').click();
		
		// Verify test panel appears
		cy.get('[data-testid="test-panel"]').should('be.visible');
		
		// Verify test panel content
		cy.contains('Test Workflow').should('be.visible');
		cy.contains('Select Contact').should('be.visible');
		cy.contains('Run Test').should('be.visible');
		
		// Close test panel
		cy.get('[data-testid="test-panel"]').within(() => {
			cy.get('button').first().click(); // Close button
		});
		
		// Verify panel is closed
		cy.get('[data-testid="test-panel"]').should('not.exist');
	});

	it('should verify draggable blocks are present', () => {
		// Wait for the workflow editor to load
		cy.get('[data-testid="workflow-editor"]').should('be.visible');
		
		// Check that draggable blocks are present (they might be in a scrollable container)
		cy.get('[data-testid="draggable-block-delay"]').should('exist');
		cy.get('[data-testid="draggable-block-send_sms"]').should('exist');
		cy.get('[data-testid="draggable-block-send_email"]').should('exist');
		cy.get('[data-testid="draggable-block-add_tag"]').should('exist');
		
		// Verify block labels are present somewhere on the page
		cy.contains('Delay').should('exist');
		cy.contains('Send SMS').should('exist');
		cy.contains('Send Email').should('exist');
		cy.contains('Add Tag').should('exist');
	});

	it('should verify React Flow canvas is present', () => {
		// Wait for the workflow editor to load
		cy.get('[data-testid="workflow-editor"]').should('be.visible');
		
		// Check that React Flow canvas is present
		cy.get('.react-flow').should('be.visible');
		
		// Check that controls are present
		cy.get('.react-flow__controls').should('be.visible');
		
		// Check that minimap is present
		cy.get('.react-flow__minimap').should('be.visible');
	});
}); 