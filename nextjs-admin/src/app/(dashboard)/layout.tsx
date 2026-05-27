import type { ReactNode } from "react";
import { AuthGate } from "@/components/layout/AuthGate";
import { RoleShell } from "@/components/layout/RoleShell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <RoleShell>{children}</RoleShell>
    </AuthGate>
  );
}
