"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProductForm } from "@/components/products/ProductForm";
import {
  createProduct,
  newProductRef,
  type ProductDraft,
} from "@/lib/firestore/products";

export default function NewProductPage() {
  const router = useRouter();
  // Reserve a Firestore-generated id up-front so image uploads can use the
  // products/{id}/... storage path before the document exists.
  const ref = useMemo(() => newProductRef(), []);

  const handleSubmit = async (draft: ProductDraft) => {
    await createProduct(ref.id, draft);
    toast.success("Шинэ бараа үүсгэгдлээ.");
    router.push(`/products/${ref.id}`);
  };

  return (
    <ProductForm
      productId={ref.id}
      onSubmit={handleSubmit}
      title="Шинэ бараа нэмэх"
      subtitle="Шинэ"
      submitLabel="Үүсгэх"
    />
  );
}
