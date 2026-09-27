"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Coins, Loader2, RefreshCw, ShoppingBag, Truck, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/StatCard";
import { SectionCard } from "@/components/report/ReportParts";
import {
  BucketChart,
  COLORS,
  CohortChart,
  CumulativeChart,
  HoldByTypeChart,
  NetChart,
  YearlyChart,
  g,
  pct,
} from "@/components/report/goldReserve/GoldReserveCharts";
import {
  fetchGoldReserveReport,
  sumBuckets,
  type GoldReserveReport,
  type MonthRow,
} from "@/lib/report/goldReserve";
import { formatInt, monthLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

function signed(n: number): string {
  return `${n > 0 ? "+" : ""}${g(n)}`;
}

function dateLabel(iso: string): string {
  if (!iso) return "—";
  return iso.slice(0, 10).replaceAll("-", ".");
}

/** Сүүлийн хэдэн сар дараалан нөөц хорогдсон бэ (сүүлийн сараас урагш тоолно). */
function trailingNegativeMonths(rows: MonthRow[]): number {
  let n = 0;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].net < 0) n++;
    else break;
  }
  return n;
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border-light bg-background/40 p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-[18px] font-semibold tabular-nums text-foreground">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

const TH = "py-2 px-3 text-right text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground";
const TD = "py-2 px-3 text-right tabular-nums";

