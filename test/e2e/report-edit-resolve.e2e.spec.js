const { test, expect } = require('@playwright/test');
const { MOCK_USER_EMAIL, OTHER_USER_EMAIL } = require('./support/test-data');

const REPORT_DATE = new Date(Date.now() - 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);

async function login(page, email) {
  await page.goto('/index.html');
  await page.getByLabel('Deakin email').fill(email);
  await page.getByRole('button', { name: /Continue with Deakin SSO/ }).click();
  await expect(page).toHaveURL(/\/browse\.html$/);
}

// Creates an active Lost report owned by the signed-in user and returns its id.
async function createLostReport(page, title) {
  const response = await page.request.post('/api/items', {
    data: {
      type: 'lost',
      title,
      category: 'Other',
      date: REPORT_DATE,
      location: 'Burwood, Library',
      description: `${title} was last seen near the library entrance.`,
    },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).report._id;
}

test('report edits are validated, limited to the owner, and resolving can be cancelled', async ({ page, browser }) => {
  const title = 'E2E Lost Green Umbrella';
  await login(page, MOCK_USER_EMAIL);
  const id = await createLostReport(page, title);
  const editUrl = `/edit-report.html?id=${id}&type=lost`;

  await test.step('E2E-14 reject invalid edits without saving them', async () => {
    await page.goto(editUrl);
    await expect(page.locator('#save-edit')).toBeEnabled();

    await page.locator('#item-title').fill('');
    await page.locator('#item-date').fill('2099-01-01');
    await page.locator('#save-edit').click();

    await expect(page.locator('#form-alert')).toContainText('Please fix the highlighted fields.');
    await expect(page.locator('#item-title-error')).toHaveText('Item title is required.');
    await expect(page.locator('#item-date-error')).toHaveText('Date cannot be in the future.');

    await page.reload();
    await expect(page.locator('#item-title')).toHaveValue(title);
    await expect(page.locator('#item-date')).toHaveValue(REPORT_DATE);
  });

  await test.step('E2E-15 block another user from editing the report', async () => {
    const otherContext = await browser.newContext();
    const other = await otherContext.newPage();
    await login(other, OTHER_USER_EMAIL);

    await other.goto(editUrl);

    await expect(other.locator('#form-alert')).toContainText('You can only edit your own reports.');
    await expect(other.locator('#save-edit')).toBeDisabled();
    await expect(other.locator('#resolve-edit')).toBeDisabled();
    await otherContext.close();
  });

  await test.step('E2E-16 cancel, then confirm, resolving from My Reports', async () => {
    await page.goto('/my-reports.html');
    const row = page.locator('.report-row').filter({ hasText: title });
    await expect(row).toContainText('Active');

    const savedStatus = async () => {
      const mine = await (await page.request.get('/api/items/mine')).json();
      return mine.lost.find((report) => report.id === id).status;
    };

    page.once('dialog', (dialog) => dialog.dismiss());
    await row.getByRole('button', { name: 'Resolve' }).click();
    await expect(row).toContainText('Active');
    await expect(row.getByRole('link', { name: 'Edit' })).toBeVisible();
    expect(await savedStatus()).toBe('active');

    page.once('dialog', (dialog) => dialog.accept());
    await row.getByRole('button', { name: 'Resolve' }).click();
    await expect(row).toContainText('Resolved');
    await expect(row.getByRole('link', { name: 'Edit' })).toHaveCount(0);
    expect(await savedStatus()).toBe('resolved');
  });
});
