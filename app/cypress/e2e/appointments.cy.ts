describe('Appointment Management', () => {
  beforeEach(() => {
    cy.visit('/')
    // Setup demo data first
    cy.visit('/setup')
    cy.get('button').contains('Setup Demo Data').click()
    cy.get('button').contains('Go to Dashboard').click()
    cy.get('button').contains('Appointments').click()
  })

  it('should display appointments tab correctly', () => {
    cy.get('button').contains('Schedule Appointment').should('be.visible')
    cy.get('input[placeholder*="Search"]').should('be.visible')
  })

  it('should show demo appointments after setup', () => {
    // Should show the demo appointments created during setup
    cy.get('table').should('contain', 'Botox Treatment')
    cy.get('table').should('contain', 'Consultation')
    cy.get('table').should('contain', 'Dr. Kevin Rae')
  })

  it('should open schedule appointment modal', () => {
    cy.get('button').contains('Schedule Appointment').click()
    cy.get('h2').should('contain', 'Schedule New Appointment')
    cy.get('select[name="clientId"]').should('be.visible')
    cy.get('select[name="type"]').should('be.visible')
  })

  it('should schedule a new appointment successfully', () => {
    cy.get('button').contains('Schedule Appointment').click()
    
    // Select client
    cy.get('select[name="clientId"]').select('Sarah Johnson')
    
    // Fill appointment details
    cy.get('select[name="type"]').select('Consultation')
    cy.get('select[name="provider"]').select('Dr. Kevin Rae')
    
    // Set date (tomorrow)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    cy.get('input[type="date"]').type(dateString)
    
    // Set time
    cy.get('input[type="time"]').type('14:00')
    
    // Add notes
    cy.get('textarea[name="notes"]').type('Initial consultation for new client')
    
    // Submit form
    cy.get('button[type="submit"]').click()
    
    // Modal should close
    cy.get('h2').should('not.contain', 'Schedule New Appointment')
    
    // New appointment should appear in list
    cy.get('table').should('contain', 'Consultation')
    cy.get('table').should('contain', 'Sarah Johnson')
  })

  it('should search for appointments', () => {
    cy.get('input[placeholder*="Search"]').type('Botox')
    cy.get('table').should('contain', 'Botox Treatment')
    cy.get('table').should('not.contain', 'Consultation')
  })

  it('should filter appointments by status', () => {
    // Test status filtering
    cy.get('select').first().select('scheduled')
    cy.get('table').should('contain', 'scheduled')
  })

  it('should edit an appointment', () => {
    // Click edit button on first appointment
    cy.get('table').find('button').contains('Edit').first().click()
    
    // Modal should open with appointment data
    cy.get('h2').should('contain', 'Edit Appointment')
    
    // Update appointment type
    cy.get('select[name="type"]').select('Follow-up')
    cy.get('button[type="submit"]').click()
    
    // Updated type should appear
    cy.get('table').should('contain', 'Follow-up')
  })

  it('should delete an appointment', () => {
    // Count initial appointments
    cy.get('table tbody tr').then(($rows) => {
      const initialCount = $rows.length
      
      // Click delete button on first appointment
      cy.get('table').find('button').contains('Delete').first().click()
      
      // Confirm deletion
      cy.on('window:confirm', () => true)
      
      // Appointment should be removed
      cy.get('table tbody tr').should('have.length', initialCount - 1)
    })
  })

  it('should display appointment details correctly', () => {
    cy.get('table').should('contain', 'Sarah Johnson')
    cy.get('table').should('contain', 'Botox Treatment')
    cy.get('table').should('contain', 'Dr. Kevin Rae')
    cy.get('table').should('contain', 'scheduled')
  })

  it('should show appointment count', () => {
    cy.get('.text-sm.text-gray-600').should('contain', 'appointments')
  })

  it('should handle form validation', () => {
    cy.get('button').contains('Schedule Appointment').click()
    
    // Try to submit without required fields
    cy.get('button[type="submit"]').click()
    
    // Should show validation errors
    cy.get('p').should('contain', 'Please select a client')
  })

  it('should display empty state when no appointments', () => {
    // Delete all appointments first
    cy.get('table tbody tr').each(($row) => {
      cy.wrap($row).find('button').contains('Delete').click()
      cy.on('window:confirm', () => true)
    })
    
    // Should show empty state
    cy.get('h3').should('contain', 'No appointments scheduled')
    cy.get('p').should('contain', 'Schedule your first appointment')
  })
}) 