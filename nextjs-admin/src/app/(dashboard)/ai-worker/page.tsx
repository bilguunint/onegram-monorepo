"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronLeft,
  Clock,
  FileBox,
  FileText,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  deleteAiConversation,
  deleteAiReport,
  fetchAiConversation,
  fetchAiConversations,
  fetchAiReports,
  formatChatTime,
  formatFileSize,
  formatSidebarDate,
  type AiChatMessage,
  type AiConversationListItem,
  type AiReport,
} from "@/lib/firestore/aiAssistant";
import { sendAiMessage } from "@/lib/api/aiActions";
import { formatAiMessage } from "@/lib/aiMarkdown";

type LocalMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
  model?: string;
};

type SidebarTab = "conversations" | "reports";

const WELCOME_TEXT =
  "Сайн байна уу! Би таны **AI бизнес туслах ажилтан**. GrammGold-ын бүх бизнес мэдээлэлд хандах боломжтой.\n\n🔍 **Миний чадварууд:**\n• Бизнесийн тайлан гаргах (PDF, Word)\n• Борлуулалт, хэрэглэгчийн шинжилгээ\n• KPI тооцоолол, MoM өсөлт\n• Хэрэглэгчийн дэлгэрэнгүй мэдээлэл хайх\n• Стратегийн зөвлөгөө өгөх\n\nДоорх товчлууруудаас сонгох эсвэл өөрийн асуултаа бичнэ үү! 👇";

const QUICK_PROMPTS: { icon: React.ReactNode; label: string; prompt: string }[] = [
  {
    icon: <BarChart3 className="h-3.5 w-3.5" />,
    label: "Өнөөдрийн тайлан",
    prompt: "Өнөөдрийн бизнесийн товч тайлан гаргаж өгнө үү.",
  },
  {
    icon: <TrendingUp className="h-3.5 w-3.5" />,
    label: "Сарын шинжилгээ",
    prompt:
      "Энэ сарын борлуулалтын шинжилгээ хийж, өмнөх сартай харьцуулна уу.",
  },
  {
    icon: <Users className="h-3.5 w-3.5" />,
    label: "Топ хэрэглэгчид",
    prompt:
      "Хамгийн их алт эзэмшдэг топ 20 хэрэглэгчийн Pareto шинжилгээ хийнэ үү.",
  },
  {
    icon: <FileText className="h-3.5 w-3.5" />,
    label: "PDF тайлан",
    prompt: "Энэ сарын бизнесийн гүйцэтгэлийн дэлгэрэнгүй PDF тайлан үүсгэнэ үү.",
  },
  {
    icon: <Wallet className="h-3.5 w-3.5" />,
    label: "Мөнгөн зарлага",
    prompt:
      "Хүлээгдэж буй зарлагын хүсэлтүүдийг шинжилж, эрсдэлийн үнэлгээ хийнэ үү.",
  },
  {
    icon: <FileBox className="h-3.5 w-3.5" />,
    label: "KPI Dashboard",
    prompt:
      "Бидний гол KPI үзүүлэлтүүдийг (DAU, ARPU, Retention, Conversion) тооцоолж, хүснэгтээр харуулна уу.",
  },
];

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function currentHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function welcomeMessage(): LocalMessage {
  return {
    id: newId(),
    role: "assistant",
    content: WELCOME_TEXT,
    time: currentHHMM(),
  };
}

