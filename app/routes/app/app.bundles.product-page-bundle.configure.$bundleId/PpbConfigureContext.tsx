import { createContext, useContext, type ReactNode } from "react";

import { usePpbConfigureFlow } from "./usePpbConfigureFlow";

type PpbConfigureFlow = ReturnType<typeof usePpbConfigureFlow>;

const PpbConfigureContext = createContext<PpbConfigureFlow | null>(null);

export function PpbConfigureProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: PpbConfigureFlow;
}) {
  return (
    <PpbConfigureContext.Provider value={value}>
      {children}
    </PpbConfigureContext.Provider>
  );
}

export function usePpbConfigureContext() {
  const context = useContext(PpbConfigureContext);
  if (!context) {
    throw new Error(
      "usePpbConfigureContext must be used inside PpbConfigureProvider",
    );
  }
  return context;
}
