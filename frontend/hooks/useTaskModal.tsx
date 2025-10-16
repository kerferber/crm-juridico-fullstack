import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface TaskModalContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const TaskModalContext = createContext<TaskModalContextValue | undefined>(undefined);

export const TaskModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);

  return <TaskModalContext.Provider value={value}>{children}</TaskModalContext.Provider>;
};

export const useTaskModal = (): TaskModalContextValue => {
  const ctx = useContext(TaskModalContext);
  if (!ctx) {
    throw new Error('useTaskModal must be used within a TaskModalProvider');
  }
  return ctx;
};
