"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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
import { formatCompactMNT, formatInt, formatMNT, monthLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Туслах
// ---------------------------------------------------------------------------
function signed(n: number): string {
  return `${n > 0 ? "+" : ""}${g(n)}`;
}

function dateLabel(iso: string): string {
  if (!iso) return "—";
  return iso.slice(0, 10).replaceAll("-", ".");
}

const MONTH_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function monthEn(key: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  return m ? `${MONTH_EN[parseInt(m[2], 10) - 1]} ${m[1]}` : key;
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

/** Монгол текст + доор нь англи тайлбар. */
function Bi({ mn, en, className }: { mn: ReactNode; en: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-0.5", className)}>
      <div className="text-[13px] leading-relaxed text-foreground">{mn}</div>
      <div lang="en" className="text-[12px] leading-relaxed text-muted-foreground">
        {en}
      </div>
    </div>
  );
}

/** Гарчиг: МН том, EN жижиг. */
function H({ mn, en }: { mn: string; en: string }) {
  return (
    <div className="mt-5 mb-2">
      <h4 className="text-[13px] font-semibold text-foreground">{mn}</h4>
      <div lang="en" className="text-[11px] text-muted-foreground">
        {en}
      </div>
    </div>
  );
}

function Tile({
  mn,
  en,
  value,
  sub,
  subEn,
}: {
  mn: string;
  en: string;
  value: string;
  sub?: string;
  subEn?: string;
}) {
  return (
    <div className="rounded-lg border border-border-light bg-background/40 p-3">
      <div className="text-[11px] text-foreground/80">{mn}</div>
      <div lang="en" className="text-[10px] text-muted-foreground">
        {en}
      </div>
      <div className="mt-1.5 text-[18px] font-semibold tabular-nums text-foreground">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
      {subEn && (
        <div lang="en" className="text-[10px] text-muted-foreground/80">
          {subEn}
        </div>
      )}
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

/** Хүснэгтийн толгой: МН + EN. */
function Th({ mn, en, left }: { mn: string; en: string; left?: boolean }) {
  return (
    <th
      className={cn(
        "py-2 px-3 align-bottom text-[11px] font-medium text-muted-foreground",
        left ? "text-left" : "text-right"
      )}
    >
      <div className="uppercase tracking-[0.06em]">{mn}</div>
      <div lang="en" className="text-[10px] font-normal normal-case tracking-normal text-muted-foreground/70">
        {en}
      </div>
    </th>
  );
}

const TD = "py-2 px-3 text-right tabular-nums";
const NEG = "text-rose-600";
const POS = "text-emerald-700 dark:text-emerald-400";

// ---------------------------------------------------------------------------
// Хуудас
// ---------------------------------------------------------------------------
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
    const peak = d.monthly.reduce<MonthRow | null>((best, m) => (!best || m.cum > best.cum ? m : best), null);
    const lastMonth = d.monthly[d.monthly.length - 1] ?? null;
    const negRun = trailingNegativeMonths(d.monthly);
    const holdTotal = sumBuckets(d.holdAll);
    const within7 = d.holdAll["0 өдөр"] + d.holdAll["1–7 өдөр"];
    const within30 = within7 + d.holdAll["8–30 өдөр"];
    const over180 = d.holdAll["181–365 өдөр"] + d.holdAll["1 жилээс дээш"];
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
            ? `${year} онд биетээр авсан / physical ${year}`
            : type === "sold_to_us"
              ? `${year} онд буцааж зарсан / sold back ${year}`
              : `${year} онд авсан / redeemed ${year}`;
        const color =
          type === "taken_physically" ? COLORS.phys : type === "sold_to_us" ? COLORS.sold : COLORS.unspec;
        return { key: k, label, color, buckets: d.holdByYearType[k] };
      });
    const reserveDiff = Math.abs(d.totals.netFlow - d.reserve.total);
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
      ageTotal,
      ageOver180,
      ageOver365,
      holdSeries,
      reserveDiff,
    };
  }, [d]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-[18px] font-semibold text-foreground">Алтны нөөцийн судалгаа</h1>
          <p lang="en" className="text-[12px] text-muted-foreground">
            Gold Reserve Study — gold sold vs. redeemed, customer holding behaviour, and the reserve the
            company must hold.
            {d && ` Data ${dateLabel(d.dataFrom)} – ${dateLabel(d.dataTo)}.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {d && (
            <span className="text-[11px] text-muted-foreground">
              Тооцсон / computed: {new Date(d.computedAt).toLocaleString("mn-MN")}
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
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-[62ch]">
                <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Байх ёстой алтны нөөц
                </div>
                <div lang="en" className="text-[10px] text-muted-foreground/80">
                  Required gold reserve (gold owed to customers)
                </div>
                <div className="mt-2 text-[40px] font-semibold leading-none tabular-nums text-primary-600 dark:text-primary-400">
                  {formatInt(Math.round(d.reserve.total))}
                  <span className="ml-2 text-[18px] font-normal text-muted-foreground">грамм</span>
                </div>
                <div className="mt-2 text-[14px] font-medium tabular-nums text-foreground">
                  ≈ {formatCompactMNT(d.investor.reserveValueMnt)}
                  <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                    өнөөдрийн ханшаар ({formatMNT(d.goldRate.rate)}/г) · at today&apos;s rate
                  </span>
                </div>
                <Bi
                  className="mt-3"
                  mn="Хэрэглэгчид өнөөдөр бүгд алтаа авахаар ирвэл өгөх ёстой хэмжээ. Хэрэглэгчдийн үлдэгдэл, хөрөнгө оруулалт, хүлээн аваагүй бэлгийн нийлбэр."
                  en="The amount of physical gold the company must hold to honour every customer claim today. Sum of customer balances, gold under investment contracts, and gifts not yet accepted."
                />
              </div>
              <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 text-[12px] tabular-nums">
                {[
                  ["Хэрэглэгчдийн үлдэгдэл", "Customer balances", g(d.reserve.userBalance)],
                  ["Алттай хэрэглэгч", "Customers holding gold", `${formatInt(d.reserve.usersWithGold)} хүн`],
                  ["Хөрөнгө оруулалт", "Under investment contracts", g(d.reserve.investments)],
                  ["Хүлээн аваагүй бэлэг", "Gifts pending acceptance", g(d.reserve.giftPending)],
                  ["Бүх цаг үед зарсан", "Sold, all time", g(d.totals.bought)],
                  ["Бүх цаг үед авсан", "Redeemed, all time", g(d.totals.withdrawn)],
                ].map(([mn, en, v]) => (
                  <div key={mn} className="contents">
                    <dt>
                      <div className="text-foreground/80">{mn}</div>
                      <div lang="en" className="text-[10px] text-muted-foreground">
                        {en}
                      </div>
                    </dt>
                    <dd className="self-start text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Бүх цаг үед зарсан алт · Gold sold"
              value={g(d.totals.bought)}
              icon={ShoppingBag}
              meta={`${formatInt(d.totals.orders)} захиалга · orders`}
            />
            <StatCard
              label="Биетээр гарсан алт · Physically delivered"
              value={g(d.totals.physicalOut)}
              icon={Truck}
              meta={`биет ${g(d.totals.phys)} + бүртгэлгүй ${g(d.totals.unspec)}`}
            />
            <StatCard
              label="Буцааж зарсан · Sold back to us"
              value={g(d.totals.sold)}
              icon={Wallet}
              meta={`${formatCompactMNT(d.investor.totalBuybackMnt)} төлсөн · paid out`}
            />
            <StatCard
              label="Хэзээ ч аваагүй · Never redeemed"
              value={pct(d.buyers.neverWithdrew, d.buyers.total, 0)}
              icon={Users}
              meta={`${formatInt(d.buyers.neverWithdrew)} / ${formatInt(d.buyers.total)} худалдан авагч · buyers`}
            />
          </div>

          {/* ---- Товч хариу ---- */}
          <SectionCard title="Товч хариу" subtitle="Key answers">
            <div className="space-y-3">
              <Bi
                mn={
                  <>
                    <strong>Нөөц өсөж байна уу?</strong>{" "}
                    {derived.prevYears.map((y) => `${y.year} онд ${signed(y.net)}`).join(", ")}. {derived.last.year} онд{" "}
                    {signed(derived.last.net)}.
                    {derived.peak && derived.lastMonth && derived.peak.month !== derived.lastMonth.month && (
                      <>
                        {" "}
                        {monthLabel(derived.peak.month)}д {g(derived.peak.cum)} оргилд хүрээд,
                        {derived.negRun > 0
                          ? ` сүүлийн ${derived.negRun} сар дараалан буурч ${g(derived.lastMonth.cum)} болсон.`
                          : ` одоо ${g(derived.lastMonth.cum)} байна.`}
                      </>
                    )}
                  </>
                }
                en={
                  <>
                    <strong>Is the reserve growing?</strong>{" "}
                    {derived.prevYears.map((y) => `${signed(y.net)} in ${y.year}`).join(", ")}, {signed(derived.last.net)} in{" "}
                    {derived.last.year}.
                    {derived.peak && derived.lastMonth && derived.peak.month !== derived.lastMonth.month && (
                      <>
                        {" "}
                        It peaked at {g(derived.peak.cum)} in {monthEn(derived.peak.month)}
                        {derived.negRun > 0
                          ? ` and has declined for ${derived.negRun} consecutive months to ${g(derived.lastMonth.cum)}.`
                          : ` and now stands at ${g(derived.lastMonth.cum)}.`}
                      </>
                    )}
                  </>
                }
              />
              <Bi
                mn={
                  <>
                    <strong>Хэрэглэгчид аппдаа хадгалж байна уу?</strong> Тийм. Алт худалдаж авсан хүмүүсийн{" "}
                    {pct(d.buyers.neverWithdrew, d.buyers.total, 0)} нь хэзээ ч аваагүй. Одоо аппд байгаа алтны{" "}
                    {pct(derived.ageOver180, derived.ageTotal, 0)} нь хагас жилээс дээш,{" "}
                    {pct(derived.ageOver365, derived.ageTotal, 0)} нь нэг жилээс дээш хугацаанд хадгалагдаж байна.
                  </>
                }
                en={
                  <>
                    <strong>Do customers keep their gold in the app?</strong> Yes. {pct(d.buyers.neverWithdrew, d.buyers.total, 0)}{" "}
                    of buyers have never redeemed. Of the gold held today, {pct(derived.ageOver180, derived.ageTotal, 0)} has been
                    held for over six months and {pct(derived.ageOver365, derived.ageTotal, 0)} for over a year.
                  </>
                }
              />
              <Bi
                mn={
                  <>
                    <strong>Захиалаад тэр дор нь авч байна уу?</strong> Үгүй. Авсан алтны {pct(derived.within7, derived.holdTotal)}{" "}
                    нь долоо хоногийн дотор, {pct(derived.within30, derived.holdTotal)} нь 30 хоногийн дотор авагдсан.{" "}
                    {pct(derived.over180, derived.holdTotal, 0)} нь хагас жилээс дээш хадгалагдсаны дараа авагдсан.
                  </>
                }
                en={
                  <>
                    <strong>Do they buy and redeem immediately?</strong> No. Only {pct(derived.within7, derived.holdTotal)} of redeemed
                    gold was taken within a week and {pct(derived.within30, derived.holdTotal)} within 30 days.{" "}
                    {pct(derived.over180, derived.holdTotal, 0)} was held for more than six months before redemption.
                  </>
                }
              />
            </div>
          </SectionCard>

          {/* ---- Хөрөнгө оруулагчийн үзүүлэлт ---- */}
          <SectionCard title="Хөрөнгө оруулагчийн үзүүлэлт" subtitle="Investor metrics — the numbers behind the story">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              <Tile
                mn="Нөөцийн үнэлгээ"
                en="Reserve value at spot"
                value={formatCompactMNT(d.investor.reserveValueMnt)}
                sub={`${g(d.reserve.total)} × ${formatMNT(d.goldRate.rate)}`}
                subEn="Gold owed to customers, valued at today's rate"
              />
              <Tile
                mn="Нийт борлуулалтын орлого"
                en="Gross sales revenue, all time"
                value={formatCompactMNT(d.investor.totalRevenueMnt)}
                sub={`${formatInt(d.totals.orders)} захиалга`}
                subEn="Cash received for gold sold via the app"
              />
              <Tile
                mn="Буцааж зарсанд төлсөн"
                en="Buy-back payouts, all time"
                value={formatCompactMNT(d.investor.totalBuybackMnt)}
                sub={`${g(d.totals.sold)} буцааж авсан`}
                subEn="Cash paid to customers who sold gold back"
              />
              <Tile
                mn="Авалтын хувь"
                en="Redemption rate"
                value={`${d.investor.redemptionPct.toFixed(1)}%`}
                sub="бүх цаг үед авсан / зарсан"
                subEn="Share of all gold sold that has left the app"
              />
              <Tile
                mn="Нөөцийн хүрэлцээ"
                en="Reserve cover"
                value={d.investor.coverMonths != null ? `${d.investor.coverMonths.toFixed(1)} сар` : "—"}
                sub={`сүүлийн 6 сарын дундаж авалт ${g(d.investor.last6AvgWithdrawn)}/сар`}
                subEn="Months the reserve would last at the last-6-month redemption pace, with zero new sales"
              />
              <Tile
                mn="Сүүлийн 6 сарын дундаж зарсан"
                en="Avg monthly sales, last 6 months"
                value={g(d.investor.last6AvgBought)}
                sub={`авалт ${g(d.investor.last6AvgWithdrawn)}/сар`}
                subEn="Compare with average monthly redemptions"
              />
              <Tile
                mn="Дундаж хадгалсан хугацаа"
                en="Avg holding period before redemption"
                value={`${formatInt(d.investor.avgHoldDays)} өдөр`}
                sub="авагдсан алтны жинлэсэн дундаж"
                subEn="Gram-weighted, from purchase to redemption"
              />
              <Tile
                mn="Одоо байгаа алтны дундаж нас"
                en="Avg age of gold held today"
                value={`${formatInt(d.investor.avgAgeDays)} өдөр`}
                sub="худалдаж авснаас өнөөдөр хүртэл"
                subEn="Gram-weighted, from purchase to today"
              />
              <Tile
                mn="Давтан худалдан авагч"
                en="Repeat buyers"
                value={`${d.investor.repeatBuyerPct.toFixed(0)}%`}
                sub="2 ба түүнээс олон удаа авсан"
                subEn="Share of buyers with two or more orders"
              />
              <Tile
                mn="Нэг худалдан авагчийн захиалга"
                en="Orders per buyer"
                value={d.investor.ordersPerBuyer.toFixed(1)}
                sub={`${formatInt(d.buyers.total)} худалдан авагч`}
                subEn="Average lifetime orders per buyer"
              />
              <Tile
                mn="Дундаж захиалга"
                en="Average order size"
                value={g(d.investor.avgOrderGrams)}
                sub="нэг захиалгад"
                subEn="Grams of gold per order"
              />
              <Tile
                mn="Топ 100 хэрэглэгчийн эзлэх хувь"
                en="Top-100 concentration"
                value={`${d.top100Share.toFixed(0)}%`}
                sub={`топ 10: ${g(d.top10Sum)}`}
                subEn="Share of the reserve held by the 100 largest balances"
              />
            </div>
            <Bi
              className="mt-4"
              mn="Уншихад: нөөцийн хүрэлцээ нь шинэ борлуулалт огт байхгүй гэж үзвэл одоогийн нөөц сүүлийн 6 сарын авалтын хурдаар хэдэн сар хүрэхийг харуулна. Авалтын хувь өндөр байх тусам нөөцөөс гарах алт их байна гэсэн үг."
              en="How to read: reserve cover assumes zero new sales and shows how many months the current reserve would satisfy redemptions at the recent pace. A higher redemption rate means more of the gold sold has left the app."
            />
          </SectionCard>

          {/* ---- 1. Жил ---- */}
          <SectionCard title="1. Жил бүрийн зарсан ба авсан алт" subtitle="Gold sold vs. redeemed, by year">
            <Bi
              className="mb-3"
              mn="Зүүн багана тухайн жил зарсан алт, баруун багана авсан алт (төрлөөр), грамм. Хоёр баганын зөрүү нь тухайн жил нөөц хэр өссөнийг харуулна."
              en="Left bar: gold sold that year. Right bar: gold redeemed, split by type (physical delivery, sold back to us, type not recorded). The gap between the bars is that year's reserve growth."
            />
            <YearlyChart rows={d.yearly} />
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {d.yearly.map((y) => (
                <Tile
                  key={y.year}
                  mn={`${y.year} онд нөөц`}
                  en={`Reserve change in ${y.year}`}
                  value={signed(y.net)}
                  sub={`авсан / зарсан ${pct(y.wd, y.bought)} · ${formatInt(y.buyers)} худалдан авагч`}
                  subEn={`redeemed / sold ${pct(y.wd, y.bought)} · ${formatInt(y.buyers)} buyers · revenue ${formatCompactMNT(y.revenue)}`}
                />
              ))}
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1100px] text-[12px]">
                <thead>
                  <tr className="border-b border-border-light">
                    <Th mn="Жил" en="Year" left />
                    <Th mn="Захиалга" en="Orders" />
                    <Th mn="Худалдан авагч" en="Buyers" />
                    <Th mn="Шинэ" en="New buyers" />
                    <Th mn="Давтан" en="Repeat (2+)" />
                    <Th mn="Хадгалалт" en="Retention" />
                    <Th mn="Зарсан" en="Sold, g" />
                    <Th mn="Орлого" en="Revenue" />
                    <Th mn="Дундаж үнэ" en="Avg ₮/g incl. premium" />
                    <Th mn="Биетээр" en="Physical, g" />
                    <Th mn="Буцааж зарсан" en="Sold back, g" />
                    <Th mn="Бүртгэлгүй" en="Untyped, g" />
                    <Th mn="Нийт авсан" en="Redeemed, g" />
                    <Th mn="Авсан / зарсан" en="Redemption" />
                    <Th mn="Өөрчлөлт" en="Net, g" />
                    <Th mn="Жилийн эцсийн нөөц" en="Year-end reserve" />
                  </tr>
                </thead>
                <tbody>
                  {d.yearly.map((y) => (
                    <tr key={y.year} className="border-b border-border-light/60 last:border-0">
                      <td className={cn(TD, "text-left font-medium text-foreground")}>{y.year}</td>
                      <td className={cn(TD, "text-muted-foreground")}>{formatInt(y.orders)}</td>
                      <td className={cn(TD, "text-muted-foreground")}>{formatInt(y.buyers)}</td>
                      <td className={cn(TD, "text-muted-foreground")}>{formatInt(y.newBuyers)}</td>
                      <td className={cn(TD, "text-muted-foreground")}>{formatInt(y.repeatBuyers)}</td>
                      <td className={cn(TD, "text-muted-foreground")}>
                        {y.retentionPct != null ? `${y.retentionPct.toFixed(0)}%` : "—"}
                      </td>
                      <td className={cn(TD, "font-medium text-foreground")}>{g(y.bought)}</td>
                      <td className={cn(TD, "text-foreground")}>{formatCompactMNT(y.revenue)}</td>
                      <td className={cn(TD, "text-muted-foreground")}>{formatMNT(y.avgPricePerGram)}</td>
                      <td className={cn(TD, "text-muted-foreground")}>{g(y.phys)}</td>
                      <td className={cn(TD, "text-muted-foreground")}>{g(y.sold)}</td>
                      <td className={cn(TD, "text-muted-foreground")}>{g(y.unspec)}</td>
                      <td className={cn(TD, "font-medium text-foreground")}>{g(y.wd)}</td>
                      <td className={cn(TD, "text-muted-foreground")}>{pct(y.wd, y.bought)}</td>
                      <td className={cn(TD, "font-medium", y.net < 0 ? NEG : POS)}>{signed(y.net)}</td>
                      <td className={cn(TD, "text-foreground")}>{g(y.cum)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border-light font-semibold text-foreground">
                    <td className={cn(TD, "text-left")}>Нийт / Total</td>
                    <td className={TD}>{formatInt(d.totals.orders)}</td>
                    <td className={TD}>{formatInt(d.buyers.total)}</td>
                    <td className={TD}>{formatInt(d.buyers.total)}</td>
                    <td className={TD}>—</td>
                    <td className={TD}>—</td>
                    <td className={TD}>{g(d.totals.bought)}</td>
                    <td className={TD}>{formatCompactMNT(d.investor.totalRevenueMnt)}</td>
                    <td className={TD}>
                      {formatMNT(d.totals.bought ? Math.round(d.investor.totalRevenueMnt / d.totals.bought) : 0)}
                    </td>
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
            <Bi
              className="mt-3"
              mn={`Хадгалалт = өмнөх жилийн худалдан авагчдаас энэ жил дахин авсан хувь. Дундаж үнэ = орлого / зарсан грамм (шимтгэл орсон). Авах хүсэлтийн төрөл 2026 оны 2-р сараас хойш бүртгэгдэж эхэлсэн; түүнээс өмнөх авалтыг биет авалт гэж үзэв. ${derived.last.year} он нь ${dateLabel(d.dataTo)} хүртэлх бодит гүйлгээ.`}
              en={`Retention = share of the previous year's buyers who bought again this year. Avg price = revenue / grams sold (includes the premium over spot). Redemption type (physical vs. sold back) has been recorded since February 2026; earlier redemptions are treated as physical. ${derived.last.year} covers actual transactions up to ${dateLabel(d.dataTo)}.`}
            />
          </SectionCard>

          {/* ---- 2. Сар ---- */}
          <SectionCard title="2. Нөөц сар бүр хэрхэн өөрчлөгдсөн бэ?" subtitle="Required reserve, month by month">
            <Bi
              className="mb-3"
              mn="Сар бүрийн эцсийн байх ёстой нөөц (нийт зарсан − нийт авсан), грамм. Шугам дээшилж байвал нөөц өсч, доошилж байвал хэрэглэгчид зарснаас илүү авч байна."
              en="Required reserve at each month-end (cumulative sold minus cumulative redeemed), in grams. A rising line means the reserve is growing; a falling line means customers redeemed more than was sold."
            />
            <CumulativeChart rows={d.monthly} />
            <div className="mt-2 flex flex-wrap gap-4">
              {derived.peak && (
                <Swatch color={COLORS.bought} label={`Оргил / peak: ${monthLabel(derived.peak.month)} · ${g(derived.peak.cum)}`} />
              )}
              {derived.lastMonth && (
                <Swatch color={COLORS.bought} label={`Одоо / now: ${monthLabel(derived.lastMonth.month)} · ${g(derived.lastMonth.cum)}`} />
              )}
            </div>
            <H mn="Сар бүрийн өөрчлөлт" en="Monthly net change (sold − redeemed)" />
            <Bi
              className="mb-2"
              mn="Ногоон: нөөц нэмэгдсэн сар. Улаан: авалт зарсанаас давсан сар."
              en="Green: months the reserve grew. Red: months redemptions exceeded sales."
            />
            <NetChart rows={d.monthly} />
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={() => setShowMonths((v) => !v)}>
                {showMonths ? "Сарын хүснэгтийг хаах" : "Сарын хүснэгтийг харах"}
              </Button>
            </div>
            {showMonths && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[760px] text-[12px]">
                  <thead>
                    <tr className="border-b border-border-light">
                      <Th mn="Сар" en="Month" left />
                      <Th mn="Зарсан" en="Sold, g" />
                      <Th mn="Биетээр" en="Physical, g" />
                      <Th mn="Буцааж зарсан" en="Sold back, g" />
                      <Th mn="Бүртгэлгүй" en="Untyped, g" />
                      <Th mn="Нийт авсан" en="Redeemed, g" />
                      <Th mn="Өөрчлөлт" en="Net, g" />
                      <Th mn="Нөөц" en="Reserve, g" />
                    </tr>
                  </thead>
                  <tbody>
                    {d.monthly.map((m) => (
                      <tr key={m.month} className="border-b border-border-light/60 last:border-0">
                        <td className={cn(TD, "text-left text-foreground")}>
                          {monthLabel(m.month)}
                          <span className="ml-1 text-[10px] text-muted-foreground">{monthEn(m.month)}</span>
                        </td>
                        <td className={cn(TD, "text-foreground")}>{g(m.bought)}</td>
                        <td className={cn(TD, "text-muted-foreground")}>{g(m.phys)}</td>
                        <td className={cn(TD, "text-muted-foreground")}>{g(m.sold)}</td>
                        <td className={cn(TD, "text-muted-foreground")}>{g(m.unspec)}</td>
                        <td className={cn(TD, "text-foreground")}>{g(m.wd)}</td>
                        <td className={cn(TD, "font-medium", m.net < 0 ? NEG : POS)}>{signed(m.net)}</td>
                        <td className={cn(TD, "text-foreground")}>{g(m.cum)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* ---- 3. Хадгалах хугацаа ---- */}
          <SectionCard title="3. Хэрэглэгч алтаа хэр удаан хадгалаад авдаг вэ?" subtitle="How long do customers hold gold before redeeming?">
            <Bi
              className="mb-3"
              mn="Авалт бүрийг тухайн хэрэглэгчийн хамгийн эрт худалдан авалттай холбож (FIFO), грамм бүрийн хадгалагдсан хугацааг тооцов. Хувь нь тухайн бүлэгт багтах граммын хувь."
              en="Each redemption is matched to that customer's earliest purchases (first-in, first-out), giving a holding period for every gram. Percentages are the share of grams in each holding-time band."
            />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div>
                <H mn="Авсан алт: хэдэн өдөр хадгалсан бэ?" en={`Redeemed gold (${g(derived.holdTotal)}): days held before redemption`} />
                <BucketChart buckets={d.holdAll} color={COLORS.phys} />
              </div>
              <div>
                <H mn="Одоо аппд байгаа алт: хэдэн өдөр болсон бэ?" en={`Gold held today (${g(derived.ageTotal)}): days since purchase`} />
                <BucketChart buckets={d.ageNow} color={COLORS.bought} />
              </div>
            </div>
            {derived.holdSeries.length > 0 && (
              <>
                <H mn="Хадгалсан хугацаа авалтын жил, төрлөөр" en="Holding period by redemption year and type (share of each group)" />
                <Bi
                  className="mb-2"
                  mn="Буцааж зарж буй хүмүүс хамгийн удаан хадгалсан алтаа зарж байна."
                  en="Customers who sell back to us are selling the gold they have held longest."
                />
                <HoldByTypeChart series={derived.holdSeries} />
              </>
            )}
          </SectionCard>

          {/* ---- 4. Cohort ---- */}
          <SectionCard title="4. Аль жилд зарсан алт одоо хаана байна?" subtitle="Where is each year's gold now? (purchase cohorts)">
            <Bi
              className="mb-3"
              mn="Худалдан авсан жилээр: тухайн жил зарсан алтнаас хэд нь одоо ч аппд байгаа, хэд нь авагдсан (FIFO), грамм. Хуучин жилийн алт аажмаар гарч, шинэ жилийн алт ихэнх нь хадгалагдаж байна."
              en="By purchase year: how much of that year's gold is still in the app and how much has been redeemed (FIFO), in grams. Older cohorts are gradually redeemed; most recent gold is still held."
            />
            <CohortChart rows={d.cohort} />
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-[12px]">
                <thead>
                  <tr className="border-b border-border-light">
                    <Th mn="Худалдан авсан жил" en="Purchase year" left />
                    <Th mn="Зарсан" en="Sold, g" />
                    <Th mn="Авагдсан" en="Redeemed, g" />
                    <Th mn="Авагдсан хувь" en="Redeemed %" />
                    <Th mn="Одоо ч аппд байгаа" en="Still held, g" />
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
          <SectionCard title="5. Хэрэглэгчид" subtitle="Customers — who holds the gold?">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              <Tile mn="Нийт худалдан авагч" en="Total buyers" value={formatInt(d.buyers.total)} sub="алт худалдаж авсан хүн" subEn="People who bought gold at least once" />
              <Tile
                mn="Хэзээ ч аваагүй"
                en="Never redeemed"
                value={formatInt(d.buyers.neverWithdrew)}
                sub={`${pct(d.buyers.neverWithdrew, d.buyers.total, 0)} · алтаа аппдаа хадгалж байгаа`}
                subEn="Still hold everything they bought"
              />
              <Tile mn="Ядаж нэг удаа авсан" en="Redeemed at least once" value={formatInt(d.buyers.everWithdrew)} sub={pct(d.buyers.everWithdrew, d.buyers.total, 0)} />
              <Tile mn="Бүгдийг нь авсан" en="Fully redeemed" value={formatInt(d.buyers.fullOut)} sub="үлдэгдэлгүй болсон" subEn="Balance now zero" />
              <Tile mn="Одоо алттай" en="Holding gold today" value={formatInt(d.reserve.usersWithGold)} sub="үлдэгдэл > 0" subEn="Balance above zero" />
            </div>
            <H mn="Алттай хэрэглэгчид үлдэгдлийн хэмжээгээр" en="Customers holding gold, by balance size" />
            <div className="space-y-1.5">
              {(() => {
                const max = Math.max(1, ...d.distribution.map((b) => b.count));
                return d.distribution.map((b) => (
                  <div key={b.label} className="grid grid-cols-[130px_1fr_90px] items-center gap-3 text-[12px]">
                    <span className="text-muted-foreground">{b.label}</span>
                    <div className="h-3 overflow-hidden rounded-sm bg-muted">
                      <div className="h-full rounded-r-sm" style={{ width: `${(100 * b.count) / max}%`, background: COLORS.phys }} />
                    </div>
                    <span className="text-right tabular-nums text-muted-foreground">{formatInt(b.count)} хүн</span>
                  </div>
                ));
              })()}
            </div>
            <Bi
              className="mt-3"
              mn={`Хамгийн их үлдэгдэлтэй 100 хэрэглэгч нийт нөөцийн ${d.top100Share.toFixed(0)}%-ийг эзэлдэг. Хамгийн их үлдэгдэлтэй 10 хэрэглэгч нийлээд ${g(d.top10Sum)}. Эдгээр хүмүүс нэгэн зэрэг авахаар шийдвэл нөөцөд шууд нөлөөлнө.`}
              en={`The 100 largest balances account for ${d.top100Share.toFixed(0)}% of the reserve; the top 10 hold ${g(d.top10Sum)} between them. A simultaneous redemption by this group would hit the reserve directly.`}
            />
          </SectionCard>

          {/* ---- 6. Дүгнэлт ---- */}
          <SectionCard title="6. Дүгнэлт" subtitle="Conclusions">
            <div className="space-y-5">
              <div>
                <H mn="&quot;Байх ёстой нөөц&quot; гэж юу вэ?" en="What is the &quot;required reserve&quot;?" />
                <Bi
                  mn="Хэрэглэгч аппаар алт худалдаж авахад бодит алт нь гарт нь очихгүй, харин балансад нь бичигдэнэ. Тэр алтыг хэрэглэгч хүссэн үедээ биетээр авах эрхтэй. Тиймээс компани хэрэглэгчдийн балансад байгаа нийт алттай тэнцэх хэмжээний бодит алтыг бэлэн байлгах ёстой. Энгийнээр хэлбэл энэ бол компанийн хэрэглэгчдэдээ өгөх өр."
                  en="When a customer buys gold in the app, no physical gold changes hands: the grams are credited to their balance, and they can redeem them physically at any time. The company must therefore hold physical gold equal to the total of all customer balances. In plain terms, this is the company's liability to its customers."
                />
              </div>
              <div>
                <H mn={`${g(d.reserve.total)} юунаас бүрдэх вэ?`} en={`What makes up the ${g(d.reserve.total)}?`} />
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <Bi
                      mn={<><strong>{g(d.reserve.userBalance)} нь хэрэглэгчдийн үлдэгдэл.</strong> {formatInt(d.reserve.usersWithGold)} хүний аппд харагдаж буй алтны нийлбэр. Өрийн үндсэн хэсэг.</>}
                      en={<><strong>{g(d.reserve.userBalance)} is customer balances.</strong> The sum of gold shown in the app to {formatInt(d.reserve.usersWithGold)} customers. The core of the liability.</>}
                    />
                  </li>
                  <li>
                    <Bi
                      mn={<><strong>{g(d.reserve.investments)} нь хөрөнгө оруулалт.</strong> Балансаас хөрөнгө оруулалтын гэрээнд шилжсэн алт. Балансад харагдахгүй ч гэрээ дуусахад буцаж ирнэ.</>}
                      en={<><strong>{g(d.reserve.investments)} is under investment contracts.</strong> Gold moved from a balance into a fixed-term contract. Not visible in the balance, but it returns when the contract ends.</>}
                    />
                  </li>
                  <li>
                    <Bi
                      mn={<><strong>{g(d.reserve.giftPending)} нь хүлээн аваагүй бэлэг.</strong> Илгээгчийн балансаас хасагдсан ч хүлээн авагч хараахан аваагүй.</>}
                      en={<><strong>{g(d.reserve.giftPending)} is gifts pending acceptance.</strong> Already deducted from the sender but not yet credited to the recipient.</>}
                    />
                  </li>
                </ul>
              </div>
              <div>
                <H mn="Энэ тоо юуг хэлэхгүй вэ?" en="What this number does not tell you" />
                <Bi
                  mn={`Компани агуулахдаа одоо бодитоор хэдэн грамм алт хадгалж байгааг энэ өгөгдлөөс мэдэх боломжгүй. Агуулахын бодит нөөцийг ${g(d.reserve.total)}-тай харьцуулах хэрэгтэй. Бага бол зөрүү нь бүрхэгдээгүй өр. Их бол илүүдэл нөөц. Бидэнд буцааж зарсан ${g(d.totals.sold)} нь компанид үлдсэн тул биет нөөцөөс хасагдаагүй; харин тэр хэмжээгээр өр буурсан. Бүх цаг үед биетээр гарсан алт ${g(d.totals.physicalOut)}.`}
                  en={`The data cannot show how much physical gold the company actually holds in its vault. That figure must be compared with ${g(d.reserve.total)}: if the vault holds less, the gap is an uncovered liability; if more, it is surplus stock. The ${g(d.totals.sold)} sold back to us stayed with the company, so it did not leave the vault, but it reduced the liability by the same amount. Gold physically delivered to customers over all time: ${g(d.totals.physicalOut)}.`}
                />
              </div>
              <div>
                <H mn="Тоог хоёр аргаар шалгасан" en="The figure is cross-checked two ways" />
                <Bi
                  mn={`Нэгдүгээрт, хэрэглэгчдийн балансыг шууд нэмэхэд ${g(d.reserve.total)}. Хоёрдугаарт, бүх цаг үед зарсан ${g(d.totals.bought)}-аас авсан ${g(d.totals.withdrawn)}-ийг хасахад ${g(d.totals.netFlow)}. Зөрүү ${g(derived.reserveDiff)} буюу ${pct(derived.reserveDiff, d.reserve.total)}. Хоёр арга бараг ижил тоо өгч байгаа нь өгөгдөл найдвартай гэдгийг харуулж байна.`}
                  en={`First, summing customer balances directly gives ${g(d.reserve.total)}. Second, all-time gold sold (${g(d.totals.bought)}) minus all-time redeemed (${g(d.totals.withdrawn)}) gives ${g(d.totals.netFlow)}. The two differ by ${g(derived.reserveDiff)} (${pct(derived.reserveDiff, d.reserve.total)}), which confirms the ledger is consistent.`}
                />
              </div>
              <div>
                <H mn="Чиг хандлага" en="Trends" />
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <Bi
                      mn={<><strong>Нөөцийн өсөлт.</strong> {derived.prevYears.map((y) => `${y.year} онд ${signed(y.net)}`).join(", ")}. {derived.last.year} онд {signed(derived.last.net)}.{derived.negRun > 0 && ` Сүүлийн ${derived.negRun} сар дараалан авалт зарсанаас давж, нөөц буурч байна.`}</>}
                      en={<><strong>Reserve growth.</strong> {derived.prevYears.map((y) => `${signed(y.net)} in ${y.year}`).join(", ")}, {signed(derived.last.net)} in {derived.last.year}.{derived.negRun > 0 && ` Redemptions have exceeded sales for the last ${derived.negRun} consecutive months, so the reserve is shrinking.`}</>}
                    />
                  </li>
                  <li>
                    <Bi
                      mn={<><strong>Хэрэглэгчид удаан хадгалдаг.</strong> Худалдаж аваад шууд авах тохиолдол цөөн. Авагдаж буй алт голдуу 1–2 жилийн өмнө зарагдсан алт.{d.cohort[0] && ` ${d.cohort[0].year} оны алтны ${pct(d.cohort[0].withdrawn, d.cohort[0].bought, 0)} нь одоо гараад явсан.`} Дундаж хадгалсан хугацаа {formatInt(d.investor.avgHoldDays)} өдөр.</>}
                      en={<><strong>Customers hold for a long time.</strong> Buying and redeeming immediately is rare; the gold being redeemed was mostly bought one to two years earlier.{d.cohort[0] && ` ${pct(d.cohort[0].withdrawn, d.cohort[0].bought, 0)} of the ${d.cohort[0].year} cohort has now left the app.`} Average holding period before redemption: {formatInt(d.investor.avgHoldDays)} days.</>}
                    />
                  </li>
                  <li>
                    <Bi
                      mn={<><strong>Буцааж зарах нэмэгдэж байна.</strong> Бүртгэгдсэн авалтын дотор буцааж зарсан {g(d.totals.sold)} ({formatCompactMNT(d.investor.totalBuybackMnt)} төлсөн), биетээр авсан {g(d.totals.phys)}.</>}
                      en={<><strong>Sell-backs are rising.</strong> Among typed redemptions, {g(d.totals.sold)} was sold back to us ({formatCompactMNT(d.investor.totalBuybackMnt)} paid out) versus {g(d.totals.phys)} delivered physically.</>}
                    />
                  </li>
                </ul>
              </div>
              <div>
                <H mn="Юунд анхаарах вэ?" en="What to watch" />
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <Bi
                      mn={<><strong>Агуулахын бодит нөөцийг {g(d.reserve.total)}-тай тулгах.</strong> Энэ нь хамгийн чухал шалгалт.</>}
                      en={<><strong>Reconcile vault stock against {g(d.reserve.total)}.</strong> This is the single most important control.</>}
                    />
                  </li>
                  {d.peakMonth && (
                    <li>
                      <Bi
                        mn={<><strong>Нэг сарын хамгийн их авалт {g(d.peakMonth.wd)}</strong> ({monthLabel(d.peakMonth.month)}, үүнээс биетээр {g(d.peakMonth.phys)}). Бэлэн байлгах биет нөөцийг наад зах нь энэ түвшинд төлөвлөх.</>}
                        en={<><strong>Peak monthly redemption was {g(d.peakMonth.wd)}</strong> ({monthEn(d.peakMonth.month)}, of which {g(d.peakMonth.phys)} physical). Plan ready physical stock at no less than this level.</>}
                      />
                    </li>
                  )}
                  <li>
                    <Bi
                      mn={<><strong>Хамгийн их үлдэгдэлтэй 100 хэрэглэгч нөөцийн {d.top100Share.toFixed(0)}%-ийг эзэлдэг.</strong> Эдгээр хүний авалт нөөцөд шууд нөлөөлнө. Тэдний хөдөлгөөнийг тусад нь хянах.</>}
                      en={<><strong>The 100 largest balances hold {d.top100Share.toFixed(0)}% of the reserve.</strong> Their redemptions move the reserve directly; monitor this group separately.</>}
                    />
                  </li>
                  {d.investor.coverMonths != null && (
                    <li>
                      <Bi
                        mn={<><strong>Нөөцийн хүрэлцээ {d.investor.coverMonths.toFixed(1)} сар.</strong> Шинэ борлуулалтгүйгээр сүүлийн 6 сарын авалтын хурдаар нөөц хэр удаан хүрэхийг харуулна.</>}
                        en={<><strong>Reserve cover is {d.investor.coverMonths.toFixed(1)} months.</strong> How long the reserve would satisfy redemptions at the last-6-month pace if no new gold were sold.</>}
                      />
                    </li>
                  )}
                </ul>
              </div>
              <div>
                <H mn="Аргачлал" en="Methodology" />
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    <Bi
                      mn={`Зарсан алт: orders баримтаас type = deposit, metal_id = 1, payment_status = success, admin_status = success байгаа ${formatInt(d.totals.orders)} захиалга, нийт ${g(d.totals.bought)}. Pending төлөвтэй захиалгыг тооцоогүй.`}
                      en={`Gold sold: ${formatInt(d.totals.orders)} orders (type deposit, gold, payment successful and admin-verified), ${g(d.totals.bought)} in total. Pending orders are excluded.`}
                    />
                  </li>
                  <li>
                    <Bi
                      mn={`Авсан алт: withdraws баримтаас metal_id = 1, status = verified байгаа ${formatInt(d.totals.withdrawCount)} хүсэлт, нийт ${g(d.totals.withdrawn)}. Огноо нь баталгаажсан огноо. Pending хүсэлтийг тооцоогүй.`}
                      en={`Gold redeemed: ${formatInt(d.totals.withdrawCount)} verified withdrawal requests (gold only), ${g(d.totals.withdrawn)} in total, dated by verification. Pending requests are excluded.`}
                    />
                  </li>
                  <li>
                    <Bi
                      mn="Байх ёстой нөөц: users.balance.gold нийлбэр + investments үлдэгдэл + gift_orders хүлээн аваагүй бэлэг. Үнэлгээ нь latest_rates дахь өнөөдрийн 1 г алтны ханшаар."
                      en="Required reserve: sum of customer gold balances + open investment balances + gifts pending acceptance. Valued at today's per-gram gold rate."
                    />
                  </li>
                  <li>
                    <Bi
                      mn={`Хадгалсан хугацаа: хэрэглэгч бүрийн худалдан авалтыг огноогоор эрэмбэлж, авалт бүрийг хамгийн эрт худалдан авалтаас эхлэн хасав (FIFO). Хүлээн авсан бэлгийг хүлээн авагчийн худалдан авалт гэж үзэв.${d.unallocated > 0 ? ` Холбож чадаагүй ${g(d.unallocated)} байна.` : ""}`}
                      en={`Holding period: each customer's purchases are ordered by date and every redemption is matched against the earliest unredeemed purchases (FIFO). Accepted gifts count as a purchase for the recipient.${d.unallocated > 0 ? ` ${g(d.unallocated)} could not be matched.` : ""}`}
                    />
                  </li>
                  <li>
                    <Bi
                      mn={`Тооцоо 6 цаг тутамд шинэчлэгдэнэ. "Дахин тооцох" товч дарвал одоогийн өгөгдлөөр шууд тооцно. Мөнгө (${g(d.reserve.silverBalance)} үлдэгдэл) энэ тайланд ороогүй.`}
                      en={`Figures refresh every 6 hours; "Дахин тооцох" recomputes from live data. Silver (${g(d.reserve.silverBalance)} in balances) is not included in this report.`}
                    />
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
