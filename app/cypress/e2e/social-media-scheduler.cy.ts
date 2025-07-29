describe('Social Media Scheduler', () => {
	beforeEach(() => {
		cy.visit('/social')
	})

	it('should load the social media page successfully', () => {
		cy.get('h1').should('contain', 'Social Media')
		cy.get('p').should('contain', 'Schedule and manage your social media posts')
	})

	it('should display stats cards', () => {
		cy.get('[data-testid="stats-card"]').should('have.length.at.least', 4)
		cy.contains('Total Posts').should('be.visible')
		cy.contains('Scheduled').should('be.visible')
		cy.contains('Connected Platforms').should('be.visible')
		cy.contains('Total Engagement').should('be.visible')
	})

	it('should show platform connection cards', () => {
		cy.contains('Instagram').should('be.visible')
		cy.contains('Facebook').should('be.visible')
		cy.contains('TikTok').should('be.visible')
		cy.contains('YouTube').should('be.visible')
	})

	it('should allow creating a new post', () => {
		cy.contains('Create Post').click()
		
		// Fill in post details
		cy.get('input[placeholder="Enter post title..."]').type('Test Post Title')
		cy.get('textarea[placeholder="Write your post content..."]').type('This is a test post content')
		
		// Select platforms
		cy.get('button').contains('Instagram').closest('button').click()
		cy.get('button').contains('Facebook').closest('button').click()
		
		// Schedule the post
		cy.contains('Schedule Post').click()
		
		// Verify post was created - check if it appears in the posts list
		cy.contains('Test Post Title').should('be.visible')
	})

	it('should handle drag and drop media upload', () => {
		cy.contains('Create Post').click()
		
		// Test drag and drop area
		cy.get('div').contains('Drag and drop images/videos here').should('be.visible')
		
		// Test file input (simulate file upload)
		cy.get('input[type="file"]').selectFile('cypress/fixtures/test-image.jpg', { force: true })
		
		// Verify media preview appears
		cy.get('img').should('be.visible')
	})

	it('should allow scheduling with calendar', () => {
		cy.contains('Create Post').click()
		
		// Open calendar
		cy.get('button').contains('Pick a date').click()
		
		// Select a date - look for any day button
		cy.get('td button').first().click()
		
		// Verify date is selected
		cy.get('button').should('not.contain', 'Pick a date')
	})

	it('should display connected platforms status', () => {
		cy.contains('Connected').should('be.visible')
		cy.contains('Not connected').should('be.visible')
	})

	it('should show platform features', () => {
		cy.contains('Platform Features').should('be.visible')
		cy.contains('Photo posts').should('be.visible')
		cy.contains('Stories').should('be.visible')
		cy.contains('Short videos').should('be.visible')
		cy.contains('Video uploads').should('be.visible')
	})

	it('should display scheduled posts list', () => {
		cy.contains('Scheduled Posts').should('be.visible')
		cy.contains('Manage your upcoming and published content').should('be.visible')
	})

	it('should allow editing posts', () => {
		// Create a post first
		cy.contains('Create Post').click()
		cy.get('input[placeholder="Enter post title..."]').type('Editable Post')
		cy.get('textarea[placeholder="Write your post content..."]').type('This post can be edited')
		cy.get('button').contains('Instagram').closest('button').click()
		cy.contains('Schedule Post').click()
		
		// Edit the post - look for the Edit button in the post card
		cy.contains('Editable Post').closest('.border').find('button').contains('Edit').click()
		
		// Verify edit form appears
		cy.get('input[placeholder="Enter post title..."]').should('have.value', 'Editable Post')
	})

	it('should allow deleting posts', () => {
		// Create a post first
		cy.contains('Create Post').click()
		cy.get('input[placeholder="Enter post title..."]').type('Delete Test Post')
		cy.get('textarea[placeholder="Write your post content..."]').type('This post will be deleted')
		cy.get('button').contains('Instagram').closest('button').click()
		cy.contains('Schedule Post').click()
		
		// Delete the post - look for the Delete button in the post card
		cy.contains('Delete Test Post').closest('.border').find('button').contains('Delete').click()
		
		// Verify post is removed
		cy.contains('Delete Test Post').should('not.exist')
	})

	it('should show post status badges', () => {
		cy.contains('Create Post').click()
		cy.get('input[placeholder="Enter post title..."]').type('Status Test Post')
		cy.get('textarea[placeholder="Write your post content..."]').type('Testing status badges')
		cy.contains('Instagram').click()
		cy.contains('Schedule Post').click()
		
		// Verify status badge appears
		cy.get('[data-testid="post-status"]').should('be.visible')
	})

	it('should display platform icons in post list', () => {
		cy.contains('Create Post').click()
		cy.get('input[placeholder="Enter post title..."]').type('Multi Platform Post')
		cy.get('textarea[placeholder="Write your post content..."]').type('Posting to multiple platforms')
		cy.get('button').contains('Instagram').closest('button').click()
		cy.get('button').contains('Facebook').closest('button').click()
		cy.contains('Schedule Post').click()
		
		// Verify platform icons are displayed - should find at least 2 icons
		cy.get('[data-testid="platform-icon"]').should('have.length.at.least', 2)
	})

	it('should handle platform connection', () => {
		// Find the first Connect button and click it
		cy.get('button').contains('Connect').first().click()
		
		// Verify connecting state appears briefly
		cy.contains('Connecting...', { timeout: 5000 }).should('be.visible')
		
		// Wait for connection to complete
		cy.contains('Connected', { timeout: 10000 }).should('be.visible')
	})

	it('should show analytics data', () => {
		cy.contains('Total Posts').should('be.visible')
		cy.contains('Total Views').should('be.visible')
		cy.contains('Total Engagement').should('be.visible')
		cy.contains('Avg. Engagement Rate').should('be.visible')
	})

	it('should display platform performance cards', () => {
		cy.contains('Platform Performance').should('be.visible')
		cy.contains('Detailed metrics for each connected platform').should('be.visible')
	})

	it('should show engagement breakdown', () => {
		cy.contains('Engagement Breakdown').should('be.visible')
		cy.contains('Total Likes').should('be.visible')
		cy.contains('Total Comments').should('be.visible')
		cy.contains('Total Shares').should('be.visible')
	})

	it('should handle mobile responsive design', () => {
		// Test mobile viewport
		cy.viewport('iphone-6')
		
		// Verify mobile menu button is visible
		cy.get('[data-testid="mobile-menu-button"]').should('be.visible')
		
		// Open mobile menu - use first() to handle multiple elements
		cy.get('[data-testid="mobile-menu-button"]').first().click()
		
		// Verify sidebar opens
		cy.get('[data-testid="sidebar"]').should('be.visible')
	})

	it('should handle search functionality', () => {
		cy.get('input[placeholder="Search anything"]').type('test search')
		
		// Verify search input works
		cy.get('input[placeholder="Search anything"]').should('have.value', 'test search')
	})

	it('should show notifications', () => {
		cy.get('[data-testid="notifications-button"]').should('be.visible')
		cy.get('[data-testid="notifications-badge"]').should('contain', '3')
	})

	it('should display user profile', () => {
		cy.get('[data-testid="user-avatar"]').should('be.visible')
		cy.contains('Dr. Rae').should('be.visible')
		cy.contains('Admin').should('be.visible')
	})

	it('should handle logout', () => {
		cy.get('[data-testid="logout-button"]').click()
		
		// Verify logout action (this might redirect to login page)
		cy.url().should('not.include', '/social')
	})

	it('should validate required fields when creating post', () => {
		cy.contains('Create Post').click()
		
		// Try to schedule without required fields
		cy.contains('Schedule Post').click()
		
		// Verify validation messages or form doesn't submit
		cy.get('input[placeholder="Enter post title..."]').should('be.visible')
		cy.get('textarea[placeholder="Write your post content..."]').should('be.visible')
	})

	it('should handle platform disconnection', () => {
		// First connect a platform
		cy.get('button').contains('Connect').first().click()
		
		// Wait for connection to complete
		cy.contains('Connected', { timeout: 10000 }).should('be.visible')
		
		// Now disconnect it
		cy.get('button').contains('Disconnect').first().click()
		
		// Verify platform is now disconnected
		cy.contains('Not connected').should('be.visible')
	})

	it('should display connection tips', () => {
		cy.contains('Connection Tips').should('be.visible')
		cy.contains('Use Business Accounts').should('be.visible')
		cy.contains('Grant Necessary Permissions').should('be.visible')
		cy.contains('Keep Connected').should('be.visible')
	})
}) 