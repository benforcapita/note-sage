import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

test('desktop, mobile, light-dark and Hebrew layouts have no overflow and produce review screenshots', async ({ page }) => {
  const directory = process.env.SCREENSHOT_DIR || 'test-results/screenshots';
  await mkdir(directory, { recursive: true });
  await page.goto('/');
  await page.screenshot({ animations: 'disabled', path: join(directory, '01-desktop-empty.png') });
  for (const [title, thoughts, tag] of [
    ['Ideas worth keeping', ['A quieter workspace makes room for better ideas.', 'Small steps, consistently.'], 'ideas'],
    ['Weekend plans', ['A slow Saturday morning, coffee, and a walk by the sea.', 'Take the train to Haifa. Find a little café and bring a notebook.', 'Leave the afternoon open for something unexpected.'], 'personal'],
  ] as const) {
    await page.getByRole('button', { name: 'New note', exact: true }).click();
    await page.getByLabel('Note title', { exact: true }).fill(title);
    for (const thought of thoughts) {
      await page.getByLabel('Write a thought').fill(thought);
      await page.getByRole('button', { name: 'Add thought', exact: true }).click();
    }
    await page.getByLabel('Add a tag').fill(tag);
    await page.getByLabel('Add a tag').press('Enter');
  }
  await page.getByLabel('Write a thought').fill('Remember to check the weather before heading out…');
  await page.getByRole('button', { name: 'Open local helper' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ animations: 'disabled', path: join(directory, '02-desktop-notebook-light.png') });
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.screenshot({ animations: 'disabled', path: join(directory, '03-desktop-notebook-dark.png') });
  await page.getByRole('complementary', { name: 'Local notes helper' }).getByRole('button', { name: 'Close local helper' }).click();
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ animations: 'disabled', path: join(directory, '04-mobile-notebook.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Open notes', exact: true }).click();
  await page.screenshot({ animations: 'disabled', path: join(directory, '05-mobile-notes-drawer.png') });
  await page.getByRole('button', { name: 'Close notes', exact: true }).last().click();
  await page.getByRole('button', { name: 'Open local helper' }).click();
  await page.getByRole('button', { name: 'Overview of my notes' }).click();
  await expect(page.getByText(/Workspace overview/)).toBeVisible();
  await page.screenshot({ animations: 'disabled', path: join(directory, '06-mobile-local-helper.png') });
  await page.getByRole('complementary', { name: 'Local notes helper' }).getByRole('button', { name: 'Close local helper' }).click();
  await page.getByRole('button', { name: 'Open notes', exact: true }).click();
  await page.getByRole('button', { name: 'New note', exact: true }).click();
  await page.getByLabel('Note title', { exact: true }).fill('רעיונות להמשך');
  await page.getByLabel('Write a thought').fill('לתת לכל רעיון מקום קטן לגדול, ולחזור אליו מחר עם מחשבה חדשה.');
  await page.getByLabel('Write a thought').press('Enter');
  await page.getByLabel('Add a tag').fill('רעיונות');
  await page.getByLabel('Add a tag').press('Enter');
  await page.screenshot({ animations: 'disabled', path: join(directory, '07-mobile-hebrew.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 320, height: 568 });
  await page.screenshot({ animations: 'disabled', path: join(directory, '08-small-phone.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('button', { name: 'Add thought', exact: true })).toBeInViewport();
});
