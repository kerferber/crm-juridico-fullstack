import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export interface ProcessModalDefaults {
  clientId?: number;
  responsibleId?: number;
}

interface ProcessModalContextValue {
  isOpen: boolean;
  defaults: ProcessModalDefaults | null;
  open: (defaults?: ProcessModalDefaults) => void;
  close: () => void;
}

const ProcessModalContext = createContext<ProcessModalContextValue | undefined>(undefined);

export const ProcessModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [defaults, setDefaults] = useState<ProcessModalDefaults | null>(null);

  const open = useCallback((nextDefaults?: ProcessModalDefaults) => {
    setDefaults(nextDefaults ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setDefaults(null);
  }, []);

  const value = useMemo(
    () => ({ isOpen, defaults, open, close }),
    [isOpen, defaults, open, close]
  );

  return <ProcessModalContext.Provider value={value}>{children}</ProcessModalContext.Provider>;
};

export const useProcessModal = (): ProcessModalContextValue => {
  const ctx = useContext(ProcessModalContext);
  if (!ctx) {
    throw new Error('useProcessModal must be used within a ProcessModalProvider');
  }
  return ctx;
};
