describe('Social Media Management', () => {
	beforeEach(() => {
		cy.visit('/setup')
		cy.get('button').contains('Setup Demo Data').click()
		cy.get('button').contains('Go to Dashboard').click()
		cy.url().should('eq', Cypress.config().baseUrl + '/')
	})

	describe('Social Media Dashboard', () => {
		it('should display social media management section', () => {
			cy.visit('/')
			cy.get('button').contains('Social Media').click()
			
			cy.get('h2').should('contain', 'Social Media')
			cy.get('button').contains('Create Post').should('be.visible')
		})

		it('should show connected platforms', () => {
			cy.visit('/')
			cy.get('button').contains('Social Media').click()
			
			cy.get('h3').should('contain', 'Connected Platforms')
			cy.get('[data-testid="platform-item"]').should('contain', 'Instagram')
			cy.get('[data-testid="platform-item"]').should('contain', 'Facebook')
			cy.get('[data-testid="platform-item"]').should('contain', 'TikTok')
		})

		it('should display scheduled posts', () => {
			cy.visit('/')
			cy.get('button').contains('Social Media').click()
			
			cy.get('h3').should('contain', 'Scheduled Posts')
			cy.get('[data-testid="scheduled-post"]').should('be.visible')
		})
	})

	describe('Post Creation', () => {
		it('should create a new social media post', () => {
			cy.visit('/')
			cy.get('button').contains('Social Media').click()
			
			// Create post
			cy.get('button').contains('Create Post').click()
			cy.get('textarea[name="content"]').type('Amazing results from our latest treatment! #aesthetics #beauty')
			cy.get('input[name="platforms"]').check(['instagram', 'facebook'])
			
			// Schedule for tomorrow
			const tomorrow = new Date()
			tomorrow.setDate(tomorrow.getDate() + 1)
			const dateString = tomorrow.toISOString().split('T')[0]
			cy.get('input[type="date"]').type(dateString)
			cy.get('input[type="time"]').type('10:00')
			
			cy.get('button[type="submit"]').click()
			
			// Verify post was created
			cy.get('[data-testid="scheduled-post"]').should('contain', 'Amazing results')
		})

		it('should upload images for posts', () => {
			cy.visit('/')
			cy.get('button').contains('Social Media').click()
			
			cy.get('button').contains('Create Post').click()
			
			// Test image upload
			cy.get('[data-testid="image-upload"]').click()
			cy.get('[data-testid="dropzone"]').should('be.visible')
			
			// Note: Actual file upload would require file fixtures
		})

		it('should preview posts for different platforms', () => {
			cy.visit('/')
			cy.get('button').contains('Social Media').click()
			
			cy.get('button').contains('Create Post').click()
			cy.get('textarea[name="content"]').type('Test post content')
			
			// Check platform previews
			cy.get('[data-testid="instagram-preview"]').should('be.visible')
			cy.get('[data-testid="facebook-preview"]').should('be.visible')
			cy.get('[data-testid="tiktok-preview"]').should('be.visible')
		})
	})

	describe('Post Management', () => {
		it('should edit scheduled posts', () => {
			cy.visit('/')
			cy.get('button').contains('Social Media').click()
			
			// Edit a scheduled post
			cy.get('[data-testid="scheduled-post"]').first().find('button').contains('Edit').click()
			cy.get('textarea[name="content"]').clear().type('Updated post content')
			cy.get('button[type="submit"]').click()
			
			// Verify changes
			cy.get('[data-testid="scheduled-post"]').should('contain', 'Updated post content')
		})

		it('should delete scheduled posts', () => {
			cy.visit('/')
			cy.get('button').contains('Social Media').click()
			
			// Delete a scheduled post
			cy.get('[data-testid="scheduled-post"]').first().find('button').contains('Delete').click()
			cy.get('button').contains('Confirm').click()
			
			// Verify post was deleted
			cy.get('[data-testid="scheduled-post"]').should('have.length', 0)
		})

		it('should reschedule posts', () => {
			cy.visit('/')
			cy.get('button').contains('Social Media').click()
			
			// Reschedule a post
			cy.get('[data-testid="scheduled-post"]').first().find('button').contains('Reschedule').click()
			
			const newDate = new Date()
			newDate.setDate(newDate.getDate() + 2)
			const dateString = newDate.toISOString().split('T')[0]
			cy.get('input[type="date"]').clear().type(dateString)
			cy.get('input[type="time"]').clear().type('14:00')
			cy.get('button[type="submit"]').click()
			
			// Verify rescheduling
			cy.get('[data-testid="scheduled-post"]').should('contain', '14:00')
		})
	})

	describe('Analytics and Performance', () => {
		it('should display post performance metrics', () => {
			cy.visit('/')
			cy.get('button').contains('Social Media').click()
			
			cy.get('h3').should('contain', 'Performance Analytics')
			cy.get('[data-testid="engagement-rate"]').should('be.visible')
			cy.get('[data-testid="reach-count"]').should('be.visible')
		})

		it('should show best performing content', () => {
			cy.visit('/')
			cy.get('button').contains('Social Media').click()
			
			cy.get('h3').should('contain', 'Top Performing Posts')
			cy.get('[data-testid="top-post"]').should('be.visible')
		})

		it('should display platform-specific metrics', () => {
			cy.visit('/')
			cy.get('button').contains('Social Media').click()
			
			cy.get('[data-testid="instagram-metrics"]').should('be.visible')
			cy.get('[data-testid="facebook-metrics"]').should('be.visible')
			cy.get('[data-testid="tiktok-metrics"]').should('be.visible')
		})
	})

	describe('Content Calendar', () => {
		it('should display content calendar view', () => {
			cy.visit('/')
			cy.get('button').contains('Social Media').click()
			
			cy.get('button').contains('Calendar View').click()
			cy.get('[data-testid="content-calendar"]').should('be.visible')
		})

		it('should show scheduled posts on calendar', () => {
			cy.visit('/')
			cy.get('button').contains('Social Media').click()
			
			cy.get('button').contains('Calendar View').click()
			cy.get('[data-testid="calendar-event"]').should('be.visible')
		})

		it('should allow drag and drop rescheduling', () => {
			cy.visit('/')
			cy.get('button').contains('Social Media').click()
			
			cy.get('button').contains('Calendar View').click()
			
			// Test drag and drop (this would require more complex setup)
			cy.get('[data-testid="calendar-event"]').should('be.visible')
		})
	})

	describe('Hashtag Management', () => {
		it('should suggest relevant hashtags', () => {
			cy.visit('/')
			cy.get('button').contains('Social Media').click()
			
			cy.get('button').contains('Create Post').click()
			cy.get('textarea[name="content"]').type('Botox treatment results')
			
			cy.get('button').contains('Suggest Hashtags').click()
			cy.get('[data-testid="hashtag-suggestion"]').should('contain', '#botox')
			cy.get('[data-testid="hashtag-suggestion"]').should('contain', '#aesthetics')
		})

		it('should save hashtag collections', () => {
			cy.visit('/')
			cy.get('button').contains('Social Media').click()
			
			cy.get('button').contains('Hashtag Collections').click()
			cy.get('button').contains('Create Collection').click()
			cy.get('input[name="name"]').type('Aesthetics Collection')
			cy.get('textarea[name="hashtags"]').type('#botox #aesthetics #beauty #skincare')
			cy.get('button[type="submit"]').click()
			
			// Verify collection was created
			cy.get('[data-testid="hashtag-collection"]').should('contain', 'Aesthetics Collection')
		})
	})

	describe('Platform Integration', () => {
		it('should connect new social media accounts', () => {
			cy.visit('/')
			cy.get('button').contains('Social Media').click()
			
			cy.get('button').contains('Connect Account').click()
			cy.get('button').contains('Connect Instagram').click()
			
			// This would typically open OAuth flow
			cy.get('[data-testid="oauth-modal"]').should('be.visible')
		})

		it('should disconnect social media accounts', () => {
			cy.visit('/')
			cy.get('button').contains('Social Media').click()
			
			cy.get('[data-testid="platform-item"]').first().find('button').contains('Disconnect').click()
			cy.get('button').contains('Confirm').click()
			
			// Verify account was disconnected
			cy.get('[data-testid="platform-item"]').should('contain', 'Not Connected')
		})

		it('should sync existing posts', () => {
			cy.visit('/')
			cy.get('button').contains('Social Media').click()
			
			cy.get('button').contains('Sync Posts').click()
			cy.get('[data-testid="sync-progress"]').should('be.visible')
		})
	})
}) 