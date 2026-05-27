"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, RefreshCw, ShieldOff, Trash2, UserX } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  isValidRole,
  ROLE_LABEL_MN,
  type AdminRole,
} from "@/lib/auth/roles";
import {
  deleteAdmin,
  listAdmins,
  type AdminListItem,
} from "@/lib/api/adminActions";
import { AddAdminDialog } from "@/components/admins/AddAdminDialog";

export default function AdminsPage() {
  const { adminData } = useAuth();
  const router = useRouter();
  const role = adminData?.role ?? null;
  const isAdmin = role === "admin";

  const [admins, setAdmins] = useState<AdminListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleting, setDeleting] = useState<AdminListItem | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAdmins();
      setAdmins(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      router.replace("/");
      return;
    }
    void load();
  }, [isAdmin, load, router]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <ShieldOff className="h-7 w-7 text-muted-foreground" />
        <p className="text-[13px] text-muted-foreground">
          Энэ хуудсанд хандах эрхгүй байна.
        </p>
      </div>
    );
  }

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setSubmittingDelete(true);
    try {
      await deleteAdmin(deleting.uid);
      toast.success("Admin устгагдлаа.");
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа.");
    } finally {
      setSubmittingDelete(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-[18px] font-semibold text-foreground">Админууд</h1>
        <p className="text-[12px] text-muted-foreground">
          Удирдлага <span className="text-foreground/70">/ Админууд</span>
        </p>
      </header>

      <div className="rounded-xl border border-border-light bg-card">
        <div className="flex flex-col gap-2 border-b border-border-light px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[14px] font-semibold text-foreground">
            Админуудын жагсаалт
          </h2>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Шинэ admin нэмэх
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => void load()}
              aria-label="Шинэчлэх"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", loading && "animate-spin")}
              />
            </Button>
          </div>
        </div>

        <div className="px-4 py-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10">
              <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
              <p className="text-[12px] text-muted-foreground">
                Ачааллаж байна…
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-[13px]">
                <thead>
                  <tr className="border-b border-border-light text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    <th className="px-2 py-2 text-left font-medium">№</th>
                    <th className="px-2 py-2 text-left font-medium">Нэр</th>
                    <th className="px-2 py-2 text-left font-medium">И-мэйл</th>
                    <th className="px-2 py-2 text-left font-medium">Эрх</th>
                    <th className="px-2 py-2 text-left font-medium">UID</th>
                    <th className="px-2 py-2 text-right font-medium">Үйлдэл</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-muted-foreground"
                      >
                        <UserX className="mx-auto mb-2 h-6 w-6 opacity-60" />
                        Admin олдсонгүй
                      </td>
                    </tr>
                  ) : (
                    admins.map((a, i) => (
                      <tr
                        key={a.uid}
                        className="border-b border-border-light/60 last:border-b-0 hover:bg-muted/40"
                      >
                        <td className="px-2 py-2 text-muted-foreground tabular-nums">
                          {i + 1}
                        </td>
                        <td className="px-2 py-2 font-medium">{a.name || "—"}</td>
                        <td className="px-2 py-2">{a.email || "—"}</td>
                        <td className="px-2 py-2">
                          <RoleBadge role={a.role} />
                        </td>
                        <td className="px-2 py-2 text-[11px] text-muted-foreground">
                          {a.uid}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-end">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Устгах"
                              onClick={() => setDeleting(a)}
                              disabled={a.uid === adminData?.uid}
                              className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AddAdminDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={() => void load()}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Admin устгах"
        description={
          deleting && (
            <span>
              <strong>{deleting.name || deleting.email}</strong>-ийг устгах гэж
              байна. Энэ үйлдлийг буцаах боломжгүй.
            </span>
          )
        }
        confirmLabel="Тийм, устгах"
        destructive
        submitting={submittingDelete}
        onOpenChange={(o) => !o && !submittingDelete && setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const label = isValidRole(role) ? ROLE_LABEL_MN[role as AdminRole] : role;
  const cls = roleClass(role);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        cls
      )}
    >
      {label}
    </span>
  );
}

function roleClass(role: string): string {
  switch (role) {
    case "admin":
      return "bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300";
    case "manager":
      return "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300";
    case "accountant":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
    case "seller":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}
