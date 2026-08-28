"use client";

import { useState } from "react";
import { Dices, Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { drawWinner } from "@/lib/api/campaignActions";

type Props = {
  open: boolean;
  campaignId: string;
  period: number;
  periodLabel: string;
  liveTickets: number;
  onOpenChange: (open: boolean) => void;
  onDrawn: () => void;
};

/**
 * Picks one winner for a draw period. Random is the default because it is what
 * a fair draw looks like; the code field is for when the draw happened
 * elsewhere — live, on stage — and the result is only being recorded here.
 */
export function DrawDialog({
  open,
  campaignId,
  period,
  periodLabel,
  liveTickets,
  onOpenChange,
  onDrawn,
}: Props) {
  const [prize, setPrize] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"random" | "manual" | null>(null);

  async function run(mode: "random" | "manual") {
    if (!prize.trim()) {
      return toast.error("Шагналын нэрийг бичнэ үү — мэдэгдэлд орно");
    }
    if (mode === "manual" && !code.trim()) {
      return toast.error("Сугалааны дугаар оруулна уу");
    }
    setBusy(mode);
    try {
      const res = await drawWinner({
        campaign_id: campaignId,
        draw_period: period,
        prize: prize.trim(),
        ...(mode === "manual" ? { ticket_code: code.trim() } : {}),
      });
      toast.success(`${res.user_name} — ${res.ticket_code} хожлоо. Мэдэгдэл илгээгдлээ.`);
      setPrize("");
      setCode("");
      onOpenChange(false);
      onDrawn();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Тохирол хийж чадсангүй");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ялагч тодруулах — {periodLabel}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-[12px] text-muted-foreground">
            Энэ үед <b className="text-foreground">{liveTickets}</b> идэвхтэй сугалаа
            байна. Ялагчид шууд мэдэгдэл очно.
          </p>

          <div className="space-y-1.5">
            <Label>Шагнал</Label>
            <Input
              value={prize}
              onChange={(e) => setPrize(e.target.value)}
              placeholder="Жишээ: 1 гр алт"
            />
            <p className="text-[10px] text-muted-foreground">
              «Та азтан боллоо! … {prize || "…"} хожлоо» гэж мэдэгдэнэ.
            </p>
          </div>

          <Button
            className="w-full"
            onClick={() => void run("random")}
            disabled={busy !== null || liveTickets === 0}
          >
            {busy === "random" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Dices className="mr-2 h-4 w-4" />
            )}
            Санамсаргүй сонгох
          </Button>

          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border-light" />
            <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              эсвэл дугаараар
            </span>
            <div className="h-px flex-1 bg-border-light" />
          </div>

          <div className="space-y-1.5">
            <Label>Сугалааны дугаар</Label>
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABCDEF"
                maxLength={6}
                className="font-mono uppercase tracking-widest"
              />
              <Button
                variant="outline"
                onClick={() => void run("manual")}
                disabled={busy !== null}
              >
                {busy === "manual" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trophy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy !== null}>
            Хаах
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
