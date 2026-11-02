import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  getStoredAdminMode,
  setStoredAdminMode,
} from "../utils/adminMode";

const AdminModeContext = createContext({
  mode: "shop",
  setMode: () => {},
});

export function AdminModeProvider({ children }) {
  const [mode, setModeState] = useState(getStoredAdminMode);

  const value = useMemo(
    () => ({
      mode,
      setMode: (nextMode) => {
        setModeState(setStoredAdminMode(nextMode));
      },
    }),
    [mode]
  );

  return (
    <AdminModeContext.Provider value={value}>
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  return useContext(AdminModeContext);
}

export default AdminModeContext;
