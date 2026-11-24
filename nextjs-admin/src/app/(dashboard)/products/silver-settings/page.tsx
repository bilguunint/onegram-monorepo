"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ChevronLeft, Coins, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchSilverJewelrySettings,
  saveSilverJewelrySettings,
  silverProductPrice,
} from "@/lib/firestore/silverJewelrySettings";
import { formatPriceMNT } from "@/lib/products";

/**
 * Мөнгөн эдлэлийн 1 лангийн үнэ. Админ үнийг оруулж БАТАЛГААЖУУЛСНААР:
 *  - шинээр эхлэх хуваан төлөлт болон лангаар явж буй хуваан төлөлтийн
 *    дараагийн төлбөрүүд энэ үнээр бодогдоно;
 *  - бүх мөнгөн эдлэл барааны бүтэн үнэ (нийт лан × үнэ) шинэчлэгдэнэ.
 * Төгрөгөөр эхэлсэн хуучин хуваан төлөлтүүд өөрчлөгдөхгүй.
 */
export default function SilverJewelrySettingsPage() {
  const [price, setPrice] = useState("");
  const [box, setBox] = useState("0");
  const [markup, setMarkup] = useState("10");
  const [vat, setVat] = useState("10");
  const [step, setStep] = useState("0.1");
  const [current, setCurrent] = useState<number>(0);
  const [updatedInfo, setUpdatedInfo] = useState<string>("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchSilverJewelrySettings()
      .then((s) => {
        if (!alive) return;
        setCurrent(s.price_per_lan);
        setPrice(s.price_per_lan > 0 ? String(s.price_per_lan) : "");
        setBox(String(s.box_price));
        setMarkup(String(s.markup_percent));
        setVat(String(s.vat_percent));
        setStep(String(s.min_step_lan));
        const at = s.updated_at ? s.updated_at.toDate().toLocaleString("mn-MN") : "";
        setUpdatedInfo(
          at ? `Сүүлд: ${at}${s.updated_by_name ? ` · ${s.updated_by_name}` : ""}` : ""
        );
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Алдаа гарлаа."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const baseNum = Number(price);
  const boxNum = Number(box || 0);
  const markupNum = Number(markup || 0);
  const vatNum = Number(vat || 0);
  /** Металлын 1 лангийн үнэ */
  const priceNum = Math.round(baseNum);
  const stepNum = Number(step);
  const valid =
    Number.isFinite(baseNum) &&
    baseNum >= 1000 &&
    Number.isFinite(boxNum) &&
    boxNum >= 0 &&
    Number.isFinite(markupNum) &&
    markupNum >= 0 &&
    markupNum <= 100 &&
    Number.isFinite(vatNum) &&
    vatNum >= 0 &&
    vatNum <= 100 &&
    Number.isFinite(stepNum) &&
    stepNum > 0 &&
    stepNum <= 10;
  const cfg = {
    price_per_lan: priceNum,
    box_price: Math.round(boxNum),
    markup_percent: markupNum,
    vat_percent: vatNum,
  };
  /** Жишээ: 15 лан, ажлын хөлс 75,000/лан, тагш 330,000 (Аавын аяга) */
  const example = silverProductPrice(
    { total_lan: 15, labor_per_lan: 75000, tagsh_price: 330000 },
    cfg
  );
  const changePct =
    current > 0 && valid ? ((priceNum - current) / current) * 100 : null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!valid) {
      toast.error("1 лангийн үнийг зөв оруулна уу.");
      return;
    }
    if (!confirmed) {
      toast.error("Баталгаажуулах чагтыг тэмдэглэнэ үү.");
      return;
    }
    setSaving(true);
    try {
      const n = await saveSilverJewelrySettings({ ...cfg, min_step_lan: stepNum });
      setCurrent(Math.round(priceNum));
      setConfirmed(false);
      setUpdatedInfo(`Сүүлд: ${new Date().toLocaleString("mn-MN")}`);
      toast.success(
        `Металл 1 лан = ${formatPriceMNT(priceNum)} баталгаажлаа. ${n} барааны үнэ шинэчлэгдлээ.`
      );
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
          <Coins className="h-4 w-4 text-primary-600" />
          Мөнгөн эдлэл: 1 лангийн үнэ
        </h1>
        <p className="text-[12px] text-muted-foreground">
          Барааны үнэ = (нийт лан × (металл + ажлын хөлс) + тагш + хайрцаг) × нэмэгдэл × НӨАТ.
          Энд нийтлэг утгууд; ажлын хөлс ба тагшийг бараа бүрийн засвар дээр оруулна.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Ачааллаж байна...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <section className="rounded-xl border border-border-light bg-card p-4">
            <div className="mb-3 text-[12px] text-muted-foreground">
              Одоогийн үнэ:{" "}
              <strong className="text-foreground">
                {current > 0 ? formatPriceMNT(current) : "тохируулаагүй (мөнгөн эдлэл зарагдахгүй)"}
              </strong>
              {updatedInfo && <span className="ml-2">{updatedInfo}</span>}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="price">Металл: 1 лангийн үнэ (₮)</Label>
                <Input
                  id="price"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step="any"
                  placeholder="жишээ: 250000"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    setConfirmed(false);
                  }}
                  disabled={saving}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="box">Хайрцагны үнэ (₮, бараа бүрт)</Label>
                <Input
                  id="box"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={box}
                  onChange={(e) => {
                    setBox(e.target.value);
                    setConfirmed(false);
                  }}
                  disabled={saving}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="markup">Нэмэгдэл (%)</Label>
                <Input
                  id="markup"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step="any"
                  value={markup}
                  onChange={(e) => {
                    setMarkup(e.target.value);
                    setConfirmed(false);
                  }}
                  disabled={saving}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vat">НӨАТ (%)</Label>
                <Input
                  id="vat"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step="any"
                  value={vat}
                  onChange={(e) => {
                    setVat(e.target.value);
                    setConfirmed(false);
                  }}
                  disabled={saving}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="step">Хамгийн бага алхам (лан)</Label>
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

          {valid && (
            <section className="rounded-xl border border-border-light bg-card p-4 text-[12px]">
              <div className="mb-2 font-semibold text-foreground">Шинэ үнээр</div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                <dt className="text-muted-foreground">Металл 1 лан</dt>
                <dd className="text-right tabular-nums">{formatPriceMNT(priceNum)}</dd>
                <dt className="text-muted-foreground">Хайрцаг</dt>
                <dd className="text-right tabular-nums">
                  {formatPriceMNT(Math.round(boxNum))}
                </dd>
                <dt className="text-muted-foreground">Нэмэгдэл × НӨАТ</dt>
                <dd className="text-right tabular-nums">
                  ×{((1 + markupNum / 100) * (1 + vatNum / 100)).toFixed(4)}
                </dd>
                <dt className="font-semibold text-foreground">
                  Жишээ: 15 лан, ажлын хөлс 75,000, тагш 330,000
                </dt>
                <dd className="text-right font-semibold tabular-nums text-primary-600">
                  {formatPriceMNT(example)}
                </dd>
                <dt className="text-muted-foreground">
                  Тэр барааны {stepNum} лангийн хуваан төлөлтийн төлбөр
                </dt>
                <dd className="text-right tabular-nums">
                  {formatPriceMNT(Math.round((example / 15) * stepNum))}
                </dd>
                {changePct != null && (
                  <>
                    <dt className="text-muted-foreground">Металлын үнэ өмнөхөөс</dt>
                    <dd className="text-right font-semibold tabular-nums">
                      {changePct >= 0 ? "+" : ""}
                      {changePct.toFixed(1)}%
                    </dd>
                  </>
                )}
              </dl>
            </section>
          )}

          <label className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-[12px] text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.currentTarget.checked)}
              disabled={saving || !valid}
              className="mt-0.5 size-4 accent-primary"
            />
            <span>
              Металл 1 лан = <strong>{valid ? formatPriceMNT(priceNum) : "—"}</strong>, хайрцаг{" "}
              {valid ? formatPriceMNT(Math.round(boxNum)) : "—"}, нэмэгдэл {markupNum}%, НӨАТ{" "}
              {vatNum}% гэдгийг баталгаажуулж байна. Хадгалмагц бүх мөнгөн эдлэлийн бүтэн үнэ
              томьёогоор дахин тооцогдож, шинэ худалдан авалт болон лангаар явж буй хуваан
              төлөлтийн дараагийн төлбөрүүд шинэ үнээр бодогдоно. Төгрөгөөр эхэлсэн хуучин
              хуваан төлөлтүүд өөрчлөгдөхгүй.
            </span>
          </label>

          <Button type="submit" disabled={saving || !valid || !confirmed}>
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5" />
            )}
            Баталгаажуулж хадгалах
          </Button>
        </form>
      )}
    </div>
  );
}
