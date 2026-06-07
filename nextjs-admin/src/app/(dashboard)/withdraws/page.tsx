"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Inbox,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  fetchWithdrawsByDateRange,
  type Withdraw,
  type WithdrawDateRange,
  type WithdrawMetal,
  type WithdrawStatus,
  type WithdrawVerificationFilter,
} from "@/lib/firestore/withdraws";
import {
  canVerifyWithdraw,
  getWithdrawClientName,
  isVerificationCodeExpired,
  verificationStatusBadge,
  verificationStatusText,
  withdrawStatusBadge,
  withdrawStatusText,
  withdrawTypeBadge,
  withdrawTypeText,
} from "@/lib/withdraws";
import { formatMNT2, formatOrderDate, formatQuantity, metalLabel } from "@/lib/orders";
import { WithdrawDetailDialog } from "@/components/withdraws/WithdrawDetailDialog";
import { VerifyWithdrawDialog } from "@/components/withdraws/VerifyWithdrawDialog";

type SortField =
  | "client_name"
  | "quantity"
  | "price"
  | "status"
  | "created_at";
type SortDir = "asc" | "desc";

const ITEMS_PER_PAGE = 20;

const RANGE_OPTIONS: { value: WithdrawDateRange; label: string }[] = [
  { value: "week", label: "7 хоног" },
  { value: "month", label: "Сар" },
  { value: "year", label: "Жил" },
  { value: "all", label: "Бүгд" },
];

