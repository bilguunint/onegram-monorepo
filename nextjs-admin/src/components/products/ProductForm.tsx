"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ChevronLeft, Info, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImageGalleryInput } from "@/components/products/ImageGalleryInput";
import {
  formatPriceMNT,
} from "@/lib/products";
import type { Product, ProductDraft } from "@/lib/firestore/products";

type Props = {
  /** Firestore doc id used as the Storage path namespace for images. */
  productId: string;
  /** Existing product when editing; null for create. */
  initial?: Product | null;
  /** Backlink shown above the form, default `/products`. */
  backHref?: string;
  /** Implementation submits the draft and resolves on success. */
  onSubmit: (draft: ProductDraft) => Promise<void>;
  /** Heading used for the page title. */
  title: string;
  /** Subtitle / breadcrumb tail. */
  subtitle: string;
  /** Submit button label. */
  submitLabel?: string;
};

export function ProductForm({
  productId,
  initial,
  backHref = "/products",
  onSubmit,
  title,
  subtitle,
  submitLabel = "Хадгалах",
}: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState<string>(
    initial?.price != null ? String(initial.price) : ""
  );
  const [minMonths, setMinMonths] = useState<string>(
    String(initial?.min_months ?? 1)
  );
  const [maxMonths, setMaxMonths] = useState<string>(
    String(initial?.max_months ?? 12)
  );
  const [cancelFee, setCancelFee] = useState<string>(
    String(initial?.cancel_fee_percent ?? 10)
  );
  const [hasStock, setHasStock] = useState(initial?.stock != null);
  const [stock, setStock] = useState<string>(
    initial?.stock != null ? String(initial.stock) : ""
  );
  const [status, setStatus] = useState(initial?.status ?? "active");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceNum = Number(price);
  const minMonthsNum = Math.max(1, Math.floor(Number(minMonths) || 0));
  const maxMonthsNum = Math.max(1, Math.floor(Number(maxMonths) || 0));
  const monthlyPreview =
    Number.isFinite(priceNum) && priceNum > 0 && maxMonthsNum > 0
      ? Math.round(priceNum / maxMonthsNum)
      : 0;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Барааны нэр оруулна уу.");
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setError("Үнэ зөв оруулна уу.");
      return;
    }
    if (minMonthsNum < 1 || maxMonthsNum < 1) {
      setError("Сарын тоо 1 ба түүнээс дээш байх ёстой.");
      return;
    }
    if (maxMonthsNum > 12) {
      setError("Хамгийн их сарын тоо 12-оос хэтэрч болохгүй.");
      return;
    }
    if (minMonthsNum > maxMonthsNum) {
      setError("Min сар нь max сараас бага байх ёстой.");
      return;
    }
    const feeNum = Number(cancelFee);
    if (!Number.isFinite(feeNum) || feeNum < 0 || feeNum > 100) {
      setError("Шимтгэлийн хувь 0-100 хооронд байх ёстой.");
      return;
    }
    let stockVal: number | null = null;
    if (hasStock) {
      const n = Number(stock);
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        setError("Stock эерэг бүхэл тоо байх ёстой.");
        return;
      }
      stockVal = n;
    }
    if (images.length === 0) {
      setError("Хамгийн багадаа 1 зураг оруулна уу.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name,
        description,
        images,
        price: Math.round(priceNum),
        min_months: minMonthsNum,
        max_months: maxMonthsNum,
        cancel_fee_percent: Math.round(feeNum),
        stock: stockVal,
        status,
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Хадгалахад алдаа гарлаа.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-[18px] font-semibold text-foreground">{title}</h1>
          <p className="text-[12px] text-muted-foreground">
            <Link
              href={backHref}
              className="text-foreground/70 hover:text-primary-600"
            >
              Бараа
            </Link>{" "}
            <span className="text-foreground/70">/ {subtitle}</span>
          </p>
        </div>
        <Button
          render={<Link href={backHref} />}
          variant="outline"
          size="sm"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Буцах
        </Button>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <div className="space-y-4 lg:col-span-2">
          <FormCard title="Үндсэн мэдээлэл">
            <div className="space-y-1.5">
              <Label htmlFor="name">Нэр</Label>
              <Input
                id="name"
                placeholder="Барааны нэр"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="mt-3 space-y-1.5">
              <Label htmlFor="description">Тайлбар</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="Барааны товч танилцуулга, онцлог шинж тэмдэг…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
              />
            </div>
          </FormCard>

          <FormCard title="Зургийн цомог">
            <ImageGalleryInput
              productId={productId}
              value={images}
              onChange={setImages}
            />
          </FormCard>

          <FormCard title="Үнэ ба хугацаа">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="price">Үнэ (₮)</Label>
                <Input
                  id="price"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cancel-fee">Цуцлах шимтгэл (%)</Label>
                <Input
                  id="cancel-fee"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100}
                  step={1}
                  placeholder="0"
                  value={cancelFee}
                  onChange={(e) => setCancelFee(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="min-months">Min сар</Label>
                <Input
                  id="min-months"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={12}
                  step={1}
                  value={minMonths}
                  onChange={(e) => setMinMonths(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max-months">Max сар (≤ 12)</Label>
                <Input
                  id="max-months"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={12}
                  step={1}
                  value={maxMonths}
                  onChange={(e) => setMaxMonths(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
            {monthlyPreview > 0 && (
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
                {maxMonthsNum} сараар сонговол сар бүрийн дүн ойролцоогоор{" "}
                <strong className="text-foreground">
                  {formatPriceMNT(monthlyPreview)}
                </strong>
              </p>
            )}
          </FormCard>

          <FormCard title="Stock ба төлөв">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  checked={hasStock}
                  onChange={(e) => setHasStock(e.currentTarget.checked)}
                  disabled={submitting}
                  className="size-4 accent-primary"
                />
                <span>Тоо хязгаартай</span>
              </label>
              {hasStock && (
                <div className="space-y-1.5">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    placeholder="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="status">Төлөв</Label>
                <Select
                  id="status"
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as Product["status"])
                  }
                  disabled={submitting}
                >
                  <option value="active">Идэвхтэй (хэрэглэгчид харагдана)</option>
                  <option value="inactive">Идэвхгүй</option>
                </Select>
              </div>
            </div>
          </FormCard>
        </div>

        {/* Preview pane */}
        <aside className="lg:col-span-1">
          <div className="sticky top-4 space-y-3 rounded-xl border border-border-light bg-card p-4">
            <h3 className="text-[13px] font-semibold text-foreground">
              Урьдчилан харах
            </h3>
            <ProductPreview
              name={name}
              description={description}
              price={priceNum}
              images={images}
              minMonths={minMonthsNum}
              maxMonths={maxMonthsNum}
              monthlyPreview={monthlyPreview}
              status={status}
            />

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {submitLabel}
            </Button>
          </div>
        </aside>
      </form>
    </div>
  );
}

function FormCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border-light bg-card p-4">
      <header className="mb-3 border-b border-border-light pb-2">
        <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
      </header>
      {children}
    </section>
  );
}

function ProductPreview({
  name,
  description,
  price,
  images,
  minMonths,
  maxMonths,
  monthlyPreview,
  status,
}: {
  name: string;
  description: string;
  price: number;
  images: string[];
  minMonths: number;
  maxMonths: number;
  monthlyPreview: number;
  status: Product["status"];
}) {
  const cover = images[0];
  return (
    <div className="overflow-hidden rounded-lg border border-border-light bg-background">
      <div className="relative aspect-[4/3] w-full bg-muted">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={name || "Бараа"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">
            Зураг алга
          </div>
        )}
        <span
          className={cn(
            "absolute top-2 left-2 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
            status === "active"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
              : "bg-muted text-muted-foreground"
          )}
        >
          {status === "active" ? "Идэвхтэй" : "Идэвхгүй"}
        </span>
      </div>
      <div className="space-y-1 p-3">
        <div className="truncate text-[14px] font-semibold text-foreground">
          {name || "Барааны нэр…"}
        </div>
        {description && (
          <p className="line-clamp-2 text-[11px] text-muted-foreground">
            {description}
          </p>
        )}
        <div className="mt-2 text-[16px] font-bold text-primary-600">
          {formatPriceMNT(price)}
        </div>
        {monthlyPreview > 0 && (
          <div className="text-[11px] text-muted-foreground">
            Сар бүрд:{" "}
            <span className="font-medium text-foreground">
              {formatPriceMNT(monthlyPreview)}
            </span>
          </div>
        )}
        <div className="text-[11px] text-muted-foreground">
          {minMonths}-{maxMonths} сараар хувааж төлнө
        </div>
      </div>
    </div>
  );
}