export default function GoldReserveReportPage() {
  const [data, setData] = useState<GoldReserveReport | null>(null);
  // Эхний ачаалалт effect дотор эхэлдэг тул loading анхнаасаа true.
  const [loading, setLoading] = useState(true);
  const [showMonths, setShowMonths] = useState(false);

  useEffect(() => {
    let active = true;
    fetchGoldReserveReport(false)
      .then((res) => {
        if (active) setData(res.data);
      })
      .catch((err) => {
        console.error("Gold reserve report load error:", err);
        toast.error(err instanceof Error ? err.message : "Тайлан ачааллахад алдаа гарлаа.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchGoldReserveReport(true);
      setData(res.data);
      toast.success("Тайланг дахин тооцлоо.");
    } catch (err) {
      console.error("Gold reserve report refresh error:", err);
      toast.error(err instanceof Error ? err.message : "Тайлан дахин тооцоход алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }, []);

  const d = data;

  const derived = useMemo(() => {
    if (!d) return null;
    const years = d.yearly;
    const last = years[years.length - 1];
    const prevYears = years.slice(0, -1);
    const peak = d.monthly.reduce<MonthRow | null>(
      (best, m) => (!best || m.cum > best.cum ? m : best),
      null
    );
    const lastMonth = d.monthly[d.monthly.length - 1] ?? null;
    const negRun = trailingNegativeMonths(d.monthly);
    const holdTotal = sumBuckets(d.holdAll);
    const within7 = d.holdAll["0 өдөр"] + d.holdAll["1–7 өдөр"];
    const within30 = within7 + d.holdAll["8–30 өдөр"];
    const over180 = d.holdAll["181–365 өдөр"] + d.holdAll["1 жилээс дээш"];
    const over365 = d.holdAll["1 жилээс дээш"];
    const ageTotal = sumBuckets(d.ageNow);
    const ageOver180 = d.ageNow["181–365 өдөр"] + d.ageNow["1 жилээс дээш"];
    const ageOver365 = d.ageNow["1 жилээс дээш"];
    const holdSeries = Object.keys(d.holdByYearType)
      .sort()
      .filter((k) => sumBuckets(d.holdByYearType[k]) >= 100)
      .map((k) => {
        const [year, type] = k.split("|");
        const label =
          type === "taken_physically"
            ? `${year} онд биетээр авсан`
            : type === "sold_to_us"
              ? `${year} онд буцааж зарсан`
              : `${year} онд авсан`;
        const color =
          type === "taken_physically" ? COLORS.phys : type === "sold_to_us" ? COLORS.sold : COLORS.unspec;
        return { key: k, label, color, buckets: d.holdByYearType[k] };
      });
    return {
      last,
      prevYears,
      peak,
      lastMonth,
      negRun,
      holdTotal,
      within7,
      within30,
      over180,
      over365,
      ageTotal,
      ageOver180,
      ageOver365,
      holdSeries,
    };
  }, [d]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-[18px] font-semibold text-foreground">Алтны нөөцийн судалгаа</h1>
          <p className="text-[12px] text-muted-foreground">
            Бүх цаг үеийн зарсан ба авсан алт, хэрэглэгчийн хадгалалт, байх ёстой нөөц.
            {d && ` Өгөгдөл ${dateLabel(d.dataFrom)} – ${dateLabel(d.dataTo)}.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {d && (
            <span className="text-[11px] text-muted-foreground">
              Тооцсон: {new Date(d.computedAt).toLocaleString("mn-MN")}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Дахин тооцох
          </Button>
        </div>
      </header>

      {!d && loading && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      )}

      {d && derived && (
        <>
          {/* ---- Байх ёстой нөөц ---- */}
          <section className="rounded-xl border border-border-light bg-card p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Байх ёстой алтны нөөц
                </div>
                <div className="mt-1 text-[40px] font-semibold leading-none tabular-nums text-primary-600 dark:text-primary-400">
                  {formatInt(Math.round(d.reserve.total))}
                  <span className="ml-2 text-[18px] font-normal text-muted-foreground">грамм</span>
                </div>
                <p className="mt-3 max-w-[60ch] text-[12px] text-muted-foreground">
                  Хэрэглэгчид өнөөдөр бүгд алтаа авахаар ирвэл өгөх ёстой хэмжээ. Хэрэглэгчдийн үлдэгдэл,
                  хөрөнгө оруулалт, хүлээн аваагүй бэлгийн нийлбэр.
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-[12px] tabular-nums sm:grid-cols-[auto_auto]">
                <dt className="text-muted-foreground">Хэрэглэгчдийн үлдэгдэл</dt>
                <dd className="text-right font-medium">{g(d.reserve.userBalance)}</dd>
                <dt className="text-muted-foreground">Алттай хэрэглэгч</dt>
                <dd className="text-right font-medium">{formatInt(d.reserve.usersWithGold)} хүн</dd>
                <dt className="text-muted-foreground">Хөрөнгө оруулалт</dt>
                <dd className="text-right font-medium">{g(d.reserve.investments)}</dd>
                <dt className="text-muted-foreground">Хүлээн аваагүй бэлэг</dt>
                <dd className="text-right font-medium">{g(d.reserve.giftPending)}</dd>
                <dt className="text-muted-foreground">Бүх цаг үед зарсан</dt>
                <dd className="text-right font-medium">{g(d.totals.bought)}</dd>
                <dt className="text-muted-foreground">Бүх цаг үед авсан</dt>
                <dd className="text-right font-medium">{g(d.totals.withdrawn)}</dd>
              </dl>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Бүх цаг үед зарсан алт"
              value={g(d.totals.bought)}
              icon={ShoppingBag}
              meta={`${formatInt(d.totals.orders)} захиалга`}
            />
            <StatCard
              label="Биетээр гарсан алт"
              value={g(d.totals.physicalOut)}
              icon={Truck}
              meta={`биет ${g(d.totals.phys)} + бүртгэлгүй ${g(d.totals.unspec)}`}
            />
            <StatCard
              label="Бидэнд буцааж зарсан"
              value={g(d.totals.sold)}
              icon={Wallet}
              meta="компанид үлдсэн, өр буурсан"
            />
            <StatCard
              label="Хэзээ ч аваагүй худалдан авагч"
              value={pct(d.buyers.neverWithdrew, d.buyers.total, 0)}
              icon={Users}
              meta={`${formatInt(d.buyers.neverWithdrew)} / ${formatInt(d.buyers.total)} хүн`}
            />
          </div>

          {/* ---- Товч хариу ---- */}
          <SectionCard title="Товч хариу">
            <ul className="space-y-2 text-[13px] leading-relaxed text-foreground">
              <li>
                <strong>Нөөц өсөж байна уу?</strong>{" "}
                {derived.prevYears.map((y) => `${y.year} онд ${signed(y.net)}`).join(", ")}.{" "}
                {derived.last.year} онд {signed(derived.last.net)}.
                {derived.peak && derived.lastMonth && derived.peak.month !== derived.lastMonth.month && (
                  <>
                    {" "}
                    {monthLabel(derived.peak.month)}д {g(derived.peak.cum)} оргилд хүрээд,
                    {derived.negRun > 0
                      ? ` сүүлийн ${derived.negRun} сар дараалан буурч ${g(derived.lastMonth.cum)} болсон.`
                      : ` одоо ${g(derived.lastMonth.cum)} байна.`}
                  </>
                )}
              </li>
              <li>
                <strong>Хэрэглэгчид аппдаа хадгалж байна уу?</strong> Тийм. Алт худалдаж авсан хүмүүсийн{" "}
                {pct(d.buyers.neverWithdrew, d.buyers.total, 0)} нь хэзээ ч аваагүй. Одоо аппд байгаа алтны{" "}
                {pct(derived.ageOver180, derived.ageTotal, 0)} нь хагас жилээс дээш,{" "}
                {pct(derived.ageOver365, derived.ageTotal, 0)} нь нэг жилээс дээш хугацаанд хадгалагдаж байна.
              </li>
              <li>
                <strong>Захиалаад тэр дор нь авч байна уу?</strong> Үгүй. Авсан алтны{" "}
                {pct(derived.within7, derived.holdTotal)} нь долоо хоногийн дотор,{" "}
                {pct(derived.within30, derived.holdTotal)} нь 30 хоногийн дотор авагдсан.{" "}
                {pct(derived.over180, derived.holdTotal, 0)} нь хагас жилээс дээш хадгалагдсаны дараа авагдсан.
              </li>
            </ul>
          </SectionCard>

          {/* ---- 1. Жил ---- */}
          <SectionCard
            title="1. Жил бүрийн зарсан ба авсан алт"
            subtitle="Зүүн багана зарсан алт, баруун багана авсан алт (төрлөөр), грамм."
          >
            <YearlyChart rows={d.yearly} />
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {d.yearly.map((y) => (
                <Tile
                  key={y.year}
                  label={`${y.year} онд нөөц`}
                  value={signed(y.net)}
                  sub={`авсан / зарсан ${pct(y.wd, y.bought)} · ${formatInt(y.buyers)} худалдан авагч`}
                />
              ))}
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[820px] text-[12px]">
                <thead>
                  <tr className="border-b border-border-light">
                    <th className={cn(TH, "text-left")}>Жил</th>
                    <th className={TH}>Захиалга</th>
                    <th className={TH}>Худалдан авагч</th>
                    <th className={TH}>Зарсан</th>
                    <th className={TH}>Биетээр авсан</th>
                    <th className={TH}>Буцааж зарсан</th>
                    <th className={TH}>Төрөл бүртгэлгүй</th>
                    <th className={TH}>Нийт авсан</th>
                    <th className={TH}>Авсан / зарсан</th>
                    <th className={TH}>Нөөцийн өөрчлөлт</th>
                    <th className={TH}>Жилийн эцсийн нөөц</th>
                  </tr>
                </thead>
                <tbody>
                  {d.yearly.map((y) => (
                    <tr key={y.year} className="border-b border-border-light/60 last:border-0">
                      <td className={cn(TD, "text-left font-medium text-foreground")}>{y.year}</td>
                      <td className={cn(TD, "text-muted-foreground")}>{formatInt(y.orders)}</td>
                      <td className={cn(TD, "text-muted-foreground")}>{formatInt(y.buyers)}</td>
                      <td className={cn(TD, "font-medium text-foreground")}>{g(y.bought)}</td>
                      <td className={cn(TD, "text-muted-foreground")}>{g(y.phys)}</td>
                      <td className={cn(TD, "text-muted-foreground")}>{g(y.sold)}</td>
                      <td className={cn(TD, "text-muted-foreground")}>{g(y.unspec)}</td>
                      <td className={cn(TD, "font-medium text-foreground")}>{g(y.wd)}</td>
                      <td className={cn(TD, "text-muted-foreground")}>{pct(y.wd, y.bought)}</td>
                      <td className={cn(TD, "font-medium", y.net < 0 ? "text-rose-600" : "text-emerald-700 dark:text-emerald-400")}>
                        {signed(y.net)}
                      </td>
                      <td className={cn(TD, "text-foreground")}>{g(y.cum)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border-light font-semibold text-foreground">
                    <td className={cn(TD, "text-left")}>Нийт</td>
                    <td className={TD}>{formatInt(d.totals.orders)}</td>
                    <td className={TD}>{formatInt(d.buyers.total)}</td>
                    <td className={TD}>{g(d.totals.bought)}</td>
                    <td className={TD}>{g(d.totals.phys)}</td>
                    <td className={TD}>{g(d.totals.sold)}</td>
                    <td className={TD}>{g(d.totals.unspec)}</td>
                    <td className={TD}>{g(d.totals.withdrawn)}</td>
                    <td className={TD}>{pct(d.totals.withdrawn, d.totals.bought)}</td>
                    <td className={TD}>{signed(d.totals.netFlow)}</td>
                    <td className={TD}>{g(d.totals.netFlow)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Авах хүсэлтийн төрөл (биетээр авсан эсвэл бидэнд буцааж зарсан) 2026 оны 2-р сараас хойш бүртгэгдэж
              эхэлсэн. Түүнээс өмнөх авалтыг биет авалт гэж үзэв. {derived.last.year} он нь{" "}
              {dateLabel(d.dataTo)} хүртэлх бодит гүйлгээ.
            </p>
          </SectionCard>

          {/* ---- 2. Сар ---- */}
          <SectionCard
            title="2. Нөөц сар бүр хэрхэн өөрчлөгдсөн бэ?"
            subtitle="Сар бүрийн эцсийн байх ёстой нөөц (нийт зарсан − нийт авсан), грамм."
          >
            <CumulativeChart rows={d.monthly} />
            <div className="mt-2 flex flex-wrap gap-4">
              {derived.peak && (
                <Swatch color={COLORS.bought} label={`Оргил: ${monthLabel(derived.peak.month)} · ${g(derived.peak.cum)}`} />
              )}
              {derived.lastMonth && (
                <Swatch color={COLORS.bought} label={`Одоо: ${monthLabel(derived.lastMonth.month)} · ${g(derived.lastMonth.cum)}`} />
              )}
            </div>
            <h4 className="mt-5 text-[13px] font-semibold text-foreground">Сар бүрийн өөрчлөлт</h4>
            <p className="mb-2 text-[11px] text-muted-foreground">
              Зарсан − авсан. Ногоон: нөөц нэмэгдсэн сар. Улаан: авалт зарсанаас давсан сар.
            </p>
            <NetChart rows={d.monthly} />
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={() => setShowMonths((v) => !v)}>
                {showMonths ? "Сарын хүснэгтийг хаах" : "Сарын хүснэгтийг харах"}
              </Button>
            </div>
            {showMonths && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[720px] text-[12px]">
                  <thead>
                    <tr className="border-b border-border-light">
                      <th className={cn(TH, "text-left")}>Сар</th>
                      <th className={TH}>Зарсан</th>
                      <th className={TH}>Биетээр авсан</th>
                      <th className={TH}>Буцааж зарсан</th>
                      <th className={TH}>Төрөл бүртгэлгүй</th>
                      <th className={TH}>Нийт авсан</th>
                      <th className={TH}>Өөрчлөлт</th>
                      <th className={TH}>Нөөц</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.monthly.map((m) => (
                      <tr key={m.month} className="border-b border-border-light/60 last:border-0">
                        <td className={cn(TD, "text-left text-foreground")}>{monthLabel(m.month)}</td>
                        <td className={cn(TD, "text-foreground")}>{g(m.bought)}</td>
                        <td className={cn(TD, "text-muted-foreground")}>{g(m.phys)}</td>
                        <td className={cn(TD, "text-muted-foreground")}>{g(m.sold)}</td>
                        <td className={cn(TD, "text-muted-foreground")}>{g(m.unspec)}</td>
                        <td className={cn(TD, "text-foreground")}>{g(m.wd)}</td>
                        <td className={cn(TD, "font-medium", m.net < 0 ? "text-rose-600" : "text-emerald-700 dark:text-emerald-400")}>
                          {signed(m.net)}
                        </td>
                        <td className={cn(TD, "text-foreground")}>{g(m.cum)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* ---- 3. Хадгалах хугацаа ---- */}
          <SectionCard
            title="3. Хэрэглэгч алтаа хэр удаан хадгалаад авдаг вэ?"
            subtitle="Авалт бүрийг тухайн хэрэглэгчийн хамгийн эрт худалдан авалттай холбож (FIFO), грамм бүрийн хадгалагдсан хугацааг тооцов."
          >
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div>
                <h4 className="text-[13px] font-semibold text-foreground">Авсан алт: хэдэн өдөр хадгалсан бэ?</h4>
                <p className="mb-1 text-[11px] text-muted-foreground">
                  Нийт {g(derived.holdTotal)}. Худалдаж авснаас авах хүртэл.
                </p>
                <BucketChart buckets={d.holdAll} color={COLORS.phys} />
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-foreground">Одоо аппд байгаа алт: хэдэн өдөр болсон бэ?</h4>
                <p className="mb-1 text-[11px] text-muted-foreground">
                  Нийт {g(derived.ageTotal)}. Худалдаж авснаас өнөөдөр хүртэл.
                </p>
                <BucketChart buckets={d.ageNow} color={COLORS.bought} />
              </div>
            </div>
            {derived.holdSeries.length > 0 && (
              <>
                <h4 className="mt-5 text-[13px] font-semibold text-foreground">
                  Хадгалсан хугацаа авалтын жил, төрлөөр
                </h4>
                <p className="mb-2 text-[11px] text-muted-foreground">
                  Тухайн бүлгийн нийт авалтад эзлэх хувь. Буцааж зарж буй хүмүүс хамгийн удаан хадгалсан алтаа зарж байна.
                </p>
                <HoldByTypeChart series={derived.holdSeries} />
              </>
            )}
          </SectionCard>

          {/* ---- 4. Cohort ---- */}
          <SectionCard
            title="4. Аль жилд зарсан алт одоо хаана байна?"
            subtitle="Худалдан авсан жилээр: тухайн жил зарсан алтнаас хэд нь одоо ч аппд байгаа, хэд нь авагдсан (FIFO), грамм."
          >
            <CohortChart rows={d.cohort} />
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] text-[12px]">
                <thead>
                  <tr className="border-b border-border-light">
                    <th className={cn(TH, "text-left")}>Худалдан авсан жил</th>
                    <th className={TH}>Зарсан</th>
                    <th className={TH}>Авагдсан</th>
                    <th className={TH}>Авагдсан хувь</th>
                    <th className={TH}>Одоо ч аппд байгаа</th>
                  </tr>
                </thead>
                <tbody>
                  {d.cohort.map((c) => (
                    <tr key={c.year} className="border-b border-border-light/60 last:border-0">
                      <td className={cn(TD, "text-left font-medium text-foreground")}>{c.year}</td>
                      <td className={cn(TD, "text-foreground")}>{g(c.bought)}</td>
                      <td className={cn(TD, "text-muted-foreground")}>{g(c.withdrawn)}</td>
                      <td className={cn(TD, "text-muted-foreground")}>{pct(c.withdrawn, c.bought)}</td>
                      <td className={cn(TD, "font-medium text-foreground")}>{g(c.held)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* ---- 5. Хэрэглэгчид ---- */}
          <SectionCard title="5. Хэрэглэгчид">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              <Tile label="Нийт худалдан авагч" value={formatInt(d.buyers.total)} sub="алт худалдаж авсан хүн" />
              <Tile
                label="Хэзээ ч аваагүй"
                value={formatInt(d.buyers.neverWithdrew)}
                sub={`${pct(d.buyers.neverWithdrew, d.buyers.total, 0)} · алтаа аппдаа хадгалж байгаа`}
              />
              <Tile
                label="Ядаж нэг удаа авсан"
                value={formatInt(d.buyers.everWithdrew)}
                sub={pct(d.buyers.everWithdrew, d.buyers.total, 0)}
              />
              <Tile label="Бүгдийг нь авсан" value={formatInt(d.buyers.fullOut)} sub="үлдэгдэлгүй болсон" />
              <Tile label="Одоо алттай" value={formatInt(d.reserve.usersWithGold)} sub="үлдэгдэл > 0" />
            </div>
            <h4 className="mt-5 text-[13px] font-semibold text-foreground">Алттай хэрэглэгчид үлдэгдлийн хэмжээгээр</h4>
            <div className="mt-2 space-y-1.5">
              {(() => {
                const max = Math.max(1, ...d.distribution.map((b) => b.count));
                return d.distribution.map((b) => (
                  <div key={b.label} className="grid grid-cols-[120px_1fr_80px] items-center gap-3 text-[12px]">
                    <span className="text-muted-foreground">{b.label}</span>
                    <div className="h-3 overflow-hidden rounded-sm bg-muted">
                      <div className="h-full rounded-r-sm" style={{ width: `${(100 * b.count) / max}%`, background: COLORS.phys }} />
                    </div>
                    <span className="text-right tabular-nums text-muted-foreground">{formatInt(b.count)} хүн</span>
                  </div>
                ));
              })()}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Хамгийн их үлдэгдэлтэй 100 хэрэглэгч нийт нөөцийн {d.top100Share.toFixed(0)}%-ийг эзэлдэг. Хамгийн их
              үлдэгдэлтэй 10 хэрэглэгч нийлээд {g(d.top10Sum)}. Эдгээр хүмүүс нэгэн зэрэг авахаар шийдвэл нөөцөд шууд
              нөлөөлнө.
            </p>
          </SectionCard>

          {/* ---- 6. Дүгнэлт ---- */}
          <SectionCard title="6. Дүгнэлт">
            <div className="space-y-4 text-[13px] leading-relaxed text-foreground">
              <div>
                <h4 className="font-semibold">&quot;Байх ёстой нөөц&quot; гэж юу вэ?</h4>
                <p className="mt-1 text-muted-foreground">
                  Хэрэглэгч аппаар алт худалдаж авахад бодит алт нь гарт нь очихгүй, харин балансад нь бичигдэнэ. Тэр
                  алтыг хэрэглэгч хүссэн үедээ биетээр авах эрхтэй. Тиймээс компани хэрэглэгчдийн балансад байгаа нийт
                  алттай тэнцэх хэмжээний бодит алтыг бэлэн байлгах ёстой. Энгийнээр хэлбэл энэ бол компанийн
                  хэрэглэгчдэдээ өгөх өр.
                </p>
              </div>
              <div>
                <h4 className="font-semibold">{g(d.reserve.total)} юунаас бүрдэх вэ?</h4>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">{g(d.reserve.userBalance)} нь хэрэглэгчдийн үлдэгдэл.</strong>{" "}
                    {formatInt(d.reserve.usersWithGold)} хүний аппд харагдаж буй алтны нийлбэр. Өрийн үндсэн хэсэг.
                  </li>
                  <li>
                    <strong className="text-foreground">{g(d.reserve.investments)} нь хөрөнгө оруулалт.</strong> Балансаас
                    хөрөнгө оруулалтын гэрээнд шилжсэн алт. Балансад харагдахгүй ч гэрээ дуусахад буцаж ирнэ.
                  </li>
                  <li>
                    <strong className="text-foreground">{g(d.reserve.giftPending)} нь хүлээн аваагүй бэлэг.</strong>{" "}
                    Илгээгчийн балансаас хасагдсан ч хүлээн авагч хараахан аваагүй.
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold">Энэ тоо юуг хэлэхгүй вэ?</h4>
                <p className="mt-1 text-muted-foreground">
                  Компани агуулахдаа одоо бодитоор хэдэн грамм алт хадгалж байгааг энэ өгөгдлөөс мэдэх боломжгүй.
                  Агуулахын бодит нөөцийг {g(d.reserve.total)}-тай харьцуулах хэрэгтэй. Бага бол зөрүү нь бүрхэгдээгүй
                  өр. Их бол илүүдэл нөөц.
                </p>
                <p className="mt-1 text-muted-foreground">
                  Бидэнд буцааж зарсан {g(d.totals.sold)} нь компанид үлдсэн тул биет нөөцөөс хасагдаагүй. Харин тэр
                  хэмжээгээр өр буурсан. Бүх цаг үед биетээр гарсан алт {g(d.totals.physicalOut)}.
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Тоог хоёр аргаар шалгасан</h4>
                <p className="mt-1 text-muted-foreground">
                  Нэгдүгээрт, хэрэглэгчдийн балансыг шууд нэмэхэд {g(d.reserve.total)}. Хоёрдугаарт, бүх цаг үед зарсан{" "}
                  {g(d.totals.bought)}-аас авсан {g(d.totals.withdrawn)}-ийг хасахад {g(d.totals.netFlow)}. Зөрүү{" "}
                  {g(Math.abs(d.totals.netFlow - d.reserve.total))} буюу{" "}
                  {pct(Math.abs(d.totals.netFlow - d.reserve.total), d.reserve.total)}. Хоёр арга бараг ижил тоо өгч
                  байгаа нь өгөгдөл найдвартай гэдгийг харуулж байна.
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Чиг хандлага</h4>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Нөөцийн өсөлт.</strong>{" "}
                    {derived.prevYears.map((y) => `${y.year} онд ${signed(y.net)}`).join(", ")}. {derived.last.year} онд{" "}
                    {signed(derived.last.net)}.
                    {derived.negRun > 0 &&
                      ` Сүүлийн ${derived.negRun} сар дараалан авалт зарсанаас давж, нөөц буурч байна.`}
                  </li>
                  <li>
                    <strong className="text-foreground">Хэрэглэгчид удаан хадгалдаг.</strong> Худалдаж аваад шууд авах
                    тохиолдол цөөн. Авагдаж буй алт голдуу 1–2 жилийн өмнө зарагдсан алт.
                    {d.cohort[0] && ` ${d.cohort[0].year} оны алтны ${pct(d.cohort[0].withdrawn, d.cohort[0].bought, 0)} нь одоо гараад явсан.`}
                  </li>
                  <li>
                    <strong className="text-foreground">Буцааж зарах нэмэгдэж байна.</strong> Бүртгэгдсэн авалтын дотор
                    буцааж зарсан {g(d.totals.sold)}, биетээр авсан {g(d.totals.phys)}.
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold">Юунд анхаарах вэ?</h4>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Агуулахын бодит нөөцийг {g(d.reserve.total)}-тай тулгах.</strong>{" "}
                    Энэ нь хамгийн чухал шалгалт.
                  </li>
                  {d.peakMonth && (
                    <li>
                      <strong className="text-foreground">
                        Нэг сарын хамгийн их авалт {g(d.peakMonth.wd)}
                      </strong>{" "}
                      ({monthLabel(d.peakMonth.month)}, үүнээс биетээр {g(d.peakMonth.phys)}). Бэлэн байлгах биет
                      нөөцийг наад зах нь энэ түвшинд төлөвлөх.
                    </li>
                  )}
                  <li>
                    <strong className="text-foreground">
                      Хамгийн их үлдэгдэлтэй 100 хэрэглэгч нөөцийн {d.top100Share.toFixed(0)}%-ийг эзэлдэг.
                    </strong>{" "}
                    Эдгээр хүний авалт нөөцөд шууд нөлөөлнө. Тэдний хөдөлгөөнийг тусад нь хянах.
                  </li>
                  {derived.negRun >= 2 && (
                    <li>
                      <strong className="text-foreground">Авалт зарсанаас давсан {derived.negRun} сар дараалж байна.</strong>{" "}
                      Энэ үргэлжилбэл шинэ алт худалдан авахгүйгээр хэрэглэгчийн авалтыг нөөцөөс л гаргах болно.
                    </li>
                  )}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold">Аргачлал</h4>
                <ol className="mt-1 list-decimal space-y-1 pl-5 text-muted-foreground">
                  <li>
                    Зарсан алт: orders баримтаас type = deposit, metal_id = 1, payment_status = success, admin_status =
                    success байгаа {formatInt(d.totals.orders)} захиалга, нийт {g(d.totals.bought)}. Pending төлөвтэй
                    захиалгыг тооцоогүй.
                  </li>
                  <li>
                    Авсан алт: withdraws баримтаас metal_id = 1, status = verified байгаа{" "}
                    {formatInt(d.totals.withdrawCount)} хүсэлт, нийт {g(d.totals.withdrawn)}. Огноо нь баталгаажсан
                    огноо. Pending хүсэлтийг тооцоогүй.
                  </li>
                  <li>
                    Байх ёстой нөөц: users.balance.gold нийлбэр + investments үлдэгдэл + gift_orders хүлээн аваагүй
                    бэлэг.
                  </li>
                  <li>
                    Хадгалсан хугацаа: хэрэглэгч бүрийн худалдан авалтыг огноогоор эрэмбэлж, авалт бүрийг хамгийн эрт
                    худалдан авалтаас эхлэн хасав (FIFO). Хүлээн авсан бэлгийг хүлээн авагчийн худалдан авалт гэж үзэв.
                    {d.unallocated > 0 && ` Холбож чадаагүй ${g(d.unallocated)} байна.`}
                  </li>
                  <li>
                    Тооцоо 6 цаг тутамд шинэчлэгдэнэ. &quot;Дахин тооцох&quot; товч дарвал одоогийн өгөгдлөөр шууд
                    тооцно. Мөнгө ({g(d.reserve.silverBalance)} үлдэгдэл) энэ тайланд ороогүй.
                  </li>
                </ol>
              </div>
            </div>
          </SectionCard>
        </>
      )}

      {!d && !loading && (
        <div className="rounded-xl border border-dashed border-border-light px-4 py-10 text-center text-[12px] text-muted-foreground">
          <Coins className="mx-auto mb-2 h-5 w-5" />
          Тайлан ачааллагдсангүй. &quot;Дахин тооцох&quot; товчийг дарна уу.
        </div>
      )}
    </div>
  );
}
