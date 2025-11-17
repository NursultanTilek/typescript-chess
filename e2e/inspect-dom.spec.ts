import { test } from '@playwright/test';

test('inspect DOM structure', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);

  // Get all elements with ID attributes
  const elementsWithId = await page.$$eval('[id]', (elements) =>
    elements.map((el) => ({
      id: el.id,
      tag: el.tagName,
      className: el.className,
    }))
  );

  console.log('\n=== Elements with ID ===');
  console.log(JSON.stringify(elementsWithId.slice(0, 20), null, 2));

  // Try to find chess squares
  const squares = await page.$$eval('div[id^="a"], div[id^="b"], div[id^="c"], div[id^="d"], div[id^="e"], div[id^="f"], div[id^="g"], div[id^="h"]', (elements) =>
    elements.map((el) => el.id)
  );

  console.log('\n=== Chess Square IDs ===');
  console.log(squares.slice(0, 20));

  //Get the board container HTML
  const boardHTML = await page.locator('.flex.justify-center').first().innerHTML();
  console.log('\n=== Board HTML (first 1000 chars) ===');
  console.log(boardHTML.substring(0, 1000));
});
