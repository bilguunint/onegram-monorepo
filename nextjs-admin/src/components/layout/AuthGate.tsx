"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Loader2 } from "lucide-react";

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, adminData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !adminData)) {
      router.replace("/login");
    }
  }, [loading, user, adminData, router]);

  if (loading || !user || !adminData) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <>{children}</>;
}
