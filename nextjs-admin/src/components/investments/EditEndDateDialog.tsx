"use client";

import { useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
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
import {
  updateInvestmentEndDate,
  type Investment,
} from "@/lib/firestore/investments";
import { formatOrderDate } from "@/lib/orders";
import { getInvestmentUserName } from "@/lib/investments";

type Props = {
  open: boolean;
  investment: Investment | null;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
};

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function EditEndDateDialog({
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
            <CalendarClock className="h-4 w-4 text-primary-600" />
            Дуусах хугацаа засах
          </DialogTitle>
        </DialogHeader>
        {investment && (
          <EditEndDateForm
            key={investment.id}
            investment={investment}
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

function EditEndDateForm({
  investment,
  onCancel,
  onCompleted,
}: {
  investment: Investment;
  onCancel: () => void;
  onCompleted: () => void;
}) {
  const current = investment.endDate?.toDate() ?? new Date();
  const [endDate, setEndDate] = useState(() => toIsoDate(current));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    if (!endDate) {
      setError("Огноо сонгоно уу.");
      return;
    }
    const selected = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selected < today) {
      setError("Дуусах огноо өнөөдрөөс хойш байх ёстой.");
      return;
    }

    setSubmitting(true);
    try {
      await updateInvestmentEndDate(investment.id, selected);
      toast.success("Дуусах огноо амжилттай шинэчлэгдлээ.");
      onCompleted();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Дуусах огноог шинэчлэхэд алдаа гарлаа."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-3">
        <div className="rounded-lg border border-border-light bg-muted/30 px-3 py-2 text-[12px]">
          <div className="text-muted-foreground">Хэрэглэгч</div>
          <div className="font-medium">{getInvestmentUserName(investment)}</div>
          <div className="mt-2 text-muted-foreground">Одоогийн дуусах огноо</div>
          <div className="font-medium">{formatOrderDate(investment.endDate)}</div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="end-date">Шинэ дуусах огноо</Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            min={toIsoDate(new Date())}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          Цуцлах
        </Button>
        <Button onClick={handleSave} disabled={submitting}>
          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Засах
        </Button>
      </DialogFooter>
    </>
  );
}
