import { test, expect } from '@playwright/test';

test('Move white pawn E2 to E3 and check console', async ({ page }) => {
  const consoleErrors: string[] = [];
  const consoleLogs: string[] = [];

  // Capture console
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      consoleErrors.push(text);
      console.log(`[ERROR] ${text}`);
    } else if (type === 'log') {
      consoleLogs.push(text);
      console.log(`[LOG] ${text}`);
    }
  });

  page.on('pageerror', (error) => {
    consoleErrors.push(`Page Error: ${error.message}`);
    console.log(`[PAGE ERROR] ${error.message}`);
  });

  // Navigate and wait
  await page.goto('/');
  await page.waitForTimeout(2000);
  console.log('\n✓ Page loaded');

  // Click E2 pawn
  console.log('\n--- Clicking E2 pawn ---');
  await page.locator('#E2').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/e2-selected.png', fullPage: true });
  console.log('✓ E2 pawn selected');

  // Move to E3
  console.log('\n--- Moving to E3 ---');
  await page.locator('#E3').click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/e3-moved.png', fullPage: true });
  console.log('✓ Moved to E3');

  // Wait for AI response
  console.log('\n--- Waiting for AI response (8 seconds) ---');
  await page.waitForTimeout(8000);
  await page.screenshot({ path: 'test-results/after-ai-response.png', fullPage: true });
  console.log('✓ AI response completed');

  // Filter MISMATCH errors
  const mismatchErrors = consoleErrors.filter(err => err.includes('MISMATCH'));

  console.log('\n=== CONSOLE ERROR SUMMARY ===');
  console.log(`Total errors: ${consoleErrors.length}`);
  console.log(`MISMATCH errors: ${mismatchErrors.length}`);

  if (mismatchErrors.length > 0) {
    console.log('\n=== MISMATCH ERRORS ===');
    mismatchErrors.forEach(err => console.log(`  ❌ ${err}`));
  }

  // Don't fail the test, just report
  console.log('\n--- Test completed, errors captured ---');
});
