import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Leaf, Search, X, List, Clock, Trash2 } from 'lucide-react';
import type { ChatMessage, Note } from '../types';
import { llmService } from '../utils/llm';
import { detectTextDirection } from '../utils/textDirection';
interface Props { messages: ChatMessage[]; notes: Note[]; onSendMessage: (message: ChatMessage) => void; onClose: () => void; onClear: () => void; }
export function ChatPanel({ messages, notes, onSendMessage, onClose, onClear }: Props) {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const active = useRef(true);
  const sending = useRef(false);
  const end = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages.length]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const closeButton = panel.current?.querySelector<HTMLButtonElement>('[aria-label="Close local helper"]');
    closeButton?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.querySelector('dialog[open]')) { onClose(); event.preventDefault(); }
      if (event.key === 'Tab' && window.matchMedia('(max-width: 1100px)').matches) {
        const elements = panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]), textarea:not([disabled])');
        if (!elements?.length) return;
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { last.focus(); event.preventDefault(); }
        else if (!event.shiftKey && document.activeElement === last) { first.focus(); event.preventDefault(); }
      }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); previous?.focus(); };
  }, [onClose]);
  const send = async (query = input) => {
    if (!query.trim() || sending.current) return;
    sending.current = true; setBusy(true); setInput('');
    onSendMessage({ id: crypto.randomUUID(), type: 'user', content: query.trim(), timestamp: new Date() });
    try {
      const response = await llmService.chatWithNotes(query, notes);
      if (active.current) onSendMessage({ id: crypto.randomUUID(), type: 'assistant', content: response, timestamp: new Date() });
    } finally { if (active.current) setBusy(false); sending.current = false; }
  };
  return <aside ref={panel} className="helper-panel" aria-label="Local notes helper">
    <div className="helper-header"><span className="helper-symbol"><Leaf size={19} /></span><div><h2>A little help</h2><p>Local tools, no AI model</p></div><button className="icon-button" aria-label="Clear helper history" title="Clear helper history" disabled={!messages.length} onClick={onClear}><Trash2 size={16} /></button><button className="icon-button" aria-label="Close local helper" onClick={onClose}><X size={19} /></button></div>
    <p className="helper-privacy"><span className="status-dot" />Works offline. Your notes never leave this browser.</p>
    <div className="helper-messages" aria-live="polite">
      {!messages.length && <div className="helper-welcome"><span className="eyebrow">A FRESH PERSPECTIVE</span><h3>Find your way<br />through your thoughts.</h3><p>Get a simple overview, find a phrase, or pick up where you left off.</p><div className="helper-suggestions"><button onClick={() => send('overview')}><List size={17} /><span>Overview of my notes</span></button><button onClick={() => send('recent notes')}><Clock size={17} /><span>What did I write recently?</span></button><button onClick={() => { setInput('find '); panel.current?.querySelector<HTMLTextAreaElement>('textarea')?.focus(); }}><Search size={17} /><span>Find a word or phrase</span></button></div><p className="helper-limit">This helper uses exact keyword matching and excerpts. It doesn’t generate answers or infer meaning.</p></div>}
      {messages.map(message => <div className={`helper-message ${message.type}`} key={message.id}><span className="message-author">{message.type === 'user' ? 'YOU' : 'LOCAL HELPER'}</span><p dir={detectTextDirection(message.content)}>{message.content}</p><time dateTime={message.timestamp.toISOString()}>{message.timestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</time></div>)}
      {busy && <span className="muted">Reading your notes…</span>}<div ref={end} />
    </div>
    <form className="helper-composer" onSubmit={event => { event.preventDefault(); void send(); }}><textarea aria-label="Ask the local helper" placeholder="Try “find travel”" dir="auto" rows={2} maxLength={1000} value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }} /><button aria-label="Send to helper" className="send-thought" disabled={!input.trim() || busy}><ArrowUp size={19} /></button></form>
  </aside>;
}
