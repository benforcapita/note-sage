import { useRegisterSW } from 'virtual:pwa-register/react';
export function PWAPrompts({ saved, onReload }: { saved: boolean; onReload: (action: () => void) => void }) {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW();
  if (!needRefresh) return null;
  return <div className="pwa-update" role="status"><strong>A fresh version is ready</strong><p>{saved ? 'Your notes and drafts are saved in this browser. Reload to use the latest app.' : 'Some changes are only in this tab. Export a backup before reloading.'}</p><div><button className="button primary" onClick={() => onReload(() => void updateServiceWorker(true))}>Reload app</button><button className="button quiet" onClick={() => setNeedRefresh(false)}>Later</button></div></div>;
}
