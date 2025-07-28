describe('URL Navigation Test', () => {
	it('should change URL when clicking on tabs', () => {
		cy.visit('/test');
		
		// Check initial URL
		cy.url().should('include', '/test');
		
		// Click on Clients tab
		cy.contains('Clients').click();
		cy.url().should('include', '/test?tab=clients');
		
		// Click on Appointments tab
		cy.contains('Appointments').click();
		cy.url().should('include', '/test?tab=appointments');
		
		// Click on Workflows tab
		cy.contains('Workflows').click();
		cy.url().should('include', '/test?tab=workflows');
		
		// Verify the workflows tab is active
		cy.contains('Workflows').should('have.class', 'text-blue-600');
	});
	
	it('should maintain tab state on page refresh', () => {
		// Visit workflows tab directly
		cy.visit('/test?tab=workflows');
		
		// Verify workflows tab is active
		cy.contains('Workflows').should('have.class', 'text-blue-600');
		
		// Refresh the page
		cy.reload();
		
		// Verify workflows tab is still active after refresh
		cy.contains('Workflows').should('have.class', 'text-blue-600');
		cy.url().should('include', '/test?tab=workflows');
	});
}); 