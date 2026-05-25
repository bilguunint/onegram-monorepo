"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Gift,
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
  fetchGiftOrders,
  type GiftOrder,
  type GiftStatus,
} from "@/lib/firestore/giftOrders";
import {
  getReceiverName,
  getSenderName,
  giftStatusBadge,
  giftStatusText,
} from "@/lib/giftOrders";
import { formatOrderDate, formatQuantity, metalLabel } from "@/lib/orders";

type MetalFilter = "gold" | "silver" | "";
type SortField =
  | "sender_name"
  | "receiver_name"
  | "quantity"
  | "status"
  | "created_at";
type SortDir = "asc" | "desc";

const ITEMS_PER_PAGE = 20;

export default function GiftOrdersPage() {
  const { adminData } = useAuth();
  const canExportExcel = adminData?.role !== "manager";

  const [allOrders, setAllOrders] = useState<GiftOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<GiftStatus>("");
  const [metal, setMetal] = useState<MetalFilter>("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchGiftOrders();
      setAllOrders(data);
    } catch (err) {
      console.error("Error fetching gift orders:", err);
      toast.error("Бэлгийн захиалгуудын мэдээлэл татахад алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let list = allOrders;

    if (term) {
      list = list.filter((o) => {
        const s = o.sender;
        const r = o.receiver;
        return (
          s?.first_name?.toLowerCase().includes(term) ||
          s?.last_name?.toLowerCase().includes(term) ||
          r?.first_name?.toLowerCase().includes(term) ||
          r?.last_name?.toLowerCase().includes(term) ||
          s?.phone?.includes(term) ||
          r?.phone?.includes(term) ||
          o.id?.toLowerCase().includes(term) ||
          o.greeting?.toLowerCase().includes(term)
        );
      });
    }
    if (status) {
      list = list.filter((o) => o.status === status);
    }
    if (metal) {
      const metalId = metal === "gold" ? 1 : 3;
      list = list.filter((o) => o.metal_id === metalId);
    }
    if (dateFilter) {
      const target = new Date(dateFilter).toDateString();
      list = list.filter(
        (o) => o.created_at?.toDate?.()?.toDateString() === target
      );
    }

    const dir = sortDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      const va = giftSortValue(a, sortField);
      const vb = giftSortValue(b, sortField);
      if (typeof va === "string" && typeof vb === "string") {
        return va.toLowerCase().localeCompare(vb.toLowerCase(), "mn") * dir;
      }
      if (va instanceof Date && vb instanceof Date) {
        return (va.getTime() - vb.getTime()) * dir;
      }
      return ((va as number) - (vb as number)) * dir;
    });
    return list;
  }, [allOrders, searchTerm, status, metal, dateFilter, sortField, sortDir]);

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
  const handleStatus = (v: GiftStatus) => { setStatus(v); setPage(1); };
  const handleMetal = (v: MetalFilter) => { setMetal(v); setPage(1); };
  const handleDate = (v: string) => { setDateFilter(v); setPage(1); };
  const handleRefresh = () => { setPage(1); void load(); };

  const hasAnyFilter = !!searchTerm || !!status || !!metal || !!dateFilter;

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.warning("Экспорт хийх бэлгийн захиалга байхгүй байна.");
      return;
    }
    try {
      const rows = filtered.map((o) => ({
        "Бэлгийн захиалгын ID": o.id,
        "Илгээгч нэр": getSenderName(o),
        "Илгээгч утас": o.sender?.phone || "Байхгүй",
        "Илгээгч и-мэйл": o.sender?.email || "Байхгүй",
        "Хүлээн авагч нэр": getReceiverName(o),
        "Хүлээн авагч утас": o.receiver?.phone || "Байхгүй",
        "Хүлээн авагч и-мэйл": o.receiver?.email || "Байхгүй",
        "Металл төрөл": metalLabel(o.metal_id),
        "Тоо хэмжээ": o.quantity ?? 0,
        Мэндчилгээ: o.greeting || "Байхгүй",
        "Төлөв": giftStatusText(o.status),
        "Үүсгэсэн огноо": formatOrderDate(o.created_at),
        "Шинэчилсэн огноо": formatOrderDate(o.updated_at),
        "Цуцалсан огноо": formatOrderDate(o.cancelled_at),
        "Хүлээн авсан огноо": formatOrderDate(o.received_at),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [
        { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 25 },
        { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 12 },
        { wch: 12 }, { wch: 30 }, { wch: 15 }, { wch: 20 },
        { wch: 20 }, { wch: 20 }, { wch: 20 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Бэлгийн захиалгууд");
      const today = new Date().toISOString().split("T")[0];
      const filename = `Бэлгийн_захиалгуудын_жагсаалт_${today}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success(`${rows.length} захиалга экспортлогдлоо.`, {
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
          Бэлгийн захиалгууд
        </h1>
        <p className="text-[12px] text-muted-foreground">
          Бэлгийн захиалгууд <span className="text-foreground/70">/ Жагсаалт</span>
        </p>
      </header>

      <div className="rounded-xl border border-border-light bg-card">
        {/* Action bar */}
        <div className="flex flex-col gap-3 border-b border-border-light px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[14px] font-semibold text-foreground">
            Бэлгийн захиалгын жагсаалт
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
          <div className="lg:col-span-5">
            <FieldLabel>Хайх</FieldLabel>
            <Input
              type="search"
              placeholder="Илгээгч/хүлээн авагчийн нэр, утас, мэндчилгээ…"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="lg:col-span-2">
            <FieldLabel>Төлөв</FieldLabel>
            <Select
              value={status}
              onChange={(e) => handleStatus(e.target.value as GiftStatus)}
            >
              <option value="">Бүгд</option>
              <option value="pending">Хүлээгдэж буй</option>
              <option value="received">Хүлээн авсан</option>
              <option value="cancelled">Цуцалсан</option>
            </Select>
          </div>
          <div className="lg:col-span-2">
            <FieldLabel>Металл</FieldLabel>
            <Select
              value={metal}
              onChange={(e) => handleMetal(e.target.value as MetalFilter)}
            >
              <option value="">Бүгд</option>
              <option value="gold">Алт</option>
              <option value="silver">Мөнгө</option>
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
          Нийт: <span className="font-medium text-foreground">{totalItems}</span> бэлгийн захиалга
          {hasAnyFilter && <span className="ml-1">(шүүлтийн дүн)</span>}
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
              <p className="text-[12px] text-muted-foreground">
                Бэлгийн захиалгуудын мэдээлэл ачааллаж байна…
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-[13px]">
                <thead>
                  <tr className="border-b border-border-light text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    <SortableHeader
                      label="Илгээгч"
                      field="sender_name"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Хүлээн авагч"
                      field="receiver_name"
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
                    <th className="px-2 py-2 text-left font-medium">Мэндчилгээ</th>
                    <SortableHeader
                      label="Төлөв"
                      field="status"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Огноо"
                      field="created_at"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-muted-foreground"
                      >
                        <Inbox className="mx-auto mb-2 h-6 w-6 opacity-60" />
                        {hasAnyFilter
                          ? "Шүүлтийн нөхцөлд тохирох бэлгийн захиалга олдсонгүй."
                          : "Бэлгийн захиалга байхгүй байна."}
                      </td>
                    </tr>
                  )}
                  {pageRows.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-border-light/60 last:border-b-0 hover:bg-muted/40"
                    >
                      <td className="px-2 py-2 align-top">
                        <PartyCell name={getSenderName(o)} party={o.sender} />
                      </td>
                      <td className="px-2 py-2 align-top">
                        <PartyCell name={getReceiverName(o)} party={o.receiver} />
                      </td>
                      <td className="px-2 py-2 align-top">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                            o.metal_id === 1
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                              : o.metal_id === 3
                                ? "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300"
                                : "bg-muted text-muted-foreground"
                          )}
                        >
                          {metalLabel(o.metal_id)}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right align-top font-semibold tabular-nums">
                        {formatQuantity(o.metal_id, o.quantity)}
                      </td>
                      <td className="px-2 py-2 align-top">
                        <div
                          className="line-clamp-2 max-w-[240px] text-[12px] text-foreground/80"
                          title={o.greeting || ""}
                        >
                          {o.greeting ? (
                            <span className="inline-flex items-start gap-1">
                              <Gift className="mt-0.5 h-3 w-3 shrink-0 text-primary-500" />
                              <span>{o.greeting}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Мэндчилгээ байхгүй
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2 align-top">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                            giftStatusBadge(o.status)
                          )}
                        >
                          {giftStatusText(o.status)}
                        </span>
                      </td>
                      <td className="px-2 py-2 align-top text-[11px] tabular-nums">
                        <div className="text-muted-foreground">
                          {formatOrderDate(o.created_at)}
                        </div>
                        {o.cancelled_at && (
                          <div className="mt-0.5 text-rose-600 dark:text-rose-400">
                            Цуцалсан: {formatOrderDate(o.cancelled_at)}
                          </div>
                        )}
                        {o.received_at && (
                          <div className="mt-0.5 text-emerald-600 dark:text-emerald-400">
                            Хүлээн авсан: {formatOrderDate(o.received_at)}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
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
    </div>
  );
}

function giftSortValue(o: GiftOrder, field: SortField): string | number | Date {
  switch (field) {
    case "sender_name":
      return getSenderName(o).toLowerCase();
    case "receiver_name":
      return getReceiverName(o).toLowerCase();
    case "quantity":
      return o.quantity ?? 0;
    case "status":
      return o.status ?? "";
    case "created_at":
      return o.created_at?.toDate?.() ?? new Date(0);
  }
}

function PartyCell({
  name,
  party,
}: {
  name: string;
  party: GiftOrder["sender"];
}) {
  return (
    <div className="min-w-0">
      <div className="truncate font-medium text-foreground">{name}</div>
      {party?.phone && (
        <div className="truncate text-[11px] text-muted-foreground">
          {party.phone}
        </div>
      )}
      {!party?.phone && party?.email && (
        <div className="truncate text-[11px] text-muted-foreground">
          {party.email}
        </div>
      )}
    </div>
  );
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
