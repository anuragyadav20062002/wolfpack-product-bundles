import { Provider } from "react-redux";
import { useRef, type ReactNode } from "react";
import { makeStore, type AppStore } from "./store";

export function ReduxProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
