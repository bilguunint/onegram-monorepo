"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
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
import { Select } from "@/components/ui/select";
import { ROLE_LABEL_MN, VALID_ROLES, type AdminRole } from "@/lib/auth/roles";
import { createAdmin } from "@/lib/api/adminActions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

export function AddAdminDialog({ open, onOpenChange, onCreated }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary-600" />
            Шинэ admin нэмэх
          </DialogTitle>
        </DialogHeader>
        {open && (
          <AddAdminBody
            onClose={() => onOpenChange(false)}
            onCreated={onCreated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AddAdminBody({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("manager");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await createAdmin({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      toast.success("Admin амжилттай нэмэгдлээ.");
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа.");
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="admin-name">Нэр</Label>
          <Input
            id="admin-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Хулан"
            disabled={submitting}
            autoComplete="off"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-email">И-мэйл</Label>
          <Input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hulan@onegram.mn"
            disabled={submitting}
            autoComplete="off"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-password">Нууц үг</Label>
          <div className="relative">
            <Input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Хамгийн багадаа 6 тэмдэгт"
              disabled={submitting}
              autoComplete="new-password"
              className="pr-9"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Нууц үг нуух" : "Нууц үг харуулах"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-role">Эрх</Label>
          <Select
            id="admin-role"
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
            disabled={submitting}
          >
            {VALID_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL_MN[r]} ({r})
              </option>
            ))}
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Цуцлах
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Нэмэх
        </Button>
      </DialogFooter>
    </>
  );
}