export default function AiWorkerPage() {
  const [messages, setMessages] = useState<LocalMessage[]>([welcomeMessage()]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const [conversations, setConversations] = useState<AiConversationListItem[]>(
    []
  );
  const [reports, setReports] = useState<AiReport[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);

  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState<SidebarTab>("conversations");

  const [confirmDeleteConv, setConfirmDeleteConv] = useState<AiConversationListItem | null>(null);
  const [confirmDeleteReport, setConfirmDeleteReport] = useState<AiReport | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on message changes
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const list = await fetchAiConversations();
      setConversations(list);
    } catch (err) {
      console.error("Failed to load conversations", err);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const loadReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const list = await fetchAiReports();
      setReports(list);
    } catch (err) {
      console.error("Failed to load reports", err);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
    void loadReports();
  }, [loadConversations, loadReports]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      const userMsg: LocalMessage = {
        id: newId(),
        role: "user",
        content: trimmed,
        time: currentHHMM(),
      };
      setMessages((m) => [...m, userMsg]);
      setInput("");
      setSending(true);

      try {
        const result = await sendAiMessage({
          message: trimmed,
          conversationId,
        });
        setConversationId(result.conversationId || null);
        setMessages((m) => [
          ...m,
          {
            id: newId(),
            role: "assistant",
            content: result.message,
            time: currentHHMM(),
            model: result.model,
          },
        ]);
        void loadConversations();
        // If response mentions a report, refresh reports list
        if (
          result.message &&
          (result.message.includes("storage.googleapis.com") ||
            result.message.toLowerCase().includes("report"))
        ) {
          void loadReports();
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Алдаа гарлаа.";
        setMessages((m) => [
          ...m,
          {
            id: newId(),
            role: "assistant",
            content: `❌ Уучлаарай, алдаа гарлаа. Дахин оролдоно уу.\n\n\`${msg}\``,
            time: currentHHMM(),
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [sending, conversationId, loadConversations, loadReports]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const handleNewConversation = () => {
    setConversationId(null);
    setMessages([
      {
        id: newId(),
        role: "assistant",
        content: "🆕 Шинэ яриа эхэлж байна. Танд юугаар туслах вэ?",
        time: currentHHMM(),
      },
    ]);
    setInput("");
  };

  const handleLoadConversation = async (conv: AiConversationListItem) => {
    try {
      const detail = await fetchAiConversation(conv.id);
      setConversationId(detail.id);
      setMessages(
        detail.messages.map<LocalMessage>((m: AiChatMessage) => ({
          id: newId(),
          role: m.role,
          content: m.content,
          time: formatChatTime(m.timestamp),
        }))
      );
    } catch (err) {
      console.error("Failed to load conversation", err);
      toast.error("Яриа татаж чадсангүй.");
    }
  };

  const handleConfirmDeleteConv = async () => {
    const conv = confirmDeleteConv;
    if (!conv) return;
    try {
      await deleteAiConversation(conv.id);
      if (conversationId === conv.id) handleNewConversation();
      toast.success("Яриа устгагдлаа.");
      void loadConversations();
    } catch (err) {
      console.error("Failed to delete conversation", err);
      toast.error("Устгахад алдаа гарлаа.");
    } finally {
      setConfirmDeleteConv(null);
    }
  };

  const handleConfirmDeleteReport = async () => {
    const r = confirmDeleteReport;
    if (!r) return;
    try {
      await deleteAiReport(r.id);
      toast.success("Тайлан устгагдлаа.");
      void loadReports();
    } catch (err) {
      console.error("Failed to delete report", err);
      toast.error("Устгахад алдаа гарлаа.");
    } finally {
      setConfirmDeleteReport(null);
    }
  };

  const showQuickPrompts = useMemo(
    () => messages.length <= 1 && !sending,
    [messages.length, sending]
  );

  return (
    <div className="-mx-1 flex h-[calc(100vh-7rem)] gap-3">
      {/* Sidebar */}
      {showSidebar && (
        <aside className="hidden w-72 shrink-0 flex-col overflow-hidden rounded-xl border border-border-light bg-card lg:flex">
          <div className="flex border-b border-border-light">
            <SidebarTabButton
              active={activeTab === "conversations"}
              onClick={() => setActiveTab("conversations")}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Яриа
            </SidebarTabButton>
            <SidebarTabButton
              active={activeTab === "reports"}
              onClick={() => {
                setActiveTab("reports");
                if (reports.length === 0) void loadReports();
              }}
            >
              <FileText className="h-3.5 w-3.5" />
              Тайлан
            </SidebarTabButton>
          </div>

          {activeTab === "conversations" ? (
            <ConversationsList
              items={conversations}
              loading={loadingConversations}
              activeId={conversationId}
              onPick={handleLoadConversation}
              onDelete={(c) => setConfirmDeleteConv(c)}
              onNew={handleNewConversation}
              onRefresh={() => void loadConversations()}
            />
          ) : (
            <ReportsList
              items={reports}
              loading={loadingReports}
              onDelete={(r) => setConfirmDeleteReport(r)}
              onRefresh={() => void loadReports()}
            />
          )}
        </aside>
      )}

      {/* Chat */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-light bg-card">
        <header className="flex items-center gap-2 border-b border-border-light px-3 py-2.5">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setShowSidebar((s) => !s)}
            aria-label="Түүх харах"
            className="hidden lg:inline-flex"
          >
            <ChevronLeft
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                !showSidebar && "rotate-180"
              )}
            />
          </Button>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-300 via-primary-500 to-primary-700 text-white shadow-sm">
            <Bot className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-semibold text-foreground">
              AI Бизнес Ажилтан
            </h1>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Идэвхтэй
              {conversationId && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                  <CheckCircle2 className="h-3 w-3" />
                  Хадгалагдсан
                </span>
              )}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleNewConversation}>
            <Plus className="h-3.5 w-3.5" />
            Шинэ яриа
          </Button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="space-y-3">
            {messages.map((m) => (
              <MessageItem key={m.id} message={m} />
            ))}

            {showQuickPrompts && (
              <li>
                <div className="ml-9 mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {QUICK_PROMPTS.map((qp) => (
                    <button
                      key={qp.label}
                      type="button"
                      onClick={() => void send(qp.prompt)}
                      disabled={sending}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border border-foreground/15 bg-foreground/[0.04] px-3 py-2 text-left text-[12px] font-medium text-foreground transition-colors",
                        "hover:border-primary-300 hover:bg-primary-50/60 hover:text-primary-700",
                        "disabled:cursor-not-allowed disabled:opacity-50"
                      )}
                    >
                      <span className="text-primary-600">{qp.icon}</span>
                      <span className="truncate">{qp.label}</span>
                    </button>
                  ))}
                </div>
              </li>
            )}

            {sending && (
              <li>
                <TypingBubble />
              </li>
            )}
          </ul>
        </div>

        <Composer
          value={input}
          onChange={setInput}
          onKeyDown={handleKeyDown}
          onSubmit={() => void send(input)}
          disabled={sending}
        />
      </div>

      <ConfirmDialog
        open={!!confirmDeleteConv}
        title="Ярианы түүхийг устгах уу?"
        description={
          confirmDeleteConv ? (
            <span>
              <strong>{confirmDeleteConv.title}</strong> ярианы түүхийг устгах
              гэж байна. Үүнийг буцаах боломжгүй.
            </span>
          ) : null
        }
        confirmLabel="Устгах"
        destructive
        onOpenChange={(o) => !o && setConfirmDeleteConv(null)}
        onConfirm={handleConfirmDeleteConv}
      />
      <ConfirmDialog
        open={!!confirmDeleteReport}
        title="Тайланг устгах уу?"
        description={
          confirmDeleteReport ? (
            <span>
              <strong>{confirmDeleteReport.title}</strong> тайланг устгах гэж
              байна.
            </span>
          ) : null
        }
        confirmLabel="Устгах"
        destructive
        onOpenChange={(o) => !o && setConfirmDeleteReport(null)}
        onConfirm={handleConfirmDeleteReport}
      />
    </div>
  );
}

function SidebarTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-[12px] font-medium transition-colors",
        active
          ? "border-b-2 border-primary text-primary-700"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function ConversationsList({
  items,
  loading,
  activeId,
  onPick,
  onDelete,
  onNew,
  onRefresh,
}: {
  items: AiConversationListItem[];
  loading: boolean;
  activeId: string | null;
  onPick: (c: AiConversationListItem) => void;
  onDelete: (c: AiConversationListItem) => void;
  onNew: () => void;
  onRefresh: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-border-light px-3 py-2">
        <span className="text-[11px] text-muted-foreground">
          {items.length} яриа
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onRefresh}
            aria-label="Шинэчлэх"
          >
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          </Button>
          <Button size="sm" onClick={onNew}>
            <Plus className="h-3 w-3" />
            Шинэ
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
            <MessageSquare className="h-6 w-6 opacity-60" />
            <p className="text-[11px]">Яриа байхгүй байна</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {items.map((c) => {
              const active = activeId === c.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onPick(c)}
                    className={cn(
                      "group flex w-full items-start gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors",
                      active
                        ? "border-primary bg-primary-50"
                        : "border-transparent hover:bg-muted/60"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          "truncate text-[12px] font-medium",
                          active ? "text-primary-700" : "text-foreground"
                        )}
                      >
                        {c.title}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                        <MessageSquare className="h-2.5 w-2.5" />
                        {c.messageCount} мессеж
                        {c.updatedAt && (
                          <>
                            <span>·</span>
                            <Clock className="h-2.5 w-2.5" />
                            {formatSidebarDate(c.updatedAt)}
                          </>
                        )}
                      </div>
                    </div>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(c);
                      }}
                      title="Устгах"
                      className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

function ReportsList({
  items,
  loading,
  onDelete,
  onRefresh,
}: {
  items: AiReport[];
  loading: boolean;
  onDelete: (r: AiReport) => void;
  onRefresh: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-border-light px-3 py-2">
        <span className="text-[11px] text-muted-foreground">
          {items.length} тайлан
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={onRefresh}
          aria-label="Шинэчлэх"
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-8 text-center text-muted-foreground">
            <FileText className="h-6 w-6 opacity-60" />
            <p className="text-[11px]">Тайлан байхгүй байна.</p>
            <p className="text-[10px]">AI-аас тайлан үүсгэхийг хүснэ үү.</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {items.map((r) => (
              <li key={r.id}>
                <a
                  href={r.downloadUrl || r.url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-start gap-2 rounded-lg border border-transparent px-2 py-1.5 transition-colors hover:bg-muted/60"
                >
                  <FileText
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      r.type === "word"
                        ? "text-sky-600"
                        : "text-rose-600"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-medium text-foreground">
                      {r.title}
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      {String(r.type).toUpperCase()} · {formatFileSize(r.size)}
                      {r.createdAt && (
                        <> · {formatSidebarDate(r.createdAt)}</>
                      )}
                    </div>
                  </div>
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(r);
                    }}
                    title="Устгах"
                    className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function MessageItem({ message }: { message: LocalMessage }) {
  if (message.role === "user") {
    return (
      <li className="flex justify-end">
        <div className="max-w-[78%] space-y-1">
          <div className="rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-[13px] leading-relaxed text-primary-foreground">
            {message.content}
          </div>
          <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            {message.time || ""}
          </div>
        </div>
      </li>
    );
  }
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 via-primary-500 to-primary-700 text-white">
        <Bot className="h-3.5 w-3.5" />
      </span>
      <div className="max-w-[78%] space-y-1">
        <div className="rounded-2xl rounded-bl-md border border-border-light bg-card px-3.5 py-2 text-[13px] leading-relaxed text-foreground">
          <div
            className="prose-sm break-words"
            dangerouslySetInnerHTML={{
              __html: formatAiMessage(message.content),
            }}
          />
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="h-2.5 w-2.5" />
          {message.time || ""}
          {message.model && (
            <span className="ml-1 rounded bg-muted px-1 py-0.5 font-mono text-[9px]">
              {message.model}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

function TypingBubble() {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 via-primary-500 to-primary-700 text-white">
        <Bot className="h-3.5 w-3.5" />
      </span>
      <div className="rounded-2xl rounded-bl-md border border-border-light bg-card px-3.5 py-2.5">
        <span className="inline-flex items-center gap-1.5">
          <Dot delay={0} />
          <Dot delay={0.15} />
          <Dot delay={0.3} />
          <span className="ml-1 text-[11px] text-muted-foreground">
            Боловсруулж байна…
          </span>
        </span>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/70"
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

function Composer({
  value,
  onChange,
  onKeyDown,
  onSubmit,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  return (
    <div className="border-t border-border-light p-3">
      <div className="flex items-end gap-2 rounded-xl border border-foreground/15 bg-foreground/[0.04] p-2 focus-within:border-ring focus-within:bg-card focus-within:ring-3 focus-within:ring-ring/40">
        <Sparkles className="ml-1.5 mb-2 h-4 w-4 shrink-0 text-primary-500" />
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Мессеж бичих… (Enter = илгээх, Shift+Enter = шинэ мөр)"
          rows={1}
          disabled={disabled}
          className="max-h-32 flex-1 resize-none bg-transparent py-1.5 text-[13px] outline-none placeholder:text-muted-foreground/70 disabled:opacity-50"
        />
        <Button
          type="button"
          size="icon"
          className="h-8 w-8 shrink-0"
          disabled={!value.trim() || disabled}
          onClick={onSubmit}
          aria-label="Илгээх"
        >
          {disabled ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
