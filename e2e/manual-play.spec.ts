import { test, expect } from '@playwright/test';

/**
 * Manual play test - make actual moves and monitor console
 */
test.describe('Manual Chess Play', () => {
  test('make white pawn move e2-e4', async ({ page }) => {
    const consoleMessages: any[] = [];
    const consoleErrors: any[] = [];
    const consoleWarnings: any[] = [];

    // Capture all console events
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();

      console.log(`[BROWSER ${type.toUpperCase()}]`, text);

      if (type === 'error') {
        consoleErrors.push(text);
      } else if (type === 'warning') {
        consoleWarnings.push(text);
      } else {
        consoleMessages.push(text);
      }
    });

    page.on('pageerror', (error) => {
      console.log('[PAGE ERROR]', error.message);
      consoleErrors.push(`Page Error: ${error.message}`);
    });

    // Navigate to the game
    await page.goto('/');
    console.log('\n✓ Page loaded');

    // Take a screenshot of initial state
    await page.screenshot({ path: 'test-results/01-initial-board.png', fullPage: true });
    console.log('✓ Screenshot taken: initial board');

    // Wait for board to be visible
    await page.waitForTimeout(2000);

    // Find all chess squares - they should have specific attributes or classes
    const squares = page.locator('[data-testid], [class*="square"], div[class*="w-"]');
    const count = await squares.count();
    console.log(`\n✓ Found ${count} potential squares on board`);

    // Let's inspect the DOM structure
    const boardHTML = await page.locator('#root').innerHTML();
    console.log('\n=== Root HTML Structure (first 500 chars) ===');
    console.log(boardHTML.substring(0, 500));

    // Click on white pawn at E2 (uppercase!)
    console.log('\n--- Attempting to click white pawn at E2 ---');
    const e2Square = page.locator('#E2');
    await e2Square.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/02-after-piece-select.png', fullPage: true });
    console.log('✓ Clicked on E2 (white pawn)');

    // Now click on E4 to make the move
    console.log('--- Moving pawn to E4 ---');
    const e4Square = page.locator('#E4');
    await e4Square.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/03-after-move.png', fullPage: true });
    console.log('✓ Clicked on E4 (target square)');

    // Wait for AI to respond
    console.log('\n--- Waiting for AI response ---');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-results/04-after-ai-move.png', fullPage: true });
    console.log('✓ AI move completed');

    // Print console summary
    console.log('\n=== CONSOLE SUMMARY ===');
    console.log(`Total Messages: ${consoleMessages.length}`);
    console.log(`Total Warnings: ${consoleWarnings.length}`);
    console.log(`Total Errors: ${consoleErrors.length}`);

    if (consoleErrors.length > 0) {
      console.log('\n=== CONSOLE ERRORS ===');
      consoleErrors.forEach(err => console.log(`  ❌ ${err}`));
    }

    // Check for errors
    expect(consoleErrors.length, 'Should have no console errors').toBe(0);
  });
});
