describe('UI Elements Only', () => {
	it('should display basic UI elements on main page', () => {
		cy.visit('/')
		
		// Check for basic page structure
		cy.get('body').should('be.visible')
		
		// Check if there's any content on the page
		cy.get('body').should('not.be.empty')
		
		// Take a screenshot to see what's actually rendered
		cy.screenshot('main-page-content')
	})

	it('should display basic UI elements on setup page', () => {
		cy.visit('/setup')
		
		// Check for basic page structure
		cy.get('body').should('be.visible')
		
		// Check if there's any content on the page
		cy.get('body').should('not.be.empty')
		
		// Take a screenshot to see what's actually rendered
		cy.screenshot('setup-page-content')
	})

	it('should have proper page titles', () => {
		cy.visit('/')
		cy.title().should('not.be.empty')
		
		cy.visit('/setup')
		cy.title().should('not.be.empty')
	})
}) 