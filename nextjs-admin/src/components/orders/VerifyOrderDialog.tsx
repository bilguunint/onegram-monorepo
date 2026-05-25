"use client";

import { useState } from "react";
import { AlertTriangle, BadgeCheck, CheckCircle2, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { verifyOrder, type VerifyOrderResponse } from "@/lib/api/orderActions";
import type { Order } from "@/lib/firestore/orders";
import { formatQuantity, getClientName, metalLabel } from "@/lib/orders";

type Props = {
  open: boolean;
  order: Order | null;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
};

export function VerifyOrderDialog({ open, order, onOpenChange, onCompleted }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgeCheck className="h-4 w-4 text-emerald-600" />
            Захиалгыг баталгаажуулах
          </DialogTitle>
        </DialogHeader>
        {order && (
          <VerifyBody
            key={order.id}
            order={order}
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

type Status =
  | { kind: "form" }
  | { kind: "submitting" }
  | { kind: "success"; result: VerifyOrderResponse }
  | { kind: "already_verified"; result: VerifyOrderResponse }
  | { kind: "error"; message: string };

function VerifyBody({
  order,
  onClose,
  onCompleted,
}: {
  order: Order;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const [isExtraOrder, setIsExtraOrder] = useState(false);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "form" });

  const handleConfirm = async () => {
    if (!order.user_id) {
      setStatus({ kind: "error", message: "user_id олдсонгүй." });
      return;
    }
    setStatus({ kind: "submitting" });
    try {
      const res = await verifyOrder({
        user_id: order.user_id,
        order_id: order.id,
        is_extraOrder: isExtraOrder,
        description,
      });
      if (res.status === "verified") {
        setStatus({ kind: "success", result: res });
      } else if (res.status === "already_verified") {
        setStatus({ kind: "already_verified", result: res });
      } else {
        setStatus({ kind: "error", message: "Тодорхойгүй хариу буцлаа." });
      }
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Үйлдэл амжилтгүй.",
      });
    }
  };

  if (status.kind === "success") {
    const r = status.result;
    return (
      <>
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="text-[13px] font-medium">
              Захиалга амжилттай баталгаажлаа.
            </span>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 rounded-lg border border-border-light bg-muted/30 p-3 text-[12px]">
            <dt className="text-muted-foreground">Статус</dt>
            <dd className="font-medium">{r.status}</dd>
            <dt className="text-muted-foreground">Металл</dt>
            <dd className="font-medium">{metalLabel(r.metal_id)}</dd>
            <dt className="text-muted-foreground">Тоо хэмжээ</dt>
            <dd className="font-medium">{formatQuantity(r.metal_id, r.qty)}</dd>
            <dt className="text-muted-foreground">Баталгаажуулсан</dt>
            <dd className="font-medium">{r.performed_by || "—"}</dd>
          </dl>
        </div>
        <DialogFooter>
          <Button onClick={onCompleted}>Хаах</Button>
        </DialogFooter>
      </>
    );
  }

  if (status.kind === "already_verified") {
    const r = status.result;
    return (
      <>
        <div className="flex items-start gap-2 rounded-lg bg-sky-50 px-3 py-2.5 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="text-[12px] leading-relaxed">
            <strong>{r.performed_by || "Өөр админ"}</strong> аль хэдийн
            баталгаажуулсан байна.
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onCompleted}>Хаах</Button>
        </DialogFooter>
      </>
    );
  }

  const submitting = status.kind === "submitting";

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="text-[12px] leading-relaxed">
            Та <strong>{getClientName(order)}</strong>-ийн{" "}
            <strong>{formatQuantity(order.metal_id, order.quantity)}</strong>
            -н захиалгыг баталгаажуулах гэж байна.
          </div>
        </div>

        <label className="flex cursor-pointer select-none items-center gap-2 rounded-lg border border-foreground/15 bg-foreground/[0.04] px-3 py-2 text-[13px] hover:bg-foreground/[0.06]">
          <input
            type="checkbox"
            checked={isExtraOrder}
            onChange={(e) => setIsExtraOrder(e.currentTarget.checked)}
            className="size-4 cursor-pointer accent-primary"
          />
          <span>Онцгой захиалга</span>
        </label>

        <div className="space-y-1.5">
          <Label htmlFor="order-description">Тайлбар</Label>
          <Textarea
            id="order-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Захиалгын тайлбар…"
          />
        </div>

        {status.kind === "error" && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            {status.message}
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Үгүй
        </Button>
        <Button onClick={handleConfirm} disabled={submitting}>
          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {status.kind === "error" ? "Дахин оролдох" : "Тийм, баталгаажуулна"}
        </Button>
      </DialogFooter>
    </>
  );
}
