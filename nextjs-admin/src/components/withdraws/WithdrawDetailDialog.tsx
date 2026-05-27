"use client";

import { useState } from "react";
import {
  Clock,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Info,
  Landmark,
  Package,
  Paperclip,
  ShieldCheck,
  User,
} from "lucide-react";
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
  withdrawTypeText,
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
              {withdraw.withdraw_type && (
                <Row
                  label="Төрөл"
                  value={withdrawTypeText(withdraw.withdraw_type)}
                />
              )}
              {withdraw.notes && (
                <Row label="Тэмдэглэл" value={withdraw.notes} multiline />
              )}
            </Section>

            {(withdraw.bank_name || withdraw.bank_account_number) && (
              <Section
                icon={<Landmark className="h-3.5 w-3.5" />}
                title="Банкны мэдээлэл"
              >
                {withdraw.bank_name && (
                  <Row label="Банк" value={withdraw.bank_name} />
                )}
                {withdraw.bank_account_number && (
                  <Row
                    label="Дансны дугаар"
                    value={withdraw.bank_account_number}
                    mono
                  />
                )}
              </Section>
            )}

            {withdraw.attachments && withdraw.attachments.length > 0 && (
              <AttachmentsSection urls={withdraw.attachments} />
            )}

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

function AttachmentsSection({ urls }: { urls: string[] }) {
  return (
    <section className="rounded-lg border border-border-light bg-card">
      <header className="flex items-center gap-1.5 border-b border-border-light px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        <Paperclip className="h-3.5 w-3.5" />
        Хавсралт ({urls.length})
      </header>
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
        {urls.map((u, i) => (
          <AttachmentTile key={`${u}-${i}`} url={u} index={i} />
        ))}
      </div>
    </section>
  );
}

function AttachmentTile({ url, index }: { url: string; index: number }) {
  const filename = extractFilenameFromUrl(url) || `Файл ${index + 1}`;
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const isImageGuess = ["png", "jpg", "jpeg", "webp", "gif", "heic"].includes(ext);
  const [imgFailed, setImgFailed] = useState(!isImageGuess);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-lg border border-border-light bg-card transition-colors hover:border-primary-500"
      title={filename}
    >
      <div className="relative flex aspect-square w-full items-center justify-center bg-muted/40">
        {!imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={filename}
            className="h-full w-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            {ext === "pdf" ? (
              <FileText className="h-6 w-6" />
            ) : (
              <ImageIcon className="h-6 w-6" />
            )}
            <span className="text-[10px] uppercase tracking-wide">
              {ext || "файл"}
            </span>
          </div>
        )}
        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-md bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
          <ExternalLink className="h-3 w-3" />
        </span>
      </div>
      <div className="truncate border-t border-border-light px-2 py-1 text-[10px] text-muted-foreground">
        {filename}
      </div>
    </a>
  );
}

function extractFilenameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\/o\/(.+)$/);
    if (!m) return "";
    const decoded = decodeURIComponent(m[1]);
    const parts = decoded.split("/");
    return parts[parts.length - 1] || "";
  } catch {
    return "";
  }
}
