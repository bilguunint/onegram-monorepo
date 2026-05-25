"use client";

import { useMemo, useState } from "react";
import { Menu, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { ThemeSettings } from "./ThemeSettings";
import { UserDropdown } from "./UserDropdown";
import { MENU } from "@/lib/menu";

function usePageTitle(): string {
  const pathname = usePathname();
  return useMemo(() => {
    if (!pathname) return "";
    const match = MENU.find(
      (m) => pathname === m.href || pathname.startsWith(`${m.href}/`)
    );
    return match?.label ?? "";
  }, [pathname]);
}

export function Topbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = usePageTitle();
  const aiActive = pathname?.startsWith("/ai-worker");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border-light bg-background px-4 sm:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger
          aria-label="Цэс нээх"
          render={
            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" />
          }
        >
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0">
          <SheetTitle className="sr-only">Цэс</SheetTitle>
          <Sidebar
            className="h-full w-full border-r-0"
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground">
        {title}
      </h1>

      <div className="flex items-center gap-1.5">
        <Link
          href="/ai-worker"
          aria-label="AI Туслах"
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-xl px-2 text-[12px] font-medium transition-colors sm:px-3 sm:text-[13px]",
            aiActive
              ? "bg-primary-100 text-primary-700"
              : "bg-sidebar-hover text-foreground hover:bg-primary-50 hover:text-primary-700"
          )}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span className="hidden sm:inline">AI Туслах</span>
        </Link>

        <ThemeSettings />
        <UserDropdown />
      </div>
    </header>
  );
}
