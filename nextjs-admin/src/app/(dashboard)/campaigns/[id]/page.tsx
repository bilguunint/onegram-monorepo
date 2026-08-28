"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Archive,
  Loader2,
  Lock,
  RefreshCw,
  Ticket,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DrawDialog } from "@/components/campaigns/DrawDialog";
import { formatInt } from "@/lib/format";
import { closeDrawPeriod } from "@/lib/api/campaignActions";
import {
  drawPeriodBounds,
  drawPeriodIndex,
  fetchCampaign,
  fetchDraws,
  fetchPeriodTickets,
  isLegacyCampaign,
  totalDrawPeriods,
  FREQUENCY_LABEL,
  GRAM_UNIT,
  STATUS_LABEL,
  TICKET_STATUS_LABEL,
  type Campaign,
  type CampaignDraw,
  type CampaignTicket,
} from "@/lib/firestore/campaigns";

const WRITE_ROLES = ["admin", "superadmin", "owner", "manager"];

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { adminData } = useAuth();
  const canWrite = WRITE_ROLES.includes((adminData?.role ?? "").toLowerCase());
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [draws, setDraws] = useState<CampaignDraw[]>([]);
  const [period, setPeriod] = useState(0);
  const [tickets, setTickets] = useState<CampaignTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [drawOpen, setDrawOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, d] = await Promise.all([fetchCampaign(id), fetchDraws(id)]);
      setCampaign(c);
      setDraws(d);
      // Land on the period that is running now, which is the one an admin
      // almost always came here to settle.
      if (c) setPeriod(Math.min(drawPeriodIndex(c), totalDrawPeriods(c) - 1));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ачаалж чадсангүй");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadTickets = useCallback(async () => {
    if (!campaign || isLegacyCampaign(campaign)) return;
    setTicketsLoading(true);
    try {
      setTickets(await fetchPeriodTickets(id, period));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Сугалаа ачаалж чадсангүй");
    } finally {
      setTicketsLoading(false);
    }
  }, [campaign, id, period]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const periods = campaign ? totalDrawPeriods(campaign) : 0;
  const bounds = campaign ? drawPeriodBounds(campaign, period) : null;
  const draw = draws.find((d) => d.draw_period === period) ?? null;
  const live = useMemo(() => tickets.filter((t) => t.status === "active"), [tickets]);
  const won = useMemo(() => tickets.filter((t) => t.status === "won"), [tickets]);

  async function handleClose() {
    setClosing(true);
    try {
      const res = await closeDrawPeriod({ campaign_id: id, draw_period: period });
      toast.success(`${res.expired} сугалаа идэвхгүй боллоо.`);
      setCloseOpen(false);
      await load();
      await loadTickets();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Хааж чадсангүй");
    } finally {
      setClosing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="rounded-xl border border-dashed border-border-light bg-card px-4 py-12 text-center text-[12px] text-muted-foreground">
        Аян олдсонгүй.
      </div>
    );
  }

  const legacy = isLegacyCampaign(campaign);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button render={<Link href="/campaigns" />} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-[16px] font-semibold text-foreground">{campaign.name}</h1>
            <p className="text-[11px] text-muted-foreground">
              {STATUS_LABEL[campaign.status]}
              {!legacy && ` · ${FREQUENCY_LABEL[campaign.draw_frequency]}`}
              {!legacy && ` · ${GRAM_UNIT}гр → ${campaign.tickets_per_unit} сугалаа`}
              {!legacy && campaign.signup_tickets > 0 &&
                ` · бүртгэл → ${campaign.signup_tickets}`}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Сэргээх
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat icon={<Users className="h-4 w-4" />} label="Оролцогч" value={campaign.total_participants} />
        <Stat icon={<Ticket className="h-4 w-4" />} label="Нийт сугалаа" value={campaign.total_tickets} />
        <Stat
          icon={<Trophy className="h-4 w-4" />}
          label="Ялагч"
          value={draws.reduce((n, d) => n + (d.winners?.length ?? 0), 0)}
        />
      </div>

      {legacy ? (
        <div className="rounded-xl border border-dashed border-border-light bg-card px-4 py-10 text-center text-[12px] text-muted-foreground">
          Энэ аян шинэ дүрэм нэвтрэхээс өмнөх бөгөөд хонжворын үе агуулаагүй.
          Зөвхөн архив болгон хадгалагдана.
        </div>
      ) : (
        <>
          {/* Period picker */}
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: periods }, (_, i) => {
              const d = draws.find((x) => x.draw_period === i);
              const isNow = drawPeriodIndex(campaign) === i;
              return (
                <button
                  key={i}
                  onClick={() => setPeriod(i)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-[11px] transition-colors",
                    period === i
                      ? "border-foreground/25 bg-sidebar/60 font-medium text-foreground"
                      : "border-border-light text-muted-foreground hover:bg-sidebar/30"
                  )}
                >
                  {i + 1}-р үе
                  {d?.status === "closed" && " ✓"}
                  {isNow && (
                    <span className="ml-1 text-[9px] text-muted-foreground/70">одоо</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-border-light bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-light px-4 py-3">
              <div>
                <div className="text-[13px] font-medium text-foreground">
                  {period + 1}-р үе
                  {draw?.status === "closed" && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-normal text-muted-foreground">
                      <Lock className="h-2.5 w-2.5" />
                      Хаагдсан
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {bounds
                    ? `${fmt(bounds.start)} – ${fmt(bounds.end)}`
                    : "Хугацаа тодорхойгүй"}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setDrawOpen(true)}
                  disabled={!canWrite || draw?.status === "closed" || live.length === 0}
                >
                  <Trophy className="mr-1 h-3.5 w-3.5" />
                  Ялагч тодруулах
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCloseOpen(true)}
                  disabled={!canWrite || draw?.status === "closed" || live.length === 0}
                >
                  <Archive className="mr-1 h-3.5 w-3.5" />
                  Үе хаах
                </Button>
              </div>
            </div>

            {/* Winners */}
            {draw?.winners && draw.winners.length > 0 && (
              <div className="border-b border-border-light bg-[#fffaf0]/60 px-4 py-3">
                <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  Ялагчид
                </div>
                <div className="mt-2 space-y-1.5">
                  {draw.winners.map((w, i) => (
                    <div key={`${w.ticket_id}-${i}`} className="flex flex-wrap items-center gap-2 text-[12px]">
                      <span className="rounded bg-[#fdf0d5] px-1.5 py-0.5 font-mono text-[11px] tracking-wider text-[#8a5a00]">
                        {w.ticket_code}
                      </span>
                      <span className="font-medium text-foreground">{w.user_name}</span>
                      {w.prize && <span className="text-muted-foreground">— {w.prize}</span>}
                      <span className="text-[10px] text-muted-foreground/70">
                        ({w.picked === "random" ? "санамсаргүй" : "гараар"})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tickets */}
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] text-muted-foreground">
                  Идэвхтэй <b className="text-foreground">{live.length}</b>
                  {won.length > 0 && ` · хожсон ${won.length}`}
                  {tickets.length >= 200 && " · эхний 200 харагдаж байна"}
                </div>
                {ticketsLoading && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
              </div>

              {tickets.length === 0 && !ticketsLoading ? (
                <p className="py-6 text-center text-[12px] text-muted-foreground">
                  Энэ үед олгогдсон сугалаа алга.
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-1">
                  {tickets.map((t) => (
                    <span
                      key={t.id}
                      title={`${TICKET_STATUS_LABEL[t.status]} · ${
                        t.source === "signup" ? "бүртгэл" : "худалдан авалт"
                      }`}
                      className={cn(
                        "rounded px-1.5 py-0.5 font-mono text-[11px] tracking-wider",
                        t.status === "won"
                          ? "bg-[#fdf0d5] text-[#8a5a00]"
                          : t.status === "expired"
                            ? "bg-muted text-muted-foreground/60 line-through"
                            : "bg-sidebar/50 text-muted-foreground"
                      )}
                    >
                      {t.ticket_code}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <DrawDialog
        open={drawOpen}
        campaignId={id}
        period={period}
        periodLabel={`${period + 1}-р үе`}
        liveTickets={live.length}
        onOpenChange={setDrawOpen}
        onDrawn={() => {
          void load();
          void loadTickets();
        }}
      />

      <ConfirmDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title={`${period + 1}-р үеийг хаах уу?`}
        description={`Үлдсэн ${live.length} сугалаа идэвхгүй болж, дараагийн үе шинээр эхэлнэ. Буцаах боломжгүй.`}
        confirmLabel="Хаах"
        submitting={closing}
        destructive
        onConfirm={() => void handleClose()}
      />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border-light bg-card p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-[20px] font-semibold tabular-nums text-foreground">
        {formatInt(value)}
      </div>
    </div>
  );
}

function fmt(d: Date): string {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
