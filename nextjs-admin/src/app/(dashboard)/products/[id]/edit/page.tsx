"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProductForm } from "@/components/products/ProductForm";
import {
  fetchProduct,
  updateProduct,
  type Product,
  type ProductDraft,
} from "@/lib/firestore/products";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const p = await fetchProduct(id);
      if (!p) {
        setNotFound(true);
        return;
      }
      setProduct(p);
    } catch (err) {
      console.error(err);
      toast.error("Бараа ачааллахад алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    void load();
  }, [id, load]);

  const handleSubmit = async (draft: ProductDraft) => {
    await updateProduct(id, draft);
    toast.success("Бараа шинэчлэгдлээ.");
    router.push(`/products/${id}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border-light bg-card py-16">
        <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
        <p className="text-[12px] text-muted-foreground">Ачааллаж байна…</p>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        Бараа олдсонгүй.
      </div>
    );
  }

  return (
    <ProductForm
      productId={product.id}
      initial={product}
      onSubmit={handleSubmit}
      title="Бараа засах"
      subtitle="Засах"
      submitLabel="Хадгалах"
      backHref={`/products/${product.id}`}
    />
  );
}
