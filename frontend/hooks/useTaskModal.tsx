import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Task, TaskStatus } from '../types/types';

type TaskModalMode = 'create' | 'edit';

export interface TaskModalDefaults {
  title?: string;
  dueDate?: string;
  deadline?: string;
  responsibleId?: number;
  lawsuitId?: number;
  clientId?: number;
  status?: TaskStatus;
  score?: number;
}

interface TaskModalContextValue {
  isOpen: boolean;
  mode: TaskModalMode;
  task: Task | null;
  defaults?: TaskModalDefaults;
  open: (defaults?: TaskModalDefaults) => void;
  openForCreate: (defaults?: TaskModalDefaults) => void;
  openForEdit: (task: Task) => void;
  close: () => void;
}

const TaskModalContext = createContext<TaskModalContextValue | undefined>(undefined);

interface TaskModalState {
  isOpen: boolean;
  mode: TaskModalMode;
  task: Task | null;
  defaults?: TaskModalDefaults;
}

const initialState: TaskModalState = {
  isOpen: false,
  mode: 'create',
  task: null,
  defaults: undefined,
};

export const TaskModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<TaskModalState>(initialState);

  const openForCreate = useCallback((defaults?: TaskModalDefaults) => {
    setState({
      isOpen: true,
      mode: 'create',
      task: null,
      defaults,
    });
  }, []);

  const openForEdit = useCallback((task: Task) => {
    setState({
      isOpen: true,
      mode: 'edit',
      task,
      defaults: undefined,
    });
  }, []);

  const close = useCallback(() => {
    setState(initialState);
  }, []);

  const value = useMemo<TaskModalContextValue>(
    () => ({
      ...state,
      open: openForCreate,
      openForCreate,
      openForEdit,
      close,
    }),
    [state, openForCreate, openForEdit, close]
  );

  return <TaskModalContext.Provider value={value}>{children}</TaskModalContext.Provider>;
};

export const useTaskModal = (): TaskModalContextValue => {
  const ctx = useContext(TaskModalContext);
  if (!ctx) {
    throw new Error('useTaskModal must be used within a TaskModalProvider');
  }
  return ctx;
};
