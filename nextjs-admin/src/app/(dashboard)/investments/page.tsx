"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Inbox,
  Loader2,
  RefreshCw,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  fetchInvestments,
  type Investment,
} from "@/lib/firestore/investments";
import {
  formatClosedDate,
  getDaysRemaining,
  getInvestmentUserName,
  getUniqueVerifiedAdmins,
  investmentStatusBadge,
  investmentStatusText,
  isClosed,
} from "@/lib/investments";
import { formatOrderDate } from "@/lib/orders";
import { EditEndDateDialog } from "@/components/investments/EditEndDateDialog";
import { CloseInvestmentDialog } from "@/components/investments/CloseInvestmentDialog";

type SortField =
  | "user_name"
  | "balance"
  | "verifiedAdmin"
  | "createdAt"
  | "endDate";
type SortDir = "asc" | "desc";

const ITEMS_PER_PAGE = 20;

export default function InvestmentsPage() {
  const { adminData } = useAuth();
  const role = adminData?.role ?? null;
  const canExportExcel = role === "admin" || role === "accountant";
  const canEditOrClose = role === "admin";

  const [all, setAll] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [adminFilter, setAdminFilter] = useState("");
  const [createdDate, setCreatedDate] = useState("");
  const [endDateF, setEndDateF] = useState("");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [editInv, setEditInv] = useState<Investment | null>(null);
  const [closeInv, setCloseInv] = useState<Investment | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchInvestments();
      setAll(data);
    } catch (err) {
      console.error("Error fetching investments:", err);
      toast.error("Хөрөнгө оруулалтын мэдээлэл татахад алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const uniqueAdmins = useMemo(() => getUniqueVerifiedAdmins(all), [all]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let list = all;

    if (term) {
      list = list.filter((inv) => {
        const u = inv.user;
        return (
          u?.first_name?.toLowerCase().includes(term) ||
          u?.last_name?.toLowerCase().includes(term) ||
          u?.phone?.includes(term) ||
          u?.email?.toLowerCase().includes(term) ||
          inv.userId?.toLowerCase().includes(term) ||
          inv.verifiedAdmin?.toLowerCase().includes(term)
        );
      });
    }
    if (adminFilter) {
      list = list.filter((inv) => inv.verifiedAdmin === adminFilter);
    }
    if (createdDate) {
      const target = new Date(createdDate).toDateString();
      list = list.filter(
        (inv) => inv.createdAt?.toDate?.()?.toDateString() === target
      );
    }
    if (endDateF) {
      const target = new Date(endDateF).toDateString();
      list = list.filter(
        (inv) => inv.endDate?.toDate?.()?.toDateString() === target
      );
    }

    const dir = sortDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      const va = investmentSortValue(a, sortField);
      const vb = investmentSortValue(b, sortField);
      if (typeof va === "string" && typeof vb === "string") {
        return va.toLowerCase().localeCompare(vb.toLowerCase(), "mn") * dir;
      }
      if (va instanceof Date && vb instanceof Date) {
        return (va.getTime() - vb.getTime()) * dir;
      }
      return ((va as number) - (vb as number)) * dir;
    });
    return list;
  }, [all, searchTerm, adminFilter, createdDate, endDateF, sortField, sortDir]);

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
      setSortDir(field === "createdAt" || field === "endDate" ? "desc" : "asc");
    }
    setPage(1);
  };
  const handleSearch = (v: string) => { setSearchTerm(v); setPage(1); };
  const handleAdmin = (v: string) => { setAdminFilter(v); setPage(1); };
  const handleCreatedDate = (v: string) => { setCreatedDate(v); setPage(1); };
  const handleEndDate = (v: string) => { setEndDateF(v); setPage(1); };
  const handleRefresh = () => { setPage(1); void load(); };

  const hasAnyFilter =
    !!searchTerm || !!adminFilter || !!createdDate || !!endDateF;

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.warning("Экспорт хийх хөрөнгө оруулалт байхгүй байна.");
      return;
    }
    try {
      const rows = filtered.map((inv) => ({
        "Хөрөнгө оруулалтын ID": inv.id,
        "Хэрэглэгчийн нэр": getInvestmentUserName(inv),
        Утас: inv.user?.phone || "Байхгүй",
        "И-мэйл": inv.user?.email || "Байхгүй",
        "Хэрэглэгчийн ID": inv.userId || "Байхгүй",
        Үлдэгдэл: inv.balance ?? 0,
        "Төлөв": investmentStatusText(inv),
        "Үлдсэн хоног": isClosed(inv) ? "-" : getDaysRemaining(inv),
        "Баталгаажуулсан админ": inv.verifiedAdmin || "Байхгүй",
        "Админ ID": inv.verifiedId || "Байхгүй",
        "Үүсгэсэн огноо": formatOrderDate(inv.createdAt),
        "Дуусах огноо": formatOrderDate(inv.endDate),
        "Хаагдсан огноо": isClosed(inv) ? formatClosedDate(inv.closedDate) : "-",
        "Хаасан админ": isClosed(inv) ? inv.closedBy || "Байхгүй" : "-",
        "Гэрээний файл": isClosed(inv) ? inv.attachedFile || "Байхгүй" : "-",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [
        { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 25 },
        { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
        { wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 20 },
        { wch: 20 }, { wch: 20 }, { wch: 50 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Хөрөнгө оруулалт");
      const today = new Date().toISOString().split("T")[0];
      const filename = `Хөрөнгө_оруулалтын_жагсаалт_${today}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success(`${rows.length} хөрөнгө оруулалт экспортлогдлоо.`, {
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
          Хөрөнгө оруулалт
        </h1>
        <p className="text-[12px] text-muted-foreground">
          Хөрөнгө оруулалт <span className="text-foreground/70">/ Жагсаалт</span>
        </p>
      </header>

      <div className="rounded-xl border border-border-light bg-card">
        {/* Action bar */}
        <div className="flex flex-col gap-3 border-b border-border-light px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[14px] font-semibold text-foreground">
            Хөрөнгө оруулалтын жагсаалт
          </h2>
          <div className="flex items-center gap-2">
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
          <div className="lg:col-span-4">
            <FieldLabel>Хайх</FieldLabel>
            <Input
              type="search"
              placeholder="Нэр, утас, и-мэйл, ID, админ…"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="lg:col-span-3">
            <FieldLabel>Баталгаажуулсан админ</FieldLabel>
            <Select
              value={adminFilter}
              onChange={(e) => handleAdmin(e.target.value)}
            >
              <option value="">Бүгд</option>
              {uniqueAdmins.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </div>
          <div className="lg:col-span-2">
            <FieldLabel>Үүсгэсэн огноо</FieldLabel>
            <div className="flex items-stretch gap-1">
              <Input
                type="date"
                value={createdDate}
                onChange={(e) => handleCreatedDate(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => handleCreatedDate("")}
                disabled={!createdDate}
                aria-label="Огноо цэвэрлэх"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="lg:col-span-3">
            <FieldLabel>Дуусах огноо</FieldLabel>
            <div className="flex items-stretch gap-1">
              <Input
                type="date"
                value={endDateF}
                onChange={(e) => handleEndDate(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => handleEndDate("")}
                disabled={!endDateF}
                aria-label="Огноо цэвэрлэх"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Info bar */}
        <div className="border-b border-border-light px-4 py-2 text-[12px] text-muted-foreground">
          Нийт: <span className="font-medium text-foreground">{totalItems}</span> хөрөнгө оруулалт
          {hasAnyFilter && <span className="ml-1">(шүүлтийн дүн)</span>}
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
              <p className="text-[12px] text-muted-foreground">
                Хөрөнгө оруулалтын мэдээлэл ачааллаж байна…
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1140px] text-[13px]">
                <thead>
                  <tr className="border-b border-border-light text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    <SortableHeader
                      label="Хэрэглэгч"
                      field="user_name"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Нийт"
                      field="balance"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                      align="right"
                    />
                    <th className="px-2 py-2 text-left font-medium">Төлөв</th>
                    <th className="px-2 py-2 text-left font-medium">Хугацаа</th>
                    <SortableHeader
                      label="Админ"
                      field="verifiedAdmin"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Үүсгэсэн"
                      field="createdAt"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Дуусах"
                      field="endDate"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    {canEditOrClose && (
                      <th className="px-2 py-2 text-right font-medium">Үйлдэл</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={canEditOrClose ? 8 : 7}
                        className="py-12 text-center text-muted-foreground"
                      >
                        <Inbox className="mx-auto mb-2 h-6 w-6 opacity-60" />
                        {hasAnyFilter
                          ? "Шүүлтийн нөхцөлд тохирох хөрөнгө оруулалт олдсонгүй."
                          : "Хөрөнгө оруулалт байхгүй байна."}
                      </td>
                    </tr>
                  )}
                  {pageRows.map((inv) => {
                    const closed = isClosed(inv);
                    const remaining = getDaysRemaining(inv);
                    return (
                      <tr
                        key={inv.id}
                        className="border-b border-border-light/60 last:border-b-0 hover:bg-muted/40"
                      >
                        <td className="px-2 py-2 align-top">
                          <div className="min-w-0">
                            <div className="truncate font-medium text-foreground">
                              {getInvestmentUserName(inv)}
                            </div>
                            {inv.user?.phone && (
                              <div className="truncate text-[11px] text-muted-foreground">
                                {inv.user.phone}
                              </div>
                            )}
                            {!inv.user?.phone && inv.user?.email && (
                              <div className="truncate text-[11px] text-muted-foreground">
                                {inv.user.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-right align-top font-semibold tabular-nums text-primary-600">
                          {(inv.balance ?? 0).toLocaleString()} гр
                        </td>
                        <td className="px-2 py-2 align-top">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                              investmentStatusBadge(inv)
                            )}
                          >
                            {investmentStatusText(inv)}
                          </span>
                          {closed && inv.attachedFile && (
                            <div className="mt-1">
                              <a
                                href={inv.attachedFile}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-md border border-border-light px-1.5 py-0.5 text-[10px] font-medium text-primary-600 hover:bg-primary-50"
                              >
                                <FileText className="h-3 w-3" />
                                Гэрээ
                              </a>
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2 align-top">
                          {!closed ? (
                            <span
                              className={cn(
                                "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                                remaining > 0
                                  ? "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {remaining > 0 ? `${remaining} хоног` : "Дууссан"}
                            </span>
                          ) : (
                            <div className="text-[11px] text-muted-foreground">
                              <div>
                                <span className="font-medium text-foreground">
                                  {formatClosedDate(inv.closedDate)}
                                </span>
                              </div>
                              {inv.closedBy && (
                                <div className="mt-0.5">
                                  Хаасан:{" "}
                                  <span className="font-medium text-foreground">
                                    {inv.closedBy}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2 align-top">
                          <div className="font-medium text-foreground">
                            {inv.verifiedAdmin || "Тодорхойгүй"}
                          </div>
                          <div className="truncate text-[11px] text-muted-foreground">
                            ID: {inv.verifiedId || "Байхгүй"}
                          </div>
                        </td>
                        <td className="px-2 py-2 align-top text-[11px] text-muted-foreground tabular-nums">
                          {formatOrderDate(inv.createdAt)}
                        </td>
                        <td className="px-2 py-2 align-top text-[11px] text-muted-foreground tabular-nums">
                          {formatOrderDate(inv.endDate)}
                        </td>
                        {canEditOrClose && (
                          <td className="px-2 py-2 align-top">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Дуусах хугацаа засах"
                                onClick={() => setEditInv(inv)}
                                disabled={closed}
                                className="text-primary-600 hover:bg-primary-50 disabled:opacity-40"
                              >
                                <CalendarClock className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Гэрээ хаах"
                                onClick={() => setCloseInv(inv)}
                                disabled={closed}
                                className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 disabled:opacity-40"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
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

      <EditEndDateDialog
        open={!!editInv}
        investment={editInv}
        onOpenChange={(o) => !o && setEditInv(null)}
        onCompleted={() => void load()}
      />
      <CloseInvestmentDialog
        open={!!closeInv}
        investment={closeInv}
        onOpenChange={(o) => !o && setCloseInv(null)}
        onCompleted={() => void load()}
      />
    </div>
  );
}

function investmentSortValue(
  inv: Investment,
  field: SortField
): string | number | Date {
  switch (field) {
    case "user_name":
      return getInvestmentUserName(inv).toLowerCase();
    case "balance":
      return inv.balance ?? 0;
    case "verifiedAdmin":
      return inv.verifiedAdmin ?? "";
    case "createdAt":
      return inv.createdAt?.toDate?.() ?? new Date(0);
    case "endDate":
      return inv.endDate?.toDate?.() ?? new Date(0);
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
