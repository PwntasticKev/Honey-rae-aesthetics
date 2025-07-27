describe('Simple Page Check', () => {
	it('should load the setup page and show content', () => {
		cy.visit('/setup')
		
		// Wait for page to load
		cy.wait(3000)
		
		// Check what's actually on the page
		cy.get('body').then(($body) => {
			cy.log('Body content:', $body.text())
		})
		
		// Take a screenshot
		cy.screenshot('setup-page-debug')
		
		// Check for any h1, h2, h3 elements
		cy.get('h1, h2, h3').then(($elements) => {
			cy.log('Found headings:', $elements.length)
			$elements.each((i, el) => {
				cy.log(`Heading ${i}:`, el.textContent)
			})
		})
		
		// Check for any buttons
		cy.get('button').then(($buttons) => {
			cy.log('Found buttons:', $buttons.length)
			$buttons.each((i, el) => {
				cy.log(`Button ${i}:`, el.textContent)
			})
		})
	})

	it('should load the main page and show content', () => {
		cy.visit('/')
		
		// Wait for page to load
		cy.wait(3000)
		
		// Check what's actually on the page
		cy.get('body').then(($body) => {
			cy.log('Body content:', $body.text())
		})
		
		// Take a screenshot
		cy.screenshot('main-page-debug')
		
		// Check for any h1, h2, h3 elements
		cy.get('h1, h2, h3').then(($elements) => {
			cy.log('Found headings:', $elements.length)
			$elements.each((i, el) => {
				cy.log(`Heading ${i}:`, el.textContent)
			})
		})
	})
}) 