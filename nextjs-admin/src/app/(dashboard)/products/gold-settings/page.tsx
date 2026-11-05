"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { ChevronLeft, Gem, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDb } from "@/lib/firebase/client";
import {
  fetchGoldJewelrySettings,
  goldPricePerGram,
  saveGoldJewelrySettings,
  type GoldJewelrySettings,
} from "@/lib/firestore/goldJewelrySettings";
import { formatPriceMNT } from "@/lib/products";

/**
 * Алтан эдлэлийн хуваан төлөлтийн нийтлэг тохиргоо. Бүх эдлэлд хамаарна;
 * өөрчлөлт дараагийн QR үүсэхээс эхлэн хүчинтэй (өмнө үүссэн нэхэмжлэх
 * тухайн үеийн утгаа хадгалсан).
 */
export default function GoldJewelrySettingsPage() {
  const [labor, setLabor] = useState("");
  const [tax, setTax] = useState("");
  const [step, setStep] = useState("");
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchGoldJewelrySettings()
      .then((s) => {
        if (!alive) return;
        setLabor(String(s.labor_per_gram));
        setTax(String(s.tax_percent));
        setStep(String(s.min_step_grams));
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Алдаа гарлаа."))
      .finally(() => alive && setLoading(false));
    // Өнөөдрийн ханш — урьдчилан харах тооцоонд
    const unsub = onSnapshot(doc(getDb(), "latest_rates", "latest_gold_rate"), (snap) => {
      const r = Number(snap.data()?.rate);
      setRate(Number.isFinite(r) && r > 0 ? r : null);
    });
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  const parsed: GoldJewelrySettings | null = (() => {
    const l = Number(labor);
    const t = Number(tax);
    const st = Number(step);
    if (!Number.isFinite(l) || l < 0) return null;
    if (!Number.isFinite(t) || t < 0 || t > 100) return null;
    if (!Number.isFinite(st) || st <= 0 || st > 10) return null;
    return { labor_per_gram: l, tax_percent: t, min_step_grams: st };
  })();
  const perGram = parsed && rate ? goldPricePerGram(rate, parsed) : null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!parsed) {
      toast.error("Утгуудаа шалгана уу.");
      return;
    }
    setSaving(true);
    try {
      await saveGoldJewelrySettings(parsed);
      toast.success("Тохиргоо хадгалагдлаа. Дараагийн QR-аас эхлэн хүчинтэй.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Хадгалахад алдаа гарлаа.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Бараа
        </Link>
        <h1 className="mt-1 flex items-center gap-2 text-[18px] font-semibold text-foreground">
          <Gem className="h-4 w-4 text-primary-600" />
          Алтан эдлэлийн тохиргоо
        </h1>
        <p className="text-[12px] text-muted-foreground">
          Бүх алтан эдлэлд нийтлэг. Төлбөр = грамм × (ханш × (1 + татвар%) + ажлын хөлс).
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Ачааллаж байна...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <section className="rounded-xl border border-border-light bg-card p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="labor">Ажлын хөлс (₮ / гр)</Label>
                <Input
                  id="labor"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step="any"
                  value={labor}
                  onChange={(e) => setLabor(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tax">Татвар (%)</Label>
                <Input
                  id="tax"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step="any"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="step">Хамгийн бага алхам (гр)</Label>
                <Input
                  id="step"
                  type="number"
                  inputMode="decimal"
                  min={0.01}
                  max={10}
                  step="any"
                  value={step}
                  onChange={(e) => setStep(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border-light bg-card p-4 text-[12px]">
            <div className="mb-2 font-semibold text-foreground">Өнөөдрийн тооцоо</div>
            {rate == null ? (
              <div className="text-muted-foreground">Ханш олдсонгүй.</div>
            ) : (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                <dt className="text-muted-foreground">Алтны ханш (1 гр)</dt>
                <dd className="text-right tabular-nums">{formatPriceMNT(rate)}</dd>
                <dt className="text-muted-foreground">Эдлэлийн 1 гр үнэ</dt>
                <dd className="text-right font-semibold tabular-nums text-primary-600">
                  {perGram != null ? formatPriceMNT(perGram) : "—"}
                </dd>
                <dt className="text-muted-foreground">0.1 гр төлбөр</dt>
                <dd className="text-right tabular-nums">
                  {perGram != null ? formatPriceMNT(Math.round(perGram * 0.1)) : "—"}
                </dd>
                <dt className="text-muted-foreground">5.2 гр эдлэл (жишээ)</dt>
                <dd className="text-right tabular-nums">
                  {perGram != null ? formatPriceMNT(Math.round(perGram * 5.2)) : "—"}
                </dd>
              </dl>
            )}
          </section>

          <Button type="submit" disabled={saving || !parsed}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Хадгалах
          </Button>
        </form>
      )}
    </div>
  );
}
