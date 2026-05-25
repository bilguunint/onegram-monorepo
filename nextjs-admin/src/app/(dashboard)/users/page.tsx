"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Loader2,
  Lock,
  RefreshCw,
  UserX,
  Wallet,
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
  fetchUsersByCategory,
  type AdminUser,
  type UserCategory,
} from "@/lib/firestore/users";
import {
  formatTimestamp,
  getFullName,
  getInitials,
  formatGramShort,
} from "@/lib/users";
import { LedgerDialog } from "@/components/users/LedgerDialog";
import { InvestmentDialog } from "@/components/users/InvestmentDialog";
import { ResetPinDialog } from "@/components/users/ResetPinDialog";

type SortField =
  | "name"
  | "phone"
  | "registration_number"
  | "gold"
  | "silver"
  | "created_at";

const ITEMS_PER_PAGE = 20;

export default function UsersPage() {
  const { adminData } = useAuth();
  const role = adminData?.role ?? null;
  const canExportExcel = role !== "manager";
  const canSeeActions = role !== "accountant";
  const canMakeInvestment = role === "admin";

  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<UserCategory>("has_gold");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [ledgerUser, setLedgerUser] = useState<AdminUser | null>(null);
  const [investmentUser, setInvestmentUser] = useState<AdminUser | null>(null);
  const [resetPinUser, setResetPinUser] = useState<AdminUser | null>(null);

  const load = useCallback(
    async (next: UserCategory = category) => {
      setLoading(true);
      try {
        const users = await fetchUsersByCategory(next);
        setAllUsers(users);
      } catch (err) {
        console.error("Error fetching users:", err);
        toast.error("Хэрэглэгчдийн мэдээлэл татаж чадсангүй.");
      } finally {
        setLoading(false);
      }
    },
    [category]
  );

  useEffect(() => {
    void load(category);
  }, [category, load]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let list = allUsers;
    if (term) {
      list = list.filter((u) =>
        [u.first_name, u.last_name, u.email, u.phone, u.registration_number]
          .some((v) => v?.toLowerCase().includes(term))
      );
    }
    if (dateFilter) {
      const target = new Date(dateFilter).toDateString();
      list = list.filter((u) => {
        if (!u.created_at) return false;
        const d = u.created_at.toDate?.();
        return d ? d.toDateString() === target : false;
      });
    }
    if (sortField) {
      const dir = sortDir === "asc" ? 1 : -1;
      list = [...list].sort((a, b) => {
        const va = sortValue(a, sortField);
        const vb = sortValue(b, sortField);
        if (typeof va === "string" && typeof vb === "string") {
          return va.toLowerCase().localeCompare(vb.toLowerCase(), "mn") * dir;
        }
        if (va instanceof Date && vb instanceof Date) {
          return (va.getTime() - vb.getTime()) * dir;
        }
        return ((va as number) - (vb as number)) * dir;
      });
    }
    return list;
  }, [allUsers, searchTerm, dateFilter, sortField, sortDir]);

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
      setSortDir("asc");
    }
    setPage(1);
  };

  const handleCategoryChange = (next: UserCategory) => {
    setCategory(next);
    setPage(1);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(1);
  };

  const handleDateFilter = (value: string) => {
    setDateFilter(value);
    setPage(1);
  };

  const handleRefresh = () => {
    setSortField(null);
    setSortDir("asc");
    setSearchTerm("");
    setDateFilter("");
    setPage(1);
    void load(category);
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.warning("Экспорт хийх хэрэглэгч байхгүй байна.");
      return;
    }
    try {
      const rows = filtered.map((u) => ({
        ID: u.id,
        Овог: u.last_name || "Байхгүй",
        Нэр: u.first_name || "Байхгүй",
        "Регистрийн дугаар": u.registration_number || "Байхгүй",
        "Алтны хэмжээ": `${u.balance.gold} гр`,
        "Мөнгөний хэмжээ": `${u.balance.silver} гр`,
        "И-мэйл хаяг": u.email || "Байхгүй",
        Утас: u.phone || "Байхгүй",
        Огноо: formatTimestamp(u.created_at) || "Байхгүй",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 30 },
        { wch: 15 },
        { wch: 20 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Хэрэглэгчид");
      const today = new Date().toISOString().split("T")[0];
      let suffix = "";
      if (searchTerm) suffix += "_хайлт";
      if (dateFilter) suffix += "_огноо";
      const filename = `Хэрэглэгчдийн_жагсаалт_${today}${suffix}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success(`${rows.length} хэрэглэгч экспортлогдлоо.`, {
        description: filename,
      });
    } catch (err) {
      console.error("Excel export error:", err);
      toast.error("Excel файл үүсгэхэд алдаа гарлаа.");
    }
  };

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-[18px] font-semibold text-foreground">Хэрэглэгчид</h1>
        <p className="text-[12px] text-muted-foreground">
          Хэрэглэгчид <span className="text-foreground/70">/ Жагсаалт</span>
        </p>
      </header>

      <div className="rounded-xl border border-border-light bg-card">
        {/* Action bar */}
        <div className="flex flex-col gap-2 border-b border-border-light px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[14px] font-semibold text-foreground">
            Хэрэглэгчдийн жагсаалт
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
        <div className="grid gap-3 border-b border-border-light px-4 py-3 sm:grid-cols-12">
          <div className="sm:col-span-6">
            <Input
              type="search"
              placeholder="Нэр, и-мэйл, утас, регистр..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="sm:col-span-3">
            <Select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value as UserCategory)}
            >
              <option value="has_gold">Алттай хэрэглэгч</option>
              <option value="others">Бусад хэрэглэгч</option>
            </Select>
          </div>
          <div className="sm:col-span-3">
            <div className="flex items-stretch gap-1">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => handleDateFilter(e.target.value)}
                className="flex-1"
              />
              {dateFilter && (
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => handleDateFilter("")}
                  aria-label="Огноо цэвэрлэх"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10">
              <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
              <p className="text-[12px] text-muted-foreground">
                Хэрэглэгчдийн мэдээлэл ачааллаж байна…
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-[13px]">
                <thead>
                  <tr className="border-b border-border-light text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    <th className="px-2 py-2 text-left font-medium">№</th>
                    <SortableHeader
                      label="Хэрэглэгч"
                      field="name"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Утас / И-мэйл"
                      field="phone"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Регистр"
                      field="registration_number"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Алт"
                      field="gold"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                      align="right"
                    />
                    <SortableHeader
                      label="Мөнгө"
                      field="silver"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                      align="right"
                    />
                    <SortableHeader
                      label="Бүртгүүлсэн"
                      field="created_at"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    {canSeeActions && (
                      <th className="px-2 py-2 text-right font-medium">Үйлдэл</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={canSeeActions ? 8 : 7}
                        className="py-10 text-center text-muted-foreground"
                      >
                        <UserX className="mx-auto mb-2 h-6 w-6 opacity-60" />
                        Хэрэглэгч олдсонгүй
                      </td>
                    </tr>
                  )}
                  {pageRows.map((u, i) => (
                    <tr
                      key={u.id}
                      className="border-b border-border-light/60 last:border-b-0 hover:bg-muted/40"
                    >
                      <td className="px-2 py-2 text-muted-foreground tabular-nums">
                        {startIndex + i + 1}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                            {getInitials(u)}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-foreground">
                              {getFullName(u)}
                            </div>
                            <div className="truncate text-[11px] text-muted-foreground">
                              ID: {u.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        {u.phone ? (
                          <div className="font-medium">{u.phone}</div>
                        ) : u.email ? (
                          <div className="font-medium">{u.email}</div>
                        ) : (
                          <div className="text-muted-foreground">
                            Холбоо барих мэдээлэл байхгүй
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">
                        {u.registration_number || "Бүртгэлгүй"}
                      </td>
                      <td className="px-2 py-2 text-right font-medium tabular-nums text-amber-600 dark:text-amber-400">
                        {formatGramShort(u.balance.gold)}
                      </td>
                      <td className="px-2 py-2 text-right font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatGramShort(u.balance.silver)}
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">
                        {formatTimestamp(u.created_at)}
                      </td>
                      {canSeeActions && (
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Дэлгэрэнгүй"
                              onClick={() => setLedgerUser(u)}
                              className="text-primary-600 hover:bg-primary-50"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Reset Pincode"
                              onClick={() => setResetPinUser(u)}
                              className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                            >
                              <Lock className="h-3.5 w-3.5" />
                            </Button>
                            {canMakeInvestment && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Хөрөнгө оруулалт"
                                onClick={() => setInvestmentUser(u)}
                                className="text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10"
                              >
                                <Wallet className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && totalItems > 0 && (
            <Pagination
              startItem={startIndex + 1}
              endItem={endIndex}
              totalItems={totalItems}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>

      <LedgerDialog
        open={!!ledgerUser}
        user={ledgerUser}
        onOpenChange={(o) => !o && setLedgerUser(null)}
      />
      <InvestmentDialog
        open={!!investmentUser}
        user={investmentUser}
        onOpenChange={(o) => !o && setInvestmentUser(null)}
        onCompleted={() => void load(category)}
      />
      <ResetPinDialog
        open={!!resetPinUser}
        user={resetPinUser}
        onOpenChange={(o) => !o && setResetPinUser(null)}
      />
    </div>
  );
}

function sortValue(u: AdminUser, field: SortField): string | number | Date {
  switch (field) {
    case "name":
      return getFullName(u);
    case "phone":
      return u.phone || "";
    case "registration_number":
      return u.registration_number || "";
    case "gold":
      return u.balance.gold;
    case "silver":
      return u.balance.silver;
    case "created_at":
      return u.created_at?.toDate?.() ?? new Date(0);
  }
}

type SortableHeaderProps = {
  label: string;
  field: SortField;
  sortField: SortField | null;
  sortDir: "asc" | "desc";
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

type PaginationProps = {
  startItem: number;
  endItem: number;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function Pagination({
  startItem,
  endItem,
  totalItems,
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const pages = useMemo(() => {
    const max = 5;
    const start = Math.max(1, currentPage - Math.floor(max / 2));
    const end = Math.min(totalPages, start + max - 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-border-light pt-3 text-[12px] sm:flex-row sm:items-center sm:justify-between">
      <div className="text-muted-foreground">
        {startItem}–{endItem}, Нийт: <span className="text-foreground">{totalItems}</span> хэрэглэгч
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Өмнөх
        </Button>
        {pages.map((p) => (
          <Button
            key={p}
            variant={p === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(p)}
            className="min-w-8"
          >
            {p}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Дараах
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
