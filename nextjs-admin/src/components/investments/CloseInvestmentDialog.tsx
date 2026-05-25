"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
  XCircle,
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
import {
  closeInvestment,
  uploadContractFile,
  type CloseInvestmentResponse,
} from "@/lib/api/investmentActions";
import type { Investment } from "@/lib/firestore/investments";
import { getInvestmentUserName } from "@/lib/investments";

type Props = {
  open: boolean;
  investment: Investment | null;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
};

const ALLOWED_EXTS = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
const MAX_BYTES = 10 * 1024 * 1024;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CloseInvestmentDialog({
  open,
  investment,
  onOpenChange,
  onCompleted,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-rose-600" />
            Гэрээ хаах
          </DialogTitle>
        </DialogHeader>
        {investment && (
          <CloseBody
            key={investment.id}
            investment={investment}
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
  | { kind: "uploading"; percent: number }
  | { kind: "submitting" }
  | { kind: "success"; result: CloseInvestmentResponse }
  | { kind: "error"; message: string };

function CloseBody({
  investment,
  onClose,
  onCompleted,
}: {
  investment: Investment;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const [closeDate, setCloseDate] = useState(() => todayIso());
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "form" });

  const handleSubmit = async () => {
    if (!closeDate) {
      setPhase({ kind: "form", error: "Гэрээ хаагдсан огноо оруулна уу." });
      return;
    }
    if (!file) {
      setPhase({ kind: "form", error: "Гэрээний файл оруулна уу." });
      return;
    }
    if (file.size > MAX_BYTES) {
      setPhase({
        kind: "form",
        error: "Файлын хэмжээ 10MB-аас бага байх ёстой.",
      });
      return;
    }

    setPhase({ kind: "uploading", percent: 0 });
    try {
      const url = await uploadContractFile(investment.id, file, (p) =>
        setPhase({ kind: "uploading", percent: p })
      );
      setPhase({ kind: "submitting" });
      const res = await closeInvestment({
        investmentId: investment.id,
        attachFile: url,
        closeDate: new Date(closeDate).toISOString(),
      });
      if (res.success === false) {
        throw new Error(res.error || "Хөрөнгө оруулалт хаахад алдаа гарлаа.");
      }
      setPhase({ kind: "success", result: res });
    } catch (err) {
      setPhase({
        kind: "error",
        message:
          err instanceof Error
            ? err.message
            : "Хөрөнгө оруулалт хаахад алдаа гарлаа.",
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
              {r.message || "Хөрөнгө оруулалт амжилттай хаагдлаа."}
            </span>
          </div>
          {typeof r.closedBalance === "number" && (
            <div className="rounded-lg border border-border-light bg-muted/30 px-3 py-2 text-[12px]">
              <div className="text-muted-foreground">Буцаасан дүн</div>
              <div className="text-[14px] font-semibold text-primary-600">
                {r.closedBalance.toLocaleString()} гр
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onCompleted}>За</Button>
        </DialogFooter>
      </>
    );
  }

  if (phase.kind === "uploading" || phase.kind === "submitting") {
    return (
      <>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[13px] text-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
            {phase.kind === "uploading"
              ? "Файл байршуулж байна…"
              : "API руу хүсэлт илгээж байна…"}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary-500 transition-[width]"
              style={{
                width:
                  phase.kind === "uploading"
                    ? `${Math.round(phase.percent)}%`
                    : "100%",
              }}
            />
          </div>
          {phase.kind === "uploading" && (
            <div className="text-right text-[11px] text-muted-foreground tabular-nums">
              {Math.round(phase.percent)}%
            </div>
          )}
        </div>
      </>
    );
  }

  const formError = phase.kind === "form" ? phase.error : undefined;
  const showError = phase.kind === "error";

  return (
    <>
      <div className="space-y-3">
        <div className="rounded-lg bg-primary-50 px-3 py-2 text-[12px] text-primary-700">
          <div>
            <strong>Хэрэглэгч:</strong> {getInvestmentUserName(investment)}
          </div>
          <div>
            <strong>Хөрөнгө оруулалт:</strong>{" "}
            {investment.balance?.toLocaleString() ?? 0} гр
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="text-[12px] leading-relaxed">
            Хөрөнгө оруулалт хаагдсаны дараа дахин идэвхжүүлэх боломжгүй.
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="close-date">
            Гэрээ хаагдсан огноо <span className="text-rose-600">*</span>
          </Label>
          <Input
            id="close-date"
            type="date"
            value={closeDate}
            onChange={(e) => setCloseDate(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contract-file">
            Гэрээ (файл) <span className="text-rose-600">*</span>
          </Label>
          <label
            htmlFor="contract-file"
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-foreground/20 bg-foreground/[0.04] px-3 py-2 text-[12px] hover:border-primary-300 hover:bg-primary-50/50"
          >
            <Upload className="h-3.5 w-3.5 text-primary-600" />
            {file ? (
              <span className="flex min-w-0 items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{file.name}</span>
                <span className="shrink-0 text-muted-foreground">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">
                Файл сонгох… (PDF, DOC, DOCX, JPG, PNG · 10MB хүртэл)
              </span>
            )}
          </label>
          <input
            id="contract-file"
            type="file"
            accept={ALLOWED_EXTS.join(",")}
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {(formError || showError) && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            {showError ? phase.message : formError}
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Цуцлах
        </Button>
        <Button variant="destructive" onClick={handleSubmit}>
          {showError ? "Дахин оролдох" : "Гэрээ хаах"}
        </Button>
      </DialogFooter>
    </>
  );
}
