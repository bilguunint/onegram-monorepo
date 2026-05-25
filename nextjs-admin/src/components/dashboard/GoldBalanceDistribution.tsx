"use client";

import { useState } from "react";
import { Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatGram, formatInt } from "@/lib/format";
import type { GoldDistribution } from "@/lib/firestore/analytics";

type Props = {
  data: GoldDistribution | null;
};

const PREVIEW = 20;

export function GoldBalanceDistribution({ data }: Props) {
  const [open, setOpen] = useState(false);

  if (!data || data.distribution.length === 0) {
    return (
      <section className="rounded-xl border border-border-light bg-card p-4">
        <Header />
        <div className="mt-4 rounded-lg border border-dashed border-border-light px-4 py-8 text-center text-[12px] text-muted-foreground">
          Тархалтын мэдээлэл олдсонгүй.
        </div>
      </section>
    );
  }

  // Top buckets by gold amount (highest balances first)
  const sorted = [...data.distribution].sort((a, b) => b.gold - a.gold);
  const preview = sorted.slice(0, PREVIEW);
  const hasMore = sorted.length > PREVIEW;

  return (
    <section className="rounded-xl border border-border-light bg-card p-4">
      <Header />

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Нийт хэрэглэгч" value={formatInt(data.totalUsers)} />
        <Stat label="Алттай" value={formatInt(data.usersWithGold)} />
        <Stat
          label="Алтгүй"
          value={formatInt(data.usersWithoutGold)}
        />
        <Stat
          label="Нийт алт"
          value={formatGram(data.totalGoldInSystem)}
        />
      </div>

      <div className="mt-4">
        <DistributionTable buckets={preview} />
      </div>

      {hasMore && (
        <div className="mt-3 flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[12px]"
                />
              }
            >
              Бүгдийг үзэх ({formatInt(sorted.length)})
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] max-w-2xl overflow-hidden p-0">
              <DialogHeader className="border-b border-border-light px-5 py-4">
                <DialogTitle className="text-[15px]">
                  Хэрэглэгчдийн алтны үлдэгдлийн тархалт
                </DialogTitle>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
                <DistributionTable buckets={sorted} dense />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </section>
  );
}

function Header() {
  return (
    <header className="flex items-start gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
        <Coins className="h-4 w-4" />
      </span>
      <div>
        <h3 className="text-[14px] font-semibold text-foreground">
          Хэрэглэгчдийн үлдэгдэл
        </h3>
        <p className="text-[11px] text-muted-foreground">
          Алтны үлдэгдлийн хэмжээ тус бүрээр хэрэглэгчдийн тоо
        </p>
      </div>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-sidebar/60 px-3 py-2.5">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-[14px] font-semibold tabular-nums text-foreground">
        {value}
      </div>
    </div>
  );
}

function DistributionTable({
  buckets,
  dense = false,
}: {
  buckets: { gold: number; count: number }[];
  dense?: boolean;
}) {
  const max = Math.max(...buckets.map((b) => b.count), 1);
  return (
    <div className="overflow-hidden rounded-lg border border-border-light">
      <table className="w-full text-[12px]">
        <thead className="bg-sidebar/40 text-left text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">#</th>
            <th className="px-3 py-2 font-medium">Алт (гр)</th>
            <th className="px-3 py-2 font-medium">Хэрэглэгч тоо</th>
            <th className="px-3 py-2 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light">
          {buckets.map((b, i) => {
            const pct = (b.count / max) * 100;
            return (
              <tr key={`${b.gold}-${i}`}>
                <td className={`px-3 ${dense ? "py-1.5" : "py-2"} text-muted-foreground tabular-nums`}>
                  {i + 1}
                </td>
                <td className={`px-3 ${dense ? "py-1.5" : "py-2"} tabular-nums text-foreground`}>
                  {formatGram(b.gold)}
                </td>
                <td className={`px-3 ${dense ? "py-1.5" : "py-2"} tabular-nums text-foreground`}>
                  {formatInt(b.count)}
                </td>
                <td className={`px-3 ${dense ? "py-1.5" : "py-2"} w-[35%]`}>
                  <div className="h-1.5 w-full rounded-full bg-sidebar">
                    <div
                      className="h-full rounded-full bg-primary-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
