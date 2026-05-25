"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import {
  ChevronLeft,
  CheckCircle2,
  Inbox,
  Loader2,
  Package,
  PackageCheck,
  Pencil,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { fetchProduct, type Product } from "@/lib/firestore/products";
import {
  fetchPurchasesForProduct,
  type ProductPurchase,
} from "@/lib/firestore/productPurchases";
import {
  formatPriceMNT,
  getPurchaseUserName,
  productStatusBadge,
  productStatusText,
  purchaseDaysBehind,
  purchaseDaysUntilDeadline,
  purchaseExpectedPaidDays,
  purchaseLastPaidAt,
  purchaseProgress,
  purchaseStatusBadge,
  purchaseStatusText,
} from "@/lib/products";
import { formatOrderDate } from "@/lib/orders";
import { CancelPurchaseDialog } from "@/components/products/CancelPurchaseDialog";
import { DeliverPurchaseDialog } from "@/components/products/DeliverPurchaseDialog";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [product, setProduct] = useState<Product | null>(null);
  const [purchases, setPurchases] = useState<ProductPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [cancelTarget, setCancelTarget] = useState<ProductPurchase | null>(null);
  const [deliverTarget, setDeliverTarget] = useState<ProductPurchase | null>(
    null
  );

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    try {
      const [p, plist] = await Promise.all([
        fetchProduct(id),
        fetchPurchasesForProduct(id),
      ]);
      if (!p) {
        setNotFound(true);
      } else {
        setProduct(p);
        setPurchases(plist);
      }
    } catch (err) {
      console.error(err);
      toast.error("Мэдээлэл ачааллахад алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border-light bg-card py-16">
        <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
        <p className="text-[12px] text-muted-foreground">Ачааллаж байна…</p>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        Бараа олдсонгүй.
      </div>
    );
  }

  const stats = {
    active: purchases.filter((p) => p.status === "active").length,
    completed: purchases.filter((p) => p.status === "completed").length,
    delivered: purchases.filter((p) => p.status === "delivered").length,
    cancelled: purchases.filter((p) => p.status === "cancelled").length,
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-[18px] font-semibold text-foreground">
            {product.name}
          </h1>
          <p className="text-[12px] text-muted-foreground">
            <Link
              href="/products"
              className="text-foreground/70 hover:text-primary-600"
            >
              Бараа
            </Link>{" "}
            <span className="text-foreground/70">/ Дэлгэрэнгүй</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            render={<Link href="/products" />}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Буцах
          </Button>
          <Button render={<Link href={`/products/${id}/edit`} />} size="sm">
            <Pencil className="h-3.5 w-3.5" />
            Засах
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => void load()}
            aria-label="Шинэчлэх"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Product card */}
        <section className="rounded-xl border border-border-light bg-card p-4 lg:col-span-1">
          <div className="overflow-hidden rounded-lg border border-border-light bg-muted">
            {product.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[0]}
                alt={product.name}
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center text-muted-foreground">
                <Package className="h-8 w-8" />
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {product.images.slice(1).map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={src}
                  src={src}
                  alt={`Зураг ${i + 2}`}
                  className="h-14 w-14 rounded-md border border-border-light object-cover"
                />
              ))}
            </div>
          )}

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                  productStatusBadge(product.status)
                )}
              >
                {productStatusText(product.status)}
              </span>
              <span className="text-[18px] font-bold text-primary-600">
                {formatPriceMNT(product.price)}
              </span>
            </div>
            {product.description && (
              <p className="whitespace-pre-wrap text-[12px] text-foreground/85">
                {product.description}
              </p>
            )}
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-border-light pt-3 text-[12px]">
            <dt className="text-muted-foreground">Хугацаа</dt>
            <dd className="text-right font-medium">
              {product.min_months === product.max_months
                ? `${product.max_months} сар`
                : `${product.min_months}-${product.max_months} сар`}
            </dd>
            <dt className="text-muted-foreground">Цуцлах шимтгэл</dt>
            <dd className="text-right font-medium">
              {product.cancel_fee_percent}%
            </dd>
            <dt className="text-muted-foreground">Stock</dt>
            <dd className="text-right font-medium">
              {product.stock == null ? "Хязгааргүй" : product.stock}
            </dd>
          </dl>
        </section>

        {/* Stats + purchases */}
        <section className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Идэвхтэй"
              value={stats.active}
              tone="bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
            />
            <StatCard
              label="Төлөгдсөн"
              value={stats.completed}
              tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
            />
            <StatCard
              label="Хүлээлгэсэн"
              value={stats.delivered}
              tone="bg-primary-100 text-primary-700"
            />
            <StatCard
              label="Цуцалсан"
              value={stats.cancelled}
              tone="bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
            />
          </div>

          <div className="rounded-xl border border-border-light bg-card">
            <div className="border-b border-border-light px-4 py-3">
              <h2 className="text-[14px] font-semibold text-foreground">
                Худалдан авалт ({purchases.length})
              </h2>
            </div>
            <div className="px-4 py-3">
              {purchases.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                  <Inbox className="h-6 w-6 opacity-60" />
                  <p className="text-[12px]">
                    Энэ бараанд худалдан авалт байхгүй байна.
                  </p>
                </div>
              ) : (
                <PurchasesTable
                  rows={purchases}
                  onCancel={setCancelTarget}
                  onDeliver={setDeliverTarget}
                />
              )}
            </div>
          </div>
        </section>
      </div>

      <CancelPurchaseDialog
        open={!!cancelTarget}
        purchase={cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
        onCompleted={() => void load()}
      />
      <DeliverPurchaseDialog
        open={!!deliverTarget}
        purchase={deliverTarget}
        onOpenChange={(o) => !o && setDeliverTarget(null)}
        onCompleted={() => void load()}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-border-light bg-card p-3">
      <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className={cn("rounded-md px-1.5 py-0.5 text-[11px]", tone)}>
          {value}
        </span>
      </div>
    </div>
  );
}

