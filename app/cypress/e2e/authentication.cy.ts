describe('Authentication System', () => {
	beforeEach(() => {
		// Clear localStorage before each test
		cy.clearLocalStorage();
	});

	it('should redirect to login page when not authenticated', () => {
		cy.visit('/');
		cy.url().should('include', '/login');
	});

	it('should display login page with master credentials', () => {
		cy.visit('/login');
		
		// Check login form elements
		cy.contains('Welcome Back').should('be.visible');
		cy.get('input[type="email"]').should('be.visible');
		cy.get('input[type="password"]').should('be.visible');
		cy.get('button[type="submit"]').should('contain', 'Sign In');
		
		// Check master credentials are displayed
		cy.contains('Master Login Credentials:').should('be.visible');
		cy.contains('admin@honeyrae.com').should('be.visible');
		cy.contains('master123').should('be.visible');
	});

	it('should login with master credentials', () => {
		cy.visit('/login');
		
		// Fill in master credentials
		cy.get('input[type="email"]').type('admin@honeyrae.com');
		cy.get('input[type="password"]').type('master123');
		cy.get('button[type="submit"]').click();
		
		// Should redirect to dashboard
		cy.url().should('eq', Cypress.config().baseUrl + '/');
		
		// Should show dashboard content
		cy.get('h1').should('contain', 'Honey Rae Aesthetics');
		cy.contains('Welcome back, Dr. Rae!').should('be.visible');
		cy.contains('Total Clients').should('be.visible');
	});

	it('should show error for invalid credentials', () => {
		cy.visit('/login');
		
		// Fill in invalid credentials
		cy.get('input[type="email"]').type('wrong@email.com');
		cy.get('input[type="password"]').type('wrongpassword');
		cy.get('button[type="submit"]').click();
		
		// Should show error message
		cy.contains('Invalid email or password').should('be.visible');
		
		// Should stay on login page
		cy.url().should('include', '/login');
	});

	it('should logout and redirect to login', () => {
		// Login first
		cy.visit('/login');
		cy.get('input[type="email"]').type('admin@honeyrae.com');
		cy.get('input[type="password"]').type('master123');
		cy.get('button[type="submit"]').click();
		
		// Verify we're on dashboard
		cy.url().should('eq', Cypress.config().baseUrl + '/');
		
		// Click logout button
		cy.get('button[title="Logout"]').click();
		
		// Should redirect to login page
		cy.url().should('include', '/login');
	});

	it('should persist login state across page reloads', () => {
		// Login first
		cy.visit('/login');
		cy.get('input[type="email"]').type('admin@honeyrae.com');
		cy.get('input[type="password"]').type('master123');
		cy.get('button[type="submit"]').click();
		
		// Verify we're on dashboard
		cy.url().should('eq', Cypress.config().baseUrl + '/');
		
		// Reload the page
		cy.reload();
		
		// Should still be on dashboard
		cy.url().should('eq', Cypress.config().baseUrl + '/');
		cy.contains('Welcome back, Dr. Rae!').should('be.visible');
	});

	it('should show user email in avatar', () => {
		// Login first
		cy.visit('/login');
		cy.get('input[type="email"]').type('admin@honeyrae.com');
		cy.get('input[type="password"]').type('master123');
		cy.get('button[type="submit"]').click();
		
		// Check avatar shows user initial
		cy.contains('A').should('be.visible');
	});

	it('should display dashboard stats after login', () => {
		// Login first
		cy.visit('/login');
		cy.get('input[type="email"]').type('admin@honeyrae.com');
		cy.get('input[type="password"]').type('master123');
		cy.get('button[type="submit"]').click();
		
		// Check dashboard stats
		cy.contains('Total Clients').should('be.visible');
		cy.contains("Today's Appointments").should('be.visible');
		cy.contains('Messages Sent').should('be.visible');
		cy.contains('Photos Uploaded').should('be.visible');
		
		// Check navigation
		cy.get('[data-testid="sidebar"]').should('be.visible');
	});

	it('should show loading state during authentication check', () => {
		cy.visit('/');
		
		// Should show loading spinner briefly
		cy.contains('Loading...').should('be.visible');
		
		// Then redirect to login
		cy.url().should('include', '/login');
	});
}); 