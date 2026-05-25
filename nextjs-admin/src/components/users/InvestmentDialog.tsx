"use client";

import { useState } from "react";
import { Info, Loader2, Wallet } from "lucide-react";
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
import { makeInvestment } from "@/lib/api/userActions";
import type { AdminUser } from "@/lib/firestore/users";

type Props = {
  open: boolean;
  user: AdminUser | null;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
};

function todayPlusDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function InvestmentDialog({ open, user, onOpenChange, onCompleted }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary-600" />
            Хөрөнгө оруулалт
          </DialogTitle>
        </DialogHeader>
        {user && (
          <InvestmentForm
            key={user.id}
            user={user}
            onCancel={() => onOpenChange(false)}
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

type FormProps = {
  user: AdminUser;
  onCancel: () => void;
  onCompleted: () => void;
};

function InvestmentForm({ user, onCancel, onCompleted }: FormProps) {
  const [amount, setAmount] = useState<string>("");
  const [endDate, setEndDate] = useState<string>(() => todayPlusDaysIso(30));
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    const quantity = Number(amount);
    if (!user.id || !Number.isFinite(quantity) || quantity <= 0) {
      toast.error("Бүх талбарыг зөв бөглөнө үү.");
      return;
    }
    if (!endDate) {
      toast.error("Дуусах огноог сонгоно уу.");
      return;
    }
    const end = new Date(endDate);
    if (Number.isNaN(end.getTime()) || end <= new Date()) {
      toast.error("Дуусах огноо ирээдүйд байх ёстой.");
      return;
    }

    setSubmitting(true);
    const t = toast.loading("Хөрөнгө оруулалт үүсгэж байна…");
    try {
      const res = await makeInvestment({
        userId: user.id,
        quantity,
        endDate: end.toISOString(),
      });
      if (res.status !== "success") {
        throw new Error(res.msg || "Үл мэдэгдэх алдаа");
      }
      toast.success("Хөрөнгө оруулалт амжилттай үүсгэгдлээ.", {
        id: t,
        description: res.data
          ? `Шинэ алтны үлдэгдэл: ${res.data.newGoldBalance} гр`
          : undefined,
      });
      onCompleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа.", {
        id: t,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-lg bg-primary-50 px-3 py-2 text-[12px] text-primary-700">
          <div className="font-medium">Хэрэглэгчийн мэдээлэл</div>
          <div className="mt-0.5">
            Та <strong>{user.last_name || ""}</strong> овогтой{" "}
            <strong>{user.first_name || ""}</strong>-н хөрөнгө оруулалтыг нэмэх
            гэж байна.
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] opacity-90">
            <span>
              <strong>И-мэйл:</strong> {user.email || "Байхгүй"}
            </span>
            <span>
              <strong>Утас:</strong> {user.phone || "Байхгүй"}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="investment-amount">Хөрөнгө оруулах хэмжээ</Label>
          <div className="flex items-stretch overflow-hidden rounded-lg border border-foreground/15 bg-foreground/[0.04] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40 focus-within:bg-card">
            <Input
              id="investment-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.001"
              placeholder="Дүн оруулна уу"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 rounded-none border-0 bg-transparent focus-visible:border-0 focus-visible:bg-transparent focus-visible:ring-0"
            />
            <span className="flex items-center border-l border-foreground/15 bg-foreground/[0.06] px-3 text-[12px] text-muted-foreground">
              гр
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="investment-end-date">Дуусах огноо</Label>
          <Input
            id="investment-end-date"
            type="date"
            value={endDate}
            min={todayPlusDaysIso(1)}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Хөрөнгө оруулалт нь хэрэглэгчийн нийт хөрөнгө оруулалтад нэмэгдэнэ.
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          Цуцлах
        </Button>
        <Button onClick={handleSave} disabled={submitting}>
          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Хадгалах
        </Button>
      </DialogFooter>
    </>
  );
}
