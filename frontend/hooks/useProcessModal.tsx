import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface ProcessModalContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const ProcessModalContext = createContext<ProcessModalContextValue | undefined>(undefined);

export const ProcessModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);

  return <ProcessModalContext.Provider value={value}>{children}</ProcessModalContext.Provider>;
};

export const useProcessModal = (): ProcessModalContextValue => {
  const ctx = useContext(ProcessModalContext);
  if (!ctx) {
    throw new Error('useProcessModal must be used within a ProcessModalProvider');
  }
  return ctx;
};
