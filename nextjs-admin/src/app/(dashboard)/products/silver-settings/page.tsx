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
  const [tagsh, setTagsh] = useState("0");
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
        setTagsh(String(s.tagsh_price));
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
  const tagshNum = Number(tagsh || 0);
  /** Мөнгөний 1 лангийн үнэ. Тагш нь лан бүрт биш, бараа бүрт нэг удаа нэмэгдэнэ. */
  const priceNum = Math.round(baseNum);
  /** Жишээ барааны бүтэн үнэ = лан × 1 лангийн үнэ + тагш */
  const fullPrice = (lan: number) => Math.round(lan * priceNum + Math.round(tagshNum));
  const stepNum = Number(step);
  const valid =
    Number.isFinite(baseNum) &&
    baseNum >= 1000 &&
    Number.isFinite(tagshNum) &&
    tagshNum >= 0 &&
    Number.isFinite(stepNum) &&
    stepNum > 0 &&
    stepNum <= 10;
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
      const n = await saveSilverJewelrySettings(baseNum, tagshNum, stepNum);
      setCurrent(Math.round(priceNum));
      setConfirmed(false);
      setUpdatedInfo(`Сүүлд: ${new Date().toLocaleString("mn-MN")}`);
      toast.success(
        `1 лан = ${formatPriceMNT(priceNum)}, тагш = ${formatPriceMNT(Math.round(tagshNum))} баталгаажлаа. ${n} барааны үнэ шинэчлэгдлээ.`
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
          Бүх мөнгөн эдлэлд нийтлэг. Барааны үнэ = нийт лан × 1 лангийн үнэ + тагшны үнэ
          (тагш бараа бүрт нэг удаа нэмэгдэнэ; 1 лан = 37.5 гр).
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="price">1 лангийн үнэ (₮)</Label>
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
                <Label htmlFor="tagsh">Тагшны үнэ (₮, бараа бүрт)</Label>
                <Input
                  id="tagsh"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step="any"
                  placeholder="0"
                  value={tagsh}
                  onChange={(e) => {
                    setTagsh(e.target.value);
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
                <dt className="text-muted-foreground">1 лангийн үнэ</dt>
                <dd className="text-right tabular-nums">{formatPriceMNT(priceNum)}</dd>
                <dt className="text-muted-foreground">Тагшны үнэ (бараа бүрт)</dt>
                <dd className="text-right tabular-nums">
                  {formatPriceMNT(Math.round(tagshNum))}
                </dd>
                <dt className="font-semibold text-foreground">
                  5 лангийн аяга = 5 × {formatPriceMNT(priceNum)} + тагш
                </dt>
                <dd className="text-right font-semibold tabular-nums text-primary-600">
                  {formatPriceMNT(fullPrice(5))}
                </dd>
                <dt className="text-muted-foreground">
                  Тэр аяганы {stepNum} лангийн хуваан төлөлтийн төлбөр
                </dt>
                <dd className="text-right tabular-nums">
                  {formatPriceMNT(Math.round((fullPrice(5) / 5) * stepNum))}
                </dd>
                {changePct != null && (
                  <>
                    <dt className="text-muted-foreground">1 лангийн үнэ өмнөхөөс</dt>
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
              1 лан = <strong>{valid ? formatPriceMNT(priceNum) : "—"}</strong>, тагшны үнэ ={" "}
              <strong>{valid ? formatPriceMNT(Math.round(tagshNum)) : "—"}</strong> (бараа бүрт
              нэг удаа) гэдгийг баталгаажуулж байна. Хадгалмагц шинэ худалдан авалт болон лангаар
              явж буй хуваан төлөлтийн дараагийн төлбөрүүд энэ үнээр бодогдож, бүх мөнгөн
              эдлэлийн бүтэн үнэ (лан × үнэ + тагш) шинэчлэгдэнэ. Хуваан төлөлтөд тагш лан бүрт
              тэнцүү хуваарилагдана. Төгрөгөөр эхэлсэн хуучин хуваан төлөлтүүд өөрчлөгдөхгүй.
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
