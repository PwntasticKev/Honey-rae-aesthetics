describe('Workflow Management', () => {
	beforeEach(() => {
		// Login first
		cy.visit('/login');
		cy.get('input[type="email"]').type('admin@honeyrae.com');
		cy.get('input[type="password"]').type('master123');
		cy.get('button[type="submit"]').click();
		
		// Navigate to workflows tab
		cy.contains('Workflows').click();
	});

	it('should display workflows list', () => {
		cy.contains('Workflows').should('be.visible');
		cy.contains('Google Review Request').should('be.visible');
		cy.contains('Welcome New Client').should('be.visible');
		cy.contains('Automate your practice with Zapier-like workflows').should('be.visible');
	});

	it('should show workflow details', () => {
		cy.contains('Google Review Request').should('be.visible');
		cy.contains('Send a Google review request 15 minutes after appointment completion').should('be.visible');
		cy.contains('Triggers on: Appointment Completed').should('be.visible');
		cy.contains('Active').should('be.visible');
		cy.contains('Runs: 12').should('be.visible');
	});

	it('should add a new workflow', () => {
		cy.contains('Add Workflow').click();
		
		// Fill in workflow details
		cy.get('input[placeholder="e.g., Google Review Request"]').type('Test Workflow');
		cy.get('textarea[placeholder="Describe what this workflow does..."]').type('A test workflow for automation');
		
		// Select trigger
		cy.get('[data-radix-select-trigger]').first().click();
		cy.contains('Appointment Completed').click();
		
		// Add a delay step
		cy.contains('Add Step').click();
		cy.get('[data-radix-select-trigger]').last().click();
		cy.contains('Wait/Delay').click();
		cy.get('input[type="number"]').first().clear().type('30');
		
		// Add a message step
		cy.contains('Add Step').click();
		cy.get('[data-radix-select-trigger]').last().click();
		cy.contains('Send Message').click();
		cy.get('select').first().select('sms');
		cy.get('textarea[placeholder*="personalization"]').type('Test message {{first_name}}');
		
		// Submit the workflow
		cy.contains('Create Workflow').click();
		
		// Should return to workflows list
		cy.contains('Workflows').should('be.visible');
	});

	it('should edit an existing workflow', () => {
		cy.contains('Google Review Request').parent().parent().find('button[title="Edit"]').click();
		
		// Should be in edit mode
		cy.contains('Edit Workflow').should('be.visible');
		cy.get('input[value="Google Review Request"]').should('be.visible');
		
		// Change the name
		cy.get('input[value="Google Review Request"]').clear().type('Updated Workflow');
		
		// Submit changes
		cy.contains('Update Workflow').click();
		
		// Should return to workflows list
		cy.contains('Workflows').should('be.visible');
	});

	it('should toggle workflow status', () => {
		// Find the first workflow and toggle it
		cy.get('button[title="Disable"]').first().click();
		
		// Should show inactive status
		cy.contains('Inactive').should('be.visible');
		
		// Toggle back
		cy.get('button[title="Enable"]').first().click();
		cy.contains('Active').should('be.visible');
	});

	it('should delete a workflow', () => {
		// Count initial workflows
		cy.contains('Google Review Request').should('be.visible');
		
		// Delete the workflow
		cy.contains('Google Review Request').parent().parent().find('button[title="Delete"]').click();
		
		// Confirm deletion
		cy.on('window:confirm', () => true);
		
		// Should be removed from list
		cy.contains('Google Review Request').should('not.exist');
	});

	it('should search workflows', () => {
		cy.get('input[placeholder="Search workflows..."]').type('Google');
		cy.contains('Google Review Request').should('be.visible');
		cy.contains('Welcome New Client').should('not.exist');
		
		// Clear search
		cy.get('input[placeholder="Search workflows..."]').clear();
		cy.contains('Welcome New Client').should('be.visible');
	});

	it('should show empty state when no workflows', () => {
		// Delete all workflows first
		cy.get('button[title="Delete"]').each(($btn) => {
			cy.wrap($btn).click();
			cy.on('window:confirm', () => true);
		});
		
		// Should show empty state
		cy.contains('No workflows found').should('be.visible');
		cy.contains('Get started by creating your first automated workflow').should('be.visible');
		cy.contains('Create Your First Workflow').should('be.visible');
	});

	it('should configure workflow steps', () => {
		cy.contains('Add Workflow').click();
		
		// Fill basic info
		cy.get('input[placeholder="e.g., Google Review Request"]').type('Step Test Workflow');
		cy.get('textarea[placeholder="Describe what this workflow does..."]').type('Testing step configuration');
		
		// Add delay step
		cy.contains('Add Step').click();
		cy.get('[data-radix-select-trigger]').last().click();
		cy.contains('Wait/Delay').click();
		cy.get('input[type="number"]').first().clear().type('60');
		
		// Add message step
		cy.contains('Add Step').click();
		cy.get('[data-radix-select-trigger]').last().click();
		cy.contains('Send Message').click();
		cy.get('select').first().select('email');
		cy.get('textarea[placeholder*="personalization"]').type('Email message to {{first_name}}');
		
		// Add tag step
		cy.contains('Add Step').click();
		cy.get('[data-radix-select-trigger]').last().click();
		cy.contains('Add Tag').click();
		cy.get('input[placeholder="Enter tag name"]').type('workflow-tested');
		
		// Remove a step
		cy.get('button[title="Delete"]').first().click();
		
		// Submit
		cy.contains('Create Workflow').click();
		
		// Should return to workflows list
		cy.contains('Workflows').should('be.visible');
	});

	it('should validate required fields', () => {
		cy.contains('Add Workflow').click();
		
		// Try to submit without name
		cy.contains('Create Workflow').click();
		cy.on('window:alert', (text) => {
			expect(text).to.include('Workflow name is required');
		});
		
		// Add name but no steps
		cy.get('input[placeholder="e.g., Google Review Request"]').type('Test Workflow');
		cy.get('button[title="Delete"]').first().click();
		cy.contains('Create Workflow').click();
		cy.on('window:alert', (text) => {
			expect(text).to.include('At least one step is required');
		});
	});

	it('should show workflow stats on dashboard', () => {
		// Go to dashboard
		cy.contains('Dashboard').click();
		
		// Should show workflow stats
		cy.contains('Active Workflows').should('be.visible');
		cy.contains('2').should('be.visible'); // 2 active workflows
		cy.contains('20 total runs').should('be.visible'); // 12 + 8 runs
	});
}); 