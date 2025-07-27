describe('Honey Rae Aesthetics Navigation', () => {
	beforeEach(() => {
		// Visit the main page before each test
		cy.visit('http://localhost:3001')
	})

	it('should display the welcome page when no organization exists', () => {
		cy.get('h1').should('contain', 'Welcome to Honey Rae')
		cy.get('button').should('contain', 'Setup Demo Organization')
	})

	it('should navigate to setup page', () => {
		cy.visit('http://localhost:3001/setup')
		cy.get('h1').should('contain', 'Welcome to Honey Rae')
		cy.get('input[id="orgName"]').should('be.visible')
		cy.get('input[id="email"]').should('be.visible')
		cy.get('button').should('contain', 'Create Demo Organization')
	})

	it('should navigate to test page', () => {
		cy.visit('http://localhost:3001/test')
		cy.get('h1').should('contain', 'Honey Rae Aesthetics')
		cy.get('[data-testid="feature-card"]').should('have.length.at.least', 3)
	})

	it('should display the main dashboard after setup', () => {
		// First setup the demo organization
		cy.visit('http://localhost:3001/setup')
		cy.get('button').contains('Create Demo Organization').click()
		
		// Wait for setup to complete and redirect
		cy.url().should('include', '/')
		cy.get('h1').should('contain', 'Welcome back')
	})

	it('should have working sidebar navigation', () => {
		// Setup demo data first
		cy.visit('http://localhost:3001/setup')
		cy.get('button').contains('Create Demo Organization').click()
		cy.url().should('include', '/')
		
		// Test sidebar navigation
		cy.get('[data-testid="sidebar"]').should('be.visible')
		
		// Test each navigation item
		cy.get('[data-testid="sidebar-item-dashboard"]').click()
		cy.get('h1').should('contain', 'Welcome back')
		
		cy.get('[data-testid="sidebar-item-clients"]').click()
		cy.get('h1').should('contain', 'Clients')
		
		cy.get('[data-testid="sidebar-item-appointments"]').click()
		cy.get('h1').should('contain', 'Appointments')
		
		cy.get('[data-testid="sidebar-item-gallery"]').click()
		cy.get('h1').should('contain', 'Photo Gallery')
		
		cy.get('[data-testid="sidebar-item-templates"]').click()
		cy.get('h1').should('contain', 'Templates')
		
		cy.get('[data-testid="sidebar-item-workflows"]').click()
		cy.get('h1').should('contain', 'Workflows')
		
		cy.get('[data-testid="sidebar-item-social"]').click()
		cy.get('h1').should('contain', 'Social Media')
		
		cy.get('[data-testid="sidebar-item-messaging"]').click()
		cy.get('h1').should('contain', 'Messaging')
		
		cy.get('[data-testid="sidebar-item-analytics"]').click()
		cy.get('h1').should('contain', 'Analytics')
		
		cy.get('[data-testid="sidebar-item-team"]').click()
		cy.get('h1').should('contain', 'Team Management')
		
		cy.get('[data-testid="sidebar-item-billing"]').click()
		cy.get('h1').should('contain', 'Billing')
		
		cy.get('[data-testid="sidebar-item-settings"]').click()
		cy.get('h1').should('contain', 'Settings')
	})

	it('should have responsive mobile navigation', () => {
		// Setup demo data first
		cy.visit('http://localhost:3001/setup')
		cy.get('button').contains('Create Demo Organization').click()
		cy.url().should('include', '/')
		
		// Test mobile view
		cy.viewport('iphone-x')
		cy.get('[data-testid="mobile-menu-button"]').click()
		cy.get('[data-testid="sidebar"]').should('be.visible')
		cy.get('[data-testid="sidebar-item-dashboard"]').click()
		cy.get('[data-testid="sidebar"]').should('not.be.visible')
	})

	it('should display proper error handling', () => {
		// Test non-existent page
		cy.visit('http://localhost:3001/non-existent-page', { failOnStatusCode: false })
		cy.get('h1').should('contain', '404')
	})
}) 