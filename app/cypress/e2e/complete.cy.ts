describe('Complete Platform Test', () => {
  it('should setup demo data and test all functionality', () => {
    // 1. Start with setup page
    cy.visit('/setup')
    cy.get('h1').should('contain', 'Setup Demo Data')
    cy.get('button').contains('Setup Demo Data').click()
    
    // Wait for setup to complete
    cy.get('h1').should('contain', 'Setup Complete!')
    cy.get('button').contains('Go to Dashboard').click()

    // 2. Verify dashboard loads
    cy.url().should('eq', Cypress.config().baseUrl + '/')
    cy.get('h1').should('contain', 'Honey Rae Aesthetics')
    
    // Check all tabs are present
    cy.get('nav').should('contain', 'Clients')
    cy.get('nav').should('contain', 'Appointments')
    cy.get('nav').should('contain', 'Gallery')
    cy.get('nav').should('contain', 'Messaging')
    cy.get('nav').should('contain', 'Workflows')
    cy.get('nav').should('contain', 'Settings')

    // 3. Test Client Management
    cy.get('button').contains('Clients').click()
    cy.get('h2').should('contain', 'Clients')
    
    // Check demo clients are loaded
    cy.get('table').should('contain', 'Sarah Johnson')
    cy.get('table').should('contain', 'Michael Chen')
    cy.get('table').should('contain', 'Emily Rodriguez')
    
    // Test adding a new client
    cy.get('button').contains('Add Client').click()
    cy.get('input[name="fullName"]').type('Test Client')
    cy.get('input[name="email"]').type('test@example.com')
    cy.get('input[name="phones.0"]').type('(555) 999-8888')
    cy.get('input[value="female"]').check()
    cy.get('button[type="submit"]').click()
    
    // Verify client was added
    cy.get('table').should('contain', 'Test Client')
    
    // Test client search
    cy.get('input[placeholder*="Search"]').type('Test Client')
    cy.get('table').should('contain', 'Test Client')
    cy.get('table').should('not.contain', 'Sarah Johnson')

    // 4. Test Appointment Management
    cy.get('button').contains('Appointments').click()
    cy.get('button').contains('Schedule Appointment').should('be.visible')
    
    // Check demo appointments are loaded
    cy.get('table').should('contain', 'Botox Treatment')
    cy.get('table').should('contain', 'Consultation')
    
    // Test scheduling a new appointment
    cy.get('button').contains('Schedule Appointment').click()
    cy.get('select[name="clientId"]').select('Test Client')
    cy.get('select[name="type"]').select('Consultation')
    cy.get('select[name="provider"]').select('Dr. Kevin Rae')
    
    // Set date (tomorrow)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    cy.get('input[type="date"]').type(dateString)
    cy.get('input[type="time"]').type('15:00')
    cy.get('textarea[name="notes"]').type('Test appointment')
    cy.get('button[type="submit"]').click()
    
    // Verify appointment was scheduled
    cy.get('table').should('contain', 'Test Client')
    cy.get('table').should('contain', 'Consultation')

    // 5. Test Other Tabs
    cy.get('button').contains('Gallery').click()
    cy.get('h2').should('contain', 'Photo Gallery')
    cy.get('button').contains('Upload Photos').should('be.visible')
    
    cy.get('button').contains('Messaging').click()
    cy.get('h2').should('contain', 'Messaging')
    cy.get('button').contains('Send Message').should('be.visible')
    
    cy.get('button').contains('Workflows').click()
    cy.get('h2').should('contain', 'Workflows')
    cy.get('button').contains('Create Workflow').should('be.visible')
    
    cy.get('button').contains('Settings').click()
    cy.get('h2').should('contain', 'Settings')
    cy.get('h3').should('contain', 'Organization Settings')

    // 6. Test Stats Display
    cy.get('h3').should('contain', 'Total Clients')
    cy.get('h3').should('contain', "Today's Appointments")
    cy.get('h3').should('contain', 'Messages Sent')
    cy.get('h3').should('contain', 'Photos Uploaded')

    cy.log('✅ Complete platform test passed! All functionality is working.')
  })
}) 