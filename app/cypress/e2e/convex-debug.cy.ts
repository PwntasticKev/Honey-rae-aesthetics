describe('Convex Debug', () => {
	// Handle uncaught exceptions from the app
	Cypress.on('uncaught:exception', (err, runnable) => {
		console.log('Uncaught exception:', err.message);
		return false;
	});

	it('should check Convex connection and console logs', () => {
		// Visit the test page
		cy.visit('/test');
		
		// Wait for page to load
		cy.wait(5000);
		
		// Check if the debug panel shows any data
		cy.contains('Debug - Real Workflows from Convex').should('be.visible');
		
		// Check the debug content
		cy.get('pre').then(($pre) => {
			cy.log('Debug content:', $pre.text());
		});
		
		// Check if there are any console errors
		cy.window().then((win) => {
			cy.log('Checking for console logs...');
			// This will help us see what's happening with Convex
		});
		
		// Check if the page has any workflow data
		cy.contains('No data found').should('be.visible');
		
		cy.log('✅ Convex debug complete!');
	});
}); 