describe('Page Debug', () => {
	// Handle uncaught exceptions from the app
	Cypress.on('uncaught:exception', (err, runnable) => {
		console.log('Uncaught exception:', err.message);
		return false;
	});

	it('should debug what is on the test page', () => {
		// Visit the test page
		cy.visit('/test');
		cy.wait(3000);
		
		// Log the page content
		cy.get('body').then(($body) => {
			cy.log('Page content:', $body.text());
		});
		
		// Check if the page title is there
		cy.contains('Workflow Management').should('be.visible');
		
		// Check what tabs are available
		cy.get('button').each(($button) => {
			cy.log('Button text:', $button.text());
		});
		
		cy.log('✅ Page debug complete!');
	});
}); 