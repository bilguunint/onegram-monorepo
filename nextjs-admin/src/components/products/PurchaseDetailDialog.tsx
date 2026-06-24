"use client";

import Link from "next/link";
import { Package, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProductPurchase } from "@/lib/firestore/productPurchases";
import {
  formatPriceMNT,
  getPurchaseUserName,
  purchaseProgress,
  purchaseStatusBadge,
  purchaseStatusText,
} from "@/lib/products";
import { formatOrderDate } from "@/lib/orders";

type Props = {
  open: boolean;
  purchase: ProductPurchase | null;
  onOpenChange: (open: boolean) => void;
};

export function PurchaseDetailDialog({ open, purchase, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary-600" />
            Худалдан авалтын дэлгэрэнгүй
          </DialogTitle>
        </DialogHeader>
        {purchase && <DetailBody key={purchase.id} purchase={purchase} />}
      </DialogContent>
    </Dialog>
  );
}

function DetailBody({ purchase: p }: { purchase: ProductPurchase }) {
  const progress = purchaseProgress(p);
  const remaining = Math.max(0, p.total_price - p.paid_amount);
  const payments = [...(p.payments ?? [])].sort(
    (a, b) => (a.day_no ?? 0) - (b.day_no ?? 0)
  );

  return (
    <div className="space-y-4">
      {/* Product + user + status */}
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
          {p.product_snapshot.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.product_snapshot.image}
              alt={p.product_snapshot.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Package className="h-5 w-5 text-muted-foreground" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <Link
            href={`/products/${p.product_id}`}
            className="block truncate text-[14px] font-semibold text-foreground hover:text-primary-600"
          >
            {p.product_snapshot.name}
          </Link>
          <div className="truncate text-[12px] text-muted-foreground">
            {getPurchaseUserName(p)}
            {p.user_snapshot.phone ? ` · ${p.user_snapshot.phone}` : ""}
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
            purchaseStatusBadge(p.status)
          )}
        >
          {purchaseStatusText(p.status)}
        </span>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-border-light bg-card p-3">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Нийт үнэ</dt>
            <dd className="font-medium tabular-nums">{formatPriceMNT(p.total_price)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Төлсөн</dt>
            <dd className="font-medium tabular-nums text-primary-600">
              {formatPriceMNT(p.paid_amount)}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Үлдэгдэл</dt>
            <dd className="font-medium tabular-nums">{formatPriceMNT(remaining)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Өдрийн төлбөр</dt>
            <dd className="font-medium tabular-nums">{formatPriceMNT(p.daily_payment)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Хугацаа</dt>
            <dd className="font-medium tabular-nums">
              {p.months} сар ({p.total_days} өдөр)
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Төлсөн өдөр</dt>
            <dd className="font-medium tabular-nums">
              {p.paid_days}/{p.total_days} ({progress}%)
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Эхэлсэн</dt>
            <dd className="font-medium tabular-nums">{formatOrderDate(p.started_at)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Дуусах</dt>
            <dd className="font-medium tabular-nums">
              {p.deadline ? formatOrderDate(p.deadline) : "—"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Payment history */}
      <div>
        <div className="mb-2 text-[12px] font-semibold text-foreground">
          Төлбөрийн түүх ({payments.length})
        </div>
        {payments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-light px-3 py-4 text-center text-[12px] text-muted-foreground">
            Төлбөр бүртгэгдээгүй байна.
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto rounded-lg border border-border-light">
            {payments.map((rec, i) => (
              <div
                key={`${rec.day_no}-${i}`}
                className="flex items-center justify-between gap-3 border-b border-border-light/60 px-3 py-2 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-foreground">
                    {rec.paid_at ? formatOrderDate(rec.paid_at) : "—"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Өдөр {rec.day_no}
                    {rec.payment_method ? ` · ${rec.payment_method}` : ""}
                  </div>
                </div>
                <div className="shrink-0 text-[13px] font-semibold tabular-nums text-primary-600">
                  {formatPriceMNT(rec.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
