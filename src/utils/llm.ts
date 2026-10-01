import type { Note } from '../types';

const recent = (notes: Note[]) => [...notes].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
const title = (note: Note) => note.title || 'Untitled note';

/** Deterministic local tools, not an AI model. No text leaves the browser. */
export class LLMService {
  async generateSummary(notes: Note[]): Promise<string> {
    if (!notes.length) return 'Your workspace is empty. Create a note and add a thought to get started.';
    const count = notes.reduce((sum, note) => sum + note.messages.length, 0);
    const tags = [...new Set(notes.flatMap(note => note.tags))];
    return `Workspace overview\n${notes.length} notes · ${count} messages${tags.length ? ` · ${tags.length} tags` : ''}\n\nRecently updated:\n${recent(notes).slice(0, 5).map(note => `• ${title(note)}: ${note.messages.length} messages${note.messages[0] ? `\n  ${note.messages[0].content.slice(0, 180)}${note.messages[0].content.length > 180 ? '…' : ''}` : ''}`).join('\n')}\n\n${tags.length ? `Tags: ${tags.slice(0, 12).join(', ')}\n\n` : ''}This is a local overview with excerpts, not an AI-generated summary.`;
  }
  async chatWithNotes(message: string, notes: Note[]): Promise<string> {
    const query = message.trim();
    if (/^(find|search)(?:\s+(?:for|notes about))?\s+/i.test(query)) {
      const term = query.replace(/^(find|search)(?:\s+(?:for|notes about))?\s+/i, '').replace(/^['"]|['"]$/g, '').trim();
      if (!term) return 'Try “find travel” with a word or phrase from your notes.';
      const lower = term.toLocaleLowerCase();
      const matches = recent(notes).filter(note => [note.title, ...note.tags, ...note.messages.map(m => m.content)].some(text => text.toLocaleLowerCase().includes(lower)));
      if (!matches.length) return `No matching notes for “${term}”. I search exact words and phrases in titles, tags, and messages.`;
      return `${matches.length} matching ${matches.length === 1 ? 'note' : 'notes'} for “${term}”:\n\n${matches.slice(0, 10).map(note => {
        const excerpt = note.messages.find(m => m.content.toLocaleLowerCase().includes(lower))?.content;
        return `• ${title(note)}${excerpt ? `\n  ${excerpt.slice(0, 280)}${excerpt.length > 280 ? '…' : ''}` : '\n  Matches the title or tags'} `;
      }).join('\n\n')}${matches.length > 10 ? '\n\nShowing the first 10 matches. Narrow your search for more.' : ''}`;
    }
    if (/\b(summary|summarize|overview)\b/i.test(query)) return this.generateSummary(notes);
    if (/\b(count|how many|stats)\b/i.test(query)) return `You have ${notes.length} notes with ${notes.reduce((sum, n) => sum + n.messages.length, 0)} messages in this workspace.`;
    if (/\b(recent|latest)\b/i.test(query)) return notes.length ? `Most recently updated:\n${recent(notes).slice(0, 5).map(note => `• ${title(note)} · ${note.updatedAt.toLocaleDateString()}`).join('\n')}` : 'No notes yet. Create your first note to begin.';
    if (/\b(export|download|backup)\b/i.test(query)) return 'Choose Export in the workspace toolbar to save a JSON backup of all notes, tags, drafts, and helper history. Choose Import to restore a backup. Files are manual backups; they are not automatically updated.';
    return 'I’m a local keyword helper, not an AI model. Nothing leaves your browser.\n\nTry:\n• “overview” for counts and note excerpts\n• “find travel” to search exact words or phrases\n• “recent notes” for your latest updates\n• “export” for backup instructions';
  }
}
export const llmService = new LLMService();
