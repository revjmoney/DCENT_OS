// One-off capture of the branded dashboard for README media.
// Run against the mock preview server (scripts/preview-with-mocks.py on :4173):
//   npx cypress run --spec cypress/e2e/capture_screenshots.cy.ts --config video=false
// Outputs land in cypress/screenshots/capture_screenshots.cy.ts/.

// The production dist throws a benign uncaught error under Cypress's runner;
// it renders fine in a real browser. Don't let it fail the capture.
Cypress.on('uncaught:exception', () => false);

const shot = (name: string) =>
  cy.screenshot(name, { capture: 'viewport', overwrite: true });

describe('branded dashboard capture', () => {
  beforeEach(() => {
    cy.viewport(1360, 1020);
    cy.visit('/');
    cy.contains('JMSCNC', { timeout: 20000 }).should('be.visible');
    cy.wait(1500);
  });

  it('dashboard-standard', () => {
    // Default load is the standard / mining dashboard.
    shot('dashboard-standard');
  });

  it('dashboard-heater', () => {
    cy.get('button[title*="Space Heater"], button[aria-label*="Space Heater"]', { timeout: 10000 })
      .first()
      .click({ force: true });
    cy.wait(1200);
    shot('dashboard-heater');
  });

  it('autotuner-tune-by-priority', () => {
    cy.contains('Autotuner', { timeout: 10000 }).first().click({ force: true });
    cy.wait(1200);
    shot('autotuner-tune-by-priority');
  });

  it('companion-chat', () => {
    cy.get('button[aria-label="Open miner companion"]', { timeout: 10000 }).first().click({ force: true });
    cy.wait(1200);
    shot('companion-chat');
  });
});
