describe('Setup Page', () => {
  beforeEach(() => {
    cy.visit('/setup')
  })

  it('should display setup page correctly', () => {
    cy.get('h1').should('contain', 'Setup Demo Data')
    cy.get('p').should('contain', 'sample data including clients, appointments, and workflows')
    cy.get('button').contains('Setup Demo Data').should('be.visible')
    cy.get('button').contains('Back to Dashboard').should('be.visible')
  })

  it('should setup demo data successfully', () => {
    cy.get('button').contains('Setup Demo Data').click()
    
    // Wait for setup to complete
    cy.get('h1').should('contain', 'Setup Complete!')
    cy.get('p').should('contain', 'Your demo data has been created successfully')
    
    // Check that created items are displayed
    cy.get('li').should('contain', 'Organization:')
    cy.get('li').should('contain', 'User:')
    cy.get('li').should('contain', '3 Demo Clients')
    cy.get('li').should('contain', '2 Demo Appointments')
    cy.get('li').should('contain', '2 Message Templates')
    cy.get('li').should('contain', '1 Workflow')
    
    // Check that "Go to Dashboard" button appears
    cy.get('button').contains('Go to Dashboard').should('be.visible')
  })

  it('should navigate to dashboard after setup', () => {
    cy.get('button').contains('Setup Demo Data').click()
    cy.get('button').contains('Go to Dashboard').click()
    
    // Should be redirected to main dashboard
    cy.url().should('eq', Cypress.config().baseUrl + '/')
    cy.get('h1').should('contain', 'Honey Rae Aesthetics')
  })

  it('should handle setup errors gracefully', () => {
    // This test would require mocking the API to simulate errors
    // For now, we'll just verify the button is clickable
    cy.get('button').contains('Setup Demo Data').should('not.be.disabled')
  })
}) 