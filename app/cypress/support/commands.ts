/// <reference types="cypress" />

export {}

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      /**
       * Custom command to setup demo data
       * @example cy.setupDemoData()
       */
      setupDemoData(): Chainable<void>
      
      /**
       * Custom command to add a new client
       * @example cy.addClient({ fullName: 'John Doe', email: 'john@example.com' })
       */
      addClient(clientData: {
        fullName: string
        email?: string
        phones?: string[]
        gender?: 'male' | 'female' | 'other'
      }): Chainable<void>
      
      /**
       * Custom command to schedule an appointment
       * @example cy.scheduleAppointment({ clientName: 'John Doe', type: 'Consultation' })
       */
      scheduleAppointment(appointmentData: {
        clientName: string
        type: string
        provider?: string
        date?: string
        time?: string
      }): Chainable<void>
    }
  }
}

// Setup demo data
Cypress.Commands.add('setupDemoData', () => {
  cy.visit('/setup')
  cy.get('button').contains('Setup Demo Data').click()
  cy.get('button').contains('Go to Dashboard').click()
})

// Add a new client
Cypress.Commands.add('addClient', (clientData: {
  fullName: string
  email?: string
  phones?: string[]
  gender?: 'male' | 'female' | 'other'
}) => {
  cy.visit('/')
  cy.get('[data-testid="clients-tab"]').click()
  cy.get('button').contains('Add Client').click()
  
  // Fill in client form
  cy.get('input[name="fullName"]').type(clientData.fullName)
  if (clientData.email) {
    cy.get('input[name="email"]').type(clientData.email)
  }
  if (clientData.phones && clientData.phones.length > 0) {
    cy.get('input[name="phones.0"]').type(clientData.phones[0])
  }
  if (clientData.gender) {
    cy.get(`input[value="${clientData.gender}"]`).check()
  }
  
  cy.get('button[type="submit"]').click()
})

// Schedule an appointment
Cypress.Commands.add('scheduleAppointment', (appointmentData: {
  clientName: string
  type: string
  provider?: string
  date?: string
  time?: string
}) => {
  cy.visit('/')
  cy.get('[data-testid="appointments-tab"]').click()
  cy.get('button').contains('Schedule Appointment').click()
  
  // Select client
  cy.get('select[name="clientId"]').select(appointmentData.clientName)
  
  // Fill appointment details
  cy.get('select[name="type"]').select(appointmentData.type)
  if (appointmentData.provider) {
    cy.get('select[name="provider"]').select(appointmentData.provider)
  }
  
  // Set date and time
  if (appointmentData.date) {
    cy.get('input[type="date"]').type(appointmentData.date)
  }
  if (appointmentData.time) {
    cy.get('input[type="time"]').type(appointmentData.time)
  }
  
  cy.get('button[type="submit"]').click()
}) 