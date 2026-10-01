import { describe, expect, it } from 'vitest';
import { WorkspaceStore, parseWorkspace, createEmptyWorkspace, serializeWorkspace } from '../src/utils/workspace';

class MemoryStorage {
  values = new Map<string, string>();
  fail = false;
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { if (this.fail) throw new Error('quota'); this.values.set(key, value); }
}
const fixture = () => ({
  version: '1.0.0', lastUpdated: '2025-07-08T12:00:00.000Z',
  notes: [{ id: 'n1', title: 'Trip', tags: ['travel', 'עברית'], createdAt: '2025-07-07T12:00:00.000Z', updatedAt: '2025-07-08T12:00:00.000Z', draft: 'unfinished thought', messages: [{ id: 'm1', type: 'message', content: 'Book the train', timestamp: '2025-07-08T12:00:00.000Z' }] }],
  chatMessages: [{ id: 'c1', type: 'assistant', content: 'Local overview', timestamp: '2025-07-08T12:00:00.000Z' }],
});

describe('workspace JSON', () => {
  it('roundtrips dates, tags, drafts, and helper history from existing files', () => {
    const data = parseWorkspace(JSON.stringify(fixture()));
    expect(data.notes[0].createdAt).toBeInstanceOf(Date);
    expect(data.notes[0].messages[0].timestamp).toBeInstanceOf(Date);
    expect(parseWorkspace(serializeWorkspace(data))).toEqual(data);
    expect(data.notes[0].tags).toEqual(['travel', 'עברית']);
    expect(data.notes[0].draft).toBe('unfinished thought');
  });
  it.each([
    '{oops', '[]', '{"notes":[]}',
    JSON.stringify({ ...fixture(), version: '99.0.0' }),
    JSON.stringify({ ...fixture(), notes: [fixture().notes[0], fixture().notes[0]] }),
    JSON.stringify({ ...fixture(), notes: [{ ...fixture().notes[0], tags: 'wrong' }] }),
    JSON.stringify({ ...fixture(), notes: [{ ...fixture().notes[0], updatedAt: 'bad date' }] }),
    JSON.stringify({ ...fixture(), chatMessages: [{ ...fixture().chatMessages[0], type: 'system' }] }),
  ])('rejects invalid files: %s', (raw) => expect(() => parseWorkspace(raw)).toThrow());
  it('does not preserve unexpected object keys or prototype-like payloads', () => {
    const data = parseWorkspace(JSON.stringify({ ...fixture(), token: 'never keep', notes: [{ ...fixture().notes[0], owner: 'unexpected' }] }));
    expect(data).not.toHaveProperty('token');
    expect(data.notes[0]).not.toHaveProperty('owner');
  });
});

describe('workspace persistence', () => {
  it('hydrates unnamed workspaces before any write and immediately persists mutations', () => {
    const storage = new MemoryStorage();
    storage.setItem('workspaceData', JSON.stringify(fixture()));
    const store = new WorkspaceStore(storage);
    expect(store.getData().notes).toHaveLength(1);
    expect(storage.getItem('workspaceData')).toBe(JSON.stringify(fixture()));
    store.update({ ...store.getData(), notes: [{ ...store.getData().notes[0], title: 'Edited immediately' }] });
    expect(new WorkspaceStore(storage).getData().notes[0].title).toBe('Edited immediately');
  });
  it('migrates the old notes key only when there is no workspace key', () => {
    const storage = new MemoryStorage();
    storage.setItem('notes', JSON.stringify(fixture().notes));
    const store = new WorkspaceStore(storage);
    expect(store.getData().notes).toHaveLength(1);
    store.update(store.getData());
    expect(new WorkspaceStore(storage).getData().notes[0].messages[0].content).toBe('Book the train');
  });
  it('never overwrites corrupt saved data without explicit replacement', () => {
    const storage = new MemoryStorage();
    storage.setItem('workspaceData', '{damaged');
    const store = new WorkspaceStore(storage);
    expect(store.error).toMatch(/recover|read/i);
    expect(store.recoveryText).toBe('{damaged');
    store.update(createEmptyWorkspace());
    expect(storage.getItem('workspaceData')).toBe('{damaged');
    store.replace(createEmptyWorkspace('Fresh'));
    expect(new WorkspaceStore(storage).getData().name).toBe('Fresh');
  });
  it('makes quota failures visible while retaining in-memory notes for export', () => {
    const storage = new MemoryStorage();
    const store = new WorkspaceStore(storage);
    storage.fail = true;
    store.update(parseWorkspace(JSON.stringify(fixture())));
    expect(store.error).toMatch(/save|storage/i);
    expect(parseWorkspace(serializeWorkspace(store.getData())).notes).toHaveLength(1);
  });
  it('refuses to overwrite newer data saved by a different tab', () => {
    const storage = new MemoryStorage();
    const first = new WorkspaceStore(storage);
    const second = new WorkspaceStore(storage);
    first.update(createEmptyWorkspace('First'));
    second.update(createEmptyWorkspace('Second'));
    expect(second.error).toMatch(/tab/i);
    expect(new WorkspaceStore(storage).getData().name).toBe('First');
  });
});

describe('export and mutation bounds', () => {
  it('keeps a large valid compact import importable after serialization', () => {
    const messages = Array.from({ length: 100_000 }, (_, i) => ({ id: `c${i}`, type: 'user', content: '', timestamp: '2025-01-01T00:00:00.000Z' }));
    const raw = JSON.stringify({ ...fixture(), chatMessages: messages });
    const data = parseWorkspace(raw);
    expect(() => parseWorkspace(serializeWorkspace(data))).not.toThrow();
  });
  it('does not accept in-memory mutations that make the saved workspace unrestorable', () => {
    const storage = new MemoryStorage();
    const store = new WorkspaceStore(storage);
    store.update(parseWorkspace(JSON.stringify(fixture())));
    store.update({ ...store.getData(), notes: [{ ...store.getData().notes[0], title: 'x'.repeat(501) }] });
    expect(store.error).toMatch(/limit|title|characters/i);
    expect(store.getData().notes[0].title).toBe('Trip');
    expect(new WorkspaceStore(storage).getData().notes[0].title).toBe('Trip');
  });
});

describe('transactional replacement', () => {
  it('retains corrupt originals and blocked writes when a replacement is rejected', () => {
    const storage = new MemoryStorage(); storage.setItem('workspaceData', '{broken');
    const store = new WorkspaceStore(storage);
    const invalid = { ...createEmptyWorkspace('Bad'), name: 'x'.repeat(101) };
    expect(store.replace(invalid)).toBe(false);
    expect(store.recoveryText).toBe('{broken');
    store.update(createEmptyWorkspace('Must not overwrite'));
    expect(storage.getItem('workspaceData')).toBe('{broken');
  });
});


describe('unsaved state', () => {
  it('tracks an empty in-memory workspace as unsaved when the last note deletion cannot persist', () => {
    const storage = new MemoryStorage(); const store = new WorkspaceStore(storage);
    store.update(parseWorkspace(JSON.stringify(fixture())));
    expect(store.unsaved).toBe(false);
    storage.fail = true;
    store.update({ ...store.getData(), notes: [], chatMessages: [] });
    expect(store.unsaved).toBe(true);
    expect(new WorkspaceStore(storage).getData().notes).toHaveLength(1);
    storage.fail = false; store.update(store.getData());
    expect(store.unsaved).toBe(false);
    expect(new WorkspaceStore(storage).getData().notes).toHaveLength(0);
  });
});
