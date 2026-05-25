"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  FileText,
  Inbox,
  LineChart,
  Loader2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import type { Timestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/select";
import {
  currentMonthKey,
  fetchWithdrawAnalytics,
  formatMonthDisplay,
  listAnalyticsMonths,
  type DailyBreakdownRow,
  type TopUserRow,
  type WithdrawAnalytics,
  type WithdrawTypeBreakdown,
} from "@/lib/firestore/withdrawAnalytics";
import { WithdrawTypePieChart } from "@/components/withdraws_statistics/WithdrawTypePieChart";

const INT = new Intl.NumberFormat("mn-MN", { maximumFractionDigits: 0 });
const GRAM2 = new Intl.NumberFormat("mn-MN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const MNT = new Intl.NumberFormat("mn-MN", { maximumFractionDigits: 0 });

function fmtInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "0";
  return INT.format(n);
}
function fmtGram2(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "0.00";
  return GRAM2.format(n);
}
function fmtMNT(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "0";
  return MNT.format(n);
}
function fmtDailyDate(value: DailyBreakdownRow["date"]): string {
  if (!value) return "—";
  let d: Date;
  if (typeof value === "string") d = new Date(value);
  else if (typeof value === "object" && "toDate" in value)
    d = (value as Timestamp).toDate();
  else return "—";
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}
function fmtCalculatedAt(ts: Timestamp | undefined): string {
  if (!ts) return "—";
  const d = ts.toDate?.();
  if (!d || Number.isNaN(d.getTime())) return "—";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

export default function WithdrawsStatisticsPage() {
  const [months, setMonths] = useState<string[]>([]);
  const [monthsLoading, setMonthsLoading] = useState(true);
  const [selected, setSelected] = useState<string>(() => currentMonthKey());
  const [data, setData] = useState<WithdrawAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const loadMonths = useCallback(async () => {
    try {
      const list = await listAnalyticsMonths();
      setMonths(list);
      if (list.length > 0 && !list.includes(selected)) {
        setSelected(list[0]);
      }
    } catch (err) {
      console.error("Error loading available months:", err);
      toast.error("Боломжтой саруудын жагсаалт татаж чадсангүй.");
    } finally {
      setMonthsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = useCallback(async (monthKey: string) => {
    setLoading(true);
    try {
      const d = await fetchWithdrawAnalytics(monthKey);
      setData(d);
    } catch (err) {
      console.error("Error loading withdraw analytics:", err);
      toast.error("Статистикийн мэдээлэл татахад алдаа гарлаа.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMonths();
  }, [loadMonths]);

  useEffect(() => {
    if (!selected) return;
    void loadData(selected);
  }, [selected, loadData]);

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-[18px] font-semibold text-foreground">
          Биетээр авах статистик
        </h1>
        <p className="text-[12px] text-muted-foreground">
          Эхлэл <span className="text-foreground/70">/ Биетээр авах статистик</span>
        </p>
      </header>

      {/* Month selector */}
      <div className="rounded-xl border border-border-light bg-card px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[14px] font-semibold text-foreground">
            Сарын статистик
          </h2>
          <div className="flex items-center gap-2">
            <label
              htmlFor="month-select"
              className="text-[12px] text-muted-foreground"
            >
              Сар сонгох:
            </label>
            <div className="min-w-[160px]">
              <Select
                id="month-select"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                disabled={monthsLoading || months.length === 0}
              >
                {months.length === 0 && (
                  <option value={selected}>{formatMonthDisplay(selected)}</option>
                )}
                {months.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthDisplay(m)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border-light bg-card py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
          <p className="text-[12px] text-muted-foreground">
            Статистик ачааллаж байна…
          </p>
        </div>
      ) : data ? (
        <Analytics data={data} />
      ) : (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Сонгосон сарын статистик мэдээлэл олдсонгүй.
        </div>
      )}
    </div>
  );
}

function Analytics({ data }: { data: WithdrawAnalytics }) {
  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Нийт хүсэлт"
          value={fmtInt(data.total_withdraws)}
          icon={<FileText className="h-4 w-4" />}
          tone="primary"
        />
        <KpiCard
          label="Нийт алт (г)"
          value={fmtGram2(data.gold?.total_grams)}
          icon={<Wallet className="h-4 w-4" />}
          tone="amber"
        />
        <KpiCard
          label="Дундаж алт (г)"
          value={fmtGram2(data.gold?.avg_quantity)}
          icon={<LineChart className="h-4 w-4" />}
          tone="sky"
        />
        <KpiCard
          label="Алт хүсэлт"
          value={fmtInt(data.gold?.withdraw_count)}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="emerald"
        />
      </section>

      {/* Pie chart + details */}
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card title="Төрлөөр">
          <WithdrawTypePieChart data={data.by_withdraw_type} />
        </Card>
        <Card title="Дэлгэрэнгүй мэдээлэл">
          <TypeDetailsTable data={data.by_withdraw_type} />
        </Card>
      </section>

      {/* Daily breakdown */}
      {data.daily_breakdown && data.daily_breakdown.length > 0 && (
        <section>
          <Card title="Өдрөөр задаргаа">
            <DailyBreakdownTable rows={data.daily_breakdown} />
          </Card>
        </section>
      )}

      {/* Top users */}
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card title="Хамгийн их хүсэлт гаргасан (Top 10)">
          <TopUsersTable rows={data.top_users_by_frequency} />
        </Card>
        <Card title="Хамгийн их татсан (Top 10)">
          <TopUsersTable rows={data.top_users_by_quantity} />
        </Card>
      </section>

      {/* Metadata */}
      <section className="flex items-center gap-1.5 rounded-xl border border-border-light bg-card px-4 py-2.5 text-[12px] text-muted-foreground">
        <CalendarClock className="h-3.5 w-3.5" />
        Тооцоолсон огноо:{" "}
        <span className="text-foreground">{fmtCalculatedAt(data.calculated_at)}</span>
      </section>
    </div>
  );
}

type KpiTone = "primary" | "amber" | "sky" | "emerald";

function KpiCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: KpiTone;
}) {
  const toneClass: Record<KpiTone, string> = {
    primary: "bg-primary-100 text-primary-700",
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  };
  return (
    <div className="rounded-xl border border-border-light bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            {label}
          </div>
          <div className="mt-1 text-[20px] font-semibold tabular-nums text-foreground">
            {value}
          </div>
        </div>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            toneClass[tone]
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border-light bg-card p-4">
      <h3 className="mb-3 text-[13px] font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function TypeDetailsTable({
  data,
}: {
  data: WithdrawAnalytics["by_withdraw_type"];
}) {
  const rows: Array<{ label: string; v: WithdrawTypeBreakdown }> = [];
  if (data?.sold_to_us) rows.push({ label: "Манайд зарсан", v: data.sold_to_us });
  if (data?.taken_physically) rows.push({ label: "Биетээр авсан", v: data.taken_physically });
  if (data?.unspecified) rows.push({ label: "Тодорхойгүй", v: data.unspecified });

  if (rows.length === 0) {
    return (
      <div className="py-6 text-center text-[12px] text-muted-foreground">
        Мэдээлэл алга
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div
          key={r.label}
          className="rounded-lg border border-border-light bg-card p-3 text-[12px]"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="font-semibold text-foreground">{r.label}</div>
            <div className="text-muted-foreground">
              {fmtInt(r.v.count)}{" "}
              <span className="text-foreground/70">({r.v.percentage ?? 0}%)</span>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
            {r.v.total_grams_gold != null && (
              <Detail label="Алт" value={`${fmtGram2(r.v.total_grams_gold)} г`} />
            )}
            {r.v.total_grams_silver != null && (
              <Detail label="Мөнгө" value={`${fmtGram2(r.v.total_grams_silver)} г`} />
            )}
            {r.v.total_price_mnt != null && (
              <Detail label="Үнэ" value={`${fmtMNT(r.v.total_price_mnt)} ₮`} />
            )}
            {r.v.avg_gold_rate != null && (
              <Detail label="Дундаж ханш" value={`${fmtMNT(r.v.avg_gold_rate)} ₮`} />
            )}
          </dl>
        </div>
      ))}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground tabular-nums">
        {value}
      </dd>
    </>
  );
}

