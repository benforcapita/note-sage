import { useRef, useState } from 'react';
import { FolderOpen, Plus, Download, Leaf, Menu, PanelRight } from 'lucide-react';
import { parseWorkspace, MAX_WORKSPACE_BYTES } from '../utils/workspace';
import type { WorkspaceData } from '../utils/workspace';

interface Props {
  data: WorkspaceData;
  onImport: (data: WorkspaceData, name: string) => void;
  onNew: () => void;
  onExport: () => Promise<void>;
  onError: (message: string) => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
  onOpenNotes: () => void;
}
export function WorkspaceManager({ data, onImport, onNew, onExport, onError, onToggleChat, isChatOpen, onOpenNotes }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || loading) return;
    setLoading(true);
    try {
      if (file.size > MAX_WORKSPACE_BYTES) throw new Error('Workspace files must be smaller than 10 MB.');
      const parsed = parseWorkspace(await file.text());
      onImport(parsed, file.name);
    } catch (error) { onError(error instanceof Error ? error.message : 'Unable to read this file.'); }
    finally { setLoading(false); }
  };
  const handleExport = async () => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true);
    try { await onExport(); } finally { busyRef.current = false; setBusy(false); }
  };
  return <header className="workspace-bar">
    <div className="workspace-identity">
      <button className="icon-button mobile-only" aria-label="Open notes" onClick={onOpenNotes}><Menu size={20} /></button>
      <span className="workspace-mark"><Leaf size={20} /></span>
      <div className="workspace-heading"><span className="eyebrow">WORKSPACE</span><strong title={data.name}>{data.name || 'My workspace'}</strong></div>
    </div>
    <nav className="workspace-actions" aria-label="Workspace tools">
      <button className="button quiet" aria-label="New workspace" title="Start a new workspace" onClick={onNew}><Plus size={16} /><span>New workspace</span></button>
      <button className="button quiet" aria-label="Import workspace" title="Import a workspace JSON backup" disabled={loading || busy} onClick={() => fileInput.current?.click()}><FolderOpen size={16} /><span>{loading ? 'Reading…' : 'Import'}</span></button>
      <button className="button export-button" aria-label="Export workspace" title="Export a JSON backup" disabled={busy} onClick={handleExport}><Download size={16} /><span>{busy ? 'Exporting…' : 'Export'}</span></button>
      <span className="toolbar-divider" />
      <button className={`icon-button helper-toggle ${isChatOpen ? 'active' : ''}`} aria-label={isChatOpen ? 'Close local helper' : 'Open local helper'} title="Local notes helper" aria-expanded={isChatOpen} onClick={onToggleChat}><PanelRight size={19} /></button>
    </nav>
    <input ref={fileInput} className="sr-only" tabIndex={-1} type="file" accept=".json,application/json" aria-label="Import workspace file" onChange={handleImport} />
  </header>;
}
