"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deliverProductPurchase,
  type ProductPurchase,
} from "@/lib/firestore/productPurchases";
import { formatPriceMNT, getPurchaseUserName } from "@/lib/products";

type Props = {
  open: boolean;
  purchase: ProductPurchase | null;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
};

export function DeliverPurchaseDialog({
  open,
  purchase,
  onOpenChange,
  onCompleted,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!purchase) return;
    setError("");
    setSubmitting(true);
    try {
      await deliverProductPurchase(purchase.id);
      toast.success("Бараа хүлээлгэн өгсөнд тэмдэглэгдлээ.");
      onOpenChange(false);
      onCompleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4 text-primary-600" />
            Бараа хүлээлгэн өгөх
          </DialogTitle>
        </DialogHeader>
        {purchase && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span className="text-[12px]">
                Хэрэглэгч төлбөрөө бүрэн төлсөн. Барааг хүлээлгэн өгөх үү?
              </span>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 rounded-lg border border-border-light bg-card p-3 text-[12px]">
              <dt className="text-muted-foreground">Хэрэглэгч</dt>
              <dd className="font-medium">{getPurchaseUserName(purchase)}</dd>
              <dt className="text-muted-foreground">Бараа</dt>
              <dd className="font-medium">{purchase.product_snapshot.name}</dd>
              <dt className="text-muted-foreground">Нийт</dt>
              <dd className="font-semibold tabular-nums">
                {formatPriceMNT(purchase.total_price)}
              </dd>
            </dl>
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                {error}
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Цуцлах
          </Button>
          <Button onClick={handleConfirm} disabled={submitting}>
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Хүлээлгэн өгөх
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
