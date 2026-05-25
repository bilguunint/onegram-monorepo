"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  const [code, setCode] = useState("");
  const [revealCode, setRevealCode] = useState(false);

  // Reset state whenever the dialog opens for a new purchase.
  useEffect(() => {
    if (open) {
      setCode("");
      setError("");
      setRevealCode(false);
    }
  }, [open, purchase?.id]);

  const handleCodeChange = (value: string) => {
    // Only digits, max 6 characters.
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
  };

  const handleConfirm = async () => {
    if (!purchase) return;
    if (code.length !== 6) {
      setError("Кодыг 6 оронтой бүрэн оруулна уу.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await deliverProductPurchase(purchase.id, code);
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
                Хэрэглэгч төлбөрөө бүрэн төлсөн. 6 оронтой кодыг оруулна уу.
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

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">
                Хэрэглэгчийн утсан дээрх 6 оронтой код
              </label>
              <Input
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                disabled={submitting}
                className="text-center font-mono text-lg tracking-[0.5em]"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setRevealCode((v) => !v)}
                className="flex items-center gap-1 text-[10.5px] text-muted-foreground hover:text-foreground"
              >
                {revealCode ? (
                  <>
                    <EyeOff className="h-3 w-3" />
                    Кодыг нуух
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3" />
                    Кодыг харах (зөвхөн онцгой тохиолдолд)
                  </>
                )}
              </button>
              {revealCode && purchase.pickup_code && (
                <div className="rounded-md border border-dashed border-border-light bg-muted/40 px-2.5 py-1.5 text-[11px]">
                  <span className="text-muted-foreground">Доорх код: </span>
                  <span className="font-mono font-semibold tracking-[0.25em]">
                    {purchase.pickup_code}
                  </span>
                </div>
              )}
            </div>

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
          <Button
            onClick={handleConfirm}
            disabled={submitting || code.length !== 6}
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Хүлээлгэн өгөх
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
