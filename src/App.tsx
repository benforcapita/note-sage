import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, Download, Leaf, X } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { NoteEditor } from './components/NoteEditor';
import { ChatPanel } from './components/ChatPanel';
import { WorkspaceManager } from './components/WorkspaceManager';
import { Dialog } from './components/Dialog';
import { ThemeProvider } from './contexts/ThemeContext';
import { PWAPrompts } from './components/PWAPrompts';
import type { Note, ChatMessage } from './types';
import { createEmptyWorkspace, serializeWorkspace, workspaceManager } from './utils/workspace';
import type { WorkspaceData, WorkspaceStore } from './utils/workspace';
import { downloadFile, exportFile, workspaceFilename } from './utils/files';

type Pending = { type: 'new' } | { type: 'import'; data: WorkspaceData; file: string } | { type: 'delete'; note: Note } | { type: 'clear-helper' } | { type: 'reload'; action: () => void };
export function AppContent({ store = workspaceManager }: { store?: WorkspaceStore }) {
  const [data, setData] = useState(() => store.getData());
  const [selected, setSelected] = useState<string | null>(() => store.getData().notes[0]?.id ?? null);
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [helperOpen, setHelperOpen] = useState(false);
  const [storageError, setStorageError] = useState(store.error);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const generation = useRef(0);
  const noticeTimer = useRef<ReturnType<typeof setTimeout>>();
  const notify = useCallback((text: string, error = false) => {
    clearTimeout(noticeTimer.current);
    setNotice({ text, error });
    if (!error) noticeTimer.current = setTimeout(() => setNotice(null), 6000);
  }, []);
  useEffect(() => () => clearTimeout(noticeTimer.current), []);
  const commit = useCallback((transform: (current: WorkspaceData) => WorkspaceData) => {
    const accepted = store.update(transform(store.getData()));
    setData(store.getData());
    setStorageError(store.error);
    return accepted;
  }, [store]);
  const createNote = useCallback(() => {
    if (store.getData().notes.length >= 5000) { notify('This workspace has reached 5,000 notes. Export a backup and start a new workspace.', true); return; }
    const note: Note = { id: crypto.randomUUID(), title: 'Untitled note', tags: [], messages: [], createdAt: new Date(), updatedAt: new Date(), draft: '' };
    if (!commit(current => ({ ...current, notes: [note, ...current.notes] }))) return;
    setSelected(note.id); setSearch(''); setSidebarOpen(false);
  }, [commit, notify, store]);
  const toggleSidebar = useCallback(() => setSidebarOpen(value => !value), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const closeHelper = useCallback(() => setHelperOpen(false), []);
  useEffect(() => {
    const change = () => setOnline(navigator.onLine);
    const external = (event: StorageEvent) => {
      if (event.key === 'workspaceData') setStorageError('Another tab changed this workspace. Export your current changes, then reload this tab before editing again.');
    };
    const key = (event: KeyboardEvent) => {
      if (document.querySelector('dialog[open]')) return;
      if (event.key === 'Escape') { setSidebarOpen(false); setHelperOpen(false); }
      if (event.metaKey || event.ctrlKey) {
        if (event.key.toLowerCase() === 'n') { event.preventDefault(); createNote(); }
        if (event.key.toLowerCase() === 'k') {
          event.preventDefault();
          if (window.matchMedia('(max-width: 800px)').matches) setSidebarOpen(true);
          setTimeout(() => document.getElementById('note-search')?.focus(), 0);
        }
      }
    };
    window.addEventListener('online', change); window.addEventListener('offline', change); window.addEventListener('storage', external); document.addEventListener('keydown', key);
    return () => { window.removeEventListener('online', change); window.removeEventListener('offline', change); window.removeEventListener('storage', external); document.removeEventListener('keydown', key); };
  }, [createNote]);
  const exportWorkspace = async () => {
    try {
      const result = await exportFile(new Blob([serializeWorkspace(store.getData())], { type: 'application/json' }), workspaceFilename(data.name));
      if (result === 'saved') notify('Workspace backup saved. Keep it somewhere safe.');
      if (result === 'downloaded') notify('Backup download started. Check your browser’s downloads.');
    } catch { notify('The backup could not be saved. Try again or choose another destination.', true); }
  };
  const replace = (next: WorkspaceData) => {
    if (!store.replace(next)) { setStorageError(store.error); notify(store.error || 'Workspace could not be replaced.', true); return; }
    generation.current += 1;
    const stored = store.getData();
    setData(stored); setStorageError(store.error);
    setSelected(stored.notes[0]?.id ?? null); setSearch(''); setPending(null); setSidebarOpen(false); setNotice(null);
  };
  const requestReload = (action: () => void) => {
    if (store.unsaved) setPending({ type: 'reload', action });
    else action();
  };
  const hasUnsavedWork = store.unsaved;
  useEffect(() => {
    if (!hasUnsavedWork) return;
    const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [hasUnsavedWork]);
  const note = data.notes.find(n => n.id === selected) ?? null;
  const hasWork = data.notes.length > 0 || data.chatMessages.length > 0 || store.recoveryText !== null;
  const helperGeneration = generation.current;
  const sendHelperMessage = (message: ChatMessage) => {
    if (helperGeneration !== generation.current) return;
    commit(current => ({ ...current, chatMessages: [...current.chatMessages, message] }));
  };
  return <div className="app-shell">
    <Sidebar notes={data.notes} selectedNoteId={selected} searchQuery={search} onSearchChange={setSearch} onNoteSelect={id => { setSelected(id); setSidebarOpen(false); }} onCreateNote={createNote} isOpen={sidebarOpen} onToggle={toggleSidebar} onClose={closeSidebar} online={online} storageError={!!storageError} />
    <div className={`workspace-main ${helperOpen ? 'with-helper' : ''}`}>
      <WorkspaceManager data={data} onNew={() => { setWorkspaceName(''); setPending({ type: 'new' }); }} onImport={(imported, file) => setPending({ type: 'import', data: imported, file })} onExport={exportWorkspace} onError={text => notify(text, true)} onToggleChat={() => { setHelperOpen(value => !value); setSidebarOpen(false); }} isChatOpen={helperOpen} onOpenNotes={() => { setSidebarOpen(true); setHelperOpen(false); }} />
      {storageError && <div className="storage-warning" role="alert"><AlertCircle size={19} /><div><strong>Keep a backup of your work</strong><p>{storageError}</p><div className="warning-actions">{store.recoveryText && <button onClick={() => downloadFile(new Blob([store.recoveryText!], { type: 'application/json' }), 'notesage-recovery.json')}>Download recovery file</button>}<button onClick={() => requestReload(() => window.location.reload())}>Reload saved workspace</button></div></div></div>}
      <div className="workspace-body"><NoteEditor key={`${data.id}:${note?.id ?? 'empty'}`} note={note} onSave={updated => commit(current => ({ ...current, notes: current.notes.map(n => n.id === updated.id ? updated : n) }))} onDelete={() => note && setPending({ type: 'delete', note })} onCreate={createNote} />
        {helperOpen && <><button className="helper-backdrop" aria-label="Close helper overlay" onClick={closeHelper} /><ChatPanel key={data.id} messages={data.chatMessages} notes={data.notes} onSendMessage={sendHelperMessage} onClose={closeHelper} onClear={() => setPending({ type: 'clear-helper' })} /></>}
      </div>
    </div>
    {notice && <div className={`notice ${notice.error ? 'error' : ''}`} role={notice.error ? 'alert' : 'status'}>{notice.error ? <AlertCircle size={18} /> : <Check size={18} />}<span>{notice.text}</span><button className="icon-button" aria-label="Dismiss notification" onClick={() => setNotice(null)}><X size={16} /></button></div>}
    {pending?.type === 'new' && <Dialog title="A fresh workspace" onClose={() => setPending(null)}><p>{hasWork ? 'This replaces the workspace on this device. Export a backup first if you want to return to your current notes.' : 'Give your notebook a name. Everything saves automatically in this browser.'}</p><form onSubmit={event => { event.preventDefault(); if (workspaceName.trim()) replace(createEmptyWorkspace(workspaceName.trim())); }}><label className="modal-label">Workspace name<input autoFocus aria-label="Workspace name" placeholder="e.g. My everyday notes" maxLength={100} value={workspaceName} onChange={event => setWorkspaceName(event.target.value)} /></label>{hasWork && <div className="replacement-summary"><Leaf size={18} /><span>{data.notes.length} notes and {data.chatMessages.length} helper messages in the current workspace</span></div>}<div className="modal-actions"><button type="button" className="button quiet" onClick={() => setPending(null)}>Cancel</button><button className="button primary" disabled={!workspaceName.trim()}>{hasWork ? 'Replace workspace' : 'Create workspace'}</button></div></form></Dialog>}
    {pending?.type === 'import' && <Dialog title="Import this workspace?" onClose={() => setPending(null)}><p>{hasWork ? 'This replaces the workspace on this device. Export a backup first to keep your current notes.' : 'Restore the notes in this JSON backup to this device.'}</p><div className="import-summary"><Download size={23} /><div><strong>{pending.file}</strong><span>{pending.data.notes.length} notes · {pending.data.notes.reduce((count, n) => count + n.messages.length, 0)} thoughts · {pending.data.chatMessages.length} helper messages</span></div></div><div className="modal-actions"><button className="button quiet" autoFocus onClick={() => setPending(null)}>Cancel</button><button className="button primary" onClick={() => replace({ ...pending.data, name: pending.data.name === 'My workspace' ? pending.file.replace(/\.json$/i, '').slice(0, 100) : pending.data.name })}>Replace workspace</button></div></Dialog>}
    {pending?.type === 'delete' && <Dialog title="Delete this note?" onClose={() => setPending(null)}><p>“{pending.note.title || 'Untitled note'}” and its {pending.note.messages.length} thoughts will be removed from this workspace.</p><div className="modal-actions"><button className="button quiet" autoFocus onClick={() => setPending(null)}>Cancel</button><button className="button destructive" onClick={() => { const deleting = pending.note.id; commit(current => ({ ...current, notes: current.notes.filter(n => n.id !== deleting) })); if (selected === deleting) setSelected(store.getData().notes[0]?.id ?? null); setPending(null); }}>Delete note</button></div></Dialog>}
    {pending?.type === 'reload' && <Dialog title="Reload without a backup?" onClose={() => setPending(null)}><p>Some work has not been saved to browser storage. Export a backup before reloading, or these changes may be lost.</p><div className="modal-actions"><button className="button quiet" autoFocus onClick={() => setPending(null)}>Cancel</button><button className="button quiet" onClick={() => void exportWorkspace()}>Export backup</button></div><button className="button destructive" style={{ width: '100%', marginTop: 12 }} onClick={() => { const action = pending.action; setPending(null); action(); }}>Reload and discard unsaved work</button></Dialog>}
    {pending?.type === 'clear-helper' && <Dialog title="Clear helper history?" onClose={() => setPending(null)}><p>Remove this workspace’s helper conversation. Your notes will stay as they are.</p><div className="modal-actions"><button className="button quiet" autoFocus onClick={() => setPending(null)}>Cancel</button><button className="button destructive" onClick={() => { generation.current += 1; commit(current => ({ ...current, chatMessages: [] })); setPending(null); }}>Clear history</button></div></Dialog>}
    <PWAPrompts saved={!hasUnsavedWork} onReload={requestReload} />
  </div>;
}
export default function App() { return <ThemeProvider><AppContent /></ThemeProvider>; }
