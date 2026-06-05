"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Timestamp } from "firebase/firestore";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Loader2,
  Package,
  PackageCheck,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  fetchAllProductPurchases,
  type ProductPurchase,
  type ProductPurchaseStatus,
} from "@/lib/firestore/productPurchases";
import {
  formatPriceMNT,
  getPurchaseUserName,
  purchaseDaysBehind,
  purchaseDaysSinceLastPayment,
  purchaseDaysUntilDeadline,
  purchaseExpectedPaidDays,
  purchaseIsOverdue,
  purchaseLastPaidAt,
  purchaseProgress,
  purchaseStatusBadge,
  purchaseStatusText,
  OVERDUE_GAP_DAYS,
} from "@/lib/products";
import { formatOrderDate } from "@/lib/orders";
import { CancelPurchaseDialog } from "@/components/products/CancelPurchaseDialog";
import { DeliverPurchaseDialog } from "@/components/products/DeliverPurchaseDialog";

const ITEMS_PER_PAGE = 20;

export default function ProductPurchasesPage() {
  const { adminData } = useAuth();
  const role = adminData?.role ?? null;
  // Accountant is view/export-only — no deliver/cancel actions.
  const canSeeActions = role !== "accountant";

  const [items, setItems] = useState<ProductPurchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "" | ProductPurchaseStatus | "overdue"
  >("");
  const [page, setPage] = useState(1);

  const [cancelTarget, setCancelTarget] = useState<ProductPurchase | null>(
    null
  );
  const [deliverTarget, setDeliverTarget] = useState<ProductPurchase | null>(
    null
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllProductPurchases();
      setItems(data);
    } catch (err) {
      console.error(err);
      toast.error("Худалдан авалт ачааллахад алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = items;
    if (term) {
      list = list.filter((p) => {
        const u = p.user_snapshot;
        return (
          p.product_snapshot.name.toLowerCase().includes(term) ||
          u.first_name?.toLowerCase().includes(term) ||
          u.last_name?.toLowerCase().includes(term) ||
          u.phone?.includes(term) ||
          u.email?.toLowerCase().includes(term) ||
          p.id.toLowerCase().includes(term)
        );
      });
    }
    if (statusFilter === "overdue") {
      list = list.filter((p) => purchaseIsOverdue(p));
    } else if (statusFilter) {
      list = list.filter((p) => p.status === statusFilter);
    }
    return list;
  }, [items, search, statusFilter]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const pageRows = filtered.slice(startIndex, endIndex);

  const pages = useMemo(() => {
    const max = 5;
    const start = Math.max(1, currentPage - Math.floor(max / 2));
    const end = Math.min(totalPages, start + max - 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };
  const handleStatus = (v: "" | ProductPurchaseStatus | "overdue") => {
    setStatusFilter(v);
    setPage(1);
  };

  // Overdue count for the filter chip — active plans with no payment for
  // OVERDUE_GAP_DAYS+ days.
  const overdueCount = useMemo(
    () => items.filter((p) => purchaseIsOverdue(p)).length,
    [items]
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-[18px] font-semibold text-foreground">
            Бараа худалдан авалт
          </h1>
          <p className="text-[12px] text-muted-foreground">
            Хуваан төлж буй худалдан авалтуудын progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => void load()}
            aria-label="Шинэчлэх"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", loading && "animate-spin")}
            />
          </Button>
        </div>
      </header>

      <div className="rounded-xl border border-border-light bg-card">
        <div className="grid gap-3 border-b border-border-light px-4 py-3 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Хайх
            </div>
            <Input
              type="search"
              placeholder="Бараа, хэрэглэгчийн нэр, утас, и-мэйл, ID…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="lg:col-span-5">
            <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Төлөв
            </div>
            <Select
              value={statusFilter}
              onChange={(e) =>
                handleStatus(
                  e.target.value as "" | ProductPurchaseStatus | "overdue"
                )
              }
            >
              <option value="">Бүгд</option>
              <option value="active">Идэвхтэй</option>
              <option value="overdue">
                {OVERDUE_GAP_DAYS}+ хоног төлбөргүй ({overdueCount})
              </option>
              <option value="completed">Төлөгдсөн</option>
              <option value="delivered">Хүлээлгэн өгсөн</option>
              <option value="cancelled">Цуцалсан</option>
            </Select>
          </div>
        </div>

        <div className="border-b border-border-light px-4 py-2 text-[12px] text-muted-foreground">
          Нийт:{" "}
          <span className="font-medium text-foreground">{totalItems}</span>{" "}
          худалдан авалт
        </div>

        <div className="px-4 py-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
              <p className="text-[12px] text-muted-foreground">
                Ачааллаж байна…
              </p>
            </div>
          ) : pageRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <Inbox className="h-6 w-6 opacity-60" />
              <p className="text-[12px]">Худалдан авалт байхгүй байна.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-[13px]">
                <thead>
                  <tr className="border-b border-border-light text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    <th className="px-2 py-2 text-left font-medium">Бараа</th>
                    <th className="px-2 py-2 text-left font-medium">Хэрэглэгч</th>
                    <th className="px-2 py-2 text-right font-medium">
                      Төлсөн / Нийт
                    </th>
                    <th className="px-2 py-2 text-left font-medium">Progress</th>
                    <th className="px-2 py-2 text-left font-medium">Огноо</th>
                    <th className="px-2 py-2 text-left font-medium">Төлөв</th>
                    {canSeeActions && (
                      <th className="px-2 py-2 text-right font-medium">Үйлдэл</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((p) => {
                    const progress = purchaseProgress(p);
                    const expected = purchaseExpectedPaidDays(p);
                    const behind = purchaseDaysBehind(p);
                    const daysLeft = purchaseDaysUntilDeadline(p);
                    const lastPaid = purchaseLastPaidAt(p);
                    const gap = purchaseDaysSinceLastPayment(p);
                    const overdue = purchaseIsOverdue(p);
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-border-light/60 last:border-b-0 hover:bg-muted/40"
                      >
                        <td className="px-2 py-2">
                          <Link
                            href={`/products/${p.product_id}`}
                            className="flex items-center gap-2"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                              {p.product_snapshot.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={p.product_snapshot.image}
                                  alt={p.product_snapshot.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package className="h-4 w-4 text-muted-foreground" />
                              )}
                            </span>
                            <div className="min-w-0">
                              <div className="truncate font-medium text-foreground hover:text-primary-600">
                                {p.product_snapshot.name}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                <span className="font-medium text-foreground/80">
                                  {formatPriceMNT(p.daily_payment)}
                                </span>
                                {" / өдөр"}
                                <span className="text-foreground/40"> · </span>
                                {p.months} сар ({p.total_days} өдөр)
                              </div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-2 py-2">
                          <div className="font-medium text-foreground">
                            {getPurchaseUserName(p)}
                          </div>
                          {p.user_snapshot.phone && (
                            <div className="truncate text-[11px] text-muted-foreground">
                              {p.user_snapshot.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums">
                          <div className="font-semibold text-primary-600">
                            {formatPriceMNT(p.paid_amount)}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {formatPriceMNT(p.total_price)}
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn(
                                  "h-full transition-[width]",
                                  p.status === "cancelled"
                                    ? "bg-rose-500"
                                    : p.status === "delivered"
                                      ? "bg-primary"
                                      : p.status === "completed"
                                        ? "bg-emerald-500"
                                        : "bg-sky-500"
                                )}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                              {progress}%
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <span>
                              {p.paid_days}/{p.total_days} өдөр
                            </span>
                            {p.status === "active" &&
                              expected != null &&
                              expected !== p.paid_days && (
                                <span
                                  className={cn(
                                    "text-foreground/60",
                                    behind && behind > 0
                                      ? "text-rose-600 dark:text-rose-400"
                                      : ""
                                  )}
                                >
                                  · төл-х: {expected}
                                </span>
                              )}
                          </div>
                          {p.status === "active" && behind != null && behind > 0 && (
                            <div className="mt-1 inline-flex items-center rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                              {behind} өдөр хоцорсон
                            </div>
                          )}
                          {overdue && gap != null && (
                            <div className="mt-1 inline-flex items-center rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold text-white dark:bg-rose-600">
                              {gap} хоног төлбөргүй
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2 text-[11px] tabular-nums">
                          <div className="text-muted-foreground">
                            Эхэлсэн: {formatOrderDate(p.started_at)}
                          </div>
                          {p.deadline && (
                            <div
                              className={cn(
                                "text-muted-foreground",
                                p.status === "active" &&
                                  daysLeft != null &&
                                  daysLeft < 0
                                  ? "text-rose-600 dark:text-rose-400 font-medium"
                                  : ""
                              )}
                            >
                              Дуусах: {formatOrderDate(p.deadline)}
                              {p.status === "active" &&
                                daysLeft != null &&
                                daysLeft >= 0 && (
                                  <span className="text-foreground/40">
                                    {" "}
                                    · {daysLeft} өдөр
                                  </span>
                                )}
                            </div>
                          )}
                          {lastPaid && (
                            <div className="text-foreground/40">
                              Сүүлд: {formatOrderDate(
                                Timestamp.fromDate(lastPaid)
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                              purchaseStatusBadge(p.status)
                            )}
                          >
                            {purchaseStatusText(p.status)}
                          </span>
                        </td>
                        {canSeeActions && (
                          <td className="px-2 py-2">
                            <div className="flex items-center justify-end gap-1">
                              {p.status === "completed" && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  title="Хүлээлгэн өгөх"
                                  onClick={() => setDeliverTarget(p)}
                                  className="text-primary-600 hover:bg-primary-50"
                                >
                                  <PackageCheck className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {(p.status === "active" ||
                                p.status === "completed") && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  title="Цуцлах"
                                  onClick={() => setCancelTarget(p)}
                                  className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {p.status === "delivered" && (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
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

      <CancelPurchaseDialog
        open={!!cancelTarget}
        purchase={cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
        onCompleted={() => void load()}
      />
      <DeliverPurchaseDialog
        open={!!deliverTarget}
        purchase={deliverTarget}
        onOpenChange={(o) => !o && setDeliverTarget(null)}
        onCompleted={() => void load()}
      />
    </div>
  );
}
