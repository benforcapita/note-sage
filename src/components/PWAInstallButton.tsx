import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Dialog } from './Dialog';
interface InstallEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
export function PWAInstallButton() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [instructions, setInstructions] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setInstalled(window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    const before = (event: Event) => { event.preventDefault(); setPrompt(event as InstallEvent); };
    const after = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener('beforeinstallprompt', before); window.addEventListener('appinstalled', after);
    return () => { window.removeEventListener('beforeinstallprompt', before); window.removeEventListener('appinstalled', after); };
  }, []);
  const install = async () => {
    if (!prompt) { setInstructions(true); return; }
    if (busy) return;
    setBusy(true);
    try { await prompt.prompt(); const choice = await prompt.userChoice; if (choice.outcome === 'accepted') setInstalled(true); } catch { setInstructions(true); }
    finally { setPrompt(null); setBusy(false); }
  };
  return <>{installed ? <span className="install-button"><Download size={14} />Installed app</span> : <button className="install-button" onClick={install} disabled={busy}><Download size={14} />{prompt ? 'Install app' : 'Install options'}</button>}{instructions && <Dialog title="Keep NoteSage close" onClose={() => setInstructions(false)}><p>Installation is optional. After one online visit, the production app caches itself for offline use in supported browsers.</p><ul className="install-instructions"><li>Chrome or Edge: look for Install in the address bar or browser menu.</li><li>iPhone or iPad: open in Safari, tap Share, then Add to Home Screen.</li><li>Safari on a supported Mac: File → Add to Dock.</li><li>If your browser has no install option, bookmark this page instead.</li></ul><p>Notes belong to this browser and device. Export a backup before clearing browsing data or switching devices.</p><div className="modal-actions"><button autoFocus className="button primary" onClick={() => setInstructions(false)}>Got it</button></div></Dialog>}</>;
}
