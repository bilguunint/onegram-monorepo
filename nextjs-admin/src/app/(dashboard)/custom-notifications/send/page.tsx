"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronLeft, Loader2, Plus, Send, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { sendCustomNotification } from "@/lib/api/notificationActions";

type NotificationType = "custom" | "promotion";

const MAX_BODY = 500;

export default function SendCustomNotificationPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<NotificationType>("custom");
  const [sendToAll, setSendToAll] = useState(true);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [userIdInput, setUserIdInput] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const titleError = submitted && !title.trim() ? "Гарчиг оруулна уу." : "";
  const bodyError = submitted && !body.trim() ? "Агуулга бичнэ үү." : "";

  const handleAddUserId = () => {
    const id = userIdInput.trim();
    if (!id) return;
    if (userIds.includes(id)) {
      toast.warning("Энэ хэрэглэгчийн ID аль хэдийн нэмэгдсэн байна.");
      return;
    }
    setUserIds((prev) => [...prev, id]);
    setUserIdInput("");
  };

  const handleRemoveUserId = (id: string) => {
    setUserIds((prev) => prev.filter((u) => u !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!title.trim() || !body.trim()) {
      toast.error("Бүх шаардлагатай талбаруудыг бөглөнө үү.");
      return;
    }
    if (!sendToAll && userIds.length === 0) {
      toast.error("Хамгийн багадаа 1 хэрэглэгчийн ID нэмнэ үү.");
      return;
    }

    setSubmitting(true);
    const t = toast.loading("Мэдэгдэл илгээж байна…");
    try {
      await sendCustomNotification({
        title: title.trim(),
        body: body.trim(),
        type,
        ...(sendToAll ? {} : { userIds }),
      });
      toast.success("Мэдэгдэл амжилттай илгээгдлээ.", { id: t });
      router.push("/custom-notifications");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа.", {
        id: t,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const bodyCount = useMemo(() => body.length, [body]);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-[18px] font-semibold text-foreground">
            Мэдэгдэл илгээх
          </h1>
          <p className="text-[12px] text-muted-foreground">
            Admin <span className="text-foreground/70">/ </span>
            <Link
              href="/custom-notifications"
              className="text-foreground/70 hover:text-primary-600"
            >
              Мэдэгдэл
            </Link>{" "}
            <span className="text-foreground/70">/ Илгээх</span>
          </p>
        </div>
        <Button
          render={<Link href="/custom-notifications" />}
          variant="outline"
          size="sm"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Буцах
        </Button>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        {/* Main form (2 cols) */}
        <div className="space-y-4 lg:col-span-2">
          {/* Title card */}
          <FormCard title="Мэдэгдлийн гарчиг">
            <div className="space-y-1.5">
              <Label htmlFor="title">Гарчиг</Label>
              <Input
                id="title"
                placeholder="Мэдэгдлийн гарчиг оруулна уу"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-invalid={!!titleError}
              />
              {titleError && (
                <p className="text-[11px] text-destructive">{titleError}</p>
              )}
            </div>
          </FormCard>

          {/* Body card */}
          <FormCard title="Мэдэгдлийн агуулга">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="body">Агуулга</Label>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {bodyCount}/{MAX_BODY}
                </span>
              </div>
              <Textarea
                id="body"
                rows={5}
                maxLength={MAX_BODY}
                placeholder="Мэдэгдлийн агуулга бичнэ үү."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                aria-invalid={!!bodyError}
                className="min-h-[120px]"
              />
              {bodyError && (
                <p className="text-[11px] text-destructive">{bodyError}</p>
              )}
            </div>
          </FormCard>

          {/* Type card */}
          <FormCard title="Мэдэгдлийн төрөл">
            <div className="space-y-1.5">
              <Label htmlFor="type">Төрөл</Label>
              <Select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as NotificationType)}
              >
                <option value="custom">Custom</option>
                <option value="promotion">Promotion</option>
              </Select>
            </div>
          </FormCard>

          {/* Recipient card */}
          <FormCard title="Хэнд илгээх вэ?">
            <div className="flex flex-wrap gap-2">
              <RadioButton
                checked={sendToAll}
                onClick={() => {
                  setSendToAll(true);
                  setUserIds([]);
                  setUserIdInput("");
                }}
                label="Бүх хэрэглэгчдэд"
              />
              <RadioButton
                checked={!sendToAll}
                onClick={() => setSendToAll(false)}
                label="Тодорхой хэрэглэгчдэд"
              />
            </div>

            {!sendToAll && (
              <div className="mt-3 space-y-2">
                <div className="flex items-stretch gap-2">
                  <Input
                    placeholder="Хэрэглэгчийн ID оруулна уу"
                    value={userIdInput}
                    onChange={(e) => setUserIdInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddUserId();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    onClick={handleAddUserId}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Нэмэх
                  </Button>
                </div>

                {userIds.length > 0 ? (
                  <div className="max-h-[160px] overflow-y-auto rounded-lg border border-border-light bg-foreground/[0.03] p-2">
                    <div className="flex flex-wrap gap-1.5">
                      {userIds.map((id) => (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 rounded-md bg-card px-2 py-1 text-[11px] font-medium ring-1 ring-border-light"
                        >
                          <span className="truncate font-mono">{id}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveUserId(id)}
                            className="text-muted-foreground hover:text-rose-600"
                            aria-label={`${id}-г устгах`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border-light px-3 py-2 text-[11px] text-muted-foreground">
                    Одоогоор хэрэглэгчийн ID нэмэгдээгүй байна.
                  </div>
                )}
              </div>
            )}
          </FormCard>
        </div>

        {/* Preview (1 col) */}
        <aside className="lg:col-span-1">
          <div className="sticky top-4 space-y-3 rounded-xl border border-border-light bg-card p-4">
            <h3 className="text-[13px] font-semibold text-foreground">
              Урьдчилан харах
            </h3>
            <PreviewRow label="Гарчиг" value={title || "—"} />
            <PreviewRow label="Агуулга" value={body || "—"} multiline />
            <PreviewRow label="Төрөл" value={type} />
            <PreviewRow
              label="Хүлээн авагч"
              value={
                sendToAll ? "Бүх хэрэглэгчид" : `${userIds.length} хэрэглэгч`
              }
            />

            {!sendToAll && userIds.length > 0 && (
              <div className="max-h-[140px] overflow-y-auto rounded-md bg-foreground/[0.03] p-2">
                <div className="flex flex-wrap gap-1">
                  {userIds.map((id) => (
                    <span
                      key={id}
                      className="rounded bg-primary-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-primary-700"
                    >
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-[11px] text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Мэдэгдлийн агуулга болон хүлээн авагчийн мэдээллийг сайтар шалгана уу.
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Илгээх
            </Button>
          </div>
        </aside>
      </form>
    </div>
  );
}

function FormCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border-light bg-card p-4">
      <header className="mb-3 border-b border-border-light pb-2">
        <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
      </header>
      {children}
    </section>
  );
}

function RadioButton({
  checked,
  onClick,
  label,
}: {
  checked: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors",
        checked
          ? "border-primary bg-primary-50 text-primary-700"
          : "border-foreground/15 bg-foreground/[0.04] text-muted-foreground hover:border-primary-300 hover:text-foreground"
      )}
    >
      <span
        className={cn(
          "flex h-3.5 w-3.5 items-center justify-center rounded-full border-2",
          checked ? "border-primary" : "border-foreground/30"
        )}
      >
        {checked && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
      </span>
      {label}
    </button>
  );
}

function PreviewRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "text-[12px] text-foreground/90",
          multiline ? "whitespace-pre-wrap" : "truncate"
        )}
      >
        {value}
      </div>
    </div>
  );
}
