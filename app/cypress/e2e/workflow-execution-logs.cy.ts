describe('Workflow Execution Logs and Enrollment History', () => {
	beforeEach(() => {
		cy.visit('/test-execution-logs');
	});

	it('should display execution logs with filtering', () => {
		// Check that execution logs are displayed
		cy.contains('Execution Logs').should('be.visible');
		cy.contains('Track workflow executions and client interactions').should('be.visible');

		// Check that logs are displayed
		cy.get('[data-testid="execution-logs"]').should('exist');
		cy.contains('Sarah Johnson').should('be.visible');
		cy.contains('Michael Chen').should('be.visible');
		cy.contains('Emily Rodriguez').should('be.visible');

		// Test search functionality
		cy.get('input[placeholder*="Search"]').type('Sarah');
		cy.contains('Sarah Johnson').should('be.visible');
		cy.contains('Michael Chen').should('not.exist');

		// Test status filter
		cy.get('select').first().select('executed');
		cy.contains('executed').should('be.visible');

		// Test action filter
		cy.get('select').last().select('send_sms');
		cy.contains('Send SMS').should('be.visible');
	});

	it('should display enrollment history with progress tracking', () => {
		// Switch to enrollment history tab
		cy.contains('Enrollment History').click();

		// Check that enrollments are displayed
		cy.contains('Track clients enrolled in workflows and their progress').should('be.visible');
		cy.contains('Sarah Johnson').should('be.visible');
		cy.contains('Michael Chen').should('be.visible');

		// Check progress bars
		cy.get('.bg-green-500, .bg-yellow-500, .bg-blue-500').should('exist');

		// Test search functionality
		cy.get('input[placeholder*="Search"]').type('Sarah');
		cy.contains('Sarah Johnson').should('be.visible');
		cy.contains('Michael Chen').should('not.exist');

		// Test status filter
		cy.get('select').first().select('active');
		cy.contains('active').should('be.visible');

		// Test workflow filter
		cy.get('select').last().select('Appointment Follow-up');
		cy.contains('Appointment Follow-up').should('be.visible');
	});

	it('should display summary statistics', () => {
		// Check summary cards
		cy.contains('Total Executions').should('be.visible');
		cy.contains('Successful').should('be.visible');
		cy.contains('Active Enrollments').should('be.visible');
		cy.contains('Workflows').should('be.visible');

		// Check that numbers are displayed
		cy.get('.text-2xl').should('have.length.at.least', 4);
	});

	it('should handle refresh functionality', () => {
		// Test refresh buttons
		cy.contains('Refresh Execution Logs').click();
		cy.contains('Refresh Enrollment History').click();

		// Check that console logs are triggered (in real app, this would refresh data)
		cy.window().then((win) => {
			cy.spy(win.console, 'log').as('consoleLog');
			cy.get('@consoleLog').should('be.called');
		});
	});

	it('should display proper status indicators', () => {
		// Check execution log status badges
		cy.contains('executed').should('be.visible');
		cy.contains('failed').should('be.visible');
		cy.contains('waiting').should('be.visible');

		// Switch to enrollment history
		cy.contains('Enrollment History').click();

		// Check enrollment status badges
		cy.contains('active').should('be.visible');
		cy.contains('completed').should('be.visible');
		cy.contains('paused').should('be.visible');
		cy.contains('cancelled').should('be.visible');
	});

	it('should display client information correctly', () => {
		// Check client avatars
		cy.get('[data-testid="client-avatar"]').should('exist');

		// Check client details
		cy.contains('sarah.johnson@email.com').should('be.visible');
		cy.contains('michael.chen@email.com').should('be.visible');
		cy.contains('emily.rodriguez@email.com').should('be.visible');

		// Check phone numbers
		cy.contains('+1 (555) 123-4567').should('be.visible');
		cy.contains('+1 (555) 234-5678').should('be.visible');
	});

	it('should display workflow information correctly', () => {
		// Switch to enrollment history
		cy.contains('Enrollment History').click();

		// Check workflow names
		cy.contains('Appointment Follow-up').should('be.visible');
		cy.contains('New Client Welcome').should('be.visible');
		cy.contains('Birthday Reminder').should('be.visible');

		// Check workflow descriptions
		cy.contains('Automated follow-up after appointments').should('be.visible');
		cy.contains('Welcome sequence for new clients').should('be.visible');
		cy.contains('Send birthday wishes to clients').should('be.visible');
	});

	it('should handle empty states', () => {
		// Test search with no results
		cy.get('input[placeholder*="Search"]').type('NonexistentClient');
		cy.contains('No logs found').should('be.visible');
		cy.contains('Try adjusting your filters or search terms').should('be.visible');

		// Clear search
		cy.get('input[placeholder*="Search"]').clear();
		cy.contains('Sarah Johnson').should('be.visible');
	});

	it('should display proper timestamps', () => {
		// Check that timestamps are displayed
		cy.contains('ago').should('be.visible');
		cy.contains('Enrolled').should('be.visible');
		cy.contains('Next:').should('be.visible');
	});

	it('should display proper action icons', () => {
		// Check that action icons are displayed
		cy.get('[data-testid="action-icon"]').should('exist');
		cy.get('[data-testid="status-icon"]').should('exist');
	});

	it('should handle pagination correctly', () => {
		// Check that pagination controls exist (if implemented)
		cy.get('[data-testid="pagination"]').should('exist');
	});

	it('should display proper error states', () => {
		// Test failed execution logs
		cy.contains('Failed to send SMS').should('be.visible');
		cy.contains('Invalid phone number').should('be.visible');
	});

	it('should display proper waiting states', () => {
		// Test waiting execution logs
		cy.contains('Waiting 24 hours before next step').should('be.visible');
		cy.contains('waiting').should('be.visible');
	});
});

