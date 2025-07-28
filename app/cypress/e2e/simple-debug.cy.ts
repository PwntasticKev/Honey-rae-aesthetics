describe('Simple Debug', () => {
	// Handle uncaught exceptions from the app
	Cypress.on('uncaught:exception', (err, runnable) => {
		console.log('Uncaught exception:', err.message);
		return false;
	});

	it('should see what is on the page', () => {
		// Visit the test page
		cy.visit('/test');
		cy.wait(5000);
		
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
		
		// Check if there's any debug information
		cy.get('pre').then(($pre) => {
			if ($pre.length > 0) {
				cy.log('Found debug info:', $pre.text());
			} else {
				cy.log('No debug info found');
			}
		});
		
		cy.log('✅ Simple debug complete!');
	});
}); 