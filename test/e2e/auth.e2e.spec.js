const { test, expect } = require('@playwright/test');
const { MOCK_USER_EMAIL } = require('./support/test-data');

test('mock login creates a browser session', async ({ page }) => {
  await page.goto('/index.html');

  await page.getByLabel('Email').fill(MOCK_USER_EMAIL);
  await page.getByLabel('Password').fill('not-checked-by-mock-login');
  await page.getByRole('button', { name: /Continue with Deakin SSO/ }).click();

  await expect(page).toHaveURL(/\/browse\.html$/);

  const response = await page.request.get('/api/auth/me');
  expect(response.ok()).toBe(true);
  await expect(response.json()).resolves.toMatchObject({
    user: { email: MOCK_USER_EMAIL, role: 'user' },
  });
});

test('signed-in user can sign out from the navigation', async ({ page }) => {
  await page.goto('/index.html');

  await page.getByLabel('Email').fill(MOCK_USER_EMAIL);
  await page.getByLabel('Password').fill('not-checked-by-mock-login');
  await page.getByRole('button', { name: /Continue with Deakin SSO/ }).click();

  const signOutButton = page.getByRole('menuitem', { name: 'Sign out' });
  await expect(signOutButton).toBeVisible();
  await signOutButton.click();

  await expect(page).toHaveURL(/\/index\.html$/);
  await expect(page.getByRole('menuitem', { name: 'Login' })).toBeVisible();

  const response = await page.request.get('/api/auth/me');
  expect(response.status()).toBe(401);
});