function DailyBreakdownTable({ rows }: { rows: DailyBreakdownRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-[12px]">
        <thead>
          <tr className="border-b border-border-light text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
            <th className="px-2 py-2 text-left font-medium">Огноо</th>
            <th className="px-2 py-2 text-center font-medium">Манайд зарсан</th>
            <th className="px-2 py-2 text-center font-medium">Биетээр авсан</th>
            <th className="px-2 py-2 text-center font-medium">Нийт хүсэлт</th>
            <th className="px-2 py-2 text-right font-medium">Алт (г)</th>
            <th className="px-2 py-2 text-right font-medium">Мөнгө (г)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d, i) => (
            <tr
              key={`${fmtDailyDate(d.date)}-${i}`}
              className="border-b border-border-light/60 last:border-b-0 hover:bg-muted/40"
            >
              <td className="px-2 py-1.5 tabular-nums">{fmtDailyDate(d.date)}</td>
              <td className="px-2 py-1.5 text-center tabular-nums">
                {fmtInt(d.sold_to_us_count)}
              </td>
              <td className="px-2 py-1.5 text-center tabular-nums">
                {fmtInt(d.taken_physically_count)}
              </td>
              <td className="px-2 py-1.5 text-center font-semibold tabular-nums">
                {fmtInt(d.total_withdraws)}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {fmtGram2(d.total_grams_gold)}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {fmtGram2(d.total_grams_silver)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopUsersTable({ rows }: { rows: TopUserRow[] | undefined }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-[12px] text-muted-foreground">
        <Inbox className="h-6 w-6 opacity-60" />
        Мэдээлэл алга
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-border-light text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
            <th className="px-2 py-2 text-left font-medium">#</th>
            <th className="px-2 py-2 text-left font-medium">Нэр</th>
            <th className="px-2 py-2 text-center font-medium">Хүсэлт</th>
            <th className="px-2 py-2 text-right font-medium">Тоо хэмжээ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u, i) => {
            const isTop = u.rank === 1;
            return (
              <tr
                key={`${u.rank}-${u.name}-${i}`}
                className="border-b border-border-light/60 last:border-b-0 hover:bg-muted/40"
              >
                <td
                  className={cn(
                    "px-2 py-1.5 font-semibold tabular-nums",
                    isTop
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground"
                  )}
                >
                  {isTop ? <TrendingUp className="inline h-3 w-3" /> : null}{" "}
                  {u.rank}
                </td>
                <td className="px-2 py-1.5 font-medium text-foreground">
                  {u.name || "Тодорхойгүй"}
                </td>
                <td className="px-2 py-1.5 text-center tabular-nums">
                  {fmtInt(u.withdraw_count)}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {fmtGram2(u.total_quantity)} г
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
