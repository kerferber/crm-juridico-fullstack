import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { TransactionType } from '../types/types';

interface TransactionModalState {
  isOpen: boolean;
  type: TransactionType;
  open: (type: TransactionType) => void;
  close: () => void;
}

const TransactionModalContext = createContext<TransactionModalState | undefined>(undefined);

const DEFAULT_TYPE = TransactionType.Receita;

export const TransactionModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<TransactionType>(DEFAULT_TYPE);

  const open = useCallback((newType: TransactionType) => {
    setType(newType);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ isOpen, type, open, close }), [isOpen, type, open, close]);

  return <TransactionModalContext.Provider value={value}>{children}</TransactionModalContext.Provider>;
};

export const useTransactionModal = (): TransactionModalState => {
  const ctx = useContext(TransactionModalContext);
  if (!ctx) {
    throw new Error('useTransactionModal must be used within a TransactionModalProvider');
  }
  return ctx;
};
