"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { resetAdminPassword, type AdminListItem } from "@/lib/api/adminActions";

type Props = {
  admin: AdminListItem | null;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
};

export function ResetPasswordDialog({ admin, onOpenChange, onDone }: Props) {
  return (
    <Dialog open={!!admin} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary-600" />
            Нууц үг шинэчлэх
          </DialogTitle>
        </DialogHeader>
        {admin && (
          <ResetPasswordBody
            admin={admin}
            onClose={() => onOpenChange(false)}
            onDone={onDone}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordBody({
  admin,
  onClose,
  onDone,
}: {
  admin: AdminListItem;
  onClose: () => void;
  onDone: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = password.length >= 6 && password === confirm && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await resetAdminPassword(admin.uid, password);
      toast.success(`${admin.name || admin.email}-ийн нууц үг шинэчлэгдлээ.`);
      onDone();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа.");
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-3">
        <p className="text-[12px] text-muted-foreground">
          <strong className="text-foreground">{admin.name || "—"}</strong>{" "}
          ({admin.email}) бүртгэлд шинэ нууц үг тавина. Тухайн админы нэвтэрсэн
          бусад төхөөрөмжүүд гарна.
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="reset-password">Шинэ нууц үг</Label>
          <div className="relative">
            <Input
              id="reset-password"
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Хамгийн багадаа 6 тэмдэгт"
              disabled={submitting}
              autoComplete="new-password"
              className="pr-9"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              tabIndex={-1}
              className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={show ? "Нууц үг нуух" : "Нууц үг харуулах"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reset-password-confirm">Шинэ нууц үг давтах</Label>
          <Input
            id="reset-password-confirm"
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={submitting}
            autoComplete="new-password"
            aria-invalid={mismatch}
          />
          {mismatch && (
            <p className="text-[11px] text-rose-600">Нууц үг таарахгүй байна.</p>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Цуцлах
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Шинэчлэх
        </Button>
      </DialogFooter>
    </>
  );
}
