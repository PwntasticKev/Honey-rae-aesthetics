describe('Honey Rae Aesthetics - Summary Test', () => {
  it('should verify all pages are accessible and functional', () => {
    // Test main dashboard
    cy.visit('/')
    cy.get('h1').should('contain', 'Honey Rae Aesthetics')
    
    // Verify all navigation tabs are present
    const expectedTabs = ['Clients', 'Appointments', 'Gallery', 'Messaging', 'Workflows', 'Settings']
    expectedTabs.forEach(tab => {
      cy.get('nav').should('contain', tab)
    })
    
    // Test setup page
    cy.visit('/setup')
    cy.get('h1').should('contain', 'Setup Demo Data')
    cy.get('button').contains('Setup Demo Data').should('be.visible')
    cy.get('button').contains('Back to Dashboard').should('be.visible')
    
    // Test test page
    cy.visit('/test')
    cy.get('h1').should('contain', 'Honey Rae Aesthetics - Test Page')
    cy.get('h2').should('contain', 'Application Status')
    
    // Verify the application is working correctly
    cy.log('✅ All pages are accessible and functional!')
  })

  it('should verify the application structure', () => {
    cy.visit('/')
    
    // Check for key UI elements
    cy.get('h1').should('contain', 'Honey Rae Aesthetics')
    cy.get('nav').should('be.visible')
    cy.get('button').contains('Bell').should('be.visible') // Notifications
    
    // Check for stats cards
    cy.get('h3').should('contain', 'Total Clients')
    cy.get('h3').should('contain', "Today's Appointments")
    cy.get('h3').should('contain', 'Messages Sent')
    cy.get('h3').should('contain', 'Photos Uploaded')
    
    // Check for search functionality
    cy.get('input[placeholder*="Search"]').should('be.visible')
    
    cy.log('✅ Application structure is correct!')
  })

  it('should verify navigation between tabs', () => {
    cy.visit('/')
    
    // Test each tab navigation
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
    
    cy.log('✅ All tab navigation is working!')
  })
}) 