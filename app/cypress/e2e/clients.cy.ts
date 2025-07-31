describe("Client Management", () => {
  beforeEach(() => {
    cy.visit("/");
    // Setup demo data first
    cy.visit("/setup");
    cy.get("button").contains("Setup Demo Data").click();
    cy.get("button").contains("Go to Dashboard").click();
    cy.get("button").contains("Clients").click();
  });

  it("should display clients page correctly", () => {
    cy.get("h1").should("contain", "Client Management");
    cy.get("button").contains("Add Client").should("be.visible");
  });

  it("should show demo clients after setup", () => {
    // Should show the demo clients created during setup
    cy.get("table").should("contain", "Sarah Johnson");
    cy.get("table").should("contain", "Michael Chen");
    cy.get("table").should("contain", "Emily Rodriguez");
  });

  it("should open add client modal", () => {
    cy.get("button").contains("Add Client").click();
    cy.get("h2").should("contain", "Add New Client");
    cy.get('input[name="fullName"]').should("be.visible");
    cy.get('input[name="email"]').should("be.visible");
  });

  it("should add a new client successfully", () => {
    cy.get("button").contains("Add Client").click();

    // Fill in client form
    cy.get('input[name="fullName"]').type("John Doe");
    cy.get('input[name="email"]').type("john.doe@example.com");
    cy.get('input[name="phones.0"]').type("(555) 123-4567");
    cy.get('input[value="male"]').check();

    // Submit form
    cy.get('button[type="submit"]').click();

    // Modal should close
    cy.get("h2").should("not.contain", "Add New Client");

    // New client should appear in list
    cy.get("table").should("contain", "John Doe");
  });

  it("should search for clients", () => {
    cy.get('input[placeholder*="Search"]').type("Sarah");
    cy.get("table").should("contain", "Sarah Johnson");
    cy.get("table").should("not.contain", "Michael Chen");
  });

  it("should filter clients by tags", () => {
    // Test tag filtering
    cy.get("select").first().select("Botox");
    cy.get("table").should("contain", "Sarah Johnson"); // Has Botox tag
  });

  it("should edit a client", () => {
    // Click edit button on first client
    cy.get("table").find("button").contains("Edit").first().click();

    // Modal should open with client data
    cy.get("h2").should("contain", "Edit Client");
    cy.get('input[name="fullName"]').should("have.value", "Sarah Johnson");

    // Update client name
    cy.get('input[name="fullName"]').clear().type("Sarah Smith");
    cy.get('button[type="submit"]').click();

    // Updated name should appear
    cy.get("table").should("contain", "Sarah Smith");
  });

  it("should delete a client", () => {
    // Count initial clients
    cy.get("table tbody tr").then(($rows) => {
      const initialCount = $rows.length;

      // Click delete button on first client
      cy.get("table").find("button").contains("Delete").first().click();

      // Confirm deletion
      cy.on("window:confirm", () => true);

      // Client should be removed
      cy.get("table tbody tr").should("have.length", initialCount - 1);
    });
  });

  it("should display client details correctly", () => {
    cy.get("table").should("contain", "Sarah Johnson");
    cy.get("table").should("contain", "sarah.johnson@email.com");
    cy.get("table").should("contain", "(555) 123-4567");
    cy.get("table").should("contain", "Botox");
    cy.get("table").should("contain", "VIP");
  });

  it("should handle form validation", () => {
    cy.get("button").contains("Add Client").click();

    // Try to submit without required fields
    cy.get('button[type="submit"]').click();

    // Should show validation errors
    cy.get("p").should("contain", "Full name is required");
  });

  it("should display import/export buttons", () => {
    cy.get("button").contains("Import Clients").should("be.visible");
    cy.get("button").contains("Export Clients").should("be.visible");
    cy.get("button").contains("Sync").should("be.visible");
  });

  it("should navigate to individual client page", () => {
    // Click on the first client name to navigate to their profile
    cy.get("table").contains("Sarah Johnson").click();

    // Should be on the client detail page
    cy.url().should("include", "/clients/");
    cy.get("h1").should("contain", "Sarah Johnson");
  });
});
