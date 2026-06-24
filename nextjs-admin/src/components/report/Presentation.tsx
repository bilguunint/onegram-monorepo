"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LangToggle } from "@/components/report/ReportParts";
import { strings, type Lang } from "@/lib/report/i18n";
import type { SlideDef } from "@/components/report/slides";

type Props = {
  slides: SlideDef[];
  open: boolean;
  onClose: () => void;
  lang: Lang;
  onLangChange: (l: Lang) => void;
};

export function Presentation({ slides, open, onClose, lang, onLangChange }: Props) {
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const t = strings(lang);
  const count = slides.length;

  const go = useCallback(
    (dir: 1 | -1) => setIndex((i) => Math.min(Math.max(i + dir, 0), count - 1)),
    [count]
  );

  // Reset to first slide each time the deck opens.
  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  // Request native browser fullscreen on open; release on close.
  useEffect(() => {
    if (!open) return;
    const el = containerRef.current;
    el?.requestFullscreen?.().catch(() => {});
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    };
  }, [open]);

  // Lock background scroll while open — covers browsers where native fullscreen
  // is unavailable/denied (e.g. Safari), so the overlay still freezes the page.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // When the user leaves native fullscreen (e.g. presses Esc), close the deck.
  useEffect(() => {
    if (!open) return;
    const onFsChange = () => {
      if (!document.fullscreenElement) onClose();
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [open, onClose]);

  // Keyboard navigation.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      // Let focused interactive controls (PeriodSelector, buttons, toggles)
      // handle Space/arrows themselves; only Esc is always global.
      const tgt = e.target as HTMLElement | null;
      if (
        e.key !== "Escape" &&
        tgt?.closest("button, a, input, select, textarea, [contenteditable]")
      ) {
        return;
      }
      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
        case " ":
          e.preventDefault();
          go(1);
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          go(-1);
          break;
        case "Home":
          setIndex(0);
          break;
        case "End":
          setIndex(count - 1);
          break;
        case "Escape":
          // In native fullscreen, Esc is handled by the browser (fullscreenchange
          // closes us). When not in fullscreen, close here.
          if (!document.fullscreenElement) onClose();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, count, go, onClose]);

  if (!open || count === 0) return null;

  const current = slides[Math.min(index, count - 1)];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col bg-background text-foreground"
      role="dialog"
      aria-modal="true"
    >
      {/* Top control bar */}
      <div className="flex items-center justify-between px-4 py-2.5 sm:px-6">
        <div className="text-[12px] font-medium tabular-nums text-muted-foreground">
          {index + 1} / {count}
        </div>
        <div className="flex items-center gap-2">
          <LangToggle value={lang} onChange={onLangChange} />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-lg border border-border-light px-2.5 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            {t.exitPresentation}
          </button>
        </div>
      </div>

      {/* Slide area */}
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center px-4 py-2 sm:px-8 sm:py-4">
          <div className="aspect-[16/9] max-h-full w-full max-w-[1760px] overflow-hidden">
            {current.node}
          </div>
        </div>

        {/* Prev / next arrows */}
        <button
          type="button"
          aria-label="Previous"
          onClick={() => go(-1)}
          disabled={index === 0}
          className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 text-foreground shadow-sm ring-1 ring-border-light transition disabled:pointer-events-none disabled:opacity-0 hover:bg-card sm:left-4"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={() => go(1)}
          disabled={index === count - 1}
          className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 text-foreground shadow-sm ring-1 ring-border-light transition disabled:pointer-events-none disabled:opacity-0 hover:bg-card sm:right-4"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 px-6 py-3">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === index
                ? "w-6 bg-primary-500"
                : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
            )}
          />
        ))}
      </div>
    </div>
  );
}
