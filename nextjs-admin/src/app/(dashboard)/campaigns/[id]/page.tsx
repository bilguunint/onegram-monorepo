"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Loader2,
  Play,
  RefreshCw,
  Ticket,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatInt } from "@/lib/format";
import { markWinner, startDraw } from "@/lib/api/campaignActions";
import {
  countPendingTickets,
  fetchCampaign,
  fetchDraws,
  fetchDrawTickets,
  isLegacyCampaign,
  isRunning,
  GRAM_UNIT,
  STATUS_LABEL,
  type Campaign,
  type CampaignDraw,
} from "@/lib/firestore/campaigns";

const WRITE_ROLES = ["admin", "superadmin", "owner", "manager"];

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { adminData } = useAuth();
  const canWrite = WRITE_ROLES.includes((adminData?.role ?? "").toLowerCase());

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [draws, setDraws] = useState<CampaignDraw[]>([]);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startOpen, setStartOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const c = await fetchCampaign(id);
      setCampaign(c);
      if (c && !isLegacyCampaign(c)) {
        const [d, p] = await Promise.all([fetchDraws(id), countPendingTickets(id)]);
        setDraws(d);
        setPending(p);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ачаалж чадсангүй");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleStart() {
    setStarting(true);
    try {
      const res = await startDraw(id);
      toast.success(
        `${res.draw_number}-р тохирол эхэллээ — ${res.ticket_count} сугалаа орлоо.`
      );
      setStartOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Тохирол эхлүүлж чадсангүй");
    } finally {
      setStarting(false);
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
  const running = isRunning(campaign);
  const winners = draws.reduce((n, d) => n + d.winners.length, 0);

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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<Users className="h-4 w-4" />} label="Оролцогч" value={campaign.total_participants} />
        <Stat icon={<Ticket className="h-4 w-4" />} label="Нийт сугалаа" value={campaign.total_tickets} />
        <Stat icon={<Play className="h-4 w-4" />} label="Тохирол" value={campaign.draw_count} />
        <Stat icon={<Trophy className="h-4 w-4" />} label="Азтан" value={winners} />
      </div>

      {legacy ? (
        <div className="rounded-xl border border-dashed border-border-light bg-card px-4 py-10 text-center text-[12px] text-muted-foreground">
          Энэ аян шинэ дүрэм нэвтрэхээс өмнөх бөгөөд тохирол агуулаагүй. Зөвхөн
          архив болгон хадгалагдана.
        </div>
      ) : (
        <>
          {/* Live pool + start */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-light bg-card px-4 py-3">
            <div>
              <div className="text-[13px] font-medium text-foreground">
                Хүлээгдэж буй {formatInt(pending)} сугалаа
              </div>
              <div className="text-[11px] text-muted-foreground">
                Тохирол эхлүүлэхэд эдгээр нь дараагийн дугаартай тохиролд орж
                идэвхгүй болно. Дараа олгогдсон сугалаа дараагийн тохиролд үлдэнэ.
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setStartOpen(true)}
              disabled={!canWrite || !running || pending === 0}
            >
              <Play className="mr-1 h-3.5 w-3.5" />
              Тохирол эхлүүлэх
            </Button>
          </div>

          {!running && campaign.status !== "completed" && (
            <p className="px-1 text-[11px] text-muted-foreground">
              Аян идэвхтэй хугацаандаа байхад л тохирол эхлүүлнэ.
            </p>
          )}

          {draws.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-light bg-card px-4 py-10 text-center text-[12px] text-muted-foreground">
              Тохирол хийгдээгүй байна.
            </div>
          ) : (
            <div className="space-y-3">
              {draws.map((d) => (
                <DrawCard
                  key={d.id}
                  campaignId={id}
                  campaignName={campaign.name}
                  draw={d}
                  canWrite={canWrite}
                  onChanged={() => void load()}
                />
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={startOpen}
        onOpenChange={setStartOpen}
        title={`${campaign.draw_count + 1}-р тохирлыг эхлүүлэх үү?`}
        description={`Одоо хүлээгдэж буй ${formatInt(
          pending
        )} сугалаа энэ тохиролд орж идэвхгүй болно. Буцаах боломжгүй.`}
        confirmLabel="Эхлүүлэх"
        submitting={starting}
        onConfirm={() => void handleStart()}
      />
    </div>
  );
}

function DrawCard({
  campaignId,
  campaignName,
  draw,
  canWrite,
  onChanged,
}: {
  campaignId: string;
  campaignName: string;
  draw: CampaignDraw;
  canWrite: boolean;
  onChanged: () => void;
}) {
  const [code, setCode] = useState("");
  const [prize, setPrize] = useState("");
  const [marking, setMarking] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const tickets = await fetchDrawTickets(campaignId, draw.draw_number);
      if (tickets.length === 0) {
        toast.warning("Энэ тохиролд сугалаа алга.");
        return;
      }
      const rows = tickets.map((t, i) => ({
        "№": i + 1,
        "Сугалааны дугаар": t.ticket_code,
        "Хэрэглэгчийн ID": t.user_id,
        "Эх сурвалж": t.source === "signup" ? "Бүртгэл" : "Худалдан авалт",
        "Огноо": t.created_at
          ? t.created_at.toDate().toISOString().slice(0, 19).replace("T", " ")
          : "",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [{ wch: 6 }, { wch: 20 }, { wch: 30 }, { wch: 18 }, { wch: 20 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${draw.draw_number}-р тохирол`);
      const safe = campaignName.replace(/[^\p{L}\p{N}]+/gu, "_").slice(0, 40);
      const filename = `${safe}_${draw.draw_number}-р_тохирол_${tickets.length}ш.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success(`${tickets.length} сугалаа экспортлогдлоо.`, {
        description: filename,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Excel үүсгэж чадсангүй");
    } finally {
      setExporting(false);
    }
  }

  async function handleMark() {
    if (!code.trim()) return toast.error("Сугалааны дугаар оруулна уу");
    setMarking(true);
    try {
      const res = await markWinner({
        campaign_id: campaignId,
        draw_number: draw.draw_number,
        ticket_code: code.trim(),
        prize: prize.trim(),
      });
      toast.success(`${res.user_name} — ${res.ticket_code}. Мэдэгдэл илгээгдлээ.`);
      setCode("");
      setPrize("");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Тэмдэглэж чадсангүй");
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-light bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-light px-4 py-3">
        <div>
          <div className="text-[13px] font-medium text-foreground">
            {draw.draw_number}-р тохирол
          </div>
          <div className="text-[11px] text-muted-foreground">
            {formatInt(draw.ticket_count)} сугалаа
            {draw.started_at && ` · ${fmt(draw.started_at.toDate())}`}
            {draw.started_by_name && ` · ${draw.started_by_name}`}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => void handleExport()} disabled={exporting}>
          {exporting ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="mr-1 h-3.5 w-3.5" />
          )}
          Excel татах
        </Button>
      </div>

      {draw.winners.length > 0 && (
        <div className="border-b border-border-light bg-[#fffaf0]/60 px-4 py-3">
          <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Азтанууд
          </div>
          <div className="mt-2 space-y-1.5">
            {draw.winners.map((w, i) => (
              <div key={`${w.ticket_id}-${i}`} className="flex flex-wrap items-center gap-2 text-[12px]">
                <span className="rounded bg-[#fdf0d5] px-1.5 py-0.5 font-mono text-[11px] tracking-wider text-[#8a5a00]">
                  {w.ticket_code}
                </span>
                <span className="font-medium text-foreground">{w.user_name}</span>
                {w.user_phone && (
                  <span className="text-muted-foreground">{w.user_phone}</span>
                )}
                {w.prize && <span className="text-muted-foreground">— {w.prize}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {canWrite && (
        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Азтан тэмдэглэх
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCDEF"
              maxLength={6}
              className={cn("w-32 font-mono uppercase tracking-widest")}
            />
            <Input
              value={prize}
              onChange={(e) => setPrize(e.target.value)}
              placeholder="Шагнал — ж: 1 гр алт"
              className="w-56"
            />
            <Button size="sm" onClick={() => void handleMark()} disabled={marking}>
              {marking ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trophy className="mr-1 h-3.5 w-3.5" />
              )}
              Тэмдэглэх
            </Button>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            Дугаарыг тэмдэглэмэгц эзэнд нь «Та азтан боллоо» мэдэгдэл очно.
          </p>
        </div>
      )}
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
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(
    d.getHours()
  )}:${p(d.getMinutes())}`;
}
