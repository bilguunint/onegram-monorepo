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
  createCenterTree,
  updateCenterTree,
  newCenterTreeRef,
  type CenterProduct,
} from "@/lib/firestore/center";

type Props = {
  open: boolean;
  tree: CenterProduct | null; // null = create
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function CenterTreeDialog({ open, tree, onOpenChange, onSaved }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{tree ? "Мод засах" : "Шинэ мод"}</DialogTitle>
        </DialogHeader>
        {open && (
          <TreeBody
            key={tree?.id ?? "new"}
            tree={tree}
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

function TreeBody({
  tree,
  onCancel,
  onSaved,
}: {
  tree: CenterProduct | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  // Stable id for the Storage image namespace on create.
  const treeId = useMemo(() => tree?.id ?? newCenterTreeRef().id, [tree?.id]);
  const [name, setName] = useState(tree?.name ?? "");
  const [description, setDescription] = useState(tree?.description ?? "");
  const [price, setPrice] = useState(tree ? String(tree.price) : "");
  const [hasStock, setHasStock] = useState(tree?.stock != null);
  const [stock, setStock] = useState(
    tree?.stock != null ? String(tree.stock) : ""
  );
  const [status, setStatus] = useState(tree?.status ?? "active");
  const [images, setImages] = useState<string[]>(tree?.images ?? []);
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
      if (tree) await updateCenterTree(tree.id, draft);
      else await createCenterTree(treeId, draft);
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
          <Label htmlFor="ct-name">Модны нэр</Label>
          <Input id="ct-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ct-desc">Тайлбар</Label>
          <Textarea
            id="ct-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ct-price">Үнэ (₮)</Label>
            <Input
              id="ct-price"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ct-status">Төлөв</Label>
            <Select
              id="ct-status"
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
          <ImageGalleryInput productId={treeId} value={images} onChange={setImages} />
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
