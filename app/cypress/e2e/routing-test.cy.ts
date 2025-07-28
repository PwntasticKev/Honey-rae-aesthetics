describe('Routing Test', () => {
	it('should navigate to different routes when clicking tabs', () => {
		// Visit workflows page (default)
		cy.visit('/workflows');
		cy.url().should('include', '/workflows');
		
		// Click on Clients tab
		cy.contains('Clients').click();
		cy.url().should('include', '/clients');
		
		// Click on Appointments tab
		cy.contains('Appointments').click();
		cy.url().should('include', '/appointments');
		
		// Click on Workflows tab
		cy.contains('Workflows').click();
		cy.url().should('include', '/workflows');
	});
	
	it('should redirect from root to workflows', () => {
		cy.visit('/');
		cy.url().should('include', '/workflows');
	});
	
	it('should maintain active tab state', () => {
		cy.visit('/clients');
		cy.contains('Clients').should('have.class', 'text-blue-600');
		
		cy.visit('/appointments');
		cy.contains('Appointments').should('have.class', 'text-blue-600');
		
		cy.visit('/workflows');
		cy.contains('Workflows').should('have.class', 'text-blue-600');
	});
	
	it('should show correct page titles', () => {
		cy.visit('/clients');
		cy.contains('Client Management').should('be.visible');
		
		cy.visit('/appointments');
		cy.contains('Appointment Management').should('be.visible');
		
		cy.visit('/workflows');
		cy.contains('Workflow Management').should('be.visible');
	});
}); 