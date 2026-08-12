import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const LunarTransitionContext = createContext(null);

export function LunarTransitionProvider({ children }) {
  const exitHandlerRef = useRef(null);
  const exitLockedRef = useRef(false);
  const [isExiting, setIsExiting] = useState(false);

  const registerHomeExit = useCallback((handler) => {
    exitHandlerRef.current = handler;
    return () => {
      if (exitHandlerRef.current === handler) exitHandlerRef.current = null;
    };
  }, []);

  const requestHomeExit = useCallback(async (path, navigate) => {
    if (exitLockedRef.current) return false;
    exitLockedRef.current = true;
    setIsExiting(true);

    try {
      const completed = await exitHandlerRef.current?.();
      if (completed === false) return false;
      navigate(path);
      return true;
    } finally {
      exitLockedRef.current = false;
      setIsExiting(false);
    }
  }, []);

  const value = useMemo(
    () => ({ isExiting, registerHomeExit, requestHomeExit }),
    [isExiting, registerHomeExit, requestHomeExit],
  );

  return (
    <LunarTransitionContext.Provider value={value}>
      {children}
    </LunarTransitionContext.Provider>
  );
}

export function useLunarTransition() {
  const context = useContext(LunarTransitionContext);
  if (!context) {
    throw new Error("useLunarTransition must be used inside LunarTransitionProvider");
  }
  return context;
}
