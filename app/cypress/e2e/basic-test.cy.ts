describe('Basic Test', () => {
	// Handle uncaught exceptions from the app
	Cypress.on('uncaught:exception', (err, runnable) => {
		console.log('Uncaught exception:', err.message);
		return false;
	});

	it('should load the page', () => {
		// Visit the test page
		cy.visit('/test');
		
		// Wait for page to load
		cy.wait(3000);
		
		// Just check if the page loads
		cy.get('body').should('exist');
		
		// Check if there's any content
		cy.get('body').then(($body) => {
			cy.log('Body text length:', $body.text().length);
			cy.log('Body text preview:', $body.text().substring(0, 200));
		});
		
		cy.log('✅ Page loaded!');
	});
}); 