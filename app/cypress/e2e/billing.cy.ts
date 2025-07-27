describe('Billing and Subscription Management', () => {
	beforeEach(() => {
		cy.visit('/setup')
		cy.get('button').contains('Setup Demo Data').click()
		cy.get('button').contains('Go to Dashboard').click()
		cy.url().should('eq', Cypress.config().baseUrl + '/')
	})

	describe('Billing Dashboard', () => {
		it('should display billing section', () => {
			cy.visit('/')
			cy.get('button').contains('Billing').click()
			
			cy.get('h2').should('contain', 'Billing')
			cy.get('h3').should('contain', 'Current Plan')
		})

		it('should show current subscription details', () => {
			cy.visit('/')
			cy.get('button').contains('Billing').click()
			
			cy.get('[data-testid="current-plan"]').should('contain', 'Starter')
			cy.get('[data-testid="plan-price"]').should('be.visible')
			cy.get('[data-testid="billing-cycle"]').should('be.visible')
		})

		it('should display usage metrics', () => {
			cy.visit('/')
			cy.get('button').contains('Billing').click()
			
			cy.get('h3').should('contain', 'Usage This Month')
			cy.get('[data-testid="clients-used"]').should('be.visible')
			cy.get('[data-testid="storage-used"]').should('be.visible')
			cy.get('[data-testid="messages-used"]').should('be.visible')
		})
	})

	describe('Plan Management', () => {
		it('should display available plans', () => {
			cy.visit('/')
			cy.get('button').contains('Billing').click()
			
			cy.get('button').contains('Change Plan').click()
			cy.get('[data-testid="plan-card"]').should('have.length', 3) // Starter, Professional, Enterprise
		})

		it('should upgrade to a higher plan', () => {
			cy.visit('/')
			cy.get('button').contains('Billing').click()
			
			cy.get('button').contains('Change Plan').click()
			cy.get('[data-testid="plan-card"]').contains('Professional').parent().find('button').contains('Upgrade').click()
			
			// This would typically open Stripe checkout
			cy.get('[data-testid="stripe-checkout"]').should('be.visible')
		})

		it('should downgrade to a lower plan', () => {
			cy.visit('/')
			cy.get('button').contains('Billing').click()
			
			cy.get('button').contains('Change Plan').click()
			cy.get('[data-testid="plan-card"]').contains('Starter').parent().find('button').contains('Downgrade').click()
			
			cy.get('button').contains('Confirm Downgrade').click()
			cy.get('[data-testid="success-message"]').should('contain', 'Plan updated successfully')
		})

		it('should show plan comparison', () => {
			cy.visit('/')
			cy.get('button').contains('Billing').click()
			
			cy.get('button').contains('Compare Plans').click()
			cy.get('[data-testid="plan-comparison-table"]').should('be.visible')
		})
	})

	describe('Payment Management', () => {
		it('should display payment methods', () => {
			cy.visit('/')
			cy.get('button').contains('Billing').click()
			
			cy.get('h3').should('contain', 'Payment Methods')
			cy.get('[data-testid="payment-method"]').should('be.visible')
		})

		it('should add a new payment method', () => {
			cy.visit('/')
			cy.get('button').contains('Billing').click()
			
			cy.get('button').contains('Add Payment Method').click()
			cy.get('[data-testid="stripe-card-element"]').should('be.visible')
			
			// Note: Actual Stripe integration would require test card numbers
		})

		it('should remove a payment method', () => {
			cy.visit('/')
			cy.get('button').contains('Billing').click()
			
			cy.get('[data-testid="payment-method"]').first().find('button').contains('Remove').click()
			cy.get('button').contains('Confirm').click()
			
			cy.get('[data-testid="success-message"]').should('contain', 'Payment method removed')
		})

		it('should set default payment method', () => {
			cy.visit('/')
			cy.get('button').contains('Billing').click()
			
			cy.get('[data-testid="payment-method"]').first().find('button').contains('Set Default').click()
			cy.get('[data-testid="success-message"]').should('contain', 'Default payment method updated')
		})
	})

	describe('Invoice Management', () => {
		it('should display invoice history', () => {
			cy.visit('/')
			cy.get('button').contains('Billing').click()
			
			cy.get('h3').should('contain', 'Invoice History')
			cy.get('[data-testid="invoice-item"]').should('be.visible')
		})

		it('should download an invoice', () => {
			cy.visit('/')
			cy.get('button').contains('Billing').click()
			
			cy.get('[data-testid="invoice-item"]').first().find('button').contains('Download').click()
			
			// Verify download started
			cy.readFile('cypress/downloads/invoice.pdf').should('exist')
		})

		it('should view invoice details', () => {
			cy.visit('/')
			cy.get('button').contains('Billing').click()
			
			cy.get('[data-testid="invoice-item"]').first().click()
			cy.get('[data-testid="invoice-details"]').should('be.visible')
			cy.get('[data-testid="invoice-amount"]').should('be.visible')
		})
	})

	describe('Usage Monitoring', () => {
		it('should show usage alerts', () => {
			cy.visit('/')
			cy.get('button').contains('Billing').click()
			
			// Simulate high usage
			cy.get('[data-testid="usage-alert"]').should('be.visible')
			cy.get('[data-testid="usage-alert"]').should('contain', 'You are approaching your limit')
		})

		it('should display usage graphs', () => {
			cy.visit('/')
			cy.get('button').contains('Billing').click()
			
			cy.get('[data-testid="usage-chart"]').should('be.visible')
			cy.get('[data-testid="usage-chart"]').should('contain', 'Clients')
			cy.get('[data-testid="usage-chart"]').should('contain', 'Storage')
			cy.get('[data-testid="usage-chart"]').should('contain', 'Messages')
		})

		it('should show usage breakdown by feature', () => {
			cy.visit('/')
			cy.get('button').contains('Billing').click()
			
			cy.get('button').contains('Usage Details').click()
			cy.get('[data-testid="feature-usage"]').should('be.visible')
		})
	})

	describe('Billing Settings', () => {
		it('should update billing information', () => {
			cy.visit('/')
			cy.get('button').contains('Billing').click()
			
			cy.get('button').contains('Billing Settings').click()
			cy.get('input[name="companyName"]').clear().type('Updated Company Name')
			cy.get('input[name="taxId"]').clear().type('12-3456789')
			cy.get('button[type="submit"]').click()
			
			cy.get('[data-testid="success-message"]').should('contain', 'Billing information updated')
		})

		it('should set up automatic billing', () => {
			cy.visit('/')
			cy.get('button').contains('Billing').click()
			
			cy.get('button').contains('Billing Settings').click()
			cy.get('input[name="autoBilling"]').check()
			cy.get('button[type="submit"]').click()
			
			cy.get('[data-testid="success-message"]').should('contain', 'Automatic billing enabled')
		})

		it('should configure billing notifications', () => {
			cy.visit('/')
			cy.get('button').contains('Billing').click()
			
			cy.get('button').contains('Billing Settings').click()
			cy.get('input[name="billingNotifications"]').check()
			cy.get('input[name="usageAlerts"]').check()
			cy.get('button[type="submit"]').click()
			
			cy.get('[data-testid="success-message"]').should('contain', 'Notification settings updated')
		})
	})

	describe('Subscription Cancellation', () => {
		it('should cancel subscription', () => {
			cy.visit('/')
			cy.get('button').contains('Billing').click()
			
			cy.get('button').contains('Cancel Subscription').click()
			cy.get('textarea[name="reason"]').type('Testing cancellation')
			cy.get('button').contains('Confirm Cancellation').click()
			
			cy.get('[data-testid="success-message"]').should('contain', 'Subscription cancelled')
		})

		it('should reactivate cancelled subscription', () => {
			cy.visit('/')
			cy.get('button').contains('Billing').click()
			
			cy.get('button').contains('Reactivate Subscription').click()
			cy.get('button').contains('Confirm Reactivation').click()
			
			cy.get('[data-testid="success-message"]').should('contain', 'Subscription reactivated')
		})
	})

	describe('Enterprise Features', () => {
		it('should display enterprise plan features', () => {
			cy.visit('/')
			cy.get('button').contains('Billing').click()
			
			cy.get('button').contains('Change Plan').click()
			cy.get('[data-testid="plan-card"]').contains('Enterprise').click()
			
			cy.get('[data-testid="enterprise-features"]').should('contain', 'Unlimited Clients')
			cy.get('[data-testid="enterprise-features"]').should('contain', 'Priority Support')
			cy.get('[data-testid="enterprise-features"]').should('contain', 'Custom Integrations')
		})

		it('should request enterprise quote', () => {
			cy.visit('/')
			cy.get('button').contains('Billing').click()
			
			cy.get('button').contains('Change Plan').click()
			cy.get('[data-testid="plan-card"]').contains('Enterprise').parent().find('button').contains('Contact Sales').click()
			
			cy.get('input[name="companyName"]').type('Test Enterprise')
			cy.get('input[name="contactName"]').type('John Doe')
			cy.get('input[name="email"]').type('john@enterprise.com')
			cy.get('textarea[name="requirements"]').type('We need enterprise features')
			cy.get('button[type="submit"]').click()
			
			cy.get('[data-testid="success-message"]').should('contain', 'Quote request submitted')
		})
	})
}) 