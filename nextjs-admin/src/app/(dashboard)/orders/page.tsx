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
  fetchOrdersByDateRange,
  type AdminStatus,
  type DateRange,
  type Order,
  type PaymentStatus,
  type ProductFilter,
} from "@/lib/firestore/orders";
import {
  formatMNT0,
  formatMNT2,
  formatOrderDate,
  formatQuantity,
  getAdminStatusBadge,
  getAdminStatusText,
  getClientName,
  getPaymentStatusBadge,
  getPaymentStatusText,
  getProductTypeName,
  getTypeText,
  metalLabel,
} from "@/lib/orders";
import { OrderDetailDialog } from "@/components/orders/OrderDetailDialog";
import { VerifyOrderDialog } from "@/components/orders/VerifyOrderDialog";

type SortField =
  | "client_name"
  | "quantity"
  | "amount"
  | "admin_status"
  | "created_at";

type SortDir = "asc" | "desc";

const ITEMS_PER_PAGE = 20;

const RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "week", label: "7 хоног" },
  { value: "month", label: "Сар" },
  { value: "year", label: "Жил" },
  { value: "all", label: "Бүгд" },
];

export default function OrdersPage() {
  const { adminData } = useAuth();
  const role = adminData?.role ?? null;
  const canExportExcel = role !== "manager";
  const canSeeActions = role !== "manager" && role !== "accountant";

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>("week");
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("success");
  const [adminStatus, setAdminStatus] = useState<AdminStatus>("");
  const [product, setProduct] = useState<ProductFilter>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [verifyOrder, setVerifyOrder] = useState<Order | null>(null);

  const load = useCallback(async (range: DateRange) => {
    setLoading(true);
    try {
      const data = await fetchOrdersByDateRange(range);
      setAllOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
      toast.error("Захиалгуудын мэдээлэл татахад алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(dateRange);
  }, [dateRange, load]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let list = allOrders;

    if (term) {
      list = list.filter((o) => {
        const c = o.client;
        return (
          c?.first_name?.toLowerCase().includes(term) ||
          c?.last_name?.toLowerCase().includes(term) ||
          c?.phone?.includes(term) ||
          c?.email?.toLowerCase().includes(term) ||
          o.id?.toLowerCase().includes(term) ||
          o.qpay_description?.toLowerCase().includes(term)
        );
      });
    }
    if (paymentStatus) {
      list = list.filter((o) => o.payment_status === paymentStatus);
    }
    if (adminStatus) {
      list = list.filter((o) => o.admin_status === adminStatus);
    }
    if (product) {
      const metalId = product === "gold" ? 1 : 3;
      list = list.filter((o) => o.metal_id === metalId);
    }
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : null;
      if (start) start.setHours(0, 0, 0, 0);
      const end = endDate ? new Date(endDate) : null;
      if (end) end.setHours(23, 59, 59, 999);
      list = list.filter((o) => {
        const d = o.created_at?.toDate?.();
        if (!d) return false;
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
      });
    }

    const dir = sortDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      const va = orderSortValue(a, sortField);
      const vb = orderSortValue(b, sortField);
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
    allOrders,
    searchTerm,
    paymentStatus,
    adminStatus,
    product,
    startDate,
    endDate,
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

  const handleSearch = (v: string) => {
    setSearchTerm(v);
    setPage(1);
  };
  const handlePayment = (v: PaymentStatus) => {
    setPaymentStatus(v);
    setPage(1);
  };
  const handleAdmin = (v: AdminStatus) => {
    setAdminStatus(v);
    setPage(1);
  };
  const handleProduct = (v: ProductFilter) => {
    setProduct(v);
    setPage(1);
  };
  const handleStart = (v: string) => {
    setStartDate(v);
    setPage(1);
  };
  const handleEnd = (v: string) => {
    setEndDate(v);
    setPage(1);
  };
  const handleDateRange = (v: DateRange) => {
    setDateRange(v);
    setPage(1);
  };
  const handleRefresh = () => {
    setPage(1);
    void load(dateRange);
  };
  const clearDateRange = () => {
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const hasAnyFilter =
    !!searchTerm ||
    !!paymentStatus ||
    !!adminStatus ||
    !!product ||
    !!startDate ||
    !!endDate;

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.warning("Экспорт хийх захиалга байхгүй байна.");
      return;
    }
    try {
      const rows = filtered.map((o) => ({
        "Захиалгын ID": o.id,
        "Гүйлгээний утга": `ORDER-${o.id}`,
        "Хуучин гүйлгээний утга": o.qpay_description || "",
        "Харилцагчийн нэр": getClientName(o),
        Утас: o.client?.phone || "Байхгүй",
        "И-мэйл": o.client?.email || "Байхгүй",
        "Төрөл": getTypeText(o.type),
        Металл: metalLabel(o.metal_id),
        "Бүтээгдэхүүн төрөл": getProductTypeName(o.prod_type),
        "Дүн": o.amount ?? 0,
        "Тоо хэмжээ": o.quantity ?? 0,
        "Үнэ": o.price ?? 0,
        "Төлөв": getAdminStatusText(o.admin_status),
        "Төлбөрийн төлөв": o.payment_status || "",
        Огноо: formatOrderDate(o.created_at),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [
        { wch: 25 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
        { wch: 25 },
        { wch: 10 },
        { wch: 10 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Захиалгууд");
      const today = new Date().toISOString().split("T")[0];
      let suffix = "";
      if (searchTerm) suffix += "_хайлт";
      if (paymentStatus || adminStatus || product) suffix += "_шүүлт";
      if (startDate || endDate) suffix += "_огноо";
      const filename = `Захиалгуудын_жагсаалт_${today}${suffix}.xlsx`;
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
        <h1 className="text-[18px] font-semibold text-foreground">Захиалгууд</h1>
        <p className="text-[12px] text-muted-foreground">
          Захиалгууд <span className="text-foreground/70">/ Жагсаалт</span>
        </p>
      </header>

      <div className="rounded-xl border border-border-light bg-card">
        {/* Action bar */}
        <div className="flex flex-col gap-3 border-b border-border-light px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-[14px] font-semibold text-foreground">
            Захиалгын жагсаалт
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center overflow-hidden rounded-lg border border-border-light bg-background">
              {RANGE_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => handleDateRange(r.value)}
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
              placeholder="Нэр, утас, ID, QPay…"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="lg:col-span-2">
            <FieldLabel>Төлбөрийн төлөв</FieldLabel>
            <Select
              value={paymentStatus}
              onChange={(e) => handlePayment(e.target.value as PaymentStatus)}
            >
              <option value="">Бүгд</option>
              <option value="pending">Хүлээгдэж буй</option>
              <option value="success">Төлсөн</option>
            </Select>
          </div>
          <div className="lg:col-span-2">
            <FieldLabel>Админ төлөв</FieldLabel>
            <Select
              value={adminStatus}
              onChange={(e) => handleAdmin(e.target.value as AdminStatus)}
            >
              <option value="">Бүгд</option>
              <option value="pending">Хүлээгдэж буй</option>
              <option value="success">Баталгаажсан</option>
            </Select>
          </div>
          <div className="lg:col-span-2">
            <FieldLabel>Бүтээгдэхүүн</FieldLabel>
            <Select
              value={product}
              onChange={(e) => handleProduct(e.target.value as ProductFilter)}
            >
              <option value="">Бүгд</option>
              <option value="gold">Алт</option>
              <option value="silver">Мөнгө</option>
            </Select>
          </div>
          <div className="lg:col-span-3">
            <FieldLabel>Огноо (эхлэх / дуусах)</FieldLabel>
            <div className="flex items-stretch gap-1">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => handleStart(e.target.value)}
                className="flex-1"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => handleEnd(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon-sm"
                onClick={clearDateRange}
                disabled={!startDate && !endDate}
                aria-label="Огноо цэвэрлэх"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Info bar */}
        <div className="border-b border-border-light px-4 py-2 text-[12px] text-muted-foreground">
          Нийт: <span className="font-medium text-foreground">{totalItems}</span> захиалга
          {hasAnyFilter && <span className="ml-1">(шүүлтийн дүн)</span>}
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
              <p className="text-[12px] text-muted-foreground">
                Захиалгуудын мэдээлэл ачааллаж байна…
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-[13px]">
                <thead>
                  <tr className="border-b border-border-light text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    <SortableHeader
                      label="Харилцагч"
                      field="client_name"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Тоо хэмжээ"
                      field="quantity"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <th className="px-2 py-2 text-left font-medium">Бүтээгдэхүүн</th>
                    <th className="px-2 py-2 text-right font-medium">Үнэ</th>
                    <SortableHeader
                      label="Нийт дүн"
                      field="amount"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                      align="right"
                    />
                    <th className="px-2 py-2 text-left font-medium">Төлбөр</th>
                    <SortableHeader
                      label="Админ төлөв"
                      field="admin_status"
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
                    {canSeeActions && (
                      <th className="px-2 py-2 text-right font-medium">Үйлдэл</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={canSeeActions ? 9 : 8}
                        className="py-12 text-center text-muted-foreground"
                      >
                        <Inbox className="mx-auto mb-2 h-6 w-6 opacity-60" />
                        {hasAnyFilter
                          ? "Шүүлтийн нөхцөлд тохирох захиалга олдсонгүй."
                          : "Захиалга байхгүй байна."}
                      </td>
                    </tr>
                  )}
                  {pageRows.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-border-light/60 last:border-b-0 hover:bg-muted/40"
                    >
                      <td className="px-2 py-2 align-top">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 truncate font-medium text-foreground">
                            <span className="truncate">{getClientName(o)}</span>
                            {o.is_extraOrder && (
                              <span className="rounded bg-rose-100 px-1 py-px text-[9px] font-semibold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                                Онцгой
                              </span>
                            )}
                          </div>
                          <div className="truncate text-[11px] text-muted-foreground">
                            {o.client?.phone || o.client?.email || "Холбоо барих мэдээлэл байхгүй"}
                          </div>
                          {!o.is_extraOrder && (
                            <div className="truncate text-[10px] text-muted-foreground/80">
                              QPAY: ORDER-{o.id}
                            </div>
                          )}
                          {o.description && (
                            <div className="truncate text-[10px] text-muted-foreground/80">
                              {o.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2 align-top">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                            o.metal_id === 1
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300"
                          )}
                        >
                          {metalLabel(o.metal_id)}:{" "}
                          {formatQuantity(o.metal_id, o.quantity)}
                        </span>
                      </td>
                      <td className="px-2 py-2 align-top">
                        <span className="inline-flex items-center rounded-md bg-sky-100 px-1.5 py-0.5 text-[11px] font-medium text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                          {getProductTypeName(o.prod_type)}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right align-top tabular-nums">
                        {formatMNT2(o.price)}
                      </td>
                      <td className="px-2 py-2 text-right align-top font-semibold tabular-nums">
                        {formatMNT0(o.amount)}
                      </td>
                      <td className="px-2 py-2 align-top">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                            getPaymentStatusBadge(o.payment_status)
                          )}
                        >
                          {getPaymentStatusText(o.payment_status)}
                        </span>
                      </td>
                      <td className="px-2 py-2 align-top">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                            getAdminStatusBadge(o.admin_status)
                          )}
                        >
                          {getAdminStatusText(o.admin_status)}
                        </span>
                      </td>
                      <td className="px-2 py-2 align-top text-[11px] text-muted-foreground tabular-nums">
                        {formatOrderDate(o.created_at)}
                      </td>
                      {canSeeActions && (
                        <td className="px-2 py-2 align-top">
                          <div className="flex items-center justify-end gap-1">
                            {o.admin_status === "success" && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Дэлгэрэнгүй"
                                onClick={() => setDetailOrder(o)}
                                className="text-primary-600 hover:bg-primary-50"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {o.admin_status === "pending" && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Баталгаажуулах"
                                onClick={() => setVerifyOrder(o)}
                                className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                              >
                                <Check className="h-3.5 w-3.5" />
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

      <OrderDetailDialog
        open={!!detailOrder}
        order={detailOrder}
        onOpenChange={(o) => !o && setDetailOrder(null)}
      />
      <VerifyOrderDialog
        open={!!verifyOrder}
        order={verifyOrder}
        onOpenChange={(o) => !o && setVerifyOrder(null)}
        onCompleted={() => void load(dateRange)}
      />
    </div>
  );
}

function orderSortValue(o: Order, field: SortField): string | number | Date {
  switch (field) {
    case "client_name":
      return getClientName(o).toLowerCase();
    case "quantity":
      return o.quantity ?? 0;
    case "amount":
      return o.amount ?? 0;
    case "admin_status":
      return o.admin_status ?? "";
    case "created_at":
      return o.created_at?.toDate?.() ?? new Date(0);
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
