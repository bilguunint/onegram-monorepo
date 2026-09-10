"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Gem, Images, Loader2, Receipt, RefreshCw, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatCard } from "@/components/dashboard/StatCard";
import { ImageGalleryInput } from "@/components/products/ImageGalleryInput";
import { formatPriceMNT } from "@/lib/products";
import {
  computeBuyback,
  computeShuteenStats,
  fetchShuteenOrders,
  fetchShuteenProgram,
  saveShuteenGallery,
  saveShuteenProgram,
  type ShuteenOrder,
  type ShuteenProgram,
} from "@/lib/firestore/shuteen";

type Tab = "orders" | "settings" | "gallery";
const TABS: { key: Tab; label: string }[] = [
  { key: "orders", label: "Захиалгууд" },
  { key: "settings", label: "Тохиргоо" },
  { key: "gallery", label: "Зургийн цомог" },
];

const fmtDate = (t: { toDate: () => Date } | null) =>
  t ? t.toDate().toLocaleDateString("mn-MN") : "—";
const ROMAN = ["—", "I", "II", "III"];

const fmtInt = (n: number) => new Intl.NumberFormat("mn-MN").format(n);

export default function ShuteenPage() {
  const { adminData } = useAuth();
  const allowed = adminData?.role === "admin" || adminData?.role === "manager";

  const [tab, setTab] = useState<Tab>("orders");
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<ShuteenProgram | null>(null);
  const [orders, setOrders] = useState<ShuteenOrder[]>([]);
  // Дахин ачаалах тоолуур — effect үүнээс хамаарч Firestore-оос уншина
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    Promise.all([fetchShuteenProgram(), fetchShuteenOrders()])
      .then(([p, o]) => {
        if (!alive) return;
        setProgram(p);
        setOrders(o);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Ачааллахад алдаа гарлаа.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [tick]);

  const load = useCallback(() => {
    setLoading(true);
    setTick((t) => t + 1);
  }, []);

  const stats = useMemo(() => computeShuteenStats(orders), [orders]);

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
            {program?.title || "Шүтээн хуур"}
          </h1>
          <p className="text-[12px] text-muted-foreground">
            Хэсэгчилсэн эзэмшлийн хөтөлбөр — апп дээрх нүүрний карт ба танилцуулга
          </p>
        </div>
        <Button variant="outline" size="icon-sm" onClick={load} aria-label="Шинэчлэх">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </Button>
      </header>

      {program && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Зарагдсан нэгж"
            value={`${fmtInt(program.sold_units)} / ${fmtInt(program.total_units)}`}
            icon={TrendingUp}
            meta={`Нэгжийн үнэ ${formatPriceMNT(program.unit_price)}`}
          />
          <StatCard label="Нийт орлого" value={formatPriceMNT(stats.amount)} icon={Receipt} meta={`${stats.orderCount} захиалга`} />
          <StatCard label="Эзэмшигчид" value={fmtInt(stats.holderCount)} icon={Users} meta={`Буцаалт ${formatPriceMNT(stats.buybackTotal)}`} />
          <StatCard
            label="Төлөв"
            value={program.status === "active" ? "Апп дээр харагдана" : "Нуусан"}
            icon={Gem}
          />
        </div>
      )}

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

      {loading && !program ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
          Ачааллаж байна…
        </div>
      ) : (
        <>
          {tab === "orders" && <OrdersTab orders={orders} />}
          {tab === "settings" && program && (
            <SettingsTab key={program.updated_at?.toMillis() ?? 0} program={program} onSaved={load} />
          )}
          {tab === "gallery" && program && (
            <GalleryTab key={program.updated_at?.toMillis() ?? 0} program={program} onSaved={load} />
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function OrdersTab({ orders }: { orders: ShuteenOrder[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-light bg-card py-12 text-center text-[13px] text-muted-foreground">
        Одоогоор нэгжийн захиалга байхгүй байна.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-border-light bg-card">
      <table className="w-full text-[12.5px]">
        <thead className="bg-sidebar text-left text-[11px] uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Гэрчилгээ</th>
            <th className="px-3 py-2">Эзэмшигч</th>
            <th className="px-3 py-2 text-right">Нэгж</th>
            <th className="px-3 py-2 text-right">Төлсөн</th>
            <th className="px-3 py-2 text-right">Буцаалт</th>
            <th className="px-3 py-2">Буцаалтын огноо</th>
            <th className="px-3 py-2">Түвшин</th>
            <th className="px-3 py-2">Төлөв</th>
            <th className="px-3 py-2">Огноо</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t border-border-light">
              <td className="px-3 py-2 font-mono font-medium text-foreground">{o.certificate_no}</td>
              <td className="px-3 py-2">
                <div className="text-foreground">{o.buyer_name || "—"}</div>
                <div className="text-[11px] text-muted-foreground">{o.buyer_phone}</div>
              </td>
              <td className="px-3 py-2 text-right">{fmtInt(o.units)}</td>
              <td className="px-3 py-2 text-right">{formatPriceMNT(o.amount)}</td>
              <td className="px-3 py-2 text-right text-primary-600">{formatPriceMNT(o.buyback_total)}</td>
              <td className="px-3 py-2">{fmtDate(o.buyback_at)}</td>
              <td className="px-3 py-2">{ROMAN[o.tier] ?? "—"}</td>
              <td className="px-3 py-2">
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[11px] font-medium",
                    o.status === "active" && "bg-emerald-500/15 text-emerald-600",
                    o.status === "bought_back" && "bg-sidebar text-muted-foreground",
                    o.status === "cancelled" && "bg-red-500/15 text-red-600"
                  )}
                >
                  {o.status === "active" ? "Хүчинтэй" : o.status === "bought_back" ? "Буцаан авсан" : "Цуцлагдсан"}
                </span>
              </td>
              <td className="px-3 py-2 text-muted-foreground">{fmtDate(o.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
function SettingsTab({
  program,
  onSaved,
}: {
  program: ShuteenProgram;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(program.title);
  const [subtitle, setSubtitle] = useState(program.subtitle);
  const [description, setDescription] = useState(program.description);
  const [status, setStatus] = useState<ShuteenProgram["status"]>(program.status);
  const [cover, setCover] = useState<string[]>(program.cover_image ? [program.cover_image] : []);
  const [header, setHeader] = useState<string[]>(program.header_image ? [program.header_image] : []);
  const [valuation, setValuation] = useState(String(program.total_valuation));
  const [units, setUnits] = useState(String(program.total_units));
  const [unitPrice, setUnitPrice] = useState(String(program.unit_price));
  const [months, setMonths] = useState(String(program.hold_months));
  const [growth, setGrowth] = useState(String(program.annual_growth_percent));
  const [buyback, setBuyback] = useState(String(program.buyback_price));
  const [saving, setSaving] = useState(false);

  const num = (s: string) => Number(String(s).replace(/[^\d.]/g, "")) || 0;

  // Санал болгох буцаан худалдан авах үнэ — үнэ / өсөлт / хугацаанаас
  const suggested = useMemo(
    () => computeBuyback(num(unitPrice), num(growth), num(months)),
    [unitPrice, growth, months]
  );
  // Нэгжийн үнэ × нийт нэгж = үнэлгээ байх ёстой; зөрвөл анхааруулна
  const impliedValuation = num(unitPrice) * num(units);
  const valuationMismatch = num(valuation) > 0 && impliedValuation !== num(valuation);

  const submit = async () => {
    if (!title.trim()) {
      toast.warning("Гарчиг оруулна уу.");
      return;
    }
    setSaving(true);
    try {
      await saveShuteenProgram({
        title,
        subtitle,
        description,
        status,
        cover_image: cover[0] ?? null,
        header_image: header[0] ?? null,
        total_valuation: num(valuation),
        total_units: num(units),
        unit_price: num(unitPrice),
        hold_months: num(months),
        annual_growth_percent: num(growth),
        buyback_price: num(buyback),
      });
      toast.success("Хадгалагдлаа.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Хадгалахад алдаа гарлаа.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3 rounded-xl border border-border-light bg-card p-4">
        <div className="space-y-1.5">
          <Label htmlFor="s-title">Гарчиг</Label>
          <Input id="s-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-sub">Дэд гарчиг (нүүрний карт дээр)</Label>
          <Input id="s-sub" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-desc">Танилцуулга</Label>
          <Textarea id="s-desc" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="s-val">Нийт үнэлгээ (₮)</Label>
            <Input id="s-val" inputMode="numeric" value={valuation} onChange={(e) => setValuation(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-units">Нийт нэгж хувь</Label>
            <Input id="s-units" inputMode="numeric" value={units} onChange={(e) => setUnits(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-price">Нэгжийн үнэ (₮)</Label>
            <Input id="s-price" inputMode="numeric" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-months">Эзэмших хугацаа (сар)</Label>
            <Input id="s-months" inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-growth">Жилийн өсөлт (%)</Label>
            <Input id="s-growth" inputMode="decimal" value={growth} onChange={(e) => setGrowth(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-buyback">Буцаан худалдан авах үнэ (₮)</Label>
            <Input id="s-buyback" inputMode="numeric" value={buyback} onChange={(e) => setBuyback(e.target.value)} />
            {suggested > 0 && num(buyback) !== suggested && (
              <button
                type="button"
                className="text-[11px] text-primary-600 hover:underline"
                onClick={() => setBuyback(String(suggested))}
              >
                Тооцоолсон: {formatPriceMNT(suggested)} — ашиглах
              </button>
            )}
          </div>
        </div>
        {valuationMismatch && (
          <p className="text-[11px] text-amber-600">
            Нэгжийн үнэ × нийт нэгж = {formatPriceMNT(impliedValuation)} нь нийт үнэлгээтэй зөрж байна.
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="s-status">Төлөв</Label>
          <Select
            id="s-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ShuteenProgram["status"])}
          >
            <option value="hidden">Нуусан (апп дээр харагдахгүй)</option>
            <option value="active">Идэвхтэй (нүүрэнд харагдана)</option>
          </Select>
        </div>

        <div>
          <Button onClick={() => void submit()} disabled={saving}>
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Хадгалах
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5 rounded-xl border border-border-light bg-card p-4">
          <Label>Нүүрний картын зураг</Label>
          <p className="text-[11px] text-muted-foreground">
            Апп нүүрний ханш, хуваан төлөлтийн доор харагдах том карт. Өргөн (16:9) зураг тохиромжтой.
          </p>
          <ImageGalleryInput productId="shuteen-cover" value={cover} onChange={setCover} max={1} />
        </div>
        <div className="space-y-1.5 rounded-xl border border-border-light bg-card p-4">
          <Label>Танилцуулгын hero зураг</Label>
          <p className="text-[11px] text-muted-foreground">
            Танилцуулга дэлгэцийн дээд баннер (21:9). Хоосон бол цомгийн эхний зураг ашиглагдана.
          </p>
          <ImageGalleryInput productId="shuteen-header" value={header} onChange={setHeader} max={1} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function GalleryTab({
  program,
  onSaved,
}: {
  program: ShuteenProgram;
  onSaved: () => void;
}) {
  const [images, setImages] = useState<string[]>(program.gallery);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await saveShuteenGallery(images);
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
        <h3 className="text-[14px] font-semibold text-foreground">Шүтээн хуурын зургууд</h3>
        <span className="ml-auto text-[12px] text-muted-foreground">{images.length} зураг</span>
      </div>
      <p className="text-[12px] text-muted-foreground">
        Шүтээн хуурын зургуудыг энд оруулна. Апп дээрх танилцуулга дэлгэцийн дээд
        хэсэгт гүйлгэж харах цомог болж харагдана. Эхний зураг нь hero зураг
        хоосон үед баннер болно.
      </p>
      <ImageGalleryInput
        productId="shuteen-gallery"
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
