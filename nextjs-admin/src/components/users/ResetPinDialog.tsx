"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resetUserPin, type ResetPinResponse } from "@/lib/api/userActions";
import type { AdminUser } from "@/lib/firestore/users";
import { getFullName, formatTimestamp } from "@/lib/users";

type Props = {
  open: boolean;
  user: AdminUser | null;
  onOpenChange: (open: boolean) => void;
};

export function ResetPinDialog({ open, user, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-rose-600" />
            Пинкод reset хийх
          </DialogTitle>
        </DialogHeader>
        {user && (
          <ResetPinBody
            key={user.id}
            user={user}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type Status = "confirm" | "submitting" | "success" | "error";

function ResetPinBody({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const [status, setStatus] = useState<Status>("confirm");
  const [result, setResult] = useState<ResetPinResponse["data"] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleConfirm = async () => {
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await resetUserPin(user.id);
      if (res.status !== "success") {
        throw new Error(res.msg || "Үл мэдэгдэх алдаа");
      }
      setResult(res.data ?? null);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Алдаа гарлаа.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <>
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="text-[13px] font-medium">
              Пинкод амжилттай reset хийгдлээ.
            </span>
          </div>
          {result && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 rounded-lg border border-border-light bg-muted/30 p-3 text-[12px]">
              <dt className="text-muted-foreground">Хэрэглэгч</dt>
              <dd className="font-medium">{result.userPhone}</dd>
              <dt className="text-muted-foreground">Reset хийсэн</dt>
              <dd className="font-medium">{result.resetBy}</dd>
              <dt className="text-muted-foreground">Эрх</dt>
              <dd className="font-medium">{result.resetByRole}</dd>
              <dt className="text-muted-foreground">Огноо</dt>
              <dd className="font-medium">{formatTimestamp(result.resetAt)}</dd>
            </dl>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Хаах</Button>
        </DialogFooter>
      </>
    );
  }

  const submitting = status === "submitting";

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="text-[12px] leading-relaxed">
            Та <strong>{getFullName(user)}</strong>-н пинкодыг reset хийх гэж
            байна. Энэ үйлдлийг буцаах боломжгүй.
          </div>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 rounded-lg border border-border-light bg-card p-3 text-[12px]">
          <dt className="text-muted-foreground">Утас</dt>
          <dd className="font-medium">{user.phone || "Байхгүй"}</dd>
          <dt className="text-muted-foreground">И-мэйл</dt>
          <dd className="font-medium">{user.email || "Байхгүй"}</dd>
          <dt className="text-muted-foreground">ID</dt>
          <dd className="truncate font-medium">{user.id}</dd>
        </dl>
        {status === "error" && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            {errorMsg}
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Цуцлах
        </Button>
        <Button
          variant="destructive"
          onClick={handleConfirm}
          disabled={submitting}
        >
          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {status === "error" ? "Дахин оролдох" : "Тийм, reset хий"}
        </Button>
      </DialogFooter>
    </>
  );
}
