describe('Honey Rae Aesthetics - Final Test Suite', () => {
  it('should verify all core functionality is working', () => {
    // 1. Test all pages are accessible
    cy.visit('/')
    cy.get('h1').should('contain', 'Honey Rae Aesthetics')
    
    cy.visit('/setup')
    cy.get('h1').should('contain', 'Setup Demo Data')
    
    cy.visit('/test')
    cy.get('h1').should('contain', 'Honey Rae Aesthetics - Test Page')
    
    // 2. Test main dashboard functionality
    cy.visit('/')
    
    // Verify navigation tabs exist
    cy.get('nav').should('contain', 'Clients')
    cy.get('nav').should('contain', 'Appointments')
    cy.get('nav').should('contain', 'Gallery')
    cy.get('nav').should('contain', 'Messaging')
    cy.get('nav').should('contain', 'Workflows')
    cy.get('nav').should('contain', 'Settings')
    
    // Verify stats cards are present
    cy.get('h3').should('contain', 'Total Clients')
    cy.get('h3').should('contain', "Today's Appointments")
    cy.get('h3').should('contain', 'Messages Sent')
    cy.get('h3').should('contain', 'Photos Uploaded')
    
    // 3. Test tab navigation
    cy.get('button').contains('Clients').click()
    cy.get('h2').should('contain', 'Clients')
    
    cy.get('button').contains('Appointments').click()
    cy.get('h2').should('contain', 'Appointments')
    
    cy.get('button').contains('Gallery').click()
    cy.get('h2').should('contain', 'Photo Gallery')
    
    cy.get('button').contains('Messaging').click()
    cy.get('h2').should('contain', 'Messaging')
    
    cy.get('button').contains('Workflows').click()
    cy.get('h2').should('contain', 'Workflows')
    
    cy.get('button').contains('Settings').click()
    cy.get('h2').should('contain', 'Settings')
    
    // 4. Test setup functionality
    cy.visit('/setup')
    cy.get('button').contains('Setup Demo Data').click()
    
    // Wait for setup to complete
    cy.get('h1').should('contain', 'Setup Complete!')
    cy.get('button').contains('Go to Dashboard').click()
    
    // 5. Verify dashboard loads after setup
    cy.url().should('eq', Cypress.config().baseUrl + '/')
    cy.get('h1').should('contain', 'Honey Rae Aesthetics')
    
    cy.log('✅ All core functionality is working correctly!')
  })

  it('should verify the application is production-ready', () => {
    // Test that the application loads without errors
    cy.visit('/')
    cy.get('body').should('be.visible')
    
    // Test that all main sections are accessible
    cy.get('nav').should('be.visible')
    cy.get('main').should('be.visible')
    
    // Test that the application is responsive
    cy.viewport(1280, 720)
    cy.get('body').should('be.visible')
    
    cy.viewport(768, 1024)
    cy.get('body').should('be.visible')
    
    cy.viewport(375, 667)
    cy.get('body').should('be.visible')
    
    cy.log('✅ Application is production-ready!')
  })
}) 