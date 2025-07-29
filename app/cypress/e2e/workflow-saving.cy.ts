describe("Workflow Saving", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3000/workflows");
  });

  it("should create a new workflow and save it successfully", () => {
    // Click "Add Workflow" to create a new workflow
    cy.contains("Add Workflow").click();

    // Wait for the workflow editor to load
    cy.url().should("include", "/workflow-editor");

    // Change the workflow name
    const newName = `Test Workflow ${Date.now()}`;
    cy.get("#workflow-name").clear().type(newName);

    // Save the workflow
    cy.contains("Save Workflow").click();

    // Wait for save to complete
    cy.contains("Success!").should("be.visible");

    // Verify we're redirected to a workflow (any ID format is fine)
    cy.url().should("include", "/workflow-editor?id=");

    // Verify the workflow name persists
    cy.get("#workflow-name").should("have.value", newName);
  });

  it("should show environment toggle in header", () => {
    cy.visit("http://localhost:3000/workflows");

    // Check that the environment toggle is visible
    cy.get('[data-testid="environment-toggle"]').should("be.visible");

    // Click the toggle to switch environments
    cy.get('[data-testid="environment-toggle"]').click();

    // Verify the environment changed
    cy.get('[data-testid="environment-toggle"]').should(
      "contain",
      "PRODUCTION",
    );
  });
});
