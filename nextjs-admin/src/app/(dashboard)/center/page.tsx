"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Coins,
  Heart,
  Images,
  Loader2,
  Package,
  Pencil,
  Plus,
  Power,
  Receipt,
  RefreshCw,
  Target,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatCard } from "@/components/dashboard/StatCard";
import { ImageGalleryInput } from "@/components/products/ImageGalleryInput";
import { CenterProductDialog } from "@/components/center/CenterProductDialog";
import { formatPriceMNT } from "@/lib/products";
import {
  fetchCampaign,
  saveCampaign,
  saveGallery,
  fetchCenterProducts,
  fetchCenterDonations,
  setCenterProductStatus,
  deleteCenterProduct,
  markDonationDelivered,
  computeCenterStats,
  type CenterCampaign,
  type CenterProduct,
  type CenterDonation,
} from "@/lib/firestore/center";

type Tab = "overview" | "orders" | "products" | "gallery" | "settings";
const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Тойм" },
  { key: "orders", label: "Захиалгууд" },
  { key: "products", label: "Бараа" },
  { key: "gallery", label: "Зургийн цомог" },
  { key: "settings", label: "Тохиргоо" },
];

const fmtInt = (n: number) => new Intl.NumberFormat("mn-MN").format(n);
function stockLabel(stock: number | null): string {
  return stock == null ? "Хязгааргүй" : `${fmtInt(stock)} ширхэг`;
}

