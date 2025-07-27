describe('Basic Setup and Navigation', () => {
	it('should setup demo data and navigate to dashboard', () => {
		// Visit the setup page
		cy.visit('/setup')
		
		// Check that setup page is displayed
		cy.get('h2').should('contain', 'Welcome to Honey Rae Aesthetics')
		cy.get('button').contains('Setup Demo Data').should('be.visible')
		
		// Click setup button
		cy.get('button').contains('Setup Demo Data').click()
		
		// Wait for setup to complete
		cy.get('h2').should('contain', 'Setup Complete!')
		
		// Go to dashboard
		cy.get('button').contains('Go to Dashboard').click()
		
		// Verify we're on the dashboard
		cy.url().should('eq', Cypress.config().baseUrl + '/')
		cy.get('h1').should('contain', 'Honey Rae Aesthetics')
	})

	it('should show welcome page when no org exists', () => {
		// Visit the main page without setup
		cy.visit('/')
		
		// Should show welcome/setup page
		cy.get('h2').should('contain', 'Welcome to Honey Rae Aesthetics')
		cy.get('button').contains('Setup Demo Data').should('be.visible')
	})

	it('should display navigation after setup', () => {
		// Setup demo data first
		cy.visit('/setup')
		cy.get('button').contains('Setup Demo Data').click()
		cy.get('button').contains('Go to Dashboard').click()
		
		// Check that navigation is visible
		cy.get('[data-testid="sidebar"]').should('be.visible')
		
		// Check for main navigation items
		cy.get('nav').should('contain', 'Dashboard')
		cy.get('nav').should('contain', 'Clients')
		cy.get('nav').should('contain', 'Appointments')
	})

	it('should display dashboard stats after setup', () => {
		// Setup demo data first
		cy.visit('/setup')
		cy.get('button').contains('Setup Demo Data').click()
		cy.get('button').contains('Go to Dashboard').click()
		
		// Check for dashboard stats - look for the text content
		cy.contains('Total Clients').should('be.visible')
		cy.contains("Today's Appointments").should('be.visible')
		cy.contains('Messages Sent').should('be.visible')
		cy.contains('Photos Uploaded').should('be.visible')
	})
}) 