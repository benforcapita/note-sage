import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Check, Leaf, MessageSquare, Pencil, Plus, Tag, Trash2, X } from 'lucide-react';
import type { Note } from '../types';
import { Dialog } from './Dialog';
import { detectTextDirection } from '../utils/textDirection';
interface Props { note: Note | null; onSave: (note: Note) => void; onDelete: () => void; onCreate: () => void; }
export function NoteEditor({ note, onSave, onDelete, onCreate }: Props) {
  const [tag, setTag] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (note?.title === 'Untitled note') { titleInput.current?.focus(); titleInput.current?.select(); } }, [note?.id, note?.title]); // Only select a newly created title.
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [note?.messages.length]);
  if (!note) return <main className="editor empty-editor"><div className="empty-art"><Leaf size={43} /><span className="art-dot dot-one" /><span className="art-dot dot-two" /></div><span className="eyebrow">MAKE ROOM FOR YOUR IDEAS</span><h2>Good thoughts deserve<br />a place to grow.</h2><p>A chat-style notebook for the ideas, plans, and little<br className="desktop-only" /> things you want to remember. Private by default.</p><button className="button primary" onClick={onCreate} aria-label="Create your first note"><Plus size={17} />Create your first note</button><div className="empty-details"><span><Check size={14} />Saved as you go</span><span><Check size={14} />Works offline</span><span><Check size={14} />No account needed</span></div></main>;
  const save = (patch: Partial<Note>) => onSave({ ...note, ...patch, updatedAt: new Date() });
  const addTag = () => {
    const value = tag.trim();
    if (!value || note.tags.length >= 100) return;
    if (!note.tags.some(current => current.toLocaleLowerCase() === value.toLocaleLowerCase())) save({ tags: [...note.tags, value] });
    setTag('');
  };
  const addThought = () => {
    if (!note.draft?.trim()) return;
    save({ draft: '', messages: [...note.messages, { id: crypto.randomUUID(), type: 'message', content: note.draft.trim(), timestamp: new Date() }] });
    composer.current?.focus();
  };
  return <main className="editor">
    <div className="editor-meta"><div><span className="breadcrumb">Your notes</span><span className="crumb-divider">/</span><span>{note.messages.length} {note.messages.length === 1 ? 'thought' : 'thoughts'}</span></div><button className="icon-button danger" title="Delete this note" aria-label="Delete note" onClick={onDelete}><Trash2 size={17} /></button></div>
    <section className="note-heading"><input ref={titleInput} className="note-title" aria-label="Note title" placeholder="Untitled note" maxLength={500} value={note.title} dir="auto" onChange={event => save({ title: event.target.value })} /><div className="note-subtitle"><span>Created {note.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span><span className="small-dot" /><span>Last edited {note.updatedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span></div>
      <div className="tags-row">{note.tags.map(value => <span className="tag-chip" key={value}><Tag size={12} /><span dir="auto">{value}</span><button aria-label={`Remove tag ${value}`} onClick={() => save({ tags: note.tags.filter(t => t !== value) })}><X size={12} /></button></span>)}<form className="tag-form" onSubmit={event => { event.preventDefault(); addTag(); }}><Plus size={13} /><input aria-label="Add a tag" placeholder="Add a tag" value={tag} maxLength={100} dir="auto" onChange={event => setTag(event.target.value)} /><button type="submit" className="tag-submit" aria-label="Add tag" disabled={!tag.trim() || note.tags.length >= 100}><Check size={14} /></button></form></div>
    </section>
    <section className="thought-list" aria-label="Note thoughts">
      {!note.messages.length ? <div className="thought-empty"><span><MessageSquare size={23} /></span><h3>Start with a single thought</h3><p>An idea, a reminder, a sentence.<br />Write it below and let the rest follow.</p></div> : <div className="thought-timeline">{note.messages.map((message, index) => <article key={message.id} className="thought-card"><div className="thought-top"><span className="thought-number">{String(index + 1).padStart(2, '0')}</span><time dateTime={message.timestamp.toISOString()}>{message.timestamp.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {message.timestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</time><div className="thought-actions"><button className="icon-button" aria-label={`Edit thought ${index + 1}`} onClick={() => setEditing(message.id)} title="Edit thought"><Pencil size={15} /></button><button className="icon-button danger" aria-label={`Delete thought ${index + 1}`} onClick={() => setDeleting(message.id)} title="Delete thought"><Trash2 size={15} /></button></div></div>
        {editing === message.id ? <div className="thought-edit"><textarea aria-label="Edit thought" dir="auto" autoFocus value={message.content} maxLength={1_000_000} onChange={event => save({ messages: note.messages.map(m => m.id === message.id ? { ...m, content: event.target.value } : m) })} onKeyDown={event => { if (event.key === 'Escape' || (event.key === 'Enter' && (event.ctrlKey || event.metaKey))) setEditing(null); }} /><div><span>Edits save as you type</span><button className="button quiet" onClick={() => setEditing(null)} aria-label="Done editing"><Check size={15} />Done</button></div></div> : <p className="thought-content" dir={detectTextDirection(message.content)}>{message.content || <span className="muted">Empty thought</span>}</p>}
      </article>)}</div>}
      <div ref={end} />
    </section>
    <div className="composer-area"><div className="composer"><textarea ref={composer} aria-label="Write a thought" placeholder="What's on your mind?" rows={2} dir="auto" maxLength={1_000_000} value={note.draft || ''} onChange={event => save({ draft: event.target.value })} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); addThought(); } }} /><button className="send-thought" aria-label="Add thought" disabled={!note.draft?.trim()} onClick={addThought}><ArrowUp size={21} /></button></div><div className="composer-hint"><span><span className="tiny-status" />Your draft is kept with this note</span><span>Enter to add <span className="hint-divider">·</span> Shift + Enter for a new line</span></div></div>
    {deleting && <Dialog title="Delete this thought?" onClose={() => setDeleting(null)}><p>This will remove it from the note. You can cancel to keep it.</p><div className="modal-actions"><button className="button quiet" autoFocus onClick={() => setDeleting(null)}>Cancel</button><button className="button destructive" aria-label="Delete thought" onClick={() => { save({ messages: note.messages.filter(m => m.id !== deleting) }); setDeleting(null); }}>Delete thought</button></div></Dialog>}
  </main>;
}
