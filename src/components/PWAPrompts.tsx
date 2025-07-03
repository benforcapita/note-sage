import React from 'react';
import { Download, RefreshCw, WifiOff, X } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

export const PWAPrompts: React.FC = () => {
  const { isInstallable, showInstallPrompt, hasUpdate, updateApp, isOnline } = usePWA();
  const [showInstallBanner, setShowInstallBanner] = React.useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = React.useState(false);
  const [showOfflineBanner, setShowOfflineBanner] = React.useState(false);

  React.useEffect(() => {
    if (isInstallable) {
      setShowInstallBanner(true);
    }
  }, [isInstallable]);

  React.useEffect(() => {
    if (hasUpdate) {
      setShowUpdateBanner(true);
    }
  }, [hasUpdate]);

  React.useEffect(() => {
    if (!isOnline) {
      setShowOfflineBanner(true);
    } else {
      setShowOfflineBanner(false);
    }
  }, [isOnline]);

  const handleInstall = async () => {
    await showInstallPrompt();
    setShowInstallBanner(false);
  };

  const handleUpdate = () => {
    updateApp();
    setShowUpdateBanner(false);
  };

  return (
    <>
      {/* Install Banner */}
      {showInstallBanner && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-lg shadow-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Download size={20} />
            <div>
              <p className="font-medium">Install NoteSage</p>
              <p className="text-sm opacity-90">Install this app for a better experience</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleInstall}
              className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Install
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Update Banner */}
      {showUpdateBanner && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-green-600 text-white p-4 rounded-lg shadow-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <RefreshCw size={20} />
            <div>
              <p className="font-medium">Update Available</p>
              <p className="text-sm opacity-90">A new version of NoteSage is ready</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleUpdate}
              className="bg-white text-green-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Update
            </button>
            <button
              onClick={() => setShowUpdateBanner(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Offline Banner */}
      {showOfflineBanner && (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-yellow-600 text-white p-3 rounded-lg shadow-lg flex items-center space-x-3">
          <WifiOff size={20} />
          <div>
            <p className="font-medium">You're offline</p>
            <p className="text-sm opacity-90">Some features may not be available</p>
          </div>
        </div>
      )}
    </>
  );
};