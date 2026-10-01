import type { Note, NoteMessage, ChatMessage } from '../types';

export interface WorkspaceData {
  id: string;
  name: string;
  notes: Note[];
  chatMessages: ChatMessage[];
  version: string;
  lastUpdated: string;
}
export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
export const MAX_WORKSPACE_BYTES = 10 * 1024 * 1024;
const VERSION = '1.1.0';
const KEY = 'workspaceData';

export function createEmptyWorkspace(name = 'My workspace'): WorkspaceData {
  return { id: crypto.randomUUID(), name, notes: [], chatMessages: [], version: VERSION, lastUpdated: new Date().toISOString() };
}
function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value as Record<string, unknown>;
}
function string(value: unknown, label: string, max = 1_000_000): string {
  if (typeof value !== 'string' || value.length > max) throw new Error(`${label} must be text (up to ${max.toLocaleString()} characters).`);
  return value;
}
function id(value: unknown, label: string): string {
  const result = string(value, label, 200);
  if (!result.trim()) throw new Error(`${label} cannot be empty.`);
  return result;
}
function date(value: unknown, label: string): Date {
  if (typeof value !== 'string' || !value.trim() || !Number.isFinite(new Date(value).getTime())) throw new Error(`${label} is not a valid date.`);
  return new Date(value);
}
function array(value: unknown, label: string, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max) throw new Error(`${label} must be a list (up to ${max.toLocaleString()} items).`);
  return value;
}
function unique<T extends { id: string }>(values: T[], label: string): T[] {
  if (new Set(values.map(value => value.id)).size !== values.length) throw new Error(`${label} contains duplicate IDs.`);
  return values;
}
function parseNote(value: unknown): Note {
  const note = record(value, 'Note');
  const messages = unique(array(note.messages ?? [], 'Messages', 100_000).map(value => {
    const message = record(value, 'Message');
    if (message.type !== undefined && message.type !== 'message') throw new Error('Unknown note message type.');
    return { id: id(message.id, 'Message ID'), type: 'message', content: string(message.content, 'Message'), timestamp: date(message.timestamp, 'Message date') } satisfies NoteMessage;
  }), 'Messages');
  return {
    id: id(note.id, 'Note ID'), title: string(note.title, 'Title', 500),
    createdAt: date(note.createdAt, 'Created date'), updatedAt: date(note.updatedAt, 'Updated date'),
    tags: [...new Set(array(note.tags ?? [], 'Tags', 100).map(tag => string(tag, 'Tag', 100)))],
    messages, ...(note.draft === undefined ? {} : { draft: string(note.draft, 'Draft') }),
  };
}

/** Validate the whole file before anything can touch the active workspace. */
export function parseWorkspace(raw: string): WorkspaceData {
  if (new TextEncoder().encode(raw).length > MAX_WORKSPACE_BYTES) throw new Error('Workspace files must be smaller than 10 MB.');
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('This file is not valid JSON. Choose a NoteSage workspace backup.'); }
  const data = record(value, 'Workspace');
  if (data.version !== '1.0.0' && data.version !== VERSION) throw new Error('Unsupported workspace version. Supported versions: 1.0.0 and 1.1.0.');
  const notes = unique(array(data.notes, 'Notes', 5000).map(parseNote), 'Notes');
  const chatMessages = unique(array(data.chatMessages ?? [], 'Helper history', 100_000).map(value => {
    const message = record(value, 'Helper message');
    if (message.type !== 'user' && message.type !== 'assistant') throw new Error('Unknown helper message type.');
    return { id: id(message.id, 'Helper message ID'), type: message.type, content: string(message.content, 'Helper message'), timestamp: date(message.timestamp, 'Helper date') } satisfies ChatMessage;
  }), 'Helper history');
  const normalized = {
    id: data.id === undefined ? 'legacy-workspace' : id(data.id, 'Workspace ID'),
    name: data.name === undefined ? 'My workspace' : string(data.name, 'Workspace name', 100),
    notes, chatMessages, version: VERSION, lastUpdated: date(data.lastUpdated, 'Workspace date').toISOString(),
  };
  if (new TextEncoder().encode(JSON.stringify(normalized)).length > MAX_WORKSPACE_BYTES) throw new Error('This workspace exceeds the 10 MB limit after normalization.');
  return normalized;
}
export function serializeWorkspace(data: WorkspaceData): string { return JSON.stringify(data); }

