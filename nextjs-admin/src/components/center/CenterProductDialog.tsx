"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageGalleryInput } from "@/components/products/ImageGalleryInput";
import {
  createCenterProduct,
  updateCenterProduct,
  newCenterProductRef,
  type CenterProduct,
} from "@/lib/firestore/center";

type Props = {
  open: boolean;
  product: CenterProduct | null; // null = create
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function CenterProductDialog({ open, product, onOpenChange, onSaved }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? "Бараа засах" : "Шинэ бараа"}</DialogTitle>
        </DialogHeader>
        {open && (
          <ProductBody
            key={product?.id ?? "new"}
            product={product}
            onCancel={() => onOpenChange(false)}
            onSaved={() => {
              onOpenChange(false);
              onSaved();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProductBody({
  product,
  onCancel,
  onSaved,
}: {
  product: CenterProduct | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  // Stable id for the Storage image namespace on create.
  const productId = useMemo(
    () => product?.id ?? newCenterProductRef().id,
    [product?.id]
  );
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [hasStock, setHasStock] = useState(product?.stock != null);
  const [stock, setStock] = useState(product?.stock != null ? String(product.stock) : "");
  const [status, setStatus] = useState(product?.status ?? "active");
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const priceNum = Number(price);
    if (!name.trim()) return toast.error("Нэр оруулна уу.");
    if (!Number.isFinite(priceNum) || priceNum <= 0)
      return toast.error("Үнэ зөв оруулна уу.");
    let stockVal: number | null = null;
    if (hasStock) {
      const n = Number(stock);
      if (!Number.isInteger(n) || n < 0) return toast.error("Нөөц зөв оруулна уу.");
      stockVal = n;
    }
    setSaving(true);
    try {
      const draft = {
        name,
        description,
        images,
        price: priceNum,
        stock: stockVal,
        status,
      };
      if (product) await updateCenterProduct(product.id, draft);
      else await createCenterProduct(productId, draft);
      toast.success("Хадгалагдлаа.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Хадгалахад алдаа гарлаа.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="cp-name">Нэр</Label>
          <Input id="cp-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cp-desc">Тайлбар</Label>
          <Textarea
            id="cp-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cp-price">Үнэ (₮)</Label>
            <Input
              id="cp-price"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-status">Төлөв</Label>
            <Select
              id="cp-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
            >
              <option value="active">Идэвхтэй</option>
              <option value="inactive">Идэвхгүй</option>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border border-border-light p-3">
          <label className="flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={hasStock}
              onChange={(e) => setHasStock(e.target.checked)}
            />
            Нөөцтэй (тэмдэглэхгүй бол хязгааргүй захиалга авна)
          </label>
          {hasStock && (
            <div className="mt-2">
              <Input
                inputMode="numeric"
                placeholder="Нөөцийн тоо"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Зураг</Label>
          <ImageGalleryInput productId={productId} value={images} onChange={setImages} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Болих
        </Button>
        <Button onClick={() => void submit()} disabled={saving}>
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Хадгалах
        </Button>
      </DialogFooter>
    </>
  );
}
