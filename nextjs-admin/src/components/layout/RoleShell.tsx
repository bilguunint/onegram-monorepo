"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { SellerShell } from "./SellerShell";

export function RoleShell({ children }: { children: ReactNode }) {
  const { adminData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isSeller = adminData?.role === "seller";
  const wrongPath = isSeller && pathname !== "/";

  useEffect(() => {
    if (wrongPath) {
      router.replace("/");
    }
  }, [wrongPath, router]);

  if (isSeller) {
    return (
      <SellerShell>
        {wrongPath ? (
          <div className="flex h-[60vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          children
        )}
      </SellerShell>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar className="sticky top-0 hidden md:flex" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
