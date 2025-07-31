describe("Client Tagging", () => {
  beforeEach(() => {
    // Suppress ResizeObserver warnings
    cy.on("uncaught:exception", (err) => {
      if (
        err.message.includes(
          "ResizeObserver loop completed with undelivered notifications",
        )
      ) {
        return false;
      }
    });

    // Setup demo data and navigate to clients page
    cy.visit("/clients");
    cy.wait(2000); // Wait for data to load
  });

  it("should display tag button when clients are selected", () => {
    // Select a client
    cy.get('[data-state="unchecked"]').first().click();

    // Tag button should be visible
    cy.get("button[title='Manage Tags']").should("be.visible");
  });

  it("should open tag dialog when clicking tag button", () => {
    // Select a client
    cy.get('[data-state="unchecked"]').first().click();

    // Click tag button
    cy.get("button[title='Manage Tags']").click();

    // Dialog should open
    cy.get("h2").should("contain", "Manage Tags");
    cy.get("input[placeholder='Enter tag name']").should("be.visible");
  });

  it("should allow adding tags to clients", () => {
    // Select a client
    cy.get('[data-state="unchecked"]').first().click();

    // Click tag button
    cy.get("button[title='Manage Tags']").click();

    // Enter tag name
    cy.get("input[placeholder='Enter tag name']").type("test-tag");

    // Click Add Tag button (should be enabled now)
    cy.get("button").contains("Add Tag").should("not.be.disabled").click();

    // Should show success message (with timeout for async operation)
    cy.contains("Tag Added", { timeout: 10000 }).should("be.visible");
  });

  it("should allow removing tags from clients", () => {
    // Select a client
    cy.get('[data-state="unchecked"]').first().click();

    // Click tag button
    cy.get("button[title='Manage Tags']").click();

    // Select "Remove Tag" action
    cy.get('[role="combobox"]').first().click();
    cy.get('div[role="option"]').contains("Remove Tag").click();

    // Enter tag name
    cy.get("input[placeholder='Enter tag name']").type("test-tag");

    // Click Remove Tag button (should be enabled now)
    cy.get("button").contains("Remove Tag").should("not.be.disabled").click();

    // Should show success message (with timeout for async operation)
    cy.contains("Tag Removed", { timeout: 10000 }).should("be.visible");
  });

  it("should validate tag name is required", () => {
    // Select a client
    cy.get('[data-state="unchecked"]').first().click();

    // Click tag button
    cy.get("button[title='Manage Tags']").click();

    // Button should be disabled when no tag name
    cy.get("button").contains("Add Tag").should("be.disabled");

    // Enter tag name and then clear it
    cy.get("input[placeholder='Enter tag name']").type("test");
    cy.get("input[placeholder='Enter tag name']").clear();

    // Button should be disabled again
    cy.get("button").contains("Add Tag").should("be.disabled");
  });

  it("should disable tag button when no clients selected", () => {
    // Tag button should be disabled when no clients selected
    cy.get("button[title='Manage Tags']").should("be.disabled");
  });

  it("should show correct summary in tag dialog", () => {
    // Select multiple clients
    cy.get('[data-state="unchecked"]').first().click();
    cy.get('[data-state="unchecked"]').eq(1).click();

    // Click tag button
    cy.get("button[title='Manage Tags']").click();

    // Enter tag name
    cy.get("input[placeholder='Enter tag name']").type("test-tag");

    // Should show correct summary
    cy.contains('Add tag "test-tag" from 2 selected clients').should(
      "be.visible",
    );
  });
});
