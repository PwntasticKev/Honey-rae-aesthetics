describe('Basic Page Access', () => {
  it('should access test page', () => {
    cy.visit('/test')
    cy.get('h1').should('contain', 'Honey Rae Aesthetics - Test Page')
    cy.get('h2').should('contain', 'Application Status')
  })

  it('should access setup page', () => {
    cy.visit('/setup')
    cy.get('h1').should('contain', 'Setup Demo Data')
    cy.get('button').contains('Setup Demo Data').should('be.visible')
  })

  it('should access main dashboard', () => {
    cy.visit('/')
    cy.get('h1').should('contain', 'Honey Rae Aesthetics')
    cy.get('nav').should('contain', 'Clients')
    cy.get('nav').should('contain', 'Appointments')
  })
}) 