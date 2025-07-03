import React, { useState, useEffect } from 'react';
import { Download, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone || isInWebAppiOS);

    // Show manual instructions after a delay if no install prompt appears
    const timer = setTimeout(() => {
      if (!isInstalled && !deferredPrompt) {
        setShowManualInstructions(true);
      }
    }, 2000);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA install prompt available');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      setShowManualInstructions(false);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA installed');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowManualInstructions(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled, deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted PWA install');
        setDeferredPrompt(null);
        setIsInstallable(false);
      } else {
        console.log('User dismissed PWA install');
      }
    } catch (error) {
      console.error('Error during PWA install:', error);
    }
  };

  const handleManualInstallClick = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    
    let message = '';
    
    if (isIOS) {
      message = '📱 To install NoteSage on iOS:\n\n1. Tap the Share button (⬆️) at the bottom\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm\n\nThe app will appear on your home screen!';
    } else if (isAndroid && isChrome) {
      message = '📱 To install NoteSage on Android:\n\n1. Tap the menu (⋮) in the top-right corner\n2. Select "Add to Home screen" or "Install app"\n3. Tap "Add" to confirm\n\nThe app will appear on your home screen!';
    } else if (isChrome) {
      message = '💻 To install NoteSage on Chrome:\n\n1. Look for the install icon (⬇️) in the address bar\n2. Or click the menu (⋮) → "Install NoteSage..."\n3. Click "Install" to confirm\n\nThe app will open in its own window!';
    } else if (isFirefox) {
      message = '🦊 To install NoteSage on Firefox:\n\n1. Click the menu (☰) in the top-right\n2. Select "Install this site as an app"\n3. Click "Install" to confirm\n\nThe app will open in its own window!';
    } else {
      message = '📱 To install NoteSage:\n\n1. Look for an install icon in your browser\'s address bar\n2. Or check your browser\'s menu for "Install" or "Add to Home Screen"\n3. Follow the prompts to install\n\nThe app will work offline once installed!';
    }
    
    alert(message);
  };

  // Don't show button if already installed
  if (isInstalled) {
    return (
      <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-xs">
        <Download className="w-3 h-3" />
        <span>Installed</span>
      </div>
    );
  }

  // Show native install button if available
  if (isInstallable && deferredPrompt) {
    return (
      <button
        onClick={handleInstallClick}
        className="flex items-center space-x-1 px-3 py-2 bg-green-500 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition-all transform hover:scale-105 text-sm font-medium shadow-md"
        title="Install NoteSage as an app"
      >
        <Download className="w-4 h-4" />
        <span>Install</span>
      </button>
    );
  }

  // Show manual install button for other cases
  if (showManualInstructions) {
    return (
      <button
        onClick={handleManualInstallClick}
        className="flex items-center space-x-1 px-3 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-all transform hover:scale-105 text-sm font-medium shadow-md"
        title="Get install instructions"
      >
        <Plus className="w-4 h-4" />
        <span>Install</span>
      </button>
    );
  }

  // Show a minimal loading state initially
  return (
    <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg text-xs">
      <Download className="w-3 h-3" />
      <span>PWA</span>
    </div>
  );
}