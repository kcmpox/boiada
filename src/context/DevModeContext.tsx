import { createContext, useContext, useState } from 'react';

interface DevModeContextType {
  devMode: boolean;
  setDevMode: (enabled: boolean) => void;
}

const DevModeContext = createContext<DevModeContextType>({
  devMode: false,
  setDevMode: () => {},
});

export function DevModeProvider({ children }: { children: React.ReactNode }) {
  const [devMode, setDevModeState] = useState<boolean>(() => {
    return localStorage.getItem('bt_devmode') === 'true';
  });

  const setDevMode = (enabled: boolean) => {
    setDevModeState(enabled);
    localStorage.setItem('bt_devmode', String(enabled));
  };

  return (
    <DevModeContext.Provider value={{ devMode, setDevMode }}>
      {children}
    </DevModeContext.Provider>
  );
}

export function useDevMode() {
  return useContext(DevModeContext);
}