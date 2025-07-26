describe('Honey Rae Aesthetics Dashboard', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should display the main dashboard with all tabs', () => {
    // Check header
    cy.get('h1').should('contain', 'Honey Rae Aesthetics')
    
    // Check all tabs are present
    cy.get('nav').should('contain', 'Clients')
    cy.get('nav').should('contain', 'Appointments')
    cy.get('nav').should('contain', 'Gallery')
    cy.get('nav').should('contain', 'Messaging')
    cy.get('nav').should('contain', 'Workflows')
    cy.get('nav').should('contain', 'Settings')
  })

  it('should display quick stats', () => {
    // Check stats cards are present
    cy.get('h3').should('contain', 'Total Clients')
    cy.get('h3').should('contain', "Today's Appointments")
    cy.get('h3').should('contain', 'Messages Sent')
    cy.get('h3').should('contain', 'Photos Uploaded')
  })

  it('should navigate between tabs', () => {
    // Test Clients tab
    cy.get('button').contains('Clients').click()
    cy.get('h2').should('contain', 'Clients')
    
    // Test Appointments tab
    cy.get('button').contains('Appointments').click()
    cy.get('h2').should('contain', 'Appointments')
    
    // Test Gallery tab
    cy.get('button').contains('Gallery').click()
    cy.get('h2').should('contain', 'Photo Gallery')
    
    // Test Messaging tab
    cy.get('button').contains('Messaging').click()
    cy.get('h2').should('contain', 'Messaging')
    
    // Test Workflows tab
    cy.get('button').contains('Workflows').click()
    cy.get('h2').should('contain', 'Workflows')
    
    // Test Settings tab
    cy.get('button').contains('Settings').click()
    cy.get('h2').should('contain', 'Settings')
  })

  it('should have working search functionality', () => {
    cy.get('input[placeholder*="Search"]').should('be.visible')
    cy.get('input[placeholder*="Search"]').type('test search')
    cy.get('input[placeholder*="Search"]').should('have.value', 'test search')
  })

  it('should display user profile section', () => {
    cy.get('.w-8.h-8').should('be.visible') // User avatar
    cy.get('button').contains('Bell').should('be.visible') // Notifications
  })
}) 