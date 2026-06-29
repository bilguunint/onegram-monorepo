"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Search,
  ShieldAlert,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatGram, formatInt } from "@/lib/format";
import { lookupUsers, type AdminUser } from "@/lib/firestore/users";
import {
  previewUserTransfer,
  executeUserTransfer,
  type TransferPreview,
  type TransferResult,
  type TransferBalance,
} from "@/lib/api/userTransferActions";

const COUNT_LABELS: { key: string; label: string }[] = [
  { key: "orders", label: "Захиалга" },
  { key: "withdraws", label: "Биетээр авах" },
  { key: "product_purchases", label: "Хуваан төлөлт" },
  { key: "pending_invoices", label: "Хүлээгдэж буй нэхэмжлэх" },
  { key: "gifts_as_sender", label: "Илгээсэн бэлэг" },
  { key: "gifts_as_receiver", label: "Хүлээн авсан бэлэг" },
  { key: "notifications", label: "Мэдэгдэл" },
  { key: "lottery_tickets", label: "Сугалааны тасалбар" },
  { key: "campaign_tickets", label: "Кампанит тасалбар" },
  { key: "ledger_entries", label: "Ledger бичлэг" },
  { key: "security_logs", label: "Аюулгүйн лог" },
];

function fullName(u: { first_name?: string; last_name?: string }): string {
  return `${u.last_name ?? ""} ${u.first_name ?? ""}`.trim() || "Нэргүй";
}

function BalanceLine({ b }: { b?: TransferBalance | null }) {
  const bal = b ?? { gold: 0, silver: 0, saving: 0 };
  return (
    <div className="text-[11px] text-muted-foreground">
      Алт: <span className="font-medium text-foreground">{formatGram(bal.gold)}</span>
      {" · "}Мөнгө:{" "}
      <span className="font-medium text-foreground">{formatGram(bal.silver)}</span>
      {" · "}Хадгаламж:{" "}
      <span className="font-medium text-foreground">{formatInt(bal.saving)}</span>
    </div>
  );
}

function UserPicker({
  title,
  tone,
  selected,
  onSelect,
}: {
  title: string;
  tone: "rose" | "emerald";
  selected: AdminUser | null;
  onSelect: (u: AdminUser | null) => void;
}) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<AdminUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    const t = term.trim();
    if (!t) return;
    setSearching(true);
    setSearched(true);
    try {
      setResults(await lookupUsers(t));
    } catch (err) {
      console.error(err);
      toast.error("Хайхад алдаа гарлаа.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="rounded-xl border border-border-light bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg",
            tone === "rose"
              ? "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300"
              : "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
          )}
        >
          <UserRound className="h-4 w-4" />
        </span>
        <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
      </div>

      {selected ? (
        <div className="rounded-lg border border-border-light bg-background/40 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-[14px] font-semibold text-foreground">
                {fullName(selected)}
              </div>
              <div className="truncate text-[12px] text-muted-foreground">
                {selected.phone || "утасгүй"}
                {selected.email ? ` · ${selected.email}` : ""} · {selected.id}
              </div>
              <div className="mt-1.5">
                <BalanceLine b={selected.balance} />
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onSelect(null)}
              title="Цэвэрлэх"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Утас, и-мэйл эсвэл UID…"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void search()}
            />
            <Button variant="outline" size="sm" onClick={() => void search()}>
              {searching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          {searched && !searching && (
            <div className="mt-2 space-y-1">
              {results.length === 0 ? (
                <p className="text-[12px] text-muted-foreground">Олдсонгүй.</p>
              ) : (
                results.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => onSelect(u)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-border-light px-3 py-2 text-left transition-colors hover:border-primary-300 hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-foreground">
                        {fullName(u)}
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {u.phone || "утасгүй"}
                        {u.email ? ` · ${u.email}` : ""} · {u.id}
                      </div>
                    </div>
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      {formatGram(u.balance.gold)}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function UserTransferPage() {
  const { adminData } = useAuth();
  const isAdmin = adminData?.role === "admin";

  const [source, setSource] = useState<AdminUser | null>(null);
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [preview, setPreview] = useState<TransferPreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [confirmPhone, setConfirmPhone] = useState("");
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<TransferResult | null>(null);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border-light bg-card py-16 text-muted-foreground">
        <ShieldAlert className="h-7 w-7 opacity-60" />
        <p className="text-[13px]">Энэ хуудсыг зөвхөн админ үзэх боломжтой.</p>
      </div>
    );
  }

  const canPreview =
    !!source && !!target && source.id !== target.id && !previewing;
  const expectedConfirm = (source?.phone || source?.id || "").trim();
  const inProgressElsewhere =
    !!preview &&
    !!target &&
    !!preview.source.merge_in_progress &&
    preview.source.merge_in_progress !== target.id;
  const canExecute =
    !!preview &&
    !!source &&
    !!target &&
    !executing &&
    !inProgressElsewhere &&
    confirmPhone.trim() === expectedConfirm &&
    expectedConfirm.length > 0;

  const resetPreview = () => {
    setPreview(null);
    setConfirmPhone("");
    setResult(null);
  };

  const handlePreview = async () => {
    if (!source || !target) return;
    setPreviewing(true);
    setResult(null);
    try {
      const p = await previewUserTransfer(source.id, target.id);
      setPreview(p);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Урьдчилан харахад алдаа.");
    } finally {
      setPreviewing(false);
    }
  };

  const handleExecute = async () => {
    if (!source || !target) return;
    setExecuting(true);
    try {
      const r = await executeUserTransfer(source.id, target.id, confirmPhone.trim());
      setResult(r);
      setPreview(null);
      toast.success("Шилжүүлэлт амжилттай боллоо.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Шилжүүлэхэд алдаа гарлаа.");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-[18px] font-semibold text-foreground">
          Хэрэглэгч шилжүүлэх
        </h1>
        <p className="text-[12px] text-muted-foreground">
          Нэг хэрэглэгчийн бүх мэдээллийг (баланс, захиалга, ledger гэх мэт) өөр
          хэрэглэгч рүү шилжүүлнэ. Зөвхөн утасны дугаараа сольсон тохиолдолд.
        </p>
      </header>

      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="text-[12px] leading-relaxed">
          Энэ үйлдэл нь <strong>буцаах боломжгүй</strong>. Эх хэрэглэгчийн баланс
          0 болж, бүх өгөгдөл зорилтот хэрэглэгч рүү нэгдэнэ. Гүйцэтгэхийн өмнө
          урьдчилан харж, эх хэрэглэгчийн утасны дугаараар баталгаажуулна.
        </div>
      </div>

      {/* Pickers */}
      <div className="grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
        <UserPicker
          title="Эх хэрэглэгч (хоослох)"
          tone="rose"
          selected={source}
          onSelect={(u) => {
            setSource(u);
            resetPreview();
          }}
        />
        <div className="flex items-center justify-center">
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>
        <UserPicker
          title="Зорилтот хэрэглэгч (хүлээн авах)"
          tone="emerald"
          selected={target}
          onSelect={(u) => {
            setTarget(u);
            resetPreview();
          }}
        />
      </div>

      {source && target && source.id === target.id && (
        <p className="text-[12px] text-rose-600">
          Эх ба зорилтот хэрэглэгч ижил байж болохгүй.
        </p>
      )}

      <div>
        <Button onClick={() => void handlePreview()} disabled={!canPreview}>
          {previewing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Урьдчилан харах
        </Button>
      </div>

      {/* Preview */}
      {preview && source && target && (
        <div className="space-y-4 rounded-xl border border-border-light bg-card p-4">
          <h3 className="text-[14px] font-semibold text-foreground">
            Шилжих өгөгдөл
          </h3>

          {preview.alreadyMerged && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              Эх хэрэглэгч аль хэдийн шилжсэн тэмдэгтэй байна. Үргэлжлүүлбэл
              үлдсэн өгөгдлийг дахин шилжүүлнэ (давхар тооцохгүй).
            </div>
          )}

          {inProgressElsewhere && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-[12px] text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
              ⚠️ Энэ хэрэглэгчийн дуусаагүй шилжүүлэлт өөр акаунт (
              <span className="font-mono">{preview.source.merge_in_progress}</span>) руу
              байна. Эхлээд тэр акаунт руу гүйцээнэ үү — өөр акаунт руу шилжүүлэх
              боломжгүй.
            </div>
          )}

          {/* Balances */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border-light bg-background/40 p-3">
              <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                Эх (шилжих)
              </div>
              <BalanceLine b={preview.source.balance} />
            </div>
            <div className="rounded-lg border border-border-light bg-background/40 p-3">
              <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                Зорилтот (одоо)
              </div>
              <BalanceLine b={preview.target.balance} />
            </div>
            <div className="rounded-lg border border-primary-300 bg-primary-50 p-3 dark:bg-primary-500/10">
              <div className="text-[11px] uppercase tracking-[0.1em] text-primary-700 dark:text-primary-300">
                Зорилтот (дараа)
              </div>
              <BalanceLine
                b={{
                  gold:
                    (preview.source.balance?.gold ?? 0) +
                    (preview.target.balance?.gold ?? 0),
                  silver:
                    (preview.source.balance?.silver ?? 0) +
                    (preview.target.balance?.silver ?? 0),
                  saving:
                    (preview.source.balance?.saving ?? 0) +
                    (preview.target.balance?.saving ?? 0),
                }}
              />
            </div>
          </div>

          {/* Counts */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {COUNT_LABELS.map(({ key, label }) => (
              <div
                key={key}
                className="rounded-lg border border-border-light bg-background/40 px-3 py-2"
              >
                <div className="text-[11px] text-muted-foreground">{label}</div>
                <div className="text-[15px] font-semibold tabular-nums text-foreground">
                  {formatInt(
                    (preview.counts as unknown as Record<string, number>)[key] ?? 0
                  )}
                </div>
              </div>
            ))}
            <div className="rounded-lg border border-border-light bg-background/40 px-3 py-2">
              <div className="text-[11px] text-muted-foreground">
                Хөрөнгө оруулалт
              </div>
              <div className="text-[15px] font-semibold text-foreground">
                {preview.counts.investment ? "Тийм" : "Үгүй"}
              </div>
            </div>
          </div>

          {/* Confirmation */}
          <div className="space-y-2 rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-500/30 dark:bg-rose-500/10">
            <div className="text-[12px] font-medium text-rose-800 dark:text-rose-200">
              Баталгаажуулах: эх хэрэглэгчийн утасны дугаарыг бичнэ үү (
              <span className="font-mono">{expectedConfirm}</span>)
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Эх хэрэглэгчийн утас / UID"
                value={confirmPhone}
                onChange={(e) => setConfirmPhone(e.target.value)}
                className="sm:max-w-xs"
              />
              <Button
                variant="destructive"
                onClick={() => void handleExecute()}
                disabled={!canExecute}
              >
                {executing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Шилжүүлэх
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-emerald-800 dark:text-emerald-200">
            <CheckCircle2 className="h-4 w-4" />
            Шилжүүлэлт амжилттай
          </div>
          <div className="text-[12px] text-emerald-900/80 dark:text-emerald-200/80">
            Зорилтот шинэ баланс — Алт:{" "}
            <strong>{formatGram(result.balances.targetAfter.gold)}</strong>, Мөнгө:{" "}
            <strong>{formatGram(result.balances.targetAfter.silver)}</strong>,
            Хадгаламж: <strong>{formatInt(result.balances.targetAfter.saving)}</strong>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-emerald-900/80 dark:text-emerald-200/80">
            {Object.entries(result.counts).map(([k, v]) => (
              <span key={k}>
                {k}: <strong className="tabular-nums">{formatInt(Number(v))}</strong>
              </span>
            ))}
          </div>
          {result.skipped.length > 0 && (
            <div className="text-[11px] text-amber-700 dark:text-amber-300">
              Алгассан: {result.skipped.join(", ")}
            </div>
          )}
          <div className="text-[11px] text-muted-foreground">
            Audit ID: <span className="font-mono">{result.auditId}</span>
          </div>
        </div>
      )}
    </div>
  );
}
