"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Inbox,
  Loader2,
  Package,
  Pencil,
  Plus,
  Power,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  fetchProducts,
  setProductStatus,
  type Product,
  type ProductStatus,
} from "@/lib/firestore/products";
import {
  formatPriceMNT,
  productStatusBadge,
  productStatusText,
} from "@/lib/products";

export default function ProductsPage() {
  const { adminData } = useAuth();
  const role = adminData?.role ?? null;
  // Accountant is view-only — no create/edit/status actions.
  const canSeeActions = role !== "accountant";

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ProductStatus>("");
  const [pendingToggle, setPendingToggle] = useState<Product | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProducts();
      setItems(data);
    } catch (err) {
      console.error("Error fetching products:", err);
      toast.error("Бараа ачааллахад алдаа гарлаа.");
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
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.description ?? "").toLowerCase().includes(term)
      );
    }
    if (statusFilter) {
      list = list.filter((p) => p.status === statusFilter);
    }
    return list;
  }, [items, search, statusFilter]);

  const handleToggleStatus = async () => {
    const p = pendingToggle;
    if (!p) return;
    const next: ProductStatus = p.status === "active" ? "inactive" : "active";
    setTogglingId(p.id);
    try {
      await setProductStatus(p.id, next);
      setItems((arr) =>
        arr.map((it) => (it.id === p.id ? { ...it, status: next } : it))
      );
      toast.success(
        next === "active"
          ? "Бараа идэвхжүүлэгдлээ."
          : "Бараа идэвхгүй болголоо."
      );
    } catch (err) {
      console.error(err);
      toast.error("Төлөв солиход алдаа гарлаа.");
    } finally {
      setTogglingId(null);
      setPendingToggle(null);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-[18px] font-semibold text-foreground">Бараа</h1>
          <p className="text-[12px] text-muted-foreground">
            Хувааж төлдөг бараануудын каталог
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canSeeActions && (
            <Button render={<Link href="/products/new" />} size="sm">
              <Plus className="h-3.5 w-3.5" />
              Шинэ бараа
            </Button>
          )}
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
          <div className="lg:col-span-8">
            <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Хайх
            </div>
            <Input
              type="search"
              placeholder="Барааны нэр, тайлбар…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="lg:col-span-4">
            <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Төлөв
            </div>
            <Select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "" | ProductStatus)
              }
            >
              <option value="">Бүгд</option>
              <option value="active">Идэвхтэй</option>
              <option value="inactive">Идэвхгүй</option>
            </Select>
          </div>
        </div>

        <div className="border-b border-border-light px-4 py-2 text-[12px] text-muted-foreground">
          Нийт:{" "}
          <span className="font-medium text-foreground">{filtered.length}</span>{" "}
          бараа
        </div>

        <div className="px-4 py-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
              <p className="text-[12px] text-muted-foreground">
                Ачааллаж байна…
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <Inbox className="h-6 w-6 opacity-60" />
              <p className="text-[12px]">
                {items.length === 0
                  ? "Бараа байхгүй байна. Шинэ бараа нэмнэ үү."
                  : "Шүүлтийн нөхцөлд тохирох бараа олдсонгүй."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-[13px]">
                <thead>
                  <tr className="border-b border-border-light text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    <th className="px-2 py-2 text-left font-medium">Бараа</th>
                    <th className="px-2 py-2 text-right font-medium">Үнэ</th>
                    <th className="px-2 py-2 text-center font-medium">Сар</th>
                    <th className="px-2 py-2 text-center font-medium">Stock</th>
                    <th className="px-2 py-2 text-left font-medium">Төлөв</th>
                    {canSeeActions && (
                      <th className="px-2 py-2 text-right font-medium">Үйлдэл</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border-light/60 last:border-b-0 hover:bg-muted/40"
                    >
                      <td className="px-2 py-2">
                        <Link
                          href={`/products/${p.id}`}
                          className="flex items-center gap-2.5"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                            {p.images[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-4 w-4 text-muted-foreground" />
                            )}
                          </span>
                          <div className="min-w-0 max-w-[280px]">
                            <div className="truncate font-medium text-foreground hover:text-primary-600">
                              {p.name || "—"}
                            </div>
                            {p.description && (
                              <div className="truncate text-[11px] text-muted-foreground">
                                {p.description}
                              </div>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-2 py-2 text-right font-semibold tabular-nums text-primary-600">
                        {formatPriceMNT(p.price)}
                      </td>
                      <td className="px-2 py-2 text-center text-[12px] tabular-nums">
                        {p.min_months === p.max_months
                          ? `${p.max_months}`
                          : `${p.min_months}-${p.max_months}`}
                      </td>
                      <td className="px-2 py-2 text-center text-[12px] tabular-nums">
                        {p.stock == null ? (
                          <span className="text-muted-foreground">∞</span>
                        ) : (
                          p.stock
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                            productStatusBadge(p.status)
                          )}
                        >
                          {productStatusText(p.status)}
                        </span>
                      </td>
                      {canSeeActions && (
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Засах"
                              render={<Link href={`/products/${p.id}/edit`} />}
                              className="text-primary-600 hover:bg-primary-50"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title={
                                p.status === "active"
                                  ? "Идэвхгүй болгох"
                                  : "Идэвхжүүлэх"
                              }
                              disabled={togglingId === p.id}
                              onClick={() => setPendingToggle(p)}
                              className={cn(
                                p.status === "active"
                                  ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                  : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                              )}
                            >
                              {togglingId === p.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Power className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingToggle}
        title={
          pendingToggle?.status === "active"
            ? "Барааг идэвхгүй болгох уу?"
            : "Барааг идэвхжүүлэх үү?"
        }
        description={
          pendingToggle ? (
            pendingToggle.status === "active" ? (
              <span>
                <strong>{pendingToggle.name}</strong> бараа хэрэглэгчдэд цаашид
                харагдахгүй болно. Идэвхтэй худалдан авалтад нөлөөлөхгүй.
              </span>
            ) : (
              <span>
                <strong>{pendingToggle.name}</strong> барааг апп дээр идэвхтэй
                болгох гэж байна.
              </span>
            )
          ) : null
        }
        confirmLabel={
          pendingToggle?.status === "active" ? "Идэвхгүй болгох" : "Идэвхжүүлэх"
        }
        destructive={pendingToggle?.status === "active"}
        onOpenChange={(o) => !o && setPendingToggle(null)}
        onConfirm={handleToggleStatus}
        submitting={!!togglingId}
      />
    </div>
  );
}
