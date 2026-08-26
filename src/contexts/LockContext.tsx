import { useLiveQuery } from "dexie-react-hooks";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { db, ensureSettings } from "../db/db";
import type { Settings } from "../db/types";
import { UNLOCK_SESSION_KEY } from "../lib/pin";

interface LockContextValue {
  settings: Settings | undefined;
  hasPin: boolean;
  onboardingDone: boolean;
  unlocked: boolean;
  unlock: () => void;
  lock: () => void;
}

const LockContext = createContext<LockContextValue | null>(null);

export function LockProvider({ children }: { children: ReactNode }) {
  const settings = useLiveQuery(() => db.settings.get("app"), []);
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(UNLOCK_SESSION_KEY) === "1");

  useEffect(() => {
    ensureSettings().finally(() => setReady(true));
  }, []);

  const unlock = () => {
    sessionStorage.setItem(UNLOCK_SESSION_KEY, "1");
    setUnlocked(true);
  };

  const lock = () => {
    sessionStorage.removeItem(UNLOCK_SESSION_KEY);
    setUnlocked(false);
  };

  if (!ready || settings === undefined) return null;

  const hasPin = !!settings?.pinHash;
  const onboardingDone = !!settings?.onboardingDone;

  return (
    <LockContext.Provider
      value={{ settings, hasPin, onboardingDone, unlocked: unlocked || !hasPin, unlock, lock }}
    >
      {children}
    </LockContext.Provider>
  );
}

export function useLock(): LockContextValue {
  const ctx = useContext(LockContext);
  if (!ctx) throw new Error("useLock deve ser usado dentro de LockProvider");
  return ctx;
}
