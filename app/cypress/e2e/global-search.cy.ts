describe('Global Search', () => {
	beforeEach(() => {
		cy.visit('/');
	});

	it('should show search input in header', () => {
		cy.get('input[placeholder="Search anything"]').should('be.visible');
	});

	it('should show recent searches when focused', () => {
		cy.get('input[placeholder="Search anything"]').focus();
		cy.contains('Recent Searches').should('be.visible');
	});

	it('should show search suggestions', () => {
		cy.get('input[placeholder="Search anything"]').type('sarah');
		cy.contains('sarah johnson').should('be.visible');
	});

	it('should show search results with different types', () => {
		cy.get('input[placeholder="Search anything"]').type('sarah');
		cy.contains('Sarah Johnson').should('be.visible');
		cy.contains('Client').should('be.visible');
		cy.contains('Appointment').should('be.visible');
	});

	it('should navigate to search results page when clicking view all', () => {
		cy.get('input[placeholder="Search anything"]').type('sarah');
		cy.contains('View all results for "sarah"').click();
		cy.url().should('include', '/search');
		cy.contains('Results for "sarah"').should('be.visible');
	});

	it('should filter results by type', () => {
		cy.visit('/search?q=sarah');
		cy.contains('Client').click();
		cy.get('.bg-blue-100').should('be.visible');
	});

	it('should clear search input', () => {
		cy.get('input[placeholder="Search anything"]').type('test');
		cy.get('input[placeholder="Search anything"]').should('have.value', 'test');
		cy.get('button').contains('✕').click();
		cy.get('input[placeholder="Search anything"]').should('have.value', '');
	});

	it('should handle keyboard navigation', () => {
		cy.get('input[placeholder="Search anything"]').type('sarah');
		cy.get('input[placeholder="Search anything"]').type('{downarrow}');
		cy.get('.bg-orange-50').should('be.visible');
	});

	it('should close dropdown when pressing escape', () => {
		cy.get('input[placeholder="Search anything"]').type('sarah');
		cy.get('input[placeholder="Search anything"]').type('{esc}');
		cy.contains('Search Results').should('not.exist');
	});

	it('should show no results message for invalid search', () => {
		cy.get('input[placeholder="Search anything"]').type('invalidsearchterm');
		cy.contains('No results found').should('be.visible');
	});

	it('should show search results with metadata', () => {
		cy.get('input[placeholder="Search anything"]').type('sarah');
		cy.contains('sarah@example.com').should('be.visible');
		cy.contains('active').should('be.visible');
	});

	it('should navigate to result when clicked', () => {
		cy.get('input[placeholder="Search anything"]').type('sarah');
		cy.contains('Sarah Johnson').click();
		cy.url().should('include', '/clients');
	});

	it('should show different icons for different result types', () => {
		cy.get('input[placeholder="Search anything"]').type('workflow');
		cy.contains('⚡').should('be.visible');
		cy.get('input[placeholder="Search anything"]').clear();
		cy.get('input[placeholder="Search anything"]').type('appointment');
		cy.contains('📅').should('be.visible');
	});

	it('should handle search with special characters', () => {
		cy.get('input[placeholder="Search anything"]').type('test@email.com');
		cy.get('input[placeholder="Search anything"]').should('have.value', 'test@email.com');
	});

	it('should show search results page with filters', () => {
		cy.visit('/search?q=sarah');
		cy.contains('Filter by:').should('be.visible');
		cy.contains('Type:').should('be.visible');
		cy.contains('Status:').should('be.visible');
	});

	it('should apply and clear filters', () => {
		cy.visit('/search?q=sarah');
		cy.contains('Client').click();
		cy.get('.bg-orange-500').should('be.visible');
		cy.contains('Clear filters').click();
		cy.get('.bg-orange-500').should('not.exist');
	});
}); 