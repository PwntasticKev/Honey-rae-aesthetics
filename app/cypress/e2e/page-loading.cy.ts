describe('Page Loading', () => {
	it('should load the main page', () => {
		cy.visit('/')
		cy.get('body').should('be.visible')
	})

	it('should load the setup page', () => {
		cy.visit('/setup')
		cy.get('body').should('be.visible')
		// Wait a bit for any dynamic content to load
		cy.wait(2000)
		cy.get('body').should('contain', 'Welcome')
	})

	it('should load the test page', () => {
		cy.visit('/test')
		cy.get('body').should('be.visible')
	})
}) 