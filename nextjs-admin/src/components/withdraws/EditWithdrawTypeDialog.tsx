"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BANKS } from "@/lib/banks";
import { withdrawTypeText } from "@/lib/withdraws";
import { type Withdraw } from "@/lib/firestore/withdraws";
import {
  updateWithdrawType,
  type WithdrawType,
} from "@/lib/api/withdrawActions";

type Props = {
  open: boolean;
  withdraw: Withdraw | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

/** Corrects a withdraw recorded under the wrong type, in either direction. */
export function EditWithdrawTypeDialog({
  open,
  withdraw,
  onOpenChange,
  onSaved,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Хүсэлтийн төрөл засах</DialogTitle>
        </DialogHeader>
        {open && withdraw && (
          <Body
            key={withdraw.id}
            withdraw={withdraw}
            onCancel={() => onOpenChange(false)}
            onSaved={() => {
              onOpenChange(false);
              onSaved();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Body({
  withdraw,
  onCancel,
  onSaved,
}: {
  withdraw: Withdraw;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const current = withdraw.withdraw_type;
  // Default to the opposite type — correcting is the whole reason to be here.
  const [type, setType] = useState<WithdrawType>(
    current === "sold_to_us" ? "taken_physically" : "sold_to_us"
  );
  const [bankCode, setBankCode] = useState("");
  const [bankAccount, setBankAccount] = useState(
    withdraw.bank_account_number ?? ""
  );
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Preselect the bank the record already carries, matched by name.
  useEffect(() => {
    const b = BANKS.find((x) => x.name === withdraw.bank_name);
    if (b) setBankCode(b.code);
  }, [withdraw.bank_name]);

  const unchanged = type === current;

  const submit = async () => {
    if (unchanged) return;
    setSaving(true);
    try {
      await updateWithdrawType({
        withdrawId: withdraw.id,
        withdrawType: type,
        bankName: BANKS.find((b) => b.code === bankCode)?.name,
        bankAccountNumber: bankAccount,
        notes,
      });
      toast.success("Төрөл шинэчлэгдлээ.");
      onSaved();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Хадгалахад алдаа гарлаа."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-3">
        <div className="rounded-lg border border-border-light bg-muted/40 px-3 py-2 text-[12px]">
          Одоогийн төрөл:{" "}
          <span className="font-medium text-foreground">
            {withdrawTypeText(current)}
          </span>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="wt-type">Шинэ төрөл</Label>
          <Select
            id="wt-type"
            value={type}
            onChange={(e) => setType(e.target.value as WithdrawType)}
          >
            <option value="taken_physically">Биетээр авсан</option>
            <option value="sold_to_us">Манайд зарсан</option>
          </Select>
        </div>

        {type === "sold_to_us" ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="wt-bank">Банк</Label>
              <Select
                id="wt-bank"
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
              >
                <option value="">— Сонгох —</option>
                {BANKS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wt-acc">Дансны дугаар</Label>
              <Input
                id="wt-acc"
                inputMode="numeric"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
              />
            </div>
          </>
        ) : (
          withdraw.bank_name && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              Биетээр авсан болгоход бүртгэлтэй банкны мэдээлэл
              ({withdraw.bank_name}) устгагдана.
            </div>
          )
        )}

        <div className="space-y-1.5">
          <Label htmlFor="wt-notes">Тайлбар (заавал биш)</Label>
          <Textarea
            id="wt-notes"
            rows={2}
            placeholder="Яагаад засаж байгаа шалтгаан"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Болих
        </Button>
        <Button onClick={() => void submit()} disabled={saving || unchanged}>
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Хадгалах
        </Button>
      </DialogFooter>
    </>
  );
}
