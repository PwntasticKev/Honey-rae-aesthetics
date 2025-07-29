describe("Appointment Management with Google Calendar", () => {
  beforeEach(() => {
    cy.visit("/appointments");
  });

  it("should display calendar page with authentication prompt", () => {
    // Should show the calendar page
    cy.get("h1").should("contain", "Calendar");

    // Should show Google Calendar connection prompt
    cy.get("div").should("contain", "Connect Google Calendar");
    cy.get("button").should("contain", "Connect Google Calendar");
  });

  it("should show calendar features in connection prompt", () => {
    // Should display feature benefits
    cy.get("div").should("contain", "View all your appointments in one place");
    cy.get("div").should("contain", "Real-time sync with Google Calendar");
    cy.get("div").should("contain", "Manage multiple calendars");
  });

  it("should show loading state during initialization", () => {
    // Mock slow initialization
    cy.window().then((win) => {
      win.localStorage.removeItem("google_calendar_token");
    });

    cy.visit("/appointments");

    // Should show loading state or connection prompt
    cy.get("div").should("contain", "Initializing calendar...");
    // Or if not loading, should show connection prompt
    cy.get("div").should("contain", "Connect Google Calendar");
  });

  it("should show environment toggle in header", () => {
    cy.visit("/appointments");

    // Should show environment information
    cy.get("p").should("contain", "environment");
  });

  it("should display basic page structure", () => {
    // Should show the main page elements
    cy.get("h1").should("exist");
    cy.get("button").should("exist");
    cy.get("div").should("exist");
  });

  it("should handle page navigation", () => {
    // Should be able to visit the page without errors
    cy.visit("/appointments");
    cy.url().should("include", "/appointments");
  });
});