/** One synchronous persistence boundary. React never writes on hydration. */
export class WorkspaceStore {
  private data = createEmptyWorkspace();
  private lastRaw: string | null = null;
  private blocked = false;
  error: string | null = null;
  unsaved = false;
  recoveryText: string | null = null;

  constructor(private storage?: StorageLike) {
    if (!storage) { this.error = 'Browser storage is unavailable. Export a backup before closing this tab.'; return; }
    try {
      this.lastRaw = storage.getItem(KEY);
      if (this.lastRaw !== null) {
        this.data = parseWorkspace(this.lastRaw);
        if (this.data.name === 'My workspace') {
          const oldName = storage.getItem('currentWorkspaceFile');
          if (oldName) this.data.name = oldName.replace(/\.json$/i, '').slice(0, 100);
        }
      } else {
        const legacy = storage.getItem('notes');
        if (legacy) {
          this.recoveryText = legacy;
          this.data = { ...this.data, notes: unique(array(JSON.parse(legacy), 'Legacy notes', 5000).map(parseNote), 'Notes') };
          this.recoveryText = null;
        }
      }
    } catch {
      this.recoveryText = this.lastRaw ?? this.recoveryText;
      this.blocked = true;
      this.error = 'Your saved workspace could not be read. The original data is preserved. Download a recovery file or import a valid backup.';
    }
  }
  getData(): WorkspaceData { return this.data; }
  update(data: WorkspaceData): boolean {
    const candidate = { ...data, version: VERSION, lastUpdated: new Date().toISOString() };
    try { parseWorkspace(serializeWorkspace(candidate)); } catch (error) {
      this.error = `Workspace limit reached: ${error instanceof Error ? error.message : 'Invalid data.'} Your previous work is preserved.`;
      return false;
    }
    this.data = candidate;
    this.unsaved = true;
    this.persist();
    return true;
  }
  replace(data: WorkspaceData): boolean {
    // Validate the final replacement, including its new identity, before touching recovery state.
    const candidate = { ...data, id: crypto.randomUUID(), version: VERSION, lastUpdated: new Date().toISOString() };
    try { parseWorkspace(serializeWorkspace(candidate)); } catch (error) {
      this.error = `Workspace could not be replaced: ${error instanceof Error ? error.message : 'Invalid data.'} Your current work is preserved.`;
      return false;
    }
    this.blocked = false;
    try { this.lastRaw = this.storage?.getItem(KEY) ?? null; } catch { /* persist will expose storage failure */ }
    return this.update(candidate);
  }
  private persist(): void {
    if (this.blocked) return;
    try {
      if (!this.storage) throw new Error('unavailable');
      if (this.storage.getItem(KEY) !== this.lastRaw) {
        this.error = 'Another tab changed this workspace. Export your current changes, then reload this tab before editing again.';
        this.blocked = true;
        return;
      }
      const raw = serializeWorkspace(this.data);
      this.storage.setItem(KEY, raw);
      this.lastRaw = raw;
      this.error = null;
      this.unsaved = false;
      this.recoveryText = null;
    } catch {
      this.error = 'Changes could not be saved to browser storage. Your work is still in this tab. Export a backup before closing it.';
    }
  }
}
function browserStorage(): StorageLike | undefined {
  try { return typeof window === 'undefined' ? undefined : window.localStorage; } catch { return undefined; }
}
export const workspaceManager = new WorkspaceStore(browserStorage());
