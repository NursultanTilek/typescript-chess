import { test, expect } from '@playwright/test';

/**
 * E2E test to capture and verify browser console errors
 */
test.describe('Browser Console Errors', () => {
  let consoleMessages: string[] = [];
  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset message arrays
    consoleMessages = [];
    consoleErrors = [];
    consoleWarnings = [];

    // Listen to all console events
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();

      if (type === 'error') {
        consoleErrors.push(text);
      } else if (type === 'warning') {
        consoleWarnings.push(text);
      } else if (type === 'log') {
        consoleMessages.push(text);
      }
    });

    // Listen to page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page Error: ${error.message}`);
    });
  });

  test('should load the chess game without console errors', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the app to load
    await page.waitForSelector('#root', { timeout: 10000 });

    // Wait a bit for any async operations
    await page.waitForTimeout(2000);

    // Print all console messages for debugging
    console.log('\n=== Console Messages ===');
    consoleMessages.forEach(msg => console.log(`[LOG] ${msg}`));

    console.log('\n=== Console Warnings ===');
    consoleWarnings.forEach(msg => console.log(`[WARN] ${msg}`));

    console.log('\n=== Console Errors ===');
    consoleErrors.forEach(msg => console.log(`[ERROR] ${msg}`));

    // Assert no critical errors
    expect(consoleErrors, 'Should have no console errors').toHaveLength(0);
  });

  test('should not have excessive console logging in production', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the app to load
    await page.waitForSelector('#root', { timeout: 10000 });

    // Wait for initial render
    await page.waitForTimeout(1000);

    // Count excessive logs (more than 5 is excessive)
    const excessiveLogs = consoleMessages.length > 5;

    console.log(`\nTotal console.log calls: ${consoleMessages.length}`);

    if (excessiveLogs) {
      console.log('Console logs found:');
      consoleMessages.forEach((msg, i) => console.log(`  ${i + 1}. ${msg}`));
    }

    // This will fail if there are excessive logs, helping us identify them
    expect(excessiveLogs, 'Should not have excessive console logging').toBe(false);
  });

  test('should play a move without errors', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the board to load
    await page.waitForSelector('#root', { timeout: 10000 });

    // Clear previous console messages
    consoleMessages = [];
    consoleErrors = [];
    consoleWarnings = [];

    // Try to click on a piece (e.g., white pawn)
    // Adjust selectors based on your actual DOM structure
    const piece = page.locator('[data-piece]').first();
    if (await piece.count() > 0) {
      await piece.click();
      await page.waitForTimeout(500);
    }

    // Check for errors after interaction
    console.log('\n=== After Move - Console Errors ===');
    consoleErrors.forEach(msg => console.log(`[ERROR] ${msg}`));

    expect(consoleErrors, 'Should have no errors after making a move').toHaveLength(0);
  });

  test('should handle AI move without errors', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the board to load
    await page.waitForSelector('#root', { timeout: 10000 });

    // Clear previous console messages
    consoleMessages = [];
    consoleErrors = [];

    // Wait for AI to potentially make a move (if AI plays first)
    // or make a move to trigger AI response
    await page.waitForTimeout(3000);

    // Check for errors during AI calculation
    console.log('\n=== After AI Move - Console Errors ===');
    consoleErrors.forEach(msg => console.log(`[ERROR] ${msg}`));

    const aiErrors = consoleErrors.filter(err =>
      err.includes('ERROR:') ||
      err.includes('undefined') ||
      err.includes('null')
    );

    expect(aiErrors, 'Should have no AI-related errors').toHaveLength(0);
  });
});
