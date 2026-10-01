// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppContent } from '../src/App';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { llmService } from '../src/utils/llm';
import { WorkspaceStore, createEmptyWorkspace, parseWorkspace } from '../src/utils/workspace';
vi.mock('../src/components/PWAPrompts', () => ({ PWAPrompts: () => null }));
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  HTMLElement.prototype.scrollIntoView = vi.fn();
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
function mount() {
  const store = new WorkspaceStore(localStorage);
  render(<ThemeProvider><AppContent store={store} /></ThemeProvider>);
  return { store, user: userEvent.setup() };
}
async function note(user: ReturnType<typeof userEvent.setup>, title: string) {
  await user.click(screen.getByRole('button', { name: 'New note' }));
  await user.clear(screen.getByLabelText('Note title'));
  await user.type(screen.getByLabelText('Note title'), title);
}
describe('usable note workspace UI', () => {
  it('creates without onboarding, saves rapid titles and unsent drafts through note switching', async () => {
    const { user, store } = mount();
    await note(user, 'First');
    await user.type(screen.getByLabelText('Write a thought'), 'draft kept');
    await note(user, 'Second');
    await user.click(screen.getByRole('button', { name: 'Open note First' }));
    expect((screen.getByLabelText('Write a thought') as HTMLTextAreaElement).value).toBe('draft kept');
    expect(new WorkspaceStore(localStorage).getData().notes.find(n => n.title === 'First')?.draft).toBe('draft kept');
    expect(store.getData().notes.map(n => n.title)).toEqual(['Second', 'First']);
  });
  it('adds, edits, and permanently removes thoughts only after confirmation', async () => {
    const { user, store } = mount(); await note(user, 'Actions');
    await user.type(screen.getByLabelText('Write a thought'), 'original{Enter}');
    await user.click(screen.getByRole('button', { name: 'Edit thought 1' }));
    await user.clear(screen.getByLabelText('Edit thought')); await user.type(screen.getByLabelText('Edit thought'), 'edited');
    await user.click(screen.getByRole('button', { name: 'Done editing' }));
    await user.click(screen.getByRole('button', { name: 'Delete thought 1' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(store.getData().notes[0].messages[0].content).toBe('edited');
    await user.click(screen.getByRole('button', { name: 'Delete thought 1' }));
    await user.click(screen.getByRole('button', { name: 'Delete thought' }));
    expect(new WorkspaceStore(localStorage).getData().notes[0].messages).toHaveLength(0);
  });
  it('tags and search cover real note text and new-note creation clears a restrictive search', async () => {
    const { user, store } = mount(); await note(user, 'Trip');
    await user.type(screen.getByLabelText('Write a thought'), 'Haifa train{Enter}');
    await user.type(screen.getByLabelText('Add a tag'), 'travel{Enter}');
    expect(store.getData().notes[0].tags).toEqual(['travel']);
    for (const query of ['Trip', 'Haifa', 'travel']) {
      await user.clear(screen.getByLabelText('Search notes')); await user.type(screen.getByLabelText('Search notes'), query);
      expect(screen.getByRole('button', { name: 'Open note Trip' })).toBeDefined();
    }
    await user.clear(screen.getByLabelText('Search notes')); await user.type(screen.getByLabelText('Search notes'), 'missing');
    expect(screen.getByText('No matching notes')).toBeDefined();
    await user.click(screen.getByRole('button', { name: 'New note' }));
    expect((screen.getByLabelText('Search notes') as HTMLInputElement).value).toBe('');
  });
  it('cancelled workspace replacement protects all data', async () => {
    const { user, store } = mount(); await note(user, 'Protected');
    await user.click(screen.getByRole('button', { name: 'New workspace' }));
    await user.type(screen.getByLabelText('Workspace name'), 'Replacement');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(store.getData().notes[0].title).toBe('Protected');
    expect(screen.queryByRole('dialog')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'New workspace' }));
    await user.type(screen.getByLabelText('Workspace name'), 'Replacement');
    await user.click(screen.getByRole('button', { name: 'Replace workspace' }));
    expect(store.getData().name).toBe('Replacement');
    expect(store.getData().notes).toHaveLength(0);
  });
  it('Escape closes the mobile note drawer once and never reopens it', async () => {
    const { user } = mount();
    await user.click(screen.getByRole('button', { name: 'Open notes' }));
    expect(screen.getByRole('dialog', { name: 'Notes' }).className).toContain('open');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Notes' })).toBeNull();
  });
  it('Escape on a confirmation cannot close the helper underneath', async () => {
    const { user } = mount(); await note(user, 'Helper');
    await user.click(screen.getByRole('button', { name: 'Open local helper' }));
    await user.click(screen.getByRole('button', { name: 'Overview of my notes' }));
    await waitFor(() => expect(screen.getByText(/Workspace overview/)).toBeDefined());
    await user.click(screen.getByRole('button', { name: 'Clear helper history' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByLabelText('Ask the local helper')).toBeDefined();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText(/Workspace overview/)).toBeDefined();
  });
  it('cannot leak an interrupted helper response into a replacement workspace', async () => {
    let complete!: (value: string) => void;
    vi.spyOn(llmService, 'chatWithNotes').mockImplementation(() => new Promise(resolve => { complete = resolve; }));
    const { user, store } = mount(); await note(user, 'Old workspace');
    await user.click(screen.getByRole('button', { name: 'Open local helper' }));
    await user.type(screen.getByLabelText('Ask the local helper'), 'overview{Enter}');
    expect(store.getData().chatMessages).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'New workspace' }));
    await user.type(screen.getByLabelText('Workspace name'), 'New workspace');
    await user.click(screen.getByRole('button', { name: 'Replace workspace' }));
    complete('Old workspace reply must not leak');
    await waitFor(() => expect(store.getData().chatMessages).toHaveLength(0));
    expect(store.getData().name).toBe('New workspace');
  });
  it('hydrates pre-existing unnamed data without overwriting on render', () => {
    const saved = createEmptyWorkspace(); saved.notes = [{ id: 'note', title: 'Restored', messages: [], tags: ['old'], createdAt: new Date(), updatedAt: new Date() }];
    localStorage.setItem('workspaceData', JSON.stringify(saved));
    const original = localStorage.getItem('workspaceData');
    mount();
    expect((screen.getByLabelText('Note title') as HTMLInputElement).value).toBe('Restored');
    expect(localStorage.getItem('workspaceData')).toBe(original);
    expect(parseWorkspace(original!).notes[0].tags).toEqual(['old']);
  });
  it('does not reload away unsaved work without an explicit discard confirmation', async () => {
    const failingStorage = { getItem: (key: string) => localStorage.getItem(key), setItem: () => { throw new Error('quota'); } };
    const store = new WorkspaceStore(failingStorage);
    render(<ThemeProvider><AppContent store={store} /></ThemeProvider>);
    const user = userEvent.setup();
    await note(user, 'Unsaved');
    await user.click(screen.getByRole('button', { name: 'Reload saved workspace' }));
    expect(screen.getByRole('dialog', { name: 'Reload without a backup?' })).toBeDefined();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(store.getData().notes[0].title).toBe('Unsaved');
  });
  it('protects failed deletion of the final note even when the in-memory workspace is empty', async () => {
    const { user, store } = mount(); await note(user, 'Last note');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    await user.click(screen.getByRole('button', { name: 'Delete note' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete note' }));
    expect(store.getData().notes).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Reload saved workspace' }));
    expect(screen.getByRole('dialog', { name: 'Reload without a backup?' })).toBeDefined();
    const leaving = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(leaving);
    expect(leaving.defaultPrevented).toBe(true);
  });
  it('keeps corrupt original data and displays a recovery action', async () => {
    localStorage.setItem('workspaceData', '{damaged');
    const { user } = mount();
    expect(screen.getByRole('button', { name: 'Download recovery file' })).toBeDefined();
    await note(user, 'Temporary');
    expect(localStorage.getItem('workspaceData')).toBe('{damaged');
  });
});
