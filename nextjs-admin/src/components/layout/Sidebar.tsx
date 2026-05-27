"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { filterMenuByRole } from "@/lib/menu";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ROLE_LABEL_MN, isValidRole } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import { SidebarMenuItem } from "./SidebarMenuItem";

type Props = {
  className?: string;
  onNavigate?: () => void;
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Sidebar({ className, onNavigate }: Props) {
  const { adminData, signOut } = useAuth();
  const router = useRouter();
  const items = filterMenuByRole(adminData?.role);

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

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
        {items.map((item) => (
          <SidebarMenuItem key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      {adminData && (
        <div className="border-t border-border-light px-3 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-300 to-primary-500 text-[12px] font-semibold text-white ring-1 ring-black/5">
              {initialsOf(adminData.name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium text-foreground">
                {adminData.name || "—"}
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                {isValidRole(adminData.role)
                  ? ROLE_LABEL_MN[adminData.role]
                  : adminData.role}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleLogout}
              title="Гарах"
              aria-label="Гарах"
              className="shrink-0 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}
