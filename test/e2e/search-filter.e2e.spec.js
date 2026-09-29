const { test, expect } = require('@playwright/test');
const { MOCK_USER_EMAIL } = require('./support/test-data');

const FOUND_TITLE = 'E2E Search Blue Umbrella';
const LOST_TITLE = 'E2E Search Red Scarf';
const REPORT_DATE = new Date(Date.now() - 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);

// Creates one found and one lost report through the API so the page has results to filter.
async function createReports(request) {
  await request.post('/api/auth/login', { data: { email: MOCK_USER_EMAIL } });

  for (const report of [
    { type: 'found', title: FOUND_TITLE, handoverMethod: 'email' },
    { type: 'lost', title: LOST_TITLE },
  ]) {
    const response = await request.post('/api/items', {
      data: {
        category: 'Other',
        date: REPORT_DATE,
        location: 'Burwood, Library',
        description: `${report.title} reported for the search and filter test.`,
        ...report,
      },
    });
    expect(response.status()).toBe(201);
  }
}

test('search filters can be applied, checked and cleared', async ({ page }) => {
  await createReports(page.request);
  await page.goto('/search-filter.html');

  const count = page.locator('#search-count');
  await expect(count).toHaveText(/\d+ results?/);
  const defaultCount = await count.textContent();

  await test.step('E2E-08 apply a keyword with the Lost filter', async () => {
    await page.locator('#filter-keyword').fill('e2e search');
    await page.getByRole('button', { name: 'Lost', exact: true }).click();

    await expect(count).toHaveText('1 result');
    await expect(page.locator('#search-grid')).toContainText(LOST_TITLE);
    await expect(page.locator('#search-grid')).not.toContainText(FOUND_TITLE);
  });

  await test.step('E2E-09 show an error when the from date is after the to date', async () => {
    await page.locator('#filter-from-date').fill('2026-09-10');
    await page.locator('#filter-to-date').fill('2026-09-01');
    await page.getByRole('button', { name: 'Apply filters' }).click();

    await expect(page.locator('#search-status')).toHaveText('From date must be on or before to date.');
    await expect(count).toHaveText('');
  });

  await test.step('E2E-10 clear all filters to return to the default listing', async () => {
    await page.getByRole('button', { name: 'Clear all filters' }).click();

    await expect(count).toHaveText(defaultCount);
    await expect(page.locator('#filter-keyword')).toHaveValue('');
    await expect(page.locator('#filter-from-date')).toHaveValue('');
    await expect(page.locator('#filter-to-date')).toHaveValue('');
    await expect(page.getByRole('button', { name: 'All', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#search-grid')).toContainText(FOUND_TITLE);
    await expect(page.locator('#search-grid')).toContainText(LOST_TITLE);
  });
});
