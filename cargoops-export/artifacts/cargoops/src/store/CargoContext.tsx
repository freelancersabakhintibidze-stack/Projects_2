import { createContext, useContext, type ReactNode } from "react";
import { useCargoStore } from "./useCargoStore";

type Store = ReturnType<typeof useCargoStore>;

const CargoContext = createContext<Store | null>(null);

export function CargoProvider({ children }: { children: ReactNode }) {
  const store = useCargoStore();
  return <CargoContext.Provider value={store}>{children}</CargoContext.Provider>;
}

export function useCargo(): Store {
  const ctx = useContext(CargoContext);
  if (!ctx) throw new Error("useCargo must be used within <CargoProvider>");
  return ctx;
}
