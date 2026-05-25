"use client";

import { cn } from "@/lib/utils";
import { MENU } from "@/lib/menu";
import { SidebarMenuItem } from "./SidebarMenuItem";

type Props = {
  className?: string;
  onNavigate?: () => void;
};

export function Sidebar({ className, onNavigate }: Props) {
  return (
    <aside
      className={cn(
        "flex h-screen w-60 shrink-0 flex-col border-r border-border-light bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            O
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            Onegram <span className="text-primary-600">Admin</span>
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-[2px] overflow-y-auto px-2 pb-4">
        <div className="px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Үндсэн цэс
        </div>
        {MENU.map((item) => (
          <SidebarMenuItem key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="border-t border-border-light px-3 py-3 text-[11px] text-muted-foreground">
        v0.1.0 · Phase 1
      </div>
    </aside>
  );
}
