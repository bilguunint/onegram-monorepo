"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarClock,
  Loader2,
  MonitorSmartphone,
  Pencil,
  Plus,
  RefreshCw,
  Ticket,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { CampaignDialog } from "@/components/campaigns/CampaignDialog";
import { formatInt } from "@/lib/format";
import {
  fetchCampaigns,
  isLegacyCampaign,
  isRunning,
  STATUS_LABEL,
  GRAM_UNIT,
  type Campaign,
} from "@/lib/firestore/campaigns";

// Sellers reach this page from the menu, but handing out prizes and rewriting
// the ticket rules is not theirs to do — the functions refuse them either way,
// so the buttons are hidden rather than left to fail.
const WRITE_ROLES = ["admin", "superadmin", "owner", "manager"];

export default function CampaignsPage() {
  const { adminData } = useAuth();
  const canWrite = WRITE_ROLES.includes((adminData?.role ?? "").toLowerCase());
  const [rows, setRows] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fetchCampaigns());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ачаалж чадсангүй");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[18px] font-semibold text-foreground">Сугалаат аян</h1>
          <p className="text-[12px] text-muted-foreground">
            Сугалаа олгох дүрэм, хонжворын давтамж, ялагч тодруулалт.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("mr-1 h-3.5 w-3.5", loading && "animate-spin")} />
            Сэргээх
          </Button>
          {canWrite && (
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Шинэ аян
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-border-light bg-card">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-light bg-card px-4 py-12 text-center text-[12px] text-muted-foreground">
          Аян алга. «Шинэ аян» дарж эхлүүлнэ үү.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {rows.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              canWrite={canWrite}
              onEdit={() => {
                setEditing(c);
                setDialogOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <CampaignDialog
        open={dialogOpen}
        campaign={editing}
        onOpenChange={setDialogOpen}
        onSaved={() => void load()}
      />
    </div>
  );
}

function CampaignCard({
  campaign: c,
  canWrite,
  onEdit,
}: {
  campaign: Campaign;
  canWrite: boolean;
  onEdit: () => void;
}) {
  const legacy = isLegacyCampaign(c);
  const running = isRunning(c);

  return (
    <div className="overflow-hidden rounded-xl border border-border-light bg-card">
      <div className="relative w-full bg-muted/40" style={{ aspectRatio: "21 / 9" }}>
        {c.cover_image ? (
          <Image
            src={c.cover_image}
            alt={c.name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[11px] text-muted-foreground">
            Cover зураг оруулаагүй
          </div>
        )}
        <div className="absolute left-2 top-2 flex gap-1">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur",
              running
                ? "bg-[#d8f3e1]/90 text-[#14653a]"
                : c.status === "completed"
                  ? "bg-muted/90 text-muted-foreground"
                  : "bg-[#fdf0d5]/90 text-[#8a5a00]"
            )}
          >
            {running ? "Явагдаж байна" : STATUS_LABEL[c.status]}
          </span>
          {legacy && (
            <span className="rounded-full bg-muted/90 px-2 py-0.5 text-[10px] text-muted-foreground backdrop-blur">
              Хуучин хэлбэр
            </span>
          )}
          {c.modal_enabled && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e7e9fd]/90 px-2 py-0.5 text-[10px] text-[#3b3f95] backdrop-blur">
              <MonitorSmartphone className="h-2.5 w-2.5" />
              Popup
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <div className="text-[14px] font-medium text-foreground">{c.name}</div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <CalendarClock className="h-3 w-3" />
            {fmtRange(c.start_date?.toDate(), c.end_date?.toDate())}
          </div>
        </div>

        {legacy ? (
          <p className="text-[11px] text-muted-foreground">
            Энэ аян шинэ дүрэм нэвтрэхээс өмнөх бөгөөд зөвхөн архив болгон
            хадгалагдана.
          </p>
        ) : (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span>
              {GRAM_UNIT}гр → <b className="text-foreground">{c.tickets_per_unit}</b> сугалаа
            </span>
            {c.signup_tickets > 0 && (
              <span>
                Бүртгэл → <b className="text-foreground">{c.signup_tickets}</b> сугалаа
              </span>
            )}
            <span>
              <b className="text-foreground">{c.draw_count}</b> тохирол хийгдсэн
            </span>
          </div>
        )}

        <div className="flex items-center gap-4 text-[12px]">
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {formatInt(c.total_participants)} оролцогч
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Ticket className="h-3.5 w-3.5" />
            {formatInt(c.total_tickets)} сугалаа
          </span>
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            render={<Link href={`/campaigns/${c.id}`} />}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            Тохирол ба сугалаа
          </Button>
          {!legacy && canWrite && (
            <Button size="sm" variant="ghost" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function fmtRange(from?: Date, to?: Date): string {
  const f = (d?: Date) =>
    d
      ? `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
          d.getDate()
        ).padStart(2, "0")}`
      : "—";
  return `${f(from)} – ${f(to)}`;
}
