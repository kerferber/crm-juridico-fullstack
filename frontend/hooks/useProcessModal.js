import { jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
const ProcessModalContext = createContext(void 0);
const ProcessModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [defaults, setDefaults] = useState(null);
  const open = useCallback((nextDefaults) => {
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
  return /* @__PURE__ */ jsx(ProcessModalContext.Provider, { value, children });
};
const useProcessModal = () => {
  const ctx = useContext(ProcessModalContext);
  if (!ctx) {
    throw new Error("useProcessModal must be used within a ProcessModalProvider");
  }
  return ctx;
};
export {
  ProcessModalProvider,
  useProcessModal
};
