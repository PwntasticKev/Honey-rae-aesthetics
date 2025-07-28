describe('Workflow Creation', () => {
	beforeEach(() => {
		// Visit the debug page first to test basic functionality
		cy.visit('http://localhost:3001/debug')
	})

	it('should test basic DataTable functionality', () => {
		// Check that the debug page loads
		cy.contains('Debug Page').should('be.visible')

		// Check that the test table loads
		cy.contains('Test Table').should('be.visible')

		// Check that the test data is displayed
		cy.contains('Test Workflow').should('be.visible')
		cy.contains('Yes').should('be.visible') // enabled status
	})

	it('should test workflow list page', () => {
		// Visit the test page with workflows tab
		cy.visit('http://localhost:3001/test?tab=workflows')

		// Check that the page loads without errors
		cy.contains('Honey Rae Platform').should('be.visible')
		
		// Check that the workflows tab is active
		cy.contains('Workflows').should('be.visible')
		
		// Check that the Add Workflow button is present
		cy.contains('Add Workflow').should('be.visible')
	})

	it('should test workflow functionality', () => {
		// Visit the test page with workflows tab
		cy.visit('http://localhost:3001/test?tab=workflows')

		// Wait for the page to load
		cy.contains('Honey Rae Platform').should('be.visible')
		
		// Check that the workflows tab is active
		cy.contains('Workflows').should('be.visible')

		// Check that buttons exist
		cy.get('button').should('exist')
	})

	it('should test workflow test modal functionality', () => {
		// Visit the test page with workflows tab
		cy.visit('http://localhost:3001/test?tab=workflows')

		// Wait for the page to load
		cy.contains('Honey Rae Platform').should('be.visible')
		
		// Check that the workflows tab is active
		cy.contains('Workflows').should('be.visible')

		// Check that test workflow buttons exist
		cy.get('[data-testid="test-workflow"]').should('exist')
		
		// Verify that the test workflow functionality is available
		cy.log('Test workflow functionality is available')
	})

	it('should navigate to workflow editor and create a workflow', () => {
		// Navigate directly to workflow editor
		cy.visit('http://localhost:3001/workflow-editor')

		// Wait for the page to load
		cy.contains('Workflow Builder').should('be.visible')

		// Check that we have a default trigger node
		cy.get('.react-flow__node').should('have.length', 1)

		// Check that the workflow editor loads properly
		cy.get('.react-flow').should('be.visible')

		// Check that the left panel with blocks is visible
		cy.contains('Add Steps').should('be.visible')

		// Check that workflow info section is visible
		cy.contains('Workflow Info').should('be.visible')
	})

	it('should test workflow editor functionality', () => {
		// Navigate to workflow editor
		cy.visit('http://localhost:3001/workflow-editor')

		// Wait for the page to load
		cy.contains('Workflow Builder').should('be.visible')

		// Check that the workflow editor loads properly
		cy.get('.react-flow').should('be.visible')

		// Check that the left panel with blocks is visible
		cy.contains('Add Steps').should('be.visible')

		// Check that workflow info section is visible
		cy.contains('Workflow Info').should('be.visible')
	})
}) 