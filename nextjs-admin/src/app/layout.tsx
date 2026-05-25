import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AccentProvider } from "@/components/providers/AccentProvider";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { Toaster } from "@/components/ui/sonner";
import { ACCENT_STORAGE_KEY, ACCENTS, DEFAULT_ACCENT } from "@/lib/theme/accents";

export const metadata: Metadata = {
  title: "Onegram Admin",
  description: "Onegram admin dashboard",
};

// Compact accent palette table consumed by the pre-hydration script.
// Shape: { key: [p50,p100,p200,p300,p400,p500,p600,p700, sidebar, sidebarHover, sidebarActive, borderLight] }
const ACCENT_TABLE = Object.fromEntries(
  ACCENTS.map((a) => [
    a.key,
    [
      a.primary[50], a.primary[100], a.primary[200], a.primary[300],
      a.primary[400], a.primary[500], a.primary[600], a.primary[700],
      a.sidebar, a.sidebarHover, a.sidebarActive, a.borderLight,
    ],
  ])
);

// Runs before hydration so the saved accent + sidebar tint apply without a
// flash on first paint. Mirrors src/components/providers/AccentProvider.tsx.
const APPLY_ACCENT_SCRIPT = `(function(){try{var T=${JSON.stringify(ACCENT_TABLE)};var k=localStorage.getItem('${ACCENT_STORAGE_KEY}');if(!k||!T[k])k='${DEFAULT_ACCENT}';var m=localStorage.getItem('theme');var dark=m==='dark'||(m!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var d=document.documentElement,v=T[k];var s=d.style;s.setProperty('--primary',v[5]);s.setProperty('--primary-50',v[0]);s.setProperty('--primary-100',v[1]);s.setProperty('--primary-200',v[2]);s.setProperty('--primary-300',v[3]);s.setProperty('--primary-400',v[4]);s.setProperty('--primary-500',v[5]);s.setProperty('--primary-600',v[6]);s.setProperty('--primary-700',v[7]);s.setProperty('--ring',v[4]);s.setProperty('--accent',v[0]);s.setProperty('--accent-foreground',v[7]);s.setProperty('--chart-1',v[5]);s.setProperty('--chart-2',v[4]);s.setProperty('--chart-3',v[3]);s.setProperty('--chart-4',v[6]);s.setProperty('--chart-5',v[7]);if(!dark){s.setProperty('--sidebar',v[8]);s.setProperty('--sidebar-hover',v[9]);s.setProperty('--sidebar-active',v[10]);s.setProperty('--sidebar-accent',v[9]);s.setProperty('--sidebar-accent-foreground',v[7]);s.setProperty('--sidebar-border',v[11]);s.setProperty('--sidebar-primary',v[5]);s.setProperty('--sidebar-ring',v[4]);s.setProperty('--border',v[11]);s.setProperty('--border-light',v[11]);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn" suppressHydrationWarning className="h-full">
      <head>
        <script dangerouslySetInnerHTML={{ __html: APPLY_ACCENT_SCRIPT }} />
      </head>
      <body className="min-h-full antialiased">
        <ThemeProvider>
          <AccentProvider>
            <AuthProvider>
              {children}
              <Toaster richColors position="top-right" />
            </AuthProvider>
          </AccentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
