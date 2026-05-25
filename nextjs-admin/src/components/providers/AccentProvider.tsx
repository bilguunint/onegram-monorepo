"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useTheme as useNextTheme } from "next-themes";
import {
  ACCENT_STORAGE_KEY,
  DEFAULT_ACCENT,
  getAccent,
  isValidAccent,
  type AccentKey,
  type AccentPreset,
} from "@/lib/theme/accents";

type Ctx = {
  accent: AccentKey;
  setAccent: (a: AccentKey) => void;
};

const AccentContext = createContext<Ctx | null>(null);

const LIGHT_ONLY_VARS = [
  "--sidebar",
  "--sidebar-hover",
  "--sidebar-active",
  "--sidebar-accent",
  "--sidebar-accent-foreground",
  "--sidebar-border",
  "--sidebar-primary",
  "--sidebar-ring",
  "--border",
  "--border-light",
];

function applyAccentVars(accent: AccentPreset, isDark: boolean) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const p = accent.primary;

  root.style.setProperty("--primary", p[500]);
  root.style.setProperty("--primary-50", p[50]);
  root.style.setProperty("--primary-100", p[100]);
  root.style.setProperty("--primary-200", p[200]);
  root.style.setProperty("--primary-300", p[300]);
  root.style.setProperty("--primary-400", p[400]);
  root.style.setProperty("--primary-500", p[500]);
  root.style.setProperty("--primary-600", p[600]);
  root.style.setProperty("--primary-700", p[700]);
  root.style.setProperty("--ring", p[400]);
  root.style.setProperty("--accent", p[50]);
  root.style.setProperty("--accent-foreground", p[700]);
  root.style.setProperty("--chart-1", p[500]);
  root.style.setProperty("--chart-2", p[400]);
  root.style.setProperty("--chart-3", p[300]);
  root.style.setProperty("--chart-4", p[600]);
  root.style.setProperty("--chart-5", p[700]);

  if (!isDark) {
    root.style.setProperty("--sidebar", accent.sidebar);
    root.style.setProperty("--sidebar-hover", accent.sidebarHover);
    root.style.setProperty("--sidebar-active", accent.sidebarActive);
    root.style.setProperty("--sidebar-accent", accent.sidebarHover);
    root.style.setProperty("--sidebar-accent-foreground", p[700]);
    root.style.setProperty("--sidebar-border", accent.borderLight);
    root.style.setProperty("--sidebar-primary", p[500]);
    root.style.setProperty("--sidebar-ring", p[400]);
    root.style.setProperty("--border", accent.borderLight);
    root.style.setProperty("--border-light", accent.borderLight);
  } else {
    for (const v of LIGHT_ONLY_VARS) root.style.removeProperty(v);
  }
}

export function AccentProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useNextTheme();
  const [accent, setAccentState] = useState<AccentKey>(DEFAULT_ACCENT);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ACCENT_STORAGE_KEY);
      if (isValidAccent(stored)) setAccentState(stored);
    } catch {
      /* localStorage blocked — stay on default */
    }
  }, []);

  useEffect(() => {
    applyAccentVars(getAccent(accent), resolvedTheme === "dark");
  }, [accent, resolvedTheme]);

  const setAccent = useCallback((next: AccentKey) => {
    setAccentState(next);
    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <AccentContext.Provider value={{ accent, setAccent }}>
      {children}
    </AccentContext.Provider>
  );
}

export function useAccent(): Ctx {
  const ctx = useContext(AccentContext);
  if (!ctx) throw new Error("useAccent must be used within <AccentProvider>");
  return ctx;
}