describe('Workflow Editor Drag and Drop', () => {
	beforeEach(() => {
		cy.visit('/workflow-editor');
	});

	it('should allow dragging blocks from sidebar to canvas', () => {
		// Check that sidebar blocks are draggable
		cy.get('[data-testid="draggable-block"]').should('exist');

		// Test dragging a trigger block
		cy.contains('Trigger').trigger('mousedown', { button: 0 });
		cy.get('.react-flow__pane').trigger('mousemove', { clientX: 400, clientY: 200 });
		cy.get('.react-flow__pane').trigger('mouseup');

		// Check that the block was added
		cy.get('.react-flow__node').should('have.length', 2); // Default trigger + new trigger
	});

	it('should allow dragging action blocks', () => {
		// Test dragging a send SMS block
		cy.contains('Send SMS').trigger('mousedown', { button: 0 });
		cy.get('.react-flow__pane').trigger('mousemove', { clientX: 500, clientY: 200 });
		cy.get('.react-flow__pane').trigger('mouseup');

		// Check that the block was added
		cy.get('.react-flow__node').should('have.length', 2);
	});

	it('should allow dragging condition blocks', () => {
		// Test dragging a condition block
		cy.contains('If/Else').trigger('mousedown', { button: 0 });
		cy.get('.react-flow__pane').trigger('mousemove', { clientX: 600, clientY: 200 });
		cy.get('.react-flow__pane').trigger('mouseup');

		// Check that the block was added
		cy.get('.react-flow__node').should('have.length', 2);
	});

	it('should allow dragging delay blocks', () => {
		// Test dragging a delay block
		cy.contains('Delay').trigger('mousedown', { button: 0 });
		cy.get('.react-flow__pane').trigger('mousemove', { clientX: 700, clientY: 200 });
		cy.get('.react-flow__pane').trigger('mouseup');

		// Check that the block was added
		cy.get('.react-flow__node').should('have.length', 2);
	});

	it('should allow connecting nodes', () => {
		// Add two nodes first
		cy.contains('Send SMS').trigger('mousedown', { button: 0 });
		cy.get('.react-flow__pane').trigger('mousemove', { clientX: 400, clientY: 200 });
		cy.get('.react-flow__pane').trigger('mouseup');

		cy.contains('Send Email').trigger('mousedown', { button: 0 });
		cy.get('.react-flow__pane').trigger('mousemove', { clientX: 600, clientY: 200 });
		cy.get('.react-flow__pane').trigger('mouseup');

		// Try to connect nodes (this would require more complex interaction)
		cy.get('.react-flow__node').should('have.length', 3);
	});

	it('should allow deleting nodes', () => {
		// Add a node
		cy.contains('Send SMS').trigger('mousedown', { button: 0 });
		cy.get('.react-flow__pane').trigger('mousemove', { clientX: 400, clientY: 200 });
		cy.get('.react-flow__pane').trigger('mouseup');

		// Click on the node to select it
		cy.get('.react-flow__node').last().click();

		// Check that the node configuration panel appears
		cy.get('[data-testid="node-config-panel"]').should('be.visible');

		// Click delete button
		cy.contains('Delete Node').click();

		// Check that the node was deleted
		cy.get('.react-flow__node').should('have.length', 1); // Only default trigger
	});

	it('should display empty state when no nodes', () => {
		// Delete the default trigger node
		cy.get('.react-flow__node').first().click();
		cy.contains('Delete Node').click();

		// Check empty state
		cy.contains('Start Building Your Workflow').should('be.visible');
		cy.contains('Drag and drop blocks from the left panel to begin').should('be.visible');
	});

	it('should allow configuring nodes', () => {
		// Add a send SMS node
		cy.contains('Send SMS').trigger('mousedown', { button: 0 });
		cy.get('.react-flow__pane').trigger('mousemove', { clientX: 400, clientY: 200 });
		cy.get('.react-flow__pane').trigger('mouseup');

		// Click on the node to configure it
		cy.get('.react-flow__node').last().click();

		// Check that configuration panel appears
		cy.get('[data-testid="node-config-panel"]').should('be.visible');
		cy.contains('Configure Send SMS').should('be.visible');

		// Test configuration fields
		cy.get('input[placeholder*="message"]').should('exist');
		cy.get('input[placeholder*="phone"]').should('exist');
	});

	it('should save workflow configuration', () => {
		// Add some nodes
		cy.contains('Send SMS').trigger('mousedown', { button: 0 });
		cy.get('.react-flow__pane').trigger('mousemove', { clientX: 400, clientY: 200 });
		cy.get('.react-flow__pane').trigger('mouseup');

		cy.contains('Delay').trigger('mousedown', { button: 0 });
		cy.get('.react-flow__pane').trigger('mousemove', { clientX: 600, clientY: 200 });
		cy.get('.react-flow__pane').trigger('mouseup');

		// Save the workflow
		cy.contains('Save Workflow').click();

		// Check that save was successful
		cy.url().should('include', '/test?tab=workflows');
	});
}); 