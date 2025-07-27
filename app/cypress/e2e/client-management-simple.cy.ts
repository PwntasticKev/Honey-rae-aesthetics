describe('Client Management - Simple', () => {
	beforeEach(() => {
		// Login first
		cy.visit('/login');
		cy.get('input[type="email"]').type('admin@honeyrae.com');
		cy.get('input[type="password"]').type('master123');
		cy.get('button[type="submit"]').click();
		
		// Navigate to clients tab
		cy.contains('Clients').click();
	});

	it('should display existing clients', () => {
		// Check that clients are displayed
		cy.contains('Sarah Johnson').should('be.visible');
		cy.contains('Michael Chen').should('be.visible');
		cy.contains('2 clients').should('be.visible');
	});

	it('should open add client form', () => {
		cy.contains('Add Client').click();
		cy.contains('Add New Client').should('be.visible');
		cy.get('input[id="fullName"]').should('be.visible');
		cy.get('input[id="email"]').should('be.visible');
	});

	it('should search for clients', () => {
		// Search by name
		cy.get('input[placeholder="Search clients..."]').type('Sarah');
		cy.contains('Sarah Johnson').should('be.visible');
		cy.contains('Michael Chen').should('not.exist');
		
		// Clear search
		cy.get('input[placeholder="Search clients..."]').clear();
		cy.contains('Michael Chen').should('be.visible');
	});

	it('should filter clients by status', () => {
		// Filter by active status
		cy.get('select').last().select('active');
		cy.contains('Sarah Johnson').should('be.visible');
		cy.contains('Michael Chen').should('not.exist');
		
		// Filter by pending status
		cy.get('select').last().select('pending');
		cy.contains('Michael Chen').should('be.visible');
		cy.contains('Sarah Johnson').should('not.exist');
		
		// Show all
		cy.get('select').last().select('all');
		cy.contains('Sarah Johnson').should('be.visible');
		cy.contains('Michael Chen').should('be.visible');
	});

	it('should edit a client', () => {
		// Click edit button on first client
		cy.get('button[title="Edit"]').first().click();
		
		// Check form is populated
		cy.get('input[id="fullName"]').should('have.value', 'Sarah Johnson');
		cy.get('input[id="email"]').should('have.value', 'sarah@example.com');
		
		// Update the name
		cy.get('input[id="fullName"]').clear().type('Sarah Johnson Updated');
		
		// Submit the form
		cy.contains('Update Client').click();
		
		// Should return to client list
		cy.contains('Clients').should('be.visible');
	});

	it('should delete a client', () => {
		// Count initial clients
		cy.contains('2 clients').should('be.visible');
		
		// Click delete button on first client
		cy.get('button[title="Delete"]').first().click();
		
		// Confirm deletion
		cy.on('window:confirm', () => true);
		
		// Should have one less client
		cy.contains('1 client').should('be.visible');
	});

	it('should display client details correctly', () => {
		// Check Sarah Johnson's details
		cy.contains('Sarah Johnson').should('be.visible');
		cy.contains('sarah@example.com').should('be.visible');
		cy.contains('+15551234567').should('be.visible');
		cy.contains('VIP').should('be.visible');
		cy.contains('returning').should('be.visible');
		cy.contains('Active').should('be.visible');
		cy.contains('via Instagram').should('be.visible');
	});

	it('should handle empty state when no clients match search', () => {
		// Search for non-existent client
		cy.get('input[placeholder="Search clients..."]').type('NonExistentClient');
		
		// Should show empty state
		cy.contains('No clients found').should('be.visible');
		cy.contains('Try adjusting your search or filters').should('be.visible');
	});

	it('should handle empty state when no clients exist', () => {
		// Delete all clients
		cy.get('button[title="Delete"]').each(($btn) => {
			cy.wrap($btn).click();
			cy.on('window:confirm', () => true);
		});
		
		// Should show empty state
		cy.contains('No clients found').should('be.visible');
		cy.contains('Get started by adding your first client').should('be.visible');
		cy.contains('Add Your First Client').should('be.visible');
	});
}); 