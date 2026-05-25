"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Loader2, RefreshCw, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  fetchCustomNotifications,
  formatNotificationDate,
  type CustomNotification,
} from "@/lib/firestore/customNotifications";

const INT = new Intl.NumberFormat("mn-MN", { maximumFractionDigits: 0 });
function fmtInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "0";
  return INT.format(n);
}

function typeBadge(type: string): string {
  switch (type) {
    case "promotion":
      return "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300";
    case "custom":
      return "bg-primary-100 text-primary-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function CustomNotificationsPage() {
  const [items, setItems] = useState<CustomNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCustomNotifications();
      setItems(data);
    } catch (err) {
      console.error("Error loading notifications:", err);
      toast.error("Мэдэгдлүүдийг ачааллахад алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-[18px] font-semibold text-foreground">Мэдэгдэл</h1>
          <p className="text-[12px] text-muted-foreground">
            Admin <span className="text-foreground/70">/ Мэдэгдэл</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button render={<Link href="/custom-notifications/send" />} size="sm">
            <Send className="h-3.5 w-3.5" />
            Мэдэгдэл илгээх
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => void load()}
            aria-label="Шинэчлэх"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      </header>

      <div className="rounded-xl border border-border-light bg-card">
        <div className="border-b border-border-light px-4 py-3">
          <h2 className="text-[14px] font-semibold text-foreground">
            Мэдэгдлийн түүх
          </h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Илгээсэн мэдэгдлүүдийн жагсаалт
          </p>
        </div>

        <div className="px-4 py-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
              <p className="text-[12px] text-muted-foreground">
                Ачааллаж байна…
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <Bell className="h-7 w-7 opacity-60" />
              <p className="text-[12px]">Мэдэгдэл олдсонгүй</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-[13px]">
                <thead>
                  <tr className="border-b border-border-light text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    <th className="px-2 py-2 text-left font-medium">#</th>
                    <th className="px-2 py-2 text-left font-medium">Гарчиг</th>
                    <th className="px-2 py-2 text-left font-medium">Агуулга</th>
                    <th className="px-2 py-2 text-left font-medium">Төрөл</th>
                    <th className="px-2 py-2 text-left font-medium">
                      Хүлээн авагч
                    </th>
                    <th className="px-2 py-2 text-right font-medium">
                      Нийт хэрэглэгч
                    </th>
                    <th className="px-2 py-2 text-left font-medium">Огноо</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((n, i) => {
                    const isAll = n.targetType === "all";
                    return (
                      <tr
                        key={n.id}
                        className="border-b border-border-light/60 last:border-b-0 hover:bg-muted/40"
                      >
                        <td className="px-2 py-2 align-top text-muted-foreground tabular-nums">
                          {i + 1}
                        </td>
                        <td className="px-2 py-2 align-top font-medium text-foreground">
                          {n.title || "—"}
                        </td>
                        <td className="px-2 py-2 align-top">
                          <div
                            className="line-clamp-3 max-w-[360px] whitespace-pre-wrap text-foreground/85"
                            title={n.body || ""}
                          >
                            {n.body || "—"}
                          </div>
                        </td>
                        <td className="px-2 py-2 align-top">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                              typeBadge(n.type)
                            )}
                          >
                            {n.type}
                          </span>
                        </td>
                        <td className="px-2 py-2 align-top">
                          {isAll ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                              <Users className="h-3 w-3" />
                              Бүгд
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                              {n.targetUserIds?.length ?? 0} хэрэглэгч
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-right align-top font-medium tabular-nums">
                          {fmtInt(n.totalUsers)}
                        </td>
                        <td className="px-2 py-2 align-top text-[11px] text-muted-foreground tabular-nums">
                          {formatNotificationDate(n.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
