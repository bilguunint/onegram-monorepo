"use client";

import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchUserLedger,
  type AdminUser,
  type LedgerDoc,
  type LedgerTransaction,
} from "@/lib/firestore/users";
import { formatGram } from "@/lib/format";
import { getFullName } from "@/lib/users";

type Props = {
  open: boolean;
  user: AdminUser | null;
  onOpenChange: (open: boolean) => void;
};

const TYPE_LABELS: Record<string, string> = {
  order: "Захиалга",
  withdraw: "Татан авалт",
  gift_sent: "Бэлэг илгээсэн",
  gift_recieved: "Бэлэг хүлээн авсан",
  gift_received: "Бэлэг хүлээн авсан",
  gift_cancelled: "Бэлэг цуцлагдсан",
  created_investment: "Хөрөнгө оруулалт нээсэн",
  closed_investment: "Хөрөнгө оруулалт хаасан",
  transfer_out: "Бүртгэл шилжүүлэлт",
  transfer_in: "Бүртгэл хүлээн авсан",
};

const TYPE_BADGE: Record<string, string> = {
  order: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  withdraw: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  gift_sent: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  gift_recieved: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  gift_received: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  gift_cancelled: "bg-muted text-muted-foreground",
  created_investment: "bg-primary-100 text-primary-700",
  closed_investment: "bg-muted text-foreground",
  transfer_out: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  transfer_in: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

function badgeClass(type: string): string {
  return TYPE_BADGE[type] ?? "bg-muted text-muted-foreground";
}

function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

function formatLedgerDate(value: LedgerTransaction["created_at"]): string {
  if (!value) return "-";
  let d: Date;
  if (typeof value === "object" && "toDate" in value) {
    d = value.toDate();
  } else {
    d = new Date(value as string);
  }
  if (Number.isNaN(d.getTime())) return "-";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function sortedTransactions(txs: LedgerTransaction[]): LedgerTransaction[] {
  return [...txs].sort((a, b) => {
    const ta = formatLedgerDate(a.created_at);
    const tb = formatLedgerDate(b.created_at);
    return tb.localeCompare(ta);
  });
}

export function LedgerDialog({ open, user, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary-600" />
            {user ? `${getFullName(user)} — Данс бүртгэл` : "Данс бүртгэл"}
          </DialogTitle>
        </DialogHeader>
        {user && <LedgerBody key={user.id} userId={user.id} />}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Хаах
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LedgerBody({ userId }: { userId: string }) {
  const [snapshot, setSnapshot] = useState<{
    loaded: boolean;
    data: LedgerDoc | null;
  }>({ loaded: false, data: null });

  useEffect(() => {
    let cancelled = false;
    fetchUserLedger(userId)
      .then((d) => {
        if (!cancelled) setSnapshot({ loaded: true, data: d });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Ledger fetch error:", err);
        toast.error("Ledger мэдээлэл татаж чадсангүй.");
        setSnapshot({ loaded: true, data: null });
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const loading = !snapshot.loaded;
  const data = snapshot.data;
  const diff = data ? data.balance_gold - data.calculated_balance : 0;
  const balanced = data?.is_balanced ?? false;
  const txs = data ? sortedTransactions(data.transactions) : [];

  return (
    <>
      {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && data && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <SummaryCard label="Алт үлдэгдэл" value={formatGram(data.balance_gold)} tone="warn" />
              <SummaryCard label="Тооцоолсон" value={formatGram(data.calculated_balance)} />
              <SummaryCard
                label="Зөрүү"
                value={`${diff > 0 ? "+" : ""}${formatGram(diff)}`}
                tone={diff === 0 ? "ok" : "bad"}
                borderTone={diff === 0 ? "ok" : "bad"}
              />
              <SummaryCard label="Нийт гүйлгээ" value={String(data.transactions.length)} />
              <SummaryCard
                label="Баланс OK"
                value={balanced ? "Тийм" : "Үгүй"}
                tone={balanced ? "ok" : "bad"}
                icon={balanced ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
              />
            </div>

            <div className="max-h-[420px] overflow-y-auto rounded-lg border border-border-light">
              <table className="w-full text-[12px]">
                <thead className="sticky top-0 bg-muted/70 text-[11px] text-muted-foreground backdrop-blur">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">#</th>
                    <th className="px-3 py-2 text-left font-medium">Огноо</th>
                    <th className="px-3 py-2 text-left font-medium">Төрөл</th>
                    <th className="px-3 py-2 text-right font-medium">Дүн (гр)</th>
                    <th className="px-3 py-2 text-right font-medium">Нийт (гр)</th>
                  </tr>
                </thead>
                <tbody>
                  {txs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">
                        Гүйлгээ байхгүй
                      </td>
                    </tr>
                  )}
                  {txs.map((tx, i) => (
                    <tr key={i} className="border-t border-border-light">
                      <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-1.5">{formatLedgerDate(tx.created_at)}</td>
                      <td className="px-3 py-1.5">
                        <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-medium", badgeClass(tx.type))}>
                          {typeLabel(tx.type)}
                        </span>
                      </td>
                      <td
                        className={cn(
                          "px-3 py-1.5 text-right font-medium tabular-nums",
                          tx.amount > 0 && "text-emerald-600 dark:text-emerald-400",
                          tx.amount < 0 && "text-rose-600 dark:text-rose-400"
                        )}
                      >
                        {tx.amount > 0 ? "+" : ""}
                        {tx.amount.toFixed(3)}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">
                        {tx.running_balance?.toFixed(3) ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {!loading && !data && (
        <div className="py-10 text-center text-muted-foreground">
          <BookOpen className="mx-auto mb-2 h-6 w-6" />
          Ledger мэдээлэл олдсонгүй
        </div>
      )}
    </>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  tone?: "ok" | "bad" | "warn" | "default";
  borderTone?: "ok" | "bad";
  icon?: React.ReactNode;
};

function SummaryCard({ label, value, tone = "default", borderTone, icon }: SummaryCardProps) {
  const toneClass =
    tone === "ok"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "bad"
        ? "text-rose-600 dark:text-rose-400"
        : tone === "warn"
          ? "text-amber-600 dark:text-amber-400"
          : "text-foreground";
  const borderClass =
    borderTone === "bad"
      ? "border-rose-300 dark:border-rose-500/40"
      : borderTone === "ok"
        ? "border-emerald-300 dark:border-emerald-500/40"
        : "border-border-light";
  return (
    <div className={cn("rounded-lg border bg-card p-2 text-center", borderClass)}>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 flex items-center justify-center gap-1 text-[13px] font-semibold tabular-nums", toneClass)}>
        {icon}
        {value}
      </div>
    </div>
  );
}

