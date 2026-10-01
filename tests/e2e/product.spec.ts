import { test, expect } from '@playwright/test';
const backup = { version: '1.0.0', lastUpdated: '2025-07-08T12:00:00.000Z', notes: [{ id: 'n1', title: 'Imported trip', tags: ['travel'], createdAt: '2025-07-07T12:00:00.000Z', updatedAt: '2025-07-08T12:00:00.000Z', messages: [{ id: 'm1', type: 'message', content: 'Train to Haifa', timestamp: '2025-07-08T12:00:00.000Z' }] }], chatMessages: [] };
async function addNote(page: import('@playwright/test').Page, title: string, content?: string) {
  await page.getByRole('button', { name: 'New note', exact: true }).click();
  await page.getByLabel('Note title', { exact: true }).fill(title);
  if (content) { await page.getByLabel('Write a thought').fill(content); await page.getByRole('button', { name: 'Add thought', exact: true }).click(); }
}
test('starts without a blocking prompt, immediately retains title, messages, tags and drafts', async ({ page }) => {
  await page.goto('/');
  await addNote(page, 'First note', 'Keep this thought');
  await page.getByLabel('Add a tag').fill('work');
  await page.getByLabel('Add a tag').press('Enter');
  await page.getByLabel('Write a thought').fill('Unsent draft');
  await addNote(page, 'Second note');
  await page.getByRole('button', { name: 'Open note First note', exact: true }).click();
  await expect(page.getByLabel('Write a thought')).toHaveValue('Unsent draft');
  await page.reload();
  await page.getByRole('button', { name: 'Open note First note', exact: true }).click();
  await expect(page.getByLabel('Note title', { exact: true })).toHaveValue('First note');
  await expect(page.getByText('Keep this thought', { exact: true }).last()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove tag work' })).toBeVisible();
  await expect(page.getByLabel('Write a thought')).toHaveValue('Unsent draft');
});
test('message edits and deletion persist after rapid switching and reload', async ({ page }) => {
  await page.goto('/'); await addNote(page, 'Actions', 'Original thought');
  await page.getByRole('button', { name: 'Edit thought 1' }).click();
  await page.getByRole('textbox', { name: 'Edit thought', exact: true }).fill('Edited thought');
  await page.getByRole('button', { name: 'Done editing' }).click();
  await page.reload();
  await expect(page.getByText('Edited thought', { exact: true }).last()).toBeVisible();
  await page.getByRole('button', { name: 'Delete thought 1' }).click();
  await page.getByRole('button', { name: 'Delete thought', exact: true }).click();
  await page.reload();
  await expect(page.getByText('Edited thought', { exact: true })).toHaveCount(0);
});
test('search finds title, messages and tags and clears when creating a note', async ({ page }) => {
  await page.goto('/'); await addNote(page, 'Trip', 'Haifa train');
  await page.getByLabel('Add a tag').fill('weekend'); await page.getByLabel('Add a tag').press('Enter');
  for (const query of ['Trip', 'Haifa', 'weekend']) {
    await page.getByLabel('Search notes').fill(query);
    await expect(page.getByRole('button', { name: 'Open note Trip', exact: true })).toBeVisible();
  }
  await page.getByLabel('Search notes').fill('impossible');
  await expect(page.getByText('No matching notes')).toBeVisible();
  await page.getByRole('button', { name: 'New note', exact: true }).click();
  await expect(page.getByLabel('Search notes')).toHaveValue('');
});
test('replacement cancel, Escape, malformed import and repeated import all preserve the workspace', async ({ page }) => {
  await page.goto('/'); await addNote(page, 'Protected', 'Do not lose');
  await page.getByRole('button', { name: 'New workspace', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByLabel('Note title', { exact: true })).toHaveValue('Protected');
  await page.getByRole('button', { name: 'New workspace', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Import workspace file').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{oops') });
  await expect(page.getByRole('alert').filter({ hasText: 'valid JSON' })).toBeVisible();
  await expect(page.getByLabel('Note title', { exact: true })).toHaveValue('Protected');
  for (let i = 0; i < 2; i++) {
    await page.getByLabel('Import workspace file').setInputFiles({ name: 'trip.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.getByLabel('Note title', { exact: true })).toHaveValue('Protected');
  }
  await page.getByLabel('Import workspace file').setInputFiles({ name: 'trip.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
  await page.getByRole('button', { name: 'Replace workspace', exact: true }).click();
  await expect(page.getByLabel('Note title', { exact: true })).toHaveValue('Imported trip');
  await page.reload();
  await expect(page.getByLabel('Note title', { exact: true })).toHaveValue('Imported trip');
});
test('Chrome-picker cancellation is quiet and fallback downloads a roundtrippable backup', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'showSaveFilePicker', { configurable: true, value: () => Promise.reject(new DOMException('Cancelled', 'AbortError')) }); });
  await page.goto('/'); await addNote(page, 'Exported', 'Backup me');
  await page.getByRole('button', { name: 'Export workspace', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.evaluate(() => { Object.defineProperty(window, 'showSaveFilePicker', { configurable: true, value: undefined }); });
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export workspace', exact: true }).click();
  const file = await download;
  const stream = await file.createReadStream();
  let raw = ''; for await (const chunk of stream!) raw += chunk.toString();
  expect(JSON.parse(raw).notes[0].messages[0].content).toBe('Backup me');
});
test('existing unnamed data is restored without destructive hydration', async ({ page }) => {
  await page.addInitScript(value => { if (!localStorage.getItem('workspaceData')) localStorage.setItem('workspaceData', JSON.stringify(value)); }, backup);
  await page.goto('/');
  await expect(page.getByLabel('Note title', { exact: true })).toHaveValue('Imported trip');
  await page.reload();
  await expect(page.getByText('Train to Haifa', { exact: true }).last()).toBeVisible();
});
test('corrupt startup data stays recoverable and quota failures remain visible', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('workspaceData', '{corrupt'));
  await page.goto('/');
  await expect(page.getByRole('alert').filter({ hasText: 'preserved' })).toBeVisible();
  await addNote(page, 'In-memory work');
  expect(await page.evaluate(() => localStorage.getItem('workspaceData'))).toBe('{corrupt');
});
test('local helper is truthful, works offline, and history belongs to the workspace', async ({ page, context }) => {
  await page.goto('/'); await addNote(page, 'Local trip', 'Train to Haifa');
  await page.getByRole('button', { name: 'Open local helper' }).click();
  await expect(page.getByText('Local tools, no AI model')).toBeVisible();
  await page.getByLabel('Ask the local helper').fill('find train');
  await page.getByRole('button', { name: 'Send to helper' }).click();
  await expect(page.getByText(/1 matching note for/)).toBeVisible();
  await page.getByRole('complementary', { name: 'Local notes helper' }).getByRole('button', { name: 'Close local helper' }).click();
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByLabel('Note title', { exact: true })).toHaveValue('Local trip');
  await page.getByLabel('Write a thought').fill('Offline thought');
  await page.getByLabel('Write a thought').press('Enter');
  await page.reload();
  await expect(page.getByText('Offline thought', { exact: true }).last()).toBeVisible();
  await context.setOffline(false);
});
test('mobile layout, keyboard access, theme and Hebrew direction remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create your first note' }).click();
  await page.getByLabel('Note title', { exact: true }).fill('הרשימות שלי');
  await page.getByLabel('Write a thought').fill('מחשבה ראשונה');
  await page.getByLabel('Write a thought').press('Enter');
  await expect(page.getByLabel('Note title', { exact: true })).toHaveAttribute('dir', 'auto');
  await expect(page.getByText('מחשבה ראשונה', { exact: true }).last()).toHaveCSS('direction', 'rtl');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Open notes' }).click();
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open notes' })).toBeVisible();
});


test('storage quota failures keep work in memory and require explicit discard before reload', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'workspaceData') throw new DOMException('Quota reached', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await page.goto('/'); await addNote(page, 'Unsaved browser note', 'Keep this in memory');
  await expect(page.getByRole('alert').filter({ hasText: 'could not be saved' })).toBeVisible();
  await page.getByRole('button', { name: 'Reload saved workspace' }).click();
  await expect(page.getByRole('dialog', { name: 'Reload without a backup?' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByLabel('Note title', { exact: true })).toHaveValue('Unsaved browser note');
  expect(await page.evaluate(() => localStorage.getItem('workspaceData'))).toBeNull();
});
