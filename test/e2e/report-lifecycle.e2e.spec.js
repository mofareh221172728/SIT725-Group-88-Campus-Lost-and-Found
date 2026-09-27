const { test, expect } = require('@playwright/test');
const { MOCK_USER_EMAIL } = require('./support/test-data');

const REPORT_TITLE = 'E2E Found Laptop Charger';
const UPDATED_TITLE = 'E2E Found USB-C Laptop Charger';
const REPORT_DATE = new Date(Date.now() - 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);

async function login(page) {
  await page.goto('/index.html');
  await page.getByLabel('Deakin email').fill(MOCK_USER_EMAIL);
  await page.getByRole('button', { name: /Continue with Deakin SSO/ }).click();
  await expect(page).toHaveURL(/\/browse\.html$/);
}

test('a report can move through the complete active-to-resolved lifecycle', async ({ page }) => {
  await login(page);

  await test.step('E2E-02 submit a found report', async () => {
    await page.goto('/report.html');
    await page.getByLabel('Item Title').fill(REPORT_TITLE);
    await page.locator('#item-category').selectOption('Electronics', { force: true });
    await page.getByLabel('Date Found').fill(REPORT_DATE);
    await page.getByLabel('Detailed Description').fill(
      'Black USB-C laptop charger found beside a library study desk.',
    );
    await page.locator('#item-campus').selectOption('Burwood', { force: true });
    await page.getByLabel('Building').fill('Library');
    await page.getByLabel('Room / Area (Optional)').fill('Level 2');
    await page.getByText('Direct Contact via Deakin Email', { exact: true }).click();
    await expect(page.getByLabel('Direct Contact via Deakin Email')).toBeChecked();

    const [response] = await Promise.all([
      page.waitForResponse((candidate) =>
        candidate.url().endsWith('/api/items') && candidate.request().method() === 'POST'),
      page.getByRole('button', { name: 'Submit Report' }).click(),
    ]);

    expect(response.status()).toBe(201);
    await expect(page.locator('#form-alert')).toContainText('Report created successfully.');
  });

  await test.step('E2E-03 view the active report in Browse', async () => {
    await page.goto('/browse.html');
    const card = page.locator('.report-card-link').filter({ hasText: REPORT_TITLE });

    await expect(card).toBeVisible();
    await expect(card).toContainText('Electronics');
    await expect(card).toContainText('Burwood, Library, Level 2');
    await expect(card).toContainText(/active/i);
  });

  await test.step('E2E-04 find the report with search and filters', async () => {
    await page.goto('/search-filter.html');
    await page.locator('#filter-keyword').fill(REPORT_TITLE);
    await page.locator('#filter-category').selectOption('Electronics');
    await page.getByRole('button', { name: 'Found', exact: true }).click();
    await page.getByRole('button', { name: 'Apply filters' }).click();

    await expect(page.locator('#search-count')).toHaveText('1 result');
    const result = page.locator('#search-grid .report-card-link').filter({ hasText: REPORT_TITLE });
    await expect(result).toBeVisible();
  });

  await test.step('E2E-05 open and verify report details', async () => {
    const result = page.locator('#search-grid .report-card-link').filter({ hasText: REPORT_TITLE });
    await result.click();
    await expect(page).toHaveURL(/\/item-detail\.html\?id=.+&type=found$/);

    await expect(page.locator('#item-title')).toHaveText(REPORT_TITLE);
    await expect(page.locator('#item-description')).toContainText('Black USB-C laptop charger');
    await expect(page.locator('#item-category')).toHaveText('Electronics');
    await expect(page.locator('#item-location')).toHaveText('Burwood, Library, Level 2');
    await expect(page.locator('#item-status')).toHaveText(/active/i);
  });

  await test.step('E2E-06 edit the active report', async () => {
    await page.goto('/my-reports.html');
    const row = page.locator('.report-row').filter({ hasText: REPORT_TITLE });
    await expect(row).toBeVisible();
    await row.getByRole('link', { name: 'Edit' }).click();

    await expect(page.locator('#save-edit')).toBeEnabled();
    await page.locator('#item-title').fill(UPDATED_TITLE);

    const [response] = await Promise.all([
      page.waitForResponse((candidate) =>
        /\/api\/items\/found\/.+$/.test(candidate.url()) &&
        candidate.request().method() === 'PUT'),
      page.getByRole('button', { name: 'Save Changes' }).click(),
    ]);

    expect(response.status()).toBe(200);
    await expect(page.locator('#form-alert')).toContainText('Report updated successfully.');
    await page.reload();
    await expect(page.locator('#item-title')).toHaveValue(UPDATED_TITLE);
  });

  await test.step('E2E-07 resolve the active report', async () => {
    await page.goto('/my-reports.html');
    let row = page.locator('.report-row').filter({ hasText: UPDATED_TITLE });
    await expect(row).toContainText('Active');

    page.once('dialog', (dialog) => dialog.accept());
    const [response] = await Promise.all([
      page.waitForResponse((candidate) =>
        candidate.url().endsWith('/status') && candidate.request().method() === 'PUT'),
      row.getByRole('button', { name: 'Resolve' }).click(),
    ]);

    expect(response.status()).toBe(200);
    row = page.locator('.report-row').filter({ hasText: UPDATED_TITLE });
    await expect(row).toContainText('Resolved');
    await expect(row.getByRole('link', { name: 'Edit' })).toHaveCount(0);
    await expect(row.getByRole('button', { name: 'Resolve' })).toHaveCount(0);

    await page.goto('/search-filter.html');
    await page.locator('#filter-keyword').fill(UPDATED_TITLE);
    await page.getByRole('button', { name: 'Apply filters' }).click();
    await expect(page.locator('#search-count')).toHaveText('0 results');
    await expect(page.locator('#search-status')).toContainText('No active reports match');
  });
});
