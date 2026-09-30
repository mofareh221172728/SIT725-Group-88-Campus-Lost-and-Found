const { test, expect } = require('@playwright/test');
const { MOCK_USER_EMAIL } = require('./support/test-data');

const REPORT_DATE = new Date(Date.now() - 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);

async function login(page, email) {
  await page.goto('/index.html');
  await page.getByLabel('Deakin email').fill(email);
  await page.getByRole('button', { name: /Continue with Deakin SSO/ }).click();
  await expect(page).toHaveURL(/\/browse\.html$/);
}

test('a lost report submitted through the form is listed and opens with its details', async ({ page }) => {
  const title = 'E2E Lost Blue Scarf';
  await login(page, MOCK_USER_EMAIL);

  await test.step('E2E-11 submit a lost report through the form', async () => {
    await page.goto('/report.html');
    await page.getByRole('radio', { name: 'I Lost Something' }).click();
    await expect(page.locator('#report-type')).toHaveValue('lost');

    await page.getByLabel('Item Title').fill(title);
    await page.locator('#item-category').selectOption('Clothing', { force: true });
    await page.getByLabel('Date Lost').fill(REPORT_DATE);
    await page.getByLabel('Detailed Description').fill('Blue wool scarf left on a bench outside the library.');
    await page.locator('#item-campus').selectOption('Burwood', { force: true });
    await page.getByLabel('Building').fill('Library');

    const [response] = await Promise.all([
      page.waitForResponse((candidate) =>
        candidate.url().endsWith('/api/items') && candidate.request().method() === 'POST'),
      page.getByRole('button', { name: 'Submit Report' }).click(),
    ]);

    expect(response.status()).toBe(201);
    await expect(page.locator('#form-alert')).toContainText('Report created successfully.');
  });

  await test.step('E2E-12 view the lost report in the Browse Lost tab', async () => {
    await page.goto('/browse.html');
    await page.locator('#tab-lost').click();
    const card = page.locator('.report-card-link').filter({ hasText: title });

    await expect(card).toBeVisible();
    await expect(card).toContainText('Clothing');
    await expect(card).toContainText('Burwood, Library');
    await expect(card).toContainText(/active/i);
  });

  await test.step('E2E-13 open the lost report details', async () => {
    await page.locator('.report-card-link').filter({ hasText: title }).click();
    await expect(page).toHaveURL(/\/item-detail\.html\?id=.+&type=lost$/);

    await expect(page.locator('#item-type')).toHaveText('Lost');
    await expect(page.locator('#item-title')).toHaveText(title);
    await expect(page.locator('#item-description')).toContainText('Blue wool scarf');
    await expect(page.locator('#item-category')).toHaveText('Clothing');
    await expect(page.locator('#item-date-label')).toHaveText('Date lost');
    await expect(page.locator('#item-location')).toHaveText('Burwood, Library');
    await expect(page.locator('#item-status')).toHaveText(/active/i);
    await expect(page.locator('#item-contact')).toBeHidden();
  });
});