export default function WithdrawsPage() {
  const { adminData, user } = useAuth();
  const role = adminData?.role ?? null;
  const adminUid = user?.uid ?? null;
  const canExportExcel = role === "admin" || role === "accountant";
  const canSeeActions = role === "admin";
  // Accountant may open the detail view but performs no verify action.
  const canViewDetail = role === "admin" || role === "accountant";

  const [all, setAll] = useState<Withdraw[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<WithdrawDateRange>("week");
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<WithdrawStatus>("");
  const [metal, setMetal] = useState<WithdrawMetal>("");
  const [verification, setVerification] = useState<WithdrawVerificationFilter>("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [detailW, setDetailW] = useState<Withdraw | null>(null);
  const [verifyW, setVerifyW] = useState<Withdraw | null>(null);

  const load = useCallback(async (range: WithdrawDateRange) => {
    setLoading(true);
    try {
      const data = await fetchWithdrawsByDateRange(range);
      setAll(data);
    } catch (err) {
      console.error("Error fetching withdraws:", err);
      toast.error("Биетээр авах хүсэлтүүдийн мэдээлэл татахад алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(dateRange);
  }, [dateRange, load]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let list = all;

    if (term) {
      list = list.filter((w) => {
        const c = w.client;
        return (
          c?.first_name?.toLowerCase().includes(term) ||
          c?.last_name?.toLowerCase().includes(term) ||
          c?.phone?.includes(term) ||
          c?.email?.toLowerCase().includes(term) ||
          w.id?.toLowerCase().includes(term) ||
          w.user_id?.toLowerCase().includes(term) ||
          w.verificationCode?.toLowerCase().includes(term) ||
          w.notes?.toLowerCase().includes(term)
        );
      });
    }
    if (status) list = list.filter((w) => w.status === status);
    if (metal) {
      const metalId = metal === "gold" ? 1 : 3;
      list = list.filter((w) => w.metal_id === metalId);
    }
    if (verification) {
      list = list.filter((w) => {
        if (verification === "verified") return !!w.verified_at;
        if (verification === "unverified") return !w.verified_at;
        if (verification === "code_used") return !!w.verificationCodeUsed;
        if (verification === "code_not_used") return !w.verificationCodeUsed;
        return true;
      });
    }
    if (dateFilter) {
      const target = new Date(dateFilter).toDateString();
      list = list.filter(
        (w) => w.created_at?.toDate?.()?.toDateString() === target
      );
    }

    const dir = sortDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      const va = withdrawSortValue(a, sortField);
      const vb = withdrawSortValue(b, sortField);
      if (typeof va === "string" && typeof vb === "string") {
        return va.toLowerCase().localeCompare(vb.toLowerCase(), "mn") * dir;
      }
      if (va instanceof Date && vb instanceof Date) {
        return (va.getTime() - vb.getTime()) * dir;
      }
      return ((va as number) - (vb as number)) * dir;
    });
    return list;
  }, [
    all,
    searchTerm,
    status,
    metal,
    verification,
    dateFilter,
    sortField,
    sortDir,
  ]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const pageRows = filtered.slice(startIndex, endIndex);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "created_at" ? "desc" : "asc");
    }
    setPage(1);
  };
  const handleSearch = (v: string) => { setSearchTerm(v); setPage(1); };
  const handleStatus = (v: WithdrawStatus) => { setStatus(v); setPage(1); };
  const handleMetal = (v: WithdrawMetal) => { setMetal(v); setPage(1); };
  const handleVerification = (v: WithdrawVerificationFilter) => {
    setVerification(v);
    setPage(1);
  };
  const handleDate = (v: string) => { setDateFilter(v); setPage(1); };
  const handleRange = (v: WithdrawDateRange) => { setDateRange(v); setPage(1); };
  const handleRefresh = () => { setPage(1); void load(dateRange); };

  const hasAnyFilter =
    !!searchTerm ||
    !!status ||
    !!metal ||
    !!verification ||
    !!dateFilter;

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.warning("Экспорт хийх биетээр авах хүсэлт байхгүй байна.");
      return;
    }
    try {
      const rows = filtered.map((w) => ({
        "Хүсэлтийн ID": w.id,
        "Харилцагчийн нэр": getWithdrawClientName(w),
        Утас: w.client?.phone || "Байхгүй",
        "И-мэйл": w.client?.email || "Байхгүй",
        "Хэрэглэгчийн ID": w.user_id || "Байхгүй",
        "Металл төрөл": metalLabel(w.metal_id),
        "Тоо хэмжээ": w.quantity ?? 0,
        "Үнэ": w.price ?? 0,
        "Төлөв": withdrawStatusText(w.status),
        "Төрөл": withdrawTypeText(w.withdraw_type),
        "Баталгаажуулалт": verificationStatusText(w),
        "Баталгаажуулсан код": w.verificationCode || "Байхгүй",
        "Баталгаажуулсан админ": w.verified_by_name || "Байхгүй",
        "Үүсгэсэн огноо": formatOrderDate(w.created_at),
        "Шинэчилсэн огноо": formatOrderDate(w.updated_at),
        "Баталгаажуулсан огноо": formatOrderDate(w.verified_at),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [
        { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 25 },
        { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 18 },
        { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 20 },
        { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Биетээр авах хүсэлтүүд");
      const today = new Date().toISOString().split("T")[0];
      const filename = `Биетээр_авах_хүсэлтүүдийн_жагсаалт_${today}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success(`${rows.length} хүсэлт экспортлогдлоо.`, {
        description: filename,
      });
    } catch (err) {
      console.error("Excel export error:", err);
      toast.error("Excel файл үүсгэхэд алдаа гарлаа.");
    }
  };

  const pages = useMemo(() => {
    const max = 5;
    const start = Math.max(1, currentPage - Math.floor(max / 2));
    const end = Math.min(totalPages, start + max - 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-[18px] font-semibold text-foreground">
          Биетээр авах хүсэлтүүд
        </h1>
        <p className="text-[12px] text-muted-foreground">
          Биетээр авах хүсэлтүүд{" "}
          <span className="text-foreground/70">/ Жагсаалт</span>
        </p>
      </header>

      <div className="rounded-xl border border-border-light bg-card">
        {/* Action bar */}
        <div className="flex flex-col gap-3 border-b border-border-light px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-[14px] font-semibold text-foreground">
            Биетээр авах хүсэлтүүдийн жагсаалт
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center overflow-hidden rounded-lg border border-border-light bg-background">
              {RANGE_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => handleRange(r.value)}
                  className={cn(
                    "px-3 py-1.5 text-[12px] font-medium transition-colors",
                    dateRange === r.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            {canExportExcel && (
              <Button
                size="sm"
                onClick={handleExport}
                className="bg-[#1D6F42] text-white hover:bg-[#185c37]"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Excel Export
              </Button>
            )}
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handleRefresh}
              aria-label="Шинэчлэх"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid gap-3 border-b border-border-light px-4 py-3 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <FieldLabel>Хайх</FieldLabel>
            <Input
              type="search"
              placeholder="Нэр, утас, и-мэйл, код…"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="lg:col-span-2">
            <FieldLabel>Төлөв</FieldLabel>
            <Select
              value={status}
              onChange={(e) => handleStatus(e.target.value as WithdrawStatus)}
            >
              <option value="">Бүгд</option>
              <option value="pending">Хүлээгдэж буй</option>
              <option value="verified">Баталгаажсан</option>
            </Select>
          </div>
          <div className="lg:col-span-2">
            <FieldLabel>Металл</FieldLabel>
            <Select
              value={metal}
              onChange={(e) => handleMetal(e.target.value as WithdrawMetal)}
            >
              <option value="">Бүгд</option>
              <option value="gold">Алт</option>
              <option value="silver">Мөнгө</option>
            </Select>
          </div>
          <div className="lg:col-span-2">
            <FieldLabel>Баталгаажуулалт</FieldLabel>
            <Select
              value={verification}
              onChange={(e) =>
                handleVerification(e.target.value as WithdrawVerificationFilter)
              }
            >
              <option value="">Бүгд</option>
              <option value="verified">Баталгаажсан</option>
              <option value="unverified">Баталгаажаагүй</option>
              <option value="code_used">Код ашигласан</option>
              <option value="code_not_used">Код ашиглаагүй</option>
            </Select>
          </div>
          <div className="lg:col-span-3">
            <FieldLabel>Огноо</FieldLabel>
            <div className="flex items-stretch gap-1">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => handleDate(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => handleDate("")}
                disabled={!dateFilter}
                aria-label="Огноо цэвэрлэх"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Info bar */}
        <div className="border-b border-border-light px-4 py-2 text-[12px] text-muted-foreground">
          Нийт:{" "}
          <span className="font-medium text-foreground">{totalItems}</span> биетээр
          авах хүсэлт
          {hasAnyFilter && <span className="ml-1">(шүүлтийн дүн)</span>}
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
              <p className="text-[12px] text-muted-foreground">
                Биетээр авах хүсэлтүүдийн мэдээлэл ачааллаж байна…
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] text-[13px]">
                <thead>
                  <tr className="border-b border-border-light text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    <SortableHeader
                      label="Харилцагч"
                      field="client_name"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <th className="px-2 py-2 text-left font-medium">Металл</th>
                    <SortableHeader
                      label="Тоо хэмжээ"
                      field="quantity"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                      align="right"
                    />
                    <SortableHeader
                      label="Үнэ"
                      field="price"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                      align="right"
                    />
                    <SortableHeader
                      label="Төлөв"
                      field="status"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <th className="px-2 py-2 text-left font-medium">Төрөл</th>
                    <th className="px-2 py-2 text-left font-medium">
                      Баталгаажуулалт
                    </th>
                    <SortableHeader
                      label="Огноо"
                      field="created_at"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    {canViewDetail && (
                      <th className="px-2 py-2 text-right font-medium">Үйлдэл</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={canViewDetail ? 9 : 8}
                        className="py-12 text-center text-muted-foreground"
                      >
                        <Inbox className="mx-auto mb-2 h-6 w-6 opacity-60" />
                        {hasAnyFilter
                          ? "Шүүлтийн нөхцөлд тохирох биетээр авах хүсэлт олдсонгүй."
                          : "Биетээр авах хүсэлт байхгүй байна."}
                      </td>
                    </tr>
                  )}
                  {pageRows.map((w) => {
                    const canVerify = canVerifyWithdraw(w, adminUid);
                    return (
                      <tr
                        key={w.id}
                        className="border-b border-border-light/60 last:border-b-0 hover:bg-muted/40"
                      >
                        <td className="px-2 py-2 align-top">
                          <div className="min-w-0">
                            <div className="truncate font-medium text-foreground">
                              {getWithdrawClientName(w)}
                            </div>
                            {w.client?.phone && (
                              <div className="truncate text-[11px] text-muted-foreground">
                                {w.client.phone}
                              </div>
                            )}
                            {!w.client?.phone && w.client?.email && (
                              <div className="truncate text-[11px] text-muted-foreground">
                                {w.client.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2 align-top">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                              w.metal_id === 1
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                                : w.metal_id === 3
                                  ? "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300"
                                  : "bg-muted text-muted-foreground"
                            )}
                          >
                            {metalLabel(w.metal_id)}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-right align-top font-semibold tabular-nums">
                          {formatQuantity(w.metal_id, w.quantity)}
                        </td>
                        <td className="px-2 py-2 text-right align-top tabular-nums">
                          {formatMNT2(w.price)}
                        </td>
                        <td className="px-2 py-2 align-top">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                              withdrawStatusBadge(w.status)
                            )}
                          >
                            {withdrawStatusText(w.status)}
                          </span>
                          {w.verificationCode && (
                            <div className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                              {w.verificationCode}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2 align-top">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                              withdrawTypeBadge(w.withdraw_type)
                            )}
                          >
                            {withdrawTypeText(w.withdraw_type)}
                          </span>
                        </td>
                        <td className="px-2 py-2 align-top">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                              verificationStatusBadge(w)
                            )}
                          >
                            {verificationStatusText(w)}
                          </span>
                          {w.verified_by_name && (
                            <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                              {w.verified_by_name}
                            </div>
                          )}
                          {isVerificationCodeExpired(w) && !w.verified_at && (
                            <div className="mt-0.5 text-[10px] text-rose-600 dark:text-rose-400">
                              Код хугацаа дуусгасан
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2 align-top text-[11px] tabular-nums">
                          <div className="text-muted-foreground">
                            {formatOrderDate(w.created_at)}
                          </div>
                          {w.verified_at && (
                            <div className="mt-0.5 text-emerald-600 dark:text-emerald-400">
                              Баталгаажсан: {formatOrderDate(w.verified_at)}
                            </div>
                          )}
                        </td>
                        {canViewDetail && (
                          <td className="px-2 py-2 align-top">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Дэлгэрэнгүй"
                                onClick={() => setDetailW(w)}
                                className="text-primary-600 hover:bg-primary-50"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              {canSeeActions && canVerify && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  title="Баталгаажуулах"
                                  onClick={() => setVerifyW(w)}
                                  className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && totalItems > 0 && (
            <div className="mt-3 flex flex-col gap-2 border-t border-border-light pt-3 text-[12px] sm:flex-row sm:items-center sm:justify-between">
              <div className="text-muted-foreground">
                {startIndex + 1}–{endIndex} / Нийт:{" "}
                <span className="text-foreground">{totalItems}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                {pages.map((p) => (
                  <Button
                    key={p}
                    variant={p === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(p)}
                    className="min-w-8"
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <WithdrawDetailDialog
        open={!!detailW}
        withdraw={detailW}
        onOpenChange={(o) => !o && setDetailW(null)}
      />
      <VerifyWithdrawDialog
        open={!!verifyW}
        withdraw={verifyW}
        onOpenChange={(o) => !o && setVerifyW(null)}
        onCompleted={() => void load(dateRange)}
      />
    </div>
  );
}

function withdrawSortValue(w: Withdraw, field: SortField): string | number | Date {
  switch (field) {
    case "client_name":
      return getWithdrawClientName(w).toLowerCase();
    case "quantity":
      return w.quantity ?? 0;
    case "price":
      return w.price ?? 0;
    case "status":
      return w.status ?? "";
    case "created_at":
      return w.created_at?.toDate?.() ?? new Date(0);
  }
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
      {children}
    </div>
  );
}

type SortableHeaderProps = {
  label: string;
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  align?: "left" | "right";
};

function SortableHeader({
  label,
  field,
  sortField,
  sortDir,
  onSort,
  align = "left",
}: SortableHeaderProps) {
  const active = sortField === field;
  const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      className={cn(
        "px-2 py-2 font-medium",
        align === "right" ? "text-right" : "text-left"
      )}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-foreground",
          align === "right" && "ml-auto",
          active && "text-foreground"
        )}
      >
        <span>{label}</span>
        <Icon className="h-3 w-3" />
      </button>
    </th>
  );
}
