"use client";

import { useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from "lucide-react";
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
import { Select } from "@/components/ui/select";
import {
  verifyWithdraw,
  type VerifyWithdrawResponse,
  type WithdrawType,
} from "@/lib/api/withdrawActions";
import type { Withdraw } from "@/lib/firestore/withdraws";
import { formatQuantity, metalLabel } from "@/lib/orders";
import { getWithdrawClientName } from "@/lib/withdraws";

type Props = {
  open: boolean;
  withdraw: Withdraw | null;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
};

export function VerifyWithdrawDialog({
  open,
  withdraw,
  onOpenChange,
  onCompleted,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Баталгаажуулах
          </DialogTitle>
        </DialogHeader>
        {withdraw && (
          <VerifyBody
            key={withdraw.id}
            withdraw={withdraw}
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

type Phase =
  | { kind: "form"; error?: string }
  | { kind: "submitting" }
  | { kind: "success"; result: VerifyWithdrawResponse }
  | { kind: "error"; message: string };

function VerifyBody({
  withdraw,
  onClose,
  onCompleted,
}: {
  withdraw: Withdraw;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const [type, setType] = useState<WithdrawType>("sold_to_us");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "form" });

  const handleSubmit = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setPhase({ kind: "form", error: "Баталгаажуулах код оруулна уу." });
      return;
    }
    if (trimmed.length !== 5) {
      setPhase({ kind: "form", error: "Код 5 оронтой байх ёстой." });
      return;
    }
    if (!/^[A-Z0-9]+$/.test(trimmed)) {
      setPhase({ kind: "form", error: "Код тоо болон үсгээс бүрдэх ёстой." });
      return;
    }
    setPhase({ kind: "submitting" });
    try {
      const res = await verifyWithdraw({
        verificationCode: trimmed,
        withdrawId: withdraw.id,
        withdrawType: type,
      });
      setPhase({ kind: "success", result: res });
    } catch (err) {
      setPhase({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Баталгаажуулахад алдаа гарлаа.",
      });
    }
  };

  if (phase.kind === "success") {
    const r = phase.result;
    return (
      <>
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="text-[13px] font-medium">
              Биетээр авах хүсэлт амжилттай баталгаажлаа.
            </span>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 rounded-lg border border-border-light bg-muted/30 p-3 text-[12px]">
            <dt className="text-muted-foreground">Статус</dt>
            <dd className="font-medium">{r.status}</dd>
            <dt className="text-muted-foreground">Металл</dt>
            <dd className="font-medium">{metalLabel(r.metal_id)}</dd>
            <dt className="text-muted-foreground">Тоо хэмжээ</dt>
            <dd className="font-medium">
              {formatQuantity(r.metal_id, r.quantity)}
            </dd>
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

  const submitting = phase.kind === "submitting";
  const formError = phase.kind === "form" ? phase.error : undefined;
  const showError = phase.kind === "error";

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="text-[12px] leading-relaxed">
            Та <strong>{getWithdrawClientName(withdraw)}</strong>-ийн{" "}
            <strong>
              {formatQuantity(withdraw.metal_id, withdraw.quantity)}
            </strong>{" "}
            биетээр авах хүсэлтийг баталгаажуулах гэж байна.
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="withdraw-type">Төрөл</Label>
          <Select
            id="withdraw-type"
            value={type}
            onChange={(e) => setType(e.target.value as WithdrawType)}
            disabled={submitting}
          >
            <option value="sold_to_us">Манайд зарсан</option>
            <option value="taken_physically">Биетээр авсан</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="verification-code">
            SMS-ээр ирсэн 5 оронтой код
          </Label>
          <Input
            id="verification-code"
            inputMode="text"
            autoComplete="off"
            maxLength={5}
            placeholder="A1B2C"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={submitting}
            className="tracking-[0.4em] text-center font-mono uppercase"
          />
        </div>

        {(formError || showError) && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            {showError ? phase.message : formError}
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Болих
        </Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <BadgeCheck className="h-3.5 w-3.5" />
          )}
          {showError ? "Дахин оролдох" : "Баталгаажуулах"}
        </Button>
      </DialogFooter>
    </>
  );
}