function PurchasesTable({
  rows,
  onCancel,
  onDeliver,
}: {
  rows: ProductPurchase[];
  onCancel: (p: ProductPurchase) => void;
  onDeliver: (p: ProductPurchase) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-[13px]">
        <thead>
          <tr className="border-b border-border-light text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            <th className="px-2 py-2 text-left font-medium">Хэрэглэгч</th>
            <th className="px-2 py-2 text-right font-medium">Төлсөн / Нийт</th>
            <th className="px-2 py-2 text-left font-medium">Progress</th>
            <th className="px-2 py-2 text-left font-medium">Огноо</th>
            <th className="px-2 py-2 text-left font-medium">Төлөв</th>
            <th className="px-2 py-2 text-right font-medium">Үйлдэл</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const progress = purchaseProgress(p);
            const expected = purchaseExpectedPaidDays(p);
            const behind = purchaseDaysBehind(p);
            const daysLeft = purchaseDaysUntilDeadline(p);
            const lastPaid = purchaseLastPaidAt(p);
            return (
              <tr
                key={p.id}
                className="border-b border-border-light/60 last:border-b-0 hover:bg-muted/40"
              >
                <td className="px-2 py-2">
                  <div className="font-medium text-foreground">
                    {getPurchaseUserName(p)}
                  </div>
                  {p.user_snapshot.phone && (
                    <div className="text-[11px] text-muted-foreground">
                      {p.user_snapshot.phone}
                    </div>
                  )}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  <div className="font-semibold text-primary-600">
                    {formatPriceMNT(p.paid_amount)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {formatPriceMNT(p.total_price)}
                  </div>
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full transition-[width]",
                          p.status === "cancelled"
                            ? "bg-rose-500"
                            : p.status === "delivered"
                              ? "bg-primary"
                              : p.status === "completed"
                                ? "bg-emerald-500"
                                : "bg-sky-500"
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                      {progress}%
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span>
                      {p.paid_days}/{p.total_days} өдөр
                    </span>
                    {p.status === "active" &&
                      expected != null &&
                      expected !== p.paid_days && (
                        <span
                          className={cn(
                            "text-foreground/60",
                            behind && behind > 0
                              ? "text-rose-600 dark:text-rose-400"
                              : ""
                          )}
                        >
                          · төл-х: {expected}
                        </span>
                      )}
                  </div>
                  {p.status === "active" && behind != null && behind > 0 && (
                    <div className="mt-1 inline-flex items-center rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                      {behind} өдөр хоцорсон
                    </div>
                  )}
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    Өдөр бүр: {formatPriceMNT(p.daily_payment)}
                  </div>
                </td>
                <td className="px-2 py-2 text-[11px] tabular-nums">
                  <div className="text-muted-foreground">
                    Эхэлсэн: {formatOrderDate(p.started_at)}
                  </div>
                  {p.deadline && (
                    <div
                      className={cn(
                        "text-muted-foreground",
                        p.status === "active" && daysLeft != null && daysLeft < 0
                          ? "text-rose-600 dark:text-rose-400 font-medium"
                          : ""
                      )}
                    >
                      Дуусах: {formatOrderDate(p.deadline)}
                      {p.status === "active" &&
                        daysLeft != null &&
                        daysLeft >= 0 && (
                          <span className="text-foreground/40">
                            {" "}
                            · {daysLeft} өдөр
                          </span>
                        )}
                    </div>
                  )}
                  {lastPaid && (
                    <div className="text-foreground/40">
                      Сүүлд: {formatOrderDate(Timestamp.fromDate(lastPaid))}
                    </div>
                  )}
                </td>
                <td className="px-2 py-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                      purchaseStatusBadge(p.status)
                    )}
                  >
                    {purchaseStatusText(p.status)}
                  </span>
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center justify-end gap-1">
                    {p.status === "completed" && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Хүлээлгэн өгөх"
                        onClick={() => onDeliver(p)}
                        className="text-primary-600 hover:bg-primary-50"
                      >
                        <PackageCheck className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {(p.status === "active" || p.status === "completed") && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Цуцлах"
                        onClick={() => onCancel(p)}
                        className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {p.status === "delivered" && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
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
