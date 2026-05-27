"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ROLE_LABEL_MN, isValidRole } from "@/lib/auth/roles";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function SellerShell({ children }: { children: React.ReactNode }) {
  const { adminData, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border-light bg-background px-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            O
          </span>
          <span className="text-[14px] font-semibold tracking-tight">
            Onegram <span className="text-primary-600">Seller</span>
          </span>
        </div>
        {adminData && (
          <div className="ml-auto flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-300 to-primary-500 text-[11px] font-semibold text-white ring-1 ring-black/5">
              {initialsOf(adminData.name)}
            </span>
            <div className="hidden min-w-0 flex-col leading-tight sm:flex">
              <span className="truncate text-[12px] font-medium">
                {adminData.name || "—"}
              </span>
              <span className="truncate text-[10px] text-muted-foreground">
                {isValidRole(adminData.role)
                  ? ROLE_LABEL_MN[adminData.role]
                  : adminData.role}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleLogout}
              title="Гарах"
              aria-label="Гарах"
              className="text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </header>
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[640px] px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
