import { useEffect, useRef } from 'react';
import { Search, Plus, Leaf, X, ArrowUpRight, FileText, WifiOff, HardDrive, Trash2 } from 'lucide-react';
import type { Note } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { PWAInstallButton } from './PWAInstallButton';
import { detectTextDirection } from '../utils/textDirection';
interface Props {
  notes: Note[]; selectedNoteId: string | null; searchQuery: string;
  onSearchChange: (value: string) => void; onNoteSelect: (id: string) => void; onCreateNote: () => void;
  isOpen: boolean; onToggle: () => void; onClose: () => void; online: boolean; storageError: boolean;
}
export function Sidebar({ notes, selectedNoteId, searchQuery, onSearchChange, onNoteSelect, onCreateNote, isOpen, onToggle, onClose, online, storageError }: Props) {
  const panel = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement;
    close.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.querySelector('dialog[open]')) { onClose(); event.preventDefault(); }
      if (event.key === 'Tab') {
        const elements = panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input');
        if (!elements?.length) return;
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { last.focus(); event.preventDefault(); }
        else if (!event.shiftKey && document.activeElement === last) { first.focus(); event.preventDefault(); }
      }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); previous?.focus(); };
  }, [isOpen, onClose]);
  const filtered = [...notes].filter(note => [note.title, ...note.tags, ...note.messages.map(m => m.content)].some(text => text.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase().trim()))).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  return <>
    {isOpen && <button className="drawer-backdrop" aria-label="Close notes" onClick={onToggle} />}
    <aside ref={panel} className={`sidebar ${isOpen ? 'open' : ''}`} aria-label="Notes" role={isOpen ? 'dialog' : undefined} aria-modal={isOpen || undefined}>
      <div className="brand"><span className="brand-icon"><Leaf size={22} /></span><div><h1>note<span>sage</span></h1><p>A little space for your mind</p></div><button ref={close} className="icon-button mobile-only close-sidebar" aria-label="Close notes" onClick={onToggle}><X size={19} /></button></div>
      <div className="sidebar-tools"><label className="search-field"><Search size={17} /><input id="note-search" aria-label="Search notes" placeholder="Search your notes" value={searchQuery} onChange={event => onSearchChange(event.target.value)} dir="auto" />{searchQuery && <button className="icon-button" aria-label="Clear search" onClick={() => onSearchChange('')}><X size={15} /></button>}</label><button className="button primary new-note" onClick={onCreateNote} aria-label="New note"><Plus size={18} /><span>New note</span><span className="shortcut">⌘ / Ctrl + N</span></button></div>
      <div className="list-heading"><span>{searchQuery ? 'SEARCH RESULTS' : 'YOUR NOTES'}</span><span>{filtered.length}</span></div>
      <div className="note-list">
        {!filtered.length ? <div className="list-empty"><FileText size={28} /><strong>{searchQuery ? 'No matching notes' : 'A fresh page awaits'}</strong><p>{searchQuery ? 'Try a different word, title, or tag' : 'Capture an idea with New note'}</p>{searchQuery && <button className="text-button" onClick={() => onSearchChange('')}>Clear search <ArrowUpRight size={14} /></button>}</div> : filtered.map(note => <button key={note.id} aria-label={`Open note ${note.title || 'Untitled note'}`} aria-current={note.id === selectedNoteId ? 'page' : undefined} className={`note-card ${note.id === selectedNoteId ? 'selected' : ''}`} onClick={() => onNoteSelect(note.id)}>
          <span className="note-card-top"><span className="note-card-title" dir={detectTextDirection(note.title)}>{note.title || 'Untitled note'}</span><span className="note-count">{note.messages.length}</span></span>
          <span className="note-preview" dir="auto">{note.messages[note.messages.length - 1]?.content || note.draft || 'No thoughts yet. Start with one.'}</span>
          <span className="note-card-bottom"><time dateTime={note.updatedAt.toISOString()}>{note.updatedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time>{note.tags[0] && <span className="mini-tag" dir="auto">{note.tags[0]}</span>}</span>
        </button>)}
      </div>
      <div className="sidebar-footer"><div className="local-status"><span className={`status-dot ${storageError ? 'warning' : ''}`} />{storageError ? <Trash2 size={14} /> : online ? <HardDrive size={14} /> : <WifiOff size={14} />}<span>{storageError ? 'Backup needed' : online ? 'Saved on this device' : 'Offline · stored on this device'}</span></div><div className="footer-tools"><PWAInstallButton /><ThemeToggle /></div><p>Your notes stay in your browser. Export a backup to keep them safe.</p></div>
    </aside>
  </>;
}
