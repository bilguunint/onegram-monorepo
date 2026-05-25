"use client";

import { useEffect, useState } from "react";
import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAccent } from "@/components/providers/AccentProvider";
import { ACCENTS, getAccent } from "@/lib/theme/accents";

const MODES = [
  { key: "light", label: "Цайвар", Icon: Sun },
  { key: "dark", label: "Бараан", Icon: Moon },
  { key: "system", label: "Систем", Icon: Monitor },
] as const;

export function ThemeSettings() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { accent, setAccent } = useAccent();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <Sheet>
      <SheetTrigger
        aria-label="Theme settings"
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-sidebar-hover"
          />
        }
      >
        <Palette className="h-4 w-4" />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[380px] max-w-full overflow-y-auto p-0 sm:w-[420px]"
        showCloseButton={false}
      >
        <SheetTitle className="sr-only">Theme settings</SheetTitle>

        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border-light bg-card px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <Palette className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <h2 className="text-[15px] font-semibold text-foreground">
              Загвар тохиргоо
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Гэрэлтэлт болон үндсэн өнгө
            </p>
          </div>
        </header>

        <div className="space-y-6 px-5 py-5">
          {/* Mode */}
          <section>
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Гэрэлтэлт
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {MODES.map(({ key, label, Icon }) => {
                const active = mounted && theme === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTheme(key)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-[11px] font-medium transition-colors",
                      active
                        ? "border-primary-300 bg-primary-50 text-primary-700"
                        : "border-border-light text-muted-foreground hover:border-primary-200 hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                );
              })}
            </div>
            {mounted && (
              <p className="mt-2 text-[10px] text-muted-foreground">
                Одоогийн төлөв:{" "}
                <span className="font-medium text-foreground">
                  {resolvedTheme === "dark" ? "Бараан" : "Цайвар"}
                </span>
              </p>
            )}
          </section>

          {/* Accent */}
          <section>
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Үндсэн өнгө
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {ACCENTS.map((a) => {
                const active = accent === a.key;
                return (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => setAccent(a.key)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-3 transition-colors",
                      active
                        ? "border-primary bg-primary-50"
                        : "border-border-light hover:border-primary-300"
                    )}
                  >
                    <span
                      className="relative flex h-9 w-9 items-center justify-center rounded-full shadow-sm"
                      style={{ background: a.primary[500] }}
                    >
                      {active && (
                        <Check className="h-4 w-4 text-white drop-shadow" />
                      )}
                    </span>
                    <span className="text-[11px] font-medium text-foreground">
                      {a.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Preview swatch row — pulls colors from the active accent's own palette */}
          <section>
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Өнгөний хүрээ
            </div>
            <div className="mt-2 flex overflow-hidden rounded-md border border-border-light">
              {(
                [50, 100, 200, 300, 400, 500, 600, 700] as const
              ).map((shade) => {
                const bg = getAccent(accent).primary[shade];
                return (
                  <div
                    key={shade}
                    className="flex h-9 flex-1 items-end justify-center pb-1"
                    style={{ background: bg }}
                    title={`primary-${shade}`}
                  >
                    <span
                      className={cn(
                        "text-[9px] font-medium",
                        shade < 400 ? "text-foreground/70" : "text-white/90"
                      )}
                    >
                      {shade}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
