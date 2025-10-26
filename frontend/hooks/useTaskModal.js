import { jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
const TaskModalContext = createContext(void 0);
const initialState = {
  isOpen: false,
  mode: "create",
  task: null,
  defaults: void 0
};
const TaskModalProvider = ({ children }) => {
  const [state, setState] = useState(initialState);
  const openForCreate = useCallback((defaults) => {
    setState({
      isOpen: true,
      mode: "create",
      task: null,
      defaults
    });
  }, []);
  const openForEdit = useCallback((task) => {
    setState({
      isOpen: true,
      mode: "edit",
      task,
      defaults: void 0
    });
  }, []);
  const close = useCallback(() => {
    setState(initialState);
  }, []);
  const value = useMemo(
    () => ({
      ...state,
      open: openForCreate,
      openForCreate,
      openForEdit,
      close
    }),
    [state, openForCreate, openForEdit, close]
  );
  return /* @__PURE__ */ jsx(TaskModalContext.Provider, { value, children });
};
const useTaskModal = () => {
  const ctx = useContext(TaskModalContext);
  if (!ctx) {
    throw new Error("useTaskModal must be used within a TaskModalProvider");
  }
  return ctx;
};
export {
  TaskModalProvider,
  useTaskModal
};
