import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, X } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load dismissed state from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('offlineWarningDismissed');
    setIsDismissed(dismissed === 'true');
  }, []);

  // Reset dismissed state when coming back online
  useEffect(() => {
    if (isOnline) {
      setIsDismissed(false);
      localStorage.removeItem('offlineWarningDismissed');
    }
  }, [isOnline]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('offlineWarningDismissed', 'true');
  };

  if (isOnline || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg shadow-lg">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">Offline Mode - Some features may not be available</span>
        <button
          onClick={handleDismiss}
          className="ml-2 p-1 hover:bg-orange-600 rounded-full transition-colors"
          title="Dismiss this warning"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}