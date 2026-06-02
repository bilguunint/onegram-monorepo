"use client";

import { useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  ImagePlus,
  Info,
  Loader2,
  ShieldCheck,
  Trash2,
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  verifyWithdraw,
  type VerifyWithdrawResponse,
  type WithdrawType,
} from "@/lib/api/withdrawActions";
import {
  uploadWithdrawAttachment,
  WITHDRAW_ATTACHMENT_ACCEPT,
  WITHDRAW_ATTACHMENT_MAX_BYTES,
  WITHDRAW_ATTACHMENT_MAX_COUNT,
} from "@/lib/api/withdrawAttachments";
import { BANKS } from "@/lib/banks";
import type { Withdraw } from "@/lib/firestore/withdraws";
import { formatQuantity } from "@/lib/orders";
import { getWithdrawClientName, withdrawTypeText } from "@/lib/withdraws";

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

function VerifyBody({
  withdraw,
  onClose,
  onCompleted,
}: {
  withdraw: Withdraw;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const initialType: WithdrawType | "" =
    withdraw.withdraw_type === "sold_to_us" ||
    withdraw.withdraw_type === "taken_physically"
      ? withdraw.withdraw_type
      : "";

  const [withdrawType, setWithdrawType] = useState<WithdrawType | "">(
    initialType
  );
  const [code, setCode] = useState("");
  const [bankCode, setBankCode] = useState<string>(
    BANKS.find((b) => b.name === withdraw.bank_name)?.code ?? ""
  );
  const [bankAccount, setBankAccount] = useState(
    withdraw.bank_account_number ?? ""
  );
  const [notes, setNotes] = useState(withdraw.notes ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<VerifyWithdrawResponse | null>(null);

  const handleAddFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming);
    const allowed: File[] = [];
    for (const f of arr) {
      if (files.length + allowed.length >= WITHDRAW_ATTACHMENT_MAX_COUNT) break;
      if (f.size > WITHDRAW_ATTACHMENT_MAX_BYTES) {
        setError(`${f.name}: файл 10MB-аас бага байх ёстой.`);
        continue;
      }
      const isImg = f.type.startsWith("image/");
      const isPdf = f.type === "application/pdf";
      if (!isImg && !isPdf) {
        setError(`${f.name}: зөвхөн зураг эсвэл PDF дэмжинэ.`);
        continue;
      }
      allowed.push(f);
    }
    if (allowed.length > 0) setFiles((prev) => [...prev, ...allowed]);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    const trimmedCode = code.trim().toUpperCase();
    setError(null);
    if (!trimmedCode) {
      setError("Баталгаажуулах код оруулна уу.");
      return;
    }
    if (trimmedCode.length !== 5) {
      setError("Код 5 оронтой байх ёстой.");
      return;
    }
    if (!/^[A-Z0-9]+$/.test(trimmedCode)) {
      setError("Код тоо болон үсгээс бүрдэх ёстой.");
      return;
    }

    const t = withdrawType;
    if (t !== "sold_to_us" && t !== "taken_physically") {
      setError("Хүсэлтийн төрлийг сонгоно уу.");
      return;
    }
    if (t === "sold_to_us") {
      if (!bankCode) {
        setError("Банкаа сонгоно уу.");
        return;
      }
      if (!bankAccount.trim()) {
        setError("Дансны дугаарыг бичнэ үү.");
        return;
      }
    }
    if (t === "taken_physically" && !notes.trim()) {
      setError("Тайлбар бичнэ үү.");
      return;
    }

    setSubmitting(true);
    try {
      const attachments: string[] = [];
      for (const f of files) {
        const url = await uploadWithdrawAttachment(withdraw.id, f);
        attachments.push(url);
      }

      const selectedBank = BANKS.find((b) => b.code === bankCode);
      const res = await verifyWithdraw({
        verificationCode: trimmedCode,
        withdrawId: withdraw.id,
        withdrawType: t,
        bankName: t === "sold_to_us" ? selectedBank?.name : undefined,
        bankAccountNumber: t === "sold_to_us" ? bankAccount.trim() : undefined,
        notes: notes.trim() || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      setDone(res);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Баталгаажуулахад алдаа гарлаа."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <>
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="text-[13px] font-medium">
              Хүсэлт амжилттай баталгаажлаа.
            </span>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 rounded-lg border border-border-light bg-muted/30 p-3 text-[12px]">
            <dt className="text-muted-foreground">Харилцагч</dt>
            <dd className="font-medium">{getWithdrawClientName(withdraw)}</dd>
            <dt className="text-muted-foreground">Тоо хэмжээ</dt>
            <dd className="font-medium">
              {formatQuantity(withdraw.metal_id, withdraw.quantity)}
            </dd>
            <dt className="text-muted-foreground">Төрөл</dt>
            <dd className="font-medium">
              {withdrawTypeText(withdrawType || withdraw.withdraw_type)}
            </dd>
          </dl>
        </div>
        <DialogFooter>
          <Button onClick={onCompleted}>Хаах</Button>
        </DialogFooter>
      </>
    );
  }

  const t = withdrawType;

  return (
    <>
      <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
        <div className="flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-[12px] text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>
            {getWithdrawClientName(withdraw)} —{" "}
            {formatQuantity(withdraw.metal_id, withdraw.quantity)}
          </span>
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
            className="h-12 text-center text-lg font-mono uppercase tracking-[0.4em]"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Хүсэлтийн төрөл</Label>
          <div className="grid grid-cols-2 gap-2">
            <TypeChoice
              active={t === "sold_to_us"}
              disabled={submitting}
              label="Манайд зарсан"
              description="Банкны данс руу шилжүүлнэ"
              onClick={() => setWithdrawType("sold_to_us")}
            />
            <TypeChoice
              active={t === "taken_physically"}
              disabled={submitting}
              label="Биетээр авсан"
              description="Бэлнээр хүлээлгэн өгсөн"
              onClick={() => setWithdrawType("taken_physically")}
            />
          </div>
        </div>

        {t === "sold_to_us" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="verify-bank">Банк</Label>
              <Select
                id="verify-bank"
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                disabled={submitting}
              >
                <option value="">Сонгоно уу...</option>
                {BANKS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="verify-account">Дансны дугаар</Label>
              <Input
                id="verify-account"
                inputMode="numeric"
                value={bankAccount}
                onChange={(e) =>
                  setBankAccount(e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="0000000000"
                disabled={submitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="verify-notes">Тайлбар (заавал биш)</Label>
              <Textarea
                id="verify-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Тайлбар..."
                rows={2}
                disabled={submitting}
              />
            </div>
          </>
        )}

        {t === "taken_physically" && (
          <div className="space-y-1.5">
            <Label htmlFor="verify-notes">Тайлбар</Label>
            <Textarea
              id="verify-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Хэдийг, хаана, хэн авсан гэх мэт..."
              rows={3}
              disabled={submitting}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Хавсралт (зураг/PDF)</Label>
          <div className="grid grid-cols-2 gap-2">
            <label
              className={cn(
                "flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-border-light bg-foreground/[0.02] text-[12px] font-medium hover:bg-foreground/[0.05]",
                (submitting ||
                  files.length >= WITHDRAW_ATTACHMENT_MAX_COUNT) &&
                  "pointer-events-none opacity-50"
              )}
            >
              <ImagePlus className="h-3.5 w-3.5" />
              Зураг авах
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  handleAddFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            <label
              className={cn(
                "flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-border-light bg-foreground/[0.02] text-[12px] font-medium hover:bg-foreground/[0.05]",
                (submitting ||
                  files.length >= WITHDRAW_ATTACHMENT_MAX_COUNT) &&
                  "pointer-events-none opacity-50"
              )}
            >
              <ImagePlus className="h-3.5 w-3.5" />
              Файл сонгох
              <input
                type="file"
                accept={WITHDRAW_ATTACHMENT_ACCEPT}
                multiple
                className="hidden"
                onChange={(e) => {
                  handleAddFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          {files.length > 0 && (
            <ul className="space-y-1">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-2 rounded-md border border-border-light bg-card px-2 py-1 text-[11px]"
                >
                  <span className="truncate flex-1">{f.name}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {Math.round(f.size / 1024)} KB
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    disabled={submitting}
                    className="text-rose-600 hover:text-rose-700 disabled:opacity-50"
                    aria-label="Хасах"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[10px] text-muted-foreground">
            Хамгийн ихдээ {WITHDRAW_ATTACHMENT_MAX_COUNT} файл, нэг файл 10MB-аас
            бага.
          </p>
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
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <BadgeCheck className="h-3.5 w-3.5" />
          )}
          Баталгаажуулах
        </Button>
      </DialogFooter>
    </>
  );
}

function TypeChoice({
  active,
  disabled,
  label,
  description,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors",
        active
          ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300"
          : "border-border-light bg-card hover:border-foreground/30",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <span className="text-[13px] font-medium">{label}</span>
      <span className="text-[10px] text-muted-foreground">{description}</span>
    </button>
  );
}
