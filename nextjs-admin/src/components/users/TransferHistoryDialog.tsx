"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Loader2, History } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchTransferHistory,
  type MigrationRecord,
} from "@/lib/api/userTransferActions";

const STATUS: Record<string, { label: string; badge: string }> = {
  completed: {
    label: "Амжилттай",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  failed: {
    label: "Амжилтгүй",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  },
  running: {
    label: "Явагдаж буй",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
};

function fmtDate(ms: number | null): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("mn-MN");
}

function label(name: string, uid: string): string {
  return name?.trim() ? `${name} (${uid})` : uid;
}

export function TransferHistoryDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [items, setItems] = useState<MigrationRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    fetchTransferHistory()
      .then((d) => active && setItems(d))
      .catch((err) => {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Түүх ачааллахад алдаа.");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary-600" />
            Шилжүүлэлтийн түүх
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
            <span className="text-[13px]">Ачааллаж байна…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-muted-foreground">
            Шилжүүлэлт хийгдээгүй байна.
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((m) => {
              const st = STATUS[m.status] ?? {
                label: m.status,
                badge: "bg-muted text-muted-foreground",
              };
              return (
                <div
                  key={m.id}
                  className="rounded-lg border border-border-light bg-card p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 text-[12px]">
                      <div className="flex flex-wrap items-center gap-1.5 font-medium text-foreground">
                        <span className="truncate">{label(m.source_name, m.source_uid)}</span>
                        <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="truncate">{label(m.target_name, m.target_uid)}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {fmtDate(m.completed_at ?? m.created_at)} ·{" "}
                        <span className="text-foreground/80">{m.performed_by_name || "—"}</span>
                        {" · "}
                        {m.total_moved} бичлэг шилжсэн
                      </div>
                      {m.note && (
                        <div className="mt-1 text-[11px] text-muted-foreground">{m.note}</div>
                      )}
                      {m.error && (
                        <div className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                          Алдаа: {m.error}
                        </div>
                      )}
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                        st.badge
                      )}
                    >
                      {st.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
