"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock,
  ImagePlus,
  Info,
  Loader2,
  Package,
  Search,
  ShieldCheck,
  Trash2,
  User,
  X,
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
  findWithdrawByVerificationCode,
  type Withdraw,
} from "@/lib/firestore/withdraws";
import {
  formatMNT0,
  formatOrderDate,
  formatQuantity,
  metalLabel,
} from "@/lib/orders";
import {
  getWithdrawClientName,
  withdrawTypeText,
} from "@/lib/withdraws";

const SELLER_CODE_VALID_MINUTES = 15;

function isWithdrawCodeExpiredForSeller(
  createdAt: { toDate: () => Date } | null | undefined
): boolean {
  if (!createdAt) return true;
  const ageMs = Date.now() - createdAt.toDate().getTime();
  return ageMs > SELLER_CODE_VALID_MINUTES * 60 * 1000;
}
import { verifyWithdraw, type WithdrawType } from "@/lib/api/withdrawActions";
import {
  uploadWithdrawAttachment,
  WITHDRAW_ATTACHMENT_ACCEPT,
  WITHDRAW_ATTACHMENT_MAX_BYTES,
  WITHDRAW_ATTACHMENT_MAX_COUNT,
} from "@/lib/api/withdrawAttachments";
import { BANKS } from "@/lib/banks";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SellerVerifyDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary-600" />
            Биетээр авах хүсэлт баталгаажуулах
          </DialogTitle>
        </DialogHeader>
        {open && <Body onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

type Step = "code" | "review" | "form" | "done";

function Body({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [withdraw, setWithdraw] = useState<Withdraw | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [withdrawType, setWithdrawType] = useState<WithdrawType | "">("");
  const [bankCode, setBankCode] = useState<string>("");
  const [bankAccount, setBankAccount] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const handleSearch = async () => {
    const trimmed = code.trim().toUpperCase();
    setError(null);
    if (!trimmed) {
      setError("Кодыг оруулна уу.");
      return;
    }
    if (trimmed.length !== 5) {
      setError("Код 5 оронтой байх ёстой.");
      return;
    }
    if (!/^[A-Z0-9]+$/.test(trimmed)) {
      setError("Код зөвхөн үсэг болон тооноос бүрдэх ёстой.");
      return;
    }
    setSearching(true);
    try {
      const w = await findWithdrawByVerificationCode(trimmed);
      if (!w) {
        setError("Энэ кодтой хүсэлт олдсонгүй.");
        return;
      }
      if (w.status === "verified" || w.verificationCodeUsed) {
        setError("Энэ хүсэлт аль хэдийн баталгаажсан байна.");
        return;
      }
      if (isWithdrawCodeExpiredForSeller(w.created_at)) {
        setError("Код идэвхжүүлэх хугацаа дууссан байна.");
        return;
      }
      setWithdraw(w);
      const t = w.withdraw_type;
      if (t === "sold_to_us" || t === "taken_physically") {
        setWithdrawType(t);
      } else {
        setWithdrawType("");
      }
      setStep("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Хайхад алдаа гарлаа.");
    } finally {
      setSearching(false);
    }
  };

  const handleProceedToForm = () => {
    if (!withdraw) return;
    setError(null);
    setStep("form");
  };

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
    if (!withdraw) return;
    const t = withdrawType;
    setError(null);

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
      await verifyWithdraw({
        verificationCode: code.trim().toUpperCase(),
        withdrawId: withdraw.id,
        withdrawType: t as WithdrawType,
        bankName: t === "sold_to_us" ? selectedBank?.name : undefined,
        bankAccountNumber:
          t === "sold_to_us" ? bankAccount.trim() : undefined,
        notes: notes.trim() || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Баталгаажуулахад алдаа гарлаа.");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "done" && withdraw) {
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
          <Button onClick={onClose}>Хаах</Button>
        </DialogFooter>
      </>
    );
  }

  if (step === "form" && withdraw) {
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
                <Label htmlFor="seller-bank">Банк</Label>
                <Select
                  id="seller-bank"
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
                <Label htmlFor="seller-account">Дансны дугаар</Label>
                <Input
                  id="seller-account"
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
                <Label htmlFor="seller-notes">Тайлбар (заавал биш)</Label>
                <Textarea
                  id="seller-notes"
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
              <Label htmlFor="seller-notes">Тайлбар</Label>
              <Textarea
                id="seller-notes"
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
              Хамгийн ихдээ {WITHDRAW_ATTACHMENT_MAX_COUNT} файл, нэг файл 10MB-аас бага.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setStep("review");
              setError(null);
            }}
            disabled={submitting}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Буцах
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

  if (step === "review" && withdraw) {
    return (
      <>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="text-[12px] leading-relaxed">
              Доорх хүсэлтийг сайн нягтлаад баталгаажуулна уу.
            </div>
          </div>

          <Section icon={<User className="h-3.5 w-3.5" />} title="Харилцагч">
            <Row label="Нэр" value={getWithdrawClientName(withdraw)} />
            <Row label="Утас" value={withdraw.client?.phone || "Байхгүй"} />
          </Section>

          <Section icon={<Package className="h-3.5 w-3.5" />} title="Хүсэлт">
            <Row label="Металл" value={metalLabel(withdraw.metal_id)} />
            <Row
              label="Тоо хэмжээ"
              value={formatQuantity(withdraw.metal_id, withdraw.quantity)}
            />
            {typeof withdraw.price === "number" && (
              <Row label="Үнэ" value={formatMNT0(withdraw.price)} />
            )}
            {withdraw.notes && (
              <Row label="Тэмдэглэл" value={withdraw.notes} multiline />
            )}
          </Section>

          <Section icon={<Clock className="h-3.5 w-3.5" />} title="Огноо">
            <Row label="Үүсгэсэн" value={formatOrderDate(withdraw.created_at)} />
          </Section>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setStep("code");
              setWithdraw(null);
              setError(null);
            }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Буцах
          </Button>
          <Button onClick={handleProceedToForm}>
            <BadgeCheck className="h-3.5 w-3.5" />
            Баталгаажуулах
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="seller-code">5 оронтой код</Label>
          <Input
            id="seller-code"
            inputMode="text"
            autoComplete="off"
            maxLength={5}
            placeholder="A1B2C"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={searching}
            autoFocus
            className="h-12 text-center text-lg font-mono uppercase tracking-[0.4em]"
          />
        </div>
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={searching}>
          <X className="h-3.5 w-3.5" />
          Болих
        </Button>
        <Button onClick={handleSearch} disabled={searching}>
          {searching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
          Хайх
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

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border-light bg-card">
      <header className="flex items-center gap-1.5 border-b border-border-light px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {icon}
        {title}
      </header>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 p-3 text-[12px]">
        {children}
      </dl>
    </section>
  );
}

function Row({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-foreground",
          multiline ? "whitespace-pre-wrap" : "truncate"
        )}
      >
        {value}
      </dd>
    </>
  );
}
