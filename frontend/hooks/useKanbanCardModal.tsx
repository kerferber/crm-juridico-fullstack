import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { KanbanCard, KanbanColumn, KanbanPhase } from '../types/types';

type ModalMode = 'create' | 'edit';

interface DefaultsPayload {
  column: KanbanColumn;
  phase: KanbanPhase;
}

interface KanbanCardModalContextValue {
  isOpen: boolean;
  mode: ModalMode;
  card: KanbanCard | null;
  defaults?: DefaultsPayload;
  openForCreate: (defaults: DefaultsPayload) => void;
  openForEdit: (card: KanbanCard) => void;
  close: () => void;
}

const KanbanCardModalContext = createContext<KanbanCardModalContextValue | undefined>(undefined);

interface KanbanCardModalState {
  isOpen: boolean;
  mode: ModalMode;
  card: KanbanCard | null;
  defaults?: DefaultsPayload;
}

const initialState: KanbanCardModalState = {
  isOpen: false,
  mode: 'create',
  card: null,
  defaults: undefined,
};

export const KanbanCardModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<KanbanCardModalState>(initialState);

  const openForCreate = useCallback((defaults: DefaultsPayload) => {
    setState({
      isOpen: true,
      mode: 'create',
      card: null,
      defaults,
    });
  }, []);

  const openForEdit = useCallback((card: KanbanCard) => {
    setState({
      isOpen: true,
      mode: 'edit',
      card,
      defaults: {
        column: card.column,
        phase: card.phase,
      },
    });
  }, []);

  const close = useCallback(() => {
    setState(initialState);
  }, []);

  const value = useMemo<KanbanCardModalContextValue>(
    () => ({
      ...state,
      openForCreate,
      openForEdit,
      close,
    }),
    [state, openForCreate, openForEdit, close]
  );

  return <KanbanCardModalContext.Provider value={value}>{children}</KanbanCardModalContext.Provider>;
};

export const useKanbanCardModal = (): KanbanCardModalContextValue => {
  const context = useContext(KanbanCardModalContext);
  if (!context) {
    throw new Error('useKanbanCardModal must be used within a KanbanCardModalProvider');
  }
  return context;
};