export default function CenterPage() {
  const { adminData } = useAuth();
  const allowed = adminData?.role === "admin" || adminData?.role === "manager";

  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState<CenterCampaign | null>(null);
  const [products, setProducts] = useState<CenterProduct[]>([]);
  const [donations, setDonations] = useState<CenterDonation[]>([]);

  const [productDialog, setProductDialog] = useState<{ open: boolean; product: CenterProduct | null }>({
    open: false,
    product: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, p, d] = await Promise.all([
        fetchCampaign(),
        fetchCenterProducts(),
        fetchCenterDonations(),
      ]);
      setCampaign(c);
      setProducts(p);
      setDonations(d);
    } catch (err) {
      console.error(err);
      toast.error("Ачааллахад алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(
    () => computeCenterStats(donations, campaign?.top_count ?? 99),
    [donations, campaign?.top_count]
  );
  const progress =
    campaign && campaign.target_amount > 0
      ? Math.min(100, (stats.totalRaised / campaign.target_amount) * 100)
      : 0;

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCenterProduct(deleteTarget.id);
      toast.success("Устгагдлаа.");
      setDeleteTarget(null);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Устгахад алдаа гарлаа.");
    }
  };

  const toggleProduct = async (p: CenterProduct) => {
    await setCenterProductStatus(p.id, p.status === "active" ? "inactive" : "active");
    void load();
  };

  if (!allowed) {
    return (
      <div className="rounded-xl border border-border-light bg-card py-16 text-center text-[13px] text-muted-foreground">
        Энэ хуудсыг зөвхөн админ/менежер үзэх боломжтой.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-[18px] font-semibold text-foreground">
            {campaign?.name || "Морин хуурын төв цогцолбор"}
          </h1>
          <p className="text-[12px] text-muted-foreground">
            Хөрөнгө босгох бүтээгдэхүүн ба хандивлагчдын удирдлага
          </p>
        </div>
        <Button variant="outline" size="icon-sm" onClick={() => void load()} aria-label="Шинэчлэх">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </Button>
      </header>

      {/* Tabs */}
      <div className="inline-flex rounded-lg bg-sidebar p-0.5 text-[12px]">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-md px-3 py-1.5 transition-colors",
              tab === t.key
                ? "bg-card font-medium text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && !campaign ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
          Ачааллаж байна…
        </div>
      ) : (
        <>
          {tab === "overview" && (
            <OverviewTab
              campaign={campaign}
              progress={progress}
              totalRaised={stats.totalRaised}
              donorCount={stats.donorCount}
              donationCount={stats.donationCount}
              productCount={products.length}
              topDonors={stats.topDonors}
            />
          )}

          {tab === "orders" && (
            <OrdersTab donations={donations} onReload={() => void load()} />
          )}

          {tab === "products" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[13px] text-muted-foreground">
                  Нийт: <span className="font-medium text-foreground">{products.length}</span>
                </div>
                <Button size="sm" onClick={() => setProductDialog({ open: true, product: null })}>
                  <Plus className="h-3.5 w-3.5" />
                  Шинэ бараа
                </Button>
              </div>
              {products.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border-light py-12 text-center text-[13px] text-muted-foreground">
                  Бараа алга.
                </div>
              ) : (
                <div className="space-y-2">
                  {products.map((p) => (
                    <ItemRow
                      key={p.id}
                      image={p.images[0] ?? null}
                      name={p.name}
                      meta={`${formatPriceMNT(p.price)} · ${stockLabel(p.stock)} · ${p.sold_count} зарагдсан`}
                      active={p.status === "active"}
                      onEdit={() => setProductDialog({ open: true, product: p })}
                      onToggle={() => void toggleProduct(p)}
                      onDelete={() => setDeleteTarget({ id: p.id, name: p.name })}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "gallery" && <GalleryTab campaign={campaign} onSaved={() => void load()} />}

          {tab === "settings" && <SettingsTab campaign={campaign} onSaved={() => void load()} />}
        </>
      )}

      <CenterProductDialog
        open={productDialog.open}
        product={productDialog.product}
        onOpenChange={(o) => setProductDialog((s) => ({ ...s, open: o }))}
        onSaved={() => void load()}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Устгах уу?"
        description={deleteTarget ? `"${deleteTarget.name}"-г устгах уу? Энэ үйлдлийг буцаах боломжгүй.` : ""}
        confirmLabel="Устгах"
        destructive
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
function OverviewTab({
  campaign,
  progress,
  totalRaised,
  donorCount,
  donationCount,
  productCount,
  topDonors,
}: {
  campaign: CenterCampaign | null;
  progress: number;
  totalRaised: number;
  donorCount: number;
  donationCount: number;
  productCount: number;
  topDonors: ReturnType<typeof computeCenterStats>["topDonors"];
}) {
  const target = campaign?.target_amount ?? 0;
  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="rounded-xl border border-border-light bg-card p-4">
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="text-[12px] text-muted-foreground">Босгосон дүн</div>
            <div className="text-[22px] font-bold tabular-nums text-foreground">
              {formatPriceMNT(totalRaised)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[12px] text-muted-foreground">Зорилт</div>
            <div className="text-[15px] font-semibold tabular-nums text-foreground">
              {formatPriceMNT(target)}
            </div>
          </div>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-1.5 text-[11px] text-muted-foreground">
          {progress.toFixed(1)}% биелсэн{" "}
          {campaign?.status === "ended" && "· Кампанит дууссан"}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Хандивлагч" value={fmtInt(donorCount)} icon={Users} />
        <StatCard label="Босгосон дүн" value={formatPriceMNT(totalRaised)} icon={Coins} />
        <StatCard label="Хандив (удаа)" value={fmtInt(donationCount)} icon={Heart} />
        <StatCard label="Бараа" value={fmtInt(productCount)} icon={Package} />
      </div>

      {/* Donor wall */}
      <div className="rounded-xl border border-border-light bg-card p-4">
        <h3 className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
          <Trophy className="h-4 w-4 text-primary-600" />
          Top {campaign?.top_count ?? 99} хандивлагч (алтан үсгээр мөнхлөх)
        </h3>
        {topDonors.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">Хандивлагч одоогоор алга.</p>
        ) : (
          <div className="space-y-1.5">
            {topDonors.map((d, i) => (
              <div key={d.buyer_uid} className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold tabular-nums",
                    i === 0
                      ? "bg-primary-500 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                  {d.anonymous ? "Нэрээ нууцалсан" : d.engrave_name || "Нэргүй"}
                </span>
                <span className="shrink-0 text-[12px] text-muted-foreground tabular-nums">
                  {d.count} удаа
                </span>
                <span className="w-28 shrink-0 text-right text-[13px] font-semibold tabular-nums text-primary-600">
                  {formatPriceMNT(d.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function ItemRow({
  image,
  name,
  meta,
  active,
  onEdit,
  onToggle,
  onDelete,
}: {
  image: string | null;
  name: string;
  meta: string;
  active: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-light bg-card p-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <Package className="h-5 w-5 text-muted-foreground" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[14px] font-medium text-foreground">{name}</span>
          {!active && (
            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              Идэвхгүй
            </span>
          )}
        </div>
        <div className="truncate text-[11px] text-muted-foreground">{meta}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={onEdit} title="Засах">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onToggle} title="Идэвх">
          <Power className={cn("h-3.5 w-3.5", active ? "text-emerald-600" : "text-muted-foreground")} />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onDelete} title="Устгах" className="text-rose-600">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
const ORDER_STATUS: Record<string, { label: string; badge: string }> = {
  completed: {
    label: "Амжилттай",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  pending: {
    label: "Хүлээгдэж буй",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  cancelled: {
    label: "Цуцалсан",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  },
};

const ORDER_FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "Бүгд" },
  { key: "completed", label: "Амжилттай" },
  { key: "pending", label: "Хүлээгдэж буй" },
  { key: "cancelled", label: "Цуцалсан" },
];

const DELIVERY: Record<string, { label: string; badge: string }> = {
  delivered: {
    label: "Хүлээлгэн өгсөн",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  pending: {
    label: "Хүлээгдэж буй",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
};

function OrdersTab({
  donations,
  onReload,
}: {
  donations: CenterDonation[];
  onReload: () => void;
}) {
  const { adminData } = useAuth();
  const [filter, setFilter] = useState<string>("all");
  const [deliverTarget, setDeliverTarget] = useState<CenterDonation | null>(null);

  const filtered =
    filter === "all" ? donations : donations.filter((d) => d.status === filter);
  const completedTotal = donations
    .filter((d) => d.status === "completed")
    .reduce((s, d) => s + d.amount, 0);

  const confirmDeliver = async () => {
    if (!deliverTarget || !adminData) return;
    try {
      await markDonationDelivered(deliverTarget.id, {
        uid: adminData.uid,
        name: adminData.name,
      });
      toast.success("Хүлээлгэн өгсөн гэж тэмдэглэлээ.");
      setDeliverTarget(null);
      onReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[13px] text-muted-foreground">
          Нийт <span className="font-medium text-foreground">{donations.length}</span> захиалга ·
          Амжилттай дүн{" "}
          <span className="font-medium text-foreground">{formatPriceMNT(completedTotal)}</span>
        </div>
        <div className="inline-flex rounded-lg bg-sidebar p-0.5 text-[12px]">
          {ORDER_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-md px-2.5 py-1 transition-colors",
                filter === f.key
                  ? "bg-card font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-light py-12 text-center text-[13px] text-muted-foreground">
          <Receipt className="mx-auto mb-2 h-6 w-6 text-muted-foreground/60" />
          {donations.length === 0
            ? "Хандивын захиалга одоогоор алга."
            : "Энэ шүүлтэд тохирох захиалга алга."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => (
            <OrderRow key={d.id} d={d} onDeliver={() => setDeliverTarget(d)} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deliverTarget}
        title="Хүлээлгэн өгөх"
        description={
          deliverTarget
            ? `Худалдан авагчийн үзүүлсэн кодтой тулгана уу: ${deliverTarget.pickup_code || "—"}. "Хүлээлгэн өгсөн" гэж тэмдэглэх үү?`
            : ""
        }
        confirmLabel="Хүлээлгэн өгсөн"
        onOpenChange={(o) => !o && setDeliverTarget(null)}
        onConfirm={() => void confirmDeliver()}
      />
    </div>
  );
}

function OrderRow({ d, onDeliver }: { d: CenterDonation; onDeliver: () => void }) {
  const st = ORDER_STATUS[d.status] ?? {
    label: d.status,
    badge: "bg-muted text-muted-foreground",
  };
  const who = d.anonymous ? "Нэрээ нууцалсан" : d.engrave_name || d.buyer_name || d.buyer_uid;
  const items = d.items.map((it) => `${it.name}${it.qty > 1 ? ` ×${it.qty}` : ""}`).join(", ");
  const date = d.created_at ? d.created_at.toDate().toLocaleString("mn-MN") : "—";
  const isCompleted = d.status === "completed";
  const delivered = d.delivery_status === "delivered";
  const dv = delivered ? DELIVERY.delivered : DELIVERY.pending;

  return (
    <div className="rounded-xl border border-border-light bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-[14px] font-medium text-foreground">{who}</span>
            <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium", st.badge)}>
              {st.label}
            </span>
            {isCompleted && (
              <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium", dv.badge)}>
                {dv.label}
              </span>
            )}
          </div>
          {items && (
            <div className="mt-0.5 truncate text-[12px] text-foreground/80">{items}</div>
          )}
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {date}
            {!d.anonymous && d.buyer_name && d.engrave_name && d.engrave_name !== d.buyer_name
              ? ` · Худалдан авагч: ${d.buyer_name}`
              : ""}
          </div>
          {isCompleted && !delivered && d.pickup_code && (
            <div className="mt-1 text-[11px] text-muted-foreground">
              Авах код:{" "}
              <span className="font-mono font-semibold tracking-widest text-foreground">
                {d.pickup_code}
              </span>
            </div>
          )}
          {delivered && d.delivered_by_name && (
            <div className="mt-1 text-[11px] text-muted-foreground">
              Хүлээлгэн өгсөн: {d.delivered_by_name}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="text-[14px] font-semibold tabular-nums text-primary-600">
            {formatPriceMNT(d.amount)}
          </div>
          {isCompleted && !delivered && (
            <Button size="sm" variant="outline" onClick={onDeliver}>
              Хүлээлгэн өгсөн
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function GalleryTab({
  campaign,
  onSaved,
}: {
  campaign: CenterCampaign | null;
  onSaved: () => void;
}) {
  const [images, setImages] = useState<string[]>(campaign?.gallery ?? []);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await saveGallery(images);
      toast.success("Зургийн цомог хадгалагдлаа.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Хадгалахад алдаа гарлаа.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-3 rounded-xl border border-border-light bg-card p-4">
      <div className="flex items-center gap-2">
        <Images className="h-4 w-4 text-primary-600" />
        <h3 className="text-[14px] font-semibold text-foreground">Зургийн цомог</h3>
        <span className="ml-auto text-[12px] text-muted-foreground">{images.length} зураг</span>
      </div>
      <p className="text-[12px] text-muted-foreground">
        Төв цогцолбортой холбоотой зургуудыг энд оруулна. Эдгээр зураг апп дээр
        хандивын аяны хэсэгт цомог болж харагдана.
      </p>
      <ImageGalleryInput
        productId="campaign-gallery"
        value={images}
        onChange={setImages}
        max={40}
      />
      <div>
        <Button onClick={() => void submit()} disabled={saving}>
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Хадгалах
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function SettingsTab({
  campaign,
  onSaved,
}: {
  campaign: CenterCampaign | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState(campaign?.name ?? "");
  const [description, setDescription] = useState(campaign?.description ?? "");
  const [target, setTarget] = useState(campaign ? String(campaign.target_amount) : "");
  const [topCount, setTopCount] = useState(String(campaign?.top_count ?? 99));
  const [status, setStatus] = useState<CenterCampaign["status"]>(campaign?.status ?? "active");
  const [cover, setCover] = useState<string[]>(campaign?.cover_image ? [campaign.cover_image] : []);
  const [header, setHeader] = useState<string[]>(campaign?.header_image ? [campaign.header_image] : []);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const targetNum = Number(target);
    if (!name.trim()) return toast.error("Нэр оруулна уу.");
    if (!Number.isFinite(targetNum) || targetNum < 0) return toast.error("Зорилтот дүн зөв оруулна уу.");
    const topNum = Number(topCount);
    setSaving(true);
    try {
      await saveCampaign({
        name,
        description,
        cover_image: cover[0] ?? null,
        header_image: header[0] ?? null,
        target_amount: targetNum,
        top_count: Number.isInteger(topNum) && topNum > 0 ? topNum : 99,
        status,
      });
      toast.success("Тохиргоо хадгалагдлаа.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Хадгалахад алдаа гарлаа.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-3 rounded-xl border border-border-light bg-card p-4">
      <div className="space-y-1.5">
        <Label htmlFor="c-name">Кампанит нэр</Label>
        <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="c-desc">Тайлбар</Label>
        <Textarea id="c-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="c-target">Зорилтот дүн (₮)</Label>
          <Input id="c-target" inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-top">Мөнхлөх хандивлагчийн тоо</Label>
          <Input id="c-top" inputMode="numeric" value={topCount} onChange={(e) => setTopCount(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="c-status">Төлөв</Label>
        <Select
          id="c-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as CenterCampaign["status"])}
        >
          <option value="active">Идэвхтэй</option>
          <option value="ended">Дууссан</option>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Нүүр зураг (карт дээр)</Label>
        <ImageGalleryInput productId="campaign" value={cover} onChange={setCover} max={1} />
      </div>
      <div className="space-y-1.5">
        <Label>Header зураг (апп дэлгэрэнгүй — 21:9)</Label>
        <p className="text-[11px] text-muted-foreground">
          Апп дээрх кампанит дэлгэрэнгүйн дээд талын баннер. Өргөн (21:9) зураг
          тохиромжтой.
        </p>
        <ImageGalleryInput
          productId="campaign-header"
          value={header}
          onChange={setHeader}
          max={1}
        />
      </div>
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <Target className="h-3.5 w-3.5" />
        Эдгээр бараанаас худалдан авалт хийсэн хэрэглэгч хандивын аянд оролцсонд тооцогдоно.
      </div>
      <div>
        <Button onClick={() => void submit()} disabled={saving}>
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Хадгалах
        </Button>
      </div>
    </div>
  );
}
