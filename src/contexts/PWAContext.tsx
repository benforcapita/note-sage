import React, { createContext, useContext, ReactNode } from 'react';

interface PWAContextType {
  updateSW?: (reloadPage?: boolean) => Promise<void>;
}

const PWAContext = createContext<PWAContextType>({});

interface PWAProviderProps {
  children: ReactNode;
  updateSW?: (reloadPage?: boolean) => Promise<void>;
}

export const PWAProvider: React.FC<PWAProviderProps> = ({ children, updateSW }) => {
  return (
    <PWAContext.Provider value={{ updateSW }}>
      {children}
    </PWAContext.Provider>
  );
};

export const usePWAContext = () => useContext(PWAContext);