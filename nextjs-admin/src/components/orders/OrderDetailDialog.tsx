"use client";

import { CheckCircle2, Clock, FileText, Info, Package, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Order } from "@/lib/firestore/orders";
import {
  formatMNT0,
  formatMNT2,
  formatOrderDate,
  formatQuantity,
  getClientName,
  getProductTypeName,
  metalLabel,
} from "@/lib/orders";

type Props = {
  open: boolean;
  order: Order | null;
  onOpenChange: (open: boolean) => void;
};

export function OrderDetailDialog({ open, order, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary-600" />
            Захиалгын дэлгэрэнгүй
          </DialogTitle>
        </DialogHeader>
        {order && (
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            <Section icon={<User className="h-3.5 w-3.5" />} title="Харилцагч">
              <Row label="Нэр" value={getClientName(order)} />
              <Row label="Утас" value={order.client?.phone || "Байхгүй"} />
              <Row label="И-мэйл" value={order.client?.email || "Байхгүй"} />
            </Section>

            <Section icon={<Package className="h-3.5 w-3.5" />} title="Захиалгын мэдээлэл">
              <Row label="Захиалгын ID" value={order.id} mono />
              <Row label="Бүтээгдэхүүн" value={getProductTypeName(order.prod_type)} />
              <Row label="Металл" value={metalLabel(order.metal_id)} />
              <Row label="Тоо хэмжээ" value={formatQuantity(order.metal_id, order.quantity)} />
              <Row label="Үнэ" value={formatMNT2(order.price)} />
              <Row label="Нийт дүн" value={formatMNT0(order.amount)} strong />
            </Section>

            <Section icon={<CheckCircle2 className="h-3.5 w-3.5" />} title="Баталгаажуулалт">
              <Row label="Огноо" value={formatOrderDate(order.verified_at)} />
              <Row label="Админ" value={order.verified_by_name || "Тодорхойгүй"} />
              <Row label="Админ ID" value={order.verified_by_uid || "Байхгүй"} mono />
            </Section>

            <Section icon={<Clock className="h-3.5 w-3.5" />} title="Огнооны мэдээлэл">
              <Row label="Үүсгэсэн" value={formatOrderDate(order.created_at)} />
              <Row label="QPay" value={order.qpay_description || "Байхгүй"} />
              {order.description && (
                <Row label="Тайлбар" value={order.description} multiline />
              )}
            </Section>

            {order.is_extraOrder && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                <FileText className="mt-0.5 h-3.5 w-3.5" />
                <span>Энэ нь онцгой захиалга.</span>
              </div>
            )}
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
  strong,
  multiline,
}: {
  label: string;
  value: string;
  mono?: boolean;
  strong?: boolean;
  multiline?: boolean;
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={[
          "text-foreground",
          mono ? "font-mono text-[11px]" : "",
          strong ? "font-semibold" : "",
          multiline ? "whitespace-pre-wrap" : "truncate",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </dd>
    </>
  );
}
