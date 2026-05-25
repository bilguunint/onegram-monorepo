"use client";

import { Clock, Info, Package, ShieldCheck, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Withdraw } from "@/lib/firestore/withdraws";
import { formatOrderDate, formatQuantity, metalLabel } from "@/lib/orders";
import {
  getWithdrawClientName,
  verificationStatusBadge,
  verificationStatusText,
  withdrawStatusBadge,
  withdrawStatusText,
} from "@/lib/withdraws";

type Props = {
  open: boolean;
  withdraw: Withdraw | null;
  onOpenChange: (open: boolean) => void;
};

export function WithdrawDetailDialog({ open, withdraw, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary-600" />
            Биетээр авах хүсэлтийн дэлгэрэнгүй
          </DialogTitle>
        </DialogHeader>
        {withdraw && (
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            <Section icon={<User className="h-3.5 w-3.5" />} title="Харилцагч">
              <Row label="Нэр" value={getWithdrawClientName(withdraw)} />
              <Row label="Утас" value={withdraw.client?.phone || "Байхгүй"} />
              <Row label="И-мэйл" value={withdraw.client?.email || "Байхгүй"} />
              <Row label="Хэрэглэгчийн ID" value={withdraw.user_id || "Байхгүй"} mono />
            </Section>

            <Section icon={<Package className="h-3.5 w-3.5" />} title="Хүсэлт">
              <Row label="ID" value={withdraw.id} mono />
              <Row label="Металл" value={metalLabel(withdraw.metal_id)} />
              <Row
                label="Тоо хэмжээ"
                value={formatQuantity(withdraw.metal_id, withdraw.quantity)}
              />
              <Row label="Төлөв" badge={withdrawStatusBadge(withdraw.status)}>
                {withdrawStatusText(withdraw.status)}
              </Row>
              {withdraw.notes && (
                <Row label="Тэмдэглэл" value={withdraw.notes} multiline />
              )}
            </Section>

            <Section icon={<ShieldCheck className="h-3.5 w-3.5" />} title="Баталгаажуулалт">
              <Row label="Код" value={withdraw.verificationCode || "Байхгүй"} mono />
              <Row
                label="Код дуусах"
                value={formatOrderDate(withdraw.verificationCodeExpiresAt)}
              />
              <Row
                label="Код ашигласан"
                value={withdraw.verificationCodeUsed ? "Тийм" : "Үгүй"}
              />
              <Row
                label="Баталгаажуулалт"
                badge={verificationStatusBadge(withdraw)}
              >
                {verificationStatusText(withdraw)}
              </Row>
              <Row label="Админ" value={withdraw.verified_by_name || "Байхгүй"} />
              <Row label="Админ ID" value={withdraw.verified_by_uid || "Байхгүй"} mono />
            </Section>

            <Section icon={<Clock className="h-3.5 w-3.5" />} title="Огноо">
              <Row label="Үүсгэсэн" value={formatOrderDate(withdraw.created_at)} />
              <Row label="Шинэчилсэн" value={formatOrderDate(withdraw.updated_at)} />
              <Row label="Баталгаажуулсан" value={formatOrderDate(withdraw.verified_at)} />
            </Section>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Хаах
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  mono,
  multiline,
  badge,
  children,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  multiline?: boolean;
  badge?: string;
  children?: React.ReactNode;
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-foreground",
          mono && "font-mono text-[11px]",
          multiline ? "whitespace-pre-wrap" : "truncate"
        )}
      >
        {badge ? (
          <span
            className={cn(
              "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
              badge
            )}
          >
            {children}
          </span>
        ) : (
          (children ?? value)
        )}
      </dd>
    </>
  );
}
