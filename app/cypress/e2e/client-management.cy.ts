describe('Client Management', () => {
	beforeEach(() => {
		// Login first
		cy.visit('/login');
		cy.get('input[type="email"]').type('admin@honeyrae.com');
		cy.get('input[type="password"]').type('master123');
		cy.get('button[type="submit"]').click();
		
		// Navigate to clients tab
		cy.contains('Clients').click();
	});

	it('should display client list with existing clients', () => {
		// Check that clients are displayed
		cy.contains('Sarah Johnson').should('be.visible');
		cy.contains('Michael Chen').should('be.visible');
		cy.contains('sarah@example.com').should('be.visible');
		cy.contains('michael@example.com').should('be.visible');
		
		// Check client count
		cy.contains('2 clients').should('be.visible');
	});

	it('should open add client form when clicking Add Client', () => {
		cy.contains('Add Client').click();
		
		// Check form elements
		cy.contains('Add New Client').should('be.visible');
		cy.get('input[id="fullName"]').should('be.visible');
		cy.get('input[id="email"]').should('be.visible');
		cy.get('select').should('be.visible'); // Gender select
		cy.contains('Cancel').should('be.visible');
	});

	it('should create a new client successfully', () => {
		cy.contains('Add Client').click();
		
		// Fill out the form
		cy.get('input[id="fullName"]').type('Test Client');
		cy.get('input[id="email"]').type('test@example.com');
		// Skip gender selection for now - it's already defaulted to female
		cy.get('input[type="date"]').type('1990-01-01');
		cy.get('input[placeholder="Enter phone number"]').first().type('555-123-4567');
		
		// Add a tag
		cy.get('input[placeholder="Add a tag"]').type('VIP');
		cy.get('button').last().click();
		
		// Submit the form
		cy.contains('Create Client').click();
		
		// Should return to client list
		cy.contains('Clients').should('be.visible');
	});

	it('should search for clients', () => {
		// Search by name
		cy.get('input[placeholder="Search clients..."]').type('Sarah');
		cy.contains('Sarah Johnson').should('be.visible');
		cy.contains('Michael Chen').should('not.exist');
		
		// Clear search
		cy.get('input[placeholder="Search clients..."]').clear();
		cy.contains('Michael Chen').should('be.visible');
		
		// Search by email
		cy.get('input[placeholder="Search clients..."]').type('michael@example.com');
		cy.contains('Michael Chen').should('be.visible');
		cy.contains('Sarah Johnson').should('not.exist');
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

	it('should edit an existing client', () => {
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
		
		// Check Michael Chen's details
		cy.contains('Michael Chen').should('be.visible');
		cy.contains('michael@example.com').should('be.visible');
		cy.contains('+15559876543').should('be.visible');
		cy.contains('consultation').should('be.visible');
		cy.contains('Pending').should('be.visible');
		cy.contains('via Referral').should('be.visible');
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

	it('should validate required fields in client form', () => {
		cy.contains('Add Client').click();
		
		// Try to submit without required fields
		cy.contains('Create Client').click();
		
		// Should stay on form (browser validation)
		cy.contains('Add New Client').should('be.visible');
	});

	it('should add multiple phone numbers', () => {
		cy.contains('Add Client').click();
		
		// Add first phone
		cy.get('input[placeholder="Enter phone number"]').first().type('555-111-1111');
		
		// Add second phone
		cy.get('input[placeholder="Add another phone number"]').type('555-222-2222');
		cy.get('button').last().click();
		
		// Should have two phone inputs
		cy.get('input[placeholder="Enter phone number"]').should('have.length', 2);
	});

	it('should add and remove tags', () => {
		cy.contains('Add Client').click();
		
		// Add a tag
		cy.get('input[placeholder="Add a tag"]').type('Test Tag');
		cy.get('button').last().click();
		
		// Should see the tag
		cy.contains('Test Tag').should('be.visible');
		
		// Remove the tag
		cy.get('button').contains('×').click();
		
		// Tag should be gone
		cy.contains('Test Tag').should('not.exist');
	});
}); 