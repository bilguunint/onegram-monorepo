"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  cancelProductPurchase,
  type ProductPurchase,
} from "@/lib/firestore/productPurchases";
import {
  computeRefundSplit,
  formatPriceMNT,
  getPurchaseUserName,
} from "@/lib/products";

type Props = {
  open: boolean;
  purchase: ProductPurchase | null;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
};

export function CancelPurchaseDialog({
  open,
  purchase,
  onOpenChange,
  onCompleted,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-rose-600" />
            Худалдан авалт цуцлах
          </DialogTitle>
        </DialogHeader>
        {purchase && (
          <CancelBody
            key={purchase.id}
            purchase={purchase}
            onClose={() => onOpenChange(false)}
            onCompleted={() => {
              onOpenChange(false);
              onCompleted();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CancelBody({
  purchase,
  onClose,
  onCompleted,
}: {
  purchase: ProductPurchase;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const split = useMemo(
    () =>
      computeRefundSplit(
        purchase.paid_amount,
        purchase.product_snapshot.cancel_fee_percent
      ),
    [purchase.paid_amount, purchase.product_snapshot.cancel_fee_percent]
  );

  const submit = async () => {
    setError("");
    if (!reason.trim()) {
      setError("Шалтгаан оруулна уу.");
      return;
    }
    setSubmitting(true);
    try {
      await cancelProductPurchase(purchase.id, {
        reason,
        refundAmount: split.refund,
        refundFee: split.fee,
      });
      toast.success("Худалдан авалт цуцлагдлаа.");
      onCompleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-3">
        <div className="rounded-lg bg-primary-50 px-3 py-2 text-[12px] text-primary-700">
          <div>
            <strong>Хэрэглэгч:</strong> {getPurchaseUserName(purchase)}
          </div>
          <div>
            <strong>Бараа:</strong> {purchase.product_snapshot.name}
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="text-[12px] leading-relaxed">
            Энэ үйлдэл нь буцаах боломжгүй. Хэрэглэгчид зөвхөн refund_amount-г
            буцаагдана.
          </div>
        </div>

        <div className="rounded-lg border border-border-light bg-card p-3">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[12px]">
            <dt className="text-muted-foreground">Төлсөн дүн</dt>
            <dd className="text-right font-medium tabular-nums">
              {formatPriceMNT(purchase.paid_amount)}
            </dd>
            <dt className="text-muted-foreground">
              Шимтгэл ({purchase.product_snapshot.cancel_fee_percent}%)
            </dt>
            <dd className="text-right font-medium tabular-nums text-rose-600">
              −{formatPriceMNT(split.fee)}
            </dd>
            <dt className="border-t border-border-light pt-1 font-semibold text-foreground">
              Буцаах дүн
            </dt>
            <dd className="border-t border-border-light pt-1 text-right text-[14px] font-bold tabular-nums text-emerald-600">
              {formatPriceMNT(split.refund)}
            </dd>
          </dl>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cancel-reason">
            Шалтгаан <span className="text-rose-600">*</span>
          </Label>
          <Textarea
            id="cancel-reason"
            rows={3}
            placeholder="Цуцлах болсон шалтгаан…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={submitting}
          />
        </div>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Болих
        </Button>
        <Button
          variant="destructive"
          onClick={submit}
          disabled={submitting}
        >
          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Цуцлах + Refund хийх
        </Button>
      </DialogFooter>
    </>
  );
}
