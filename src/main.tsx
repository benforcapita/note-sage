import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { PWAProvider } from './contexts/PWAContext';
import './index.css';

// PWA Auto-Update Registration
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    // Show update available notification - this will be handled by the PWA components
    console.log('PWA update available');
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('pwa-update-available'));
  },
  onOfflineReady() {
    // Show ready to work offline notification
    console.log('PWA ready to work offline');
    window.dispatchEvent(new CustomEvent('pwa-offline-ready'));
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PWAProvider updateSW={updateSW}>
      <App />
    </PWAProvider>
  </StrictMode>
);
