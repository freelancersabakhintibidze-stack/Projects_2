import { createContext, useContext, type ReactNode } from "react";
import { useFavorites } from "../hooks/useFavorites";
import { useWatchlist } from "../hooks/useWatchlist";

type AppContextType = ReturnType<typeof useFavorites> & ReturnType<typeof useWatchlist>;

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const favorites = useFavorites();
  const watchlist = useWatchlist();

  return (
    <AppContext.Provider value={{ ...favorites, ...watchlist }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
