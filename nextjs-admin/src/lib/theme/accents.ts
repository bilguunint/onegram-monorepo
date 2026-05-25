export type AccentKey =
  | "emerald"
  | "purple"
  | "blue"
  | "rose"
  | "amber"
  | "cyan";

export type AccentShades = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
};

export type AccentPreset = {
  key: AccentKey;
  label: string;
  primary: AccentShades;
  /** Sidebar bg in light mode */
  sidebar: string;
  /** Sidebar hover row bg in light mode */
  sidebarHover: string;
  /** Sidebar active row bg in light mode */
  sidebarActive: string;
  /** Subtle border tint in light mode (border-light + sidebar-border) */
  borderLight: string;
};

export const ACCENTS: AccentPreset[] = [
  {
    key: "emerald",
    label: "Ногоон",
    primary: {
      50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7",
      400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857",
    },
    sidebar: "#f0fdf5", sidebarHover: "#e0f8ec", sidebarActive: "#d0f0e0",
    borderLight: "#d0e8d8",
  },
  {
    key: "purple",
    label: "Ягаан",
    primary: {
      50: "#faf5ff", 100: "#f3e8ff", 200: "#e9d5ff", 300: "#d8b4fe",
      400: "#c084fc", 500: "#a855f7", 600: "#9333ea", 700: "#7e22ce",
    },
    sidebar: "#faf5ff", sidebarHover: "#f0e8ff", sidebarActive: "#e2d4f7",
    borderLight: "#e6dbf5",
  },
  {
    key: "blue",
    label: "Хөх",
    primary: {
      50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd",
      400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8",
    },
    sidebar: "#f0f5ff", sidebarHover: "#e0ecff", sidebarActive: "#d0e0f8",
    borderLight: "#d8e4f0",
  },
  {
    key: "rose",
    label: "Сарнай",
    primary: {
      50: "#fff1f2", 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af",
      400: "#fb7185", 500: "#f43f5e", 600: "#e11d48", 700: "#be123c",
    },
    sidebar: "#fff5f6", sidebarHover: "#ffe8ea", sidebarActive: "#fdd8dc",
    borderLight: "#f0d8dc",
  },
  {
    key: "amber",
    label: "Алтан",
    primary: {
      50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d",
      400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309",
    },
    sidebar: "#fffbf0", sidebarHover: "#fef3c7", sidebarActive: "#fde68a",
    borderLight: "#f0e3c0",
  },
  {
    key: "cyan",
    label: "Цэнхэр",
    primary: {
      50: "#ecfeff", 100: "#cffafe", 200: "#a5f3fc", 300: "#67e8f9",
      400: "#22d3ee", 500: "#06b6d4", 600: "#0891b2", 700: "#0e7490",
    },
    sidebar: "#f0fdff", sidebarHover: "#e0f8fc", sidebarActive: "#d0f0f5",
    borderLight: "#d0e8f0",
  },
];

export const DEFAULT_ACCENT: AccentKey = "amber";
export const ACCENT_STORAGE_KEY = "onegram-admin-accent";

export function isValidAccent(v: unknown): v is AccentKey {
  return typeof v === "string" && ACCENTS.some((a) => a.key === v);
}

export function getAccent(key: AccentKey): AccentPreset {
  return ACCENTS.find((a) => a.key === key) ?? ACCENTS.find((a) => a.key === DEFAULT_ACCENT)!;
}
