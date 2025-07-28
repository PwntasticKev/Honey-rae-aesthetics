describe.skip('Visual Workflow Editor', () => {
	beforeEach(() => {
		cy.visit('/');
		
		// Check if we need to login
		cy.get('body').then(($body) => {
			if ($body.find('input[type="email"]').length > 0) {
				// Need to login
				cy.get('input[type="email"]').type('admin@honeyrae.com');
				cy.get('input[type="password"]').type('master123');
				cy.get('button[type="submit"]').click();
				cy.url().should('include', '/');
			}
		});
		
		// Wait for the page to load and then navigate
		cy.contains('Dashboard').should('be.visible');
		cy.contains('Workflows').should('be.visible').click();
		
		// Wait for workflows page to load
		cy.contains('Workflows').should('be.visible');
		cy.contains('Create Workflow').should('be.visible').click();
	});

	it('should open visual workflow editor', () => {
		cy.contains('Visual Workflow Editor').should('be.visible');
		cy.contains('Drag and drop to build your workflow').should('be.visible');
		cy.get('[data-testid="sidebar"]').should('be.visible');
	});

	it('should add blocks to canvas', () => {
		// Add a trigger block
		cy.contains('Trigger').click();
		cy.get('.absolute').should('have.length', 1);
		
		// Add a delay block
		cy.contains('Delay').click();
		cy.get('.absolute').should('have.length', 2);
		
		// Add a send SMS block
		cy.contains('Send SMS').click();
		cy.get('.absolute').should('have.length', 3);
	});

	it('should delete blocks', () => {
		// Add a block first
		cy.contains('Trigger').click();
		cy.get('.absolute').should('have.length', 1);
		
		// Delete the block
		cy.get('.absolute').first().find('button').click();
		cy.get('.absolute').should('have.length', 0);
	});

	it('should show empty state when no blocks', () => {
		cy.contains('Start Building Your Workflow').should('be.visible');
		cy.contains('Drag blocks from the left panel to create your workflow').should('be.visible');
	});

	it('should save workflow', () => {
		// Add a block
		cy.contains('Trigger').click();
		
		// Save the workflow
		cy.contains('Save Workflow').click();
		
		// Should close the editor
		cy.contains('Visual Workflow Editor').should('not.exist');
	});

	it('should cancel workflow editing', () => {
		cy.contains('Cancel').click();
		cy.contains('Visual Workflow Editor').should('not.exist');
	});

	it('should show different block categories', () => {
		cy.contains('Trigger').should('be.visible');
		cy.contains('Delay').should('be.visible');
		cy.contains('Send SMS').should('be.visible');
		cy.contains('Send Email').should('be.visible');
		cy.contains('Add Tag').should('be.visible');
		cy.contains('Condition').should('be.visible');
	});

	it('should allow block selection', () => {
		// Add a block
		cy.contains('Trigger').click();
		
		// Click on the block to select it
		cy.get('.absolute').first().click();
		
		// Should show selected state
		cy.get('.absolute').first().should('have.class', 'border-blue-500');
	});

	it('should have workflow info section', () => {
		cy.contains('Workflow Info').should('be.visible');
		cy.get('input[placeholder="New Workflow"]').should('be.visible');
	});

	it('should have proper block styling', () => {
		// Add a trigger block
		cy.contains('Trigger').click();
		
		// Check block styling
		cy.get('.absolute').first().should('have.class', 'border-2');
		cy.get('.absolute').first().should('have.class', 'rounded-lg');
		cy.get('.absolute').first().should('have.class', 'cursor-move');
	});

	it('should have connection ports', () => {
		// Add a block
		cy.contains('Trigger').click();
		
		// Check for connection port
		cy.get('.absolute').first().find('.bg-blue-500').should('be.visible');
	});
}); 