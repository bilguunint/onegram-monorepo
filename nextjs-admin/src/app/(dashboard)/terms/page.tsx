"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, FileSignature, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchAllTerms, TERM_KEYS, type TermDoc } from "@/lib/firestore/terms";

const TH = "py-2 px-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground";
const TD = "py-2.5 px-3 align-top";

const fmtDate = (t: { toDate: () => Date } | null) =>
  t ? t.toDate().toLocaleString("mn-MN") : "—";

export default function TermsListPage() {
  const [docs, setDocs] = useState<Map<string, TermDoc> | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    fetchAllTerms()
      .then((m) => {
        if (alive) setDocs(m);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Нөхцөлүүдийг ачааллахад алдаа гарлаа.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [tick]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-[18px] font-semibold text-foreground">Үйлчилгээний нөхцөл</h1>
          <p className="text-[12px] text-muted-foreground">
            Апп дээр харагдах нөхцөл бүрийн текст. Хадгалах бүрд хувилбар нэмэгдэж, хэрэглэгч
            шинэ хувилбарт дахин гарын үсэг зурна.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLoading(true);
            setTick((t) => t + 1);
          }}
          disabled={loading}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Шинэчлэх
        </Button>
      </header>

      {loading && !docs ? (
        <div className="flex items-center justify-center gap-2 py-12 text-[12px] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
          Ачааллаж байна...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border-light bg-card">
          <table className="w-full min-w-[760px] text-[12px]">
            <thead>
              <tr className="border-b border-border-light">
                <th className={TH}>Нөхцөл</th>
                <th className={TH}>Апп дээр хаана</th>
                <th className={cn(TH, "text-right")}>Хувилбар</th>
                <th className={TH}>Сүүлд засварласан</th>
                <th className={TH}>Хэлүүд</th>
                <th className={TH} />
              </tr>
            </thead>
            <tbody>
              {TERM_KEYS.map((m) => {
                const d = docs?.get(m.key) ?? null;
                const langs = d
                  ? (["mn", "en", "zh", "ru"] as const).filter((l) => d.body[l].trim()).join(", ")
                  : "";
                return (
                  <tr key={m.key} className="border-b border-border-light/60 last:border-0 hover:bg-muted/40">
                    <td className={TD}>
                      <Link
                        href={`/terms/${m.key}`}
                        className="flex items-center gap-2 font-medium text-foreground hover:text-primary-600 hover:underline"
                      >
                        <FileSignature className="h-3.5 w-3.5 text-primary-600" />
                        {m.label}
                      </Link>
                      <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">terms/{m.key}</div>
                    </td>
                    <td className={cn(TD, "text-muted-foreground")}>{m.where}</td>
                    <td className={cn(TD, "text-right tabular-nums")}>
                      {d ? (
                        <span className="rounded bg-primary-50 px-1.5 py-0.5 text-[11px] font-medium text-primary-700">
                          v{d.version}
                        </span>
                      ) : (
                        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[11px] font-medium text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                          Firestore-д алга
                        </span>
                      )}
                    </td>
                    <td className={cn(TD, "text-muted-foreground")}>{d ? fmtDate(d.updated_at) : "—"}</td>
                    <td className={cn(TD, "text-muted-foreground")}>{langs || "—"}</td>
                    <td className={cn(TD, "text-right")}>
                      <Link href={`/terms/${m.key}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-3.5 w-3.5" />
                          Харах
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="px-1 text-[11px] text-muted-foreground">
        Firestore-д байхгүй нөхцөлийг апп өөрт шигтгэсэн хуучин текстээр харуулна (гарын үсэг
        шаардахгүй). Анхны текстийг оруулахын тулд <code>functions/scripts/seed_terms.js</code>-ийг
        ажиллуулна, эсвэл энд шууд бичнэ.
      </p>
    </div>
  );
}
