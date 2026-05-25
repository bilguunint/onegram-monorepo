"use client";

import { useCallback, useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  deleteProductImage,
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGE_MAX_COUNT,
  uploadProductImage,
} from "@/lib/api/productImages";

type UploadingItem = {
  id: string;
  percent: number;
  fileName: string;
};

type Props = {
  productId: string;
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
};

export function ImageGalleryInput({
  productId,
  value,
  onChange,
  max = PRODUCT_IMAGE_MAX_COUNT,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<UploadingItem[]>([]);

  const remaining = Math.max(0, max - value.length - uploading.length);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const arr = Array.from(files).slice(0, remaining);
      if (arr.length === 0) {
        toast.warning(`Хамгийн ихдээ ${max} зураг оруулна уу.`);
        return;
      }

      // Validate
      const valid: File[] = [];
      for (const f of arr) {
        if (f.size > PRODUCT_IMAGE_MAX_BYTES) {
          toast.error(`"${f.name}" — 5MB-аас бага байх ёстой.`);
          continue;
        }
        valid.push(f);
      }
      if (valid.length === 0) return;

      // Upload sequentially so each onChange() sees the previous URLs.
      let workingValue = value;
      for (const file of valid) {
        const uploadId = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;
        setUploading((u) => [
          ...u,
          { id: uploadId, percent: 0, fileName: file.name },
        ]);
        try {
          const url = await uploadProductImage(productId, file, (p) => {
            setUploading((u) =>
              u.map((it) => (it.id === uploadId ? { ...it, percent: p } : it))
            );
          });
          workingValue = [...workingValue, url];
          onChange(workingValue);
        } catch (err) {
          console.error(err);
          toast.error(`"${file.name}" upload амжилтгүй.`);
        } finally {
          setUploading((u) => u.filter((it) => it.id !== uploadId));
        }
      }
    },
    [remaining, productId, value, onChange, max]
  );

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    void handleFiles(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    void handleFiles(e.dataTransfer.files);
  };

  const removeAt = async (idx: number) => {
    const url = value[idx];
    onChange(value.filter((_, i) => i !== idx));
    if (url) {
      // Best-effort cleanup
      void deleteProductImage(url);
    }
  };

  const setPrimary = (idx: number) => {
    if (idx === 0) return;
    const next = [...value];
    const [picked] = next.splice(idx, 1);
    next.unshift(picked);
    onChange(next);
  };

  const canAdd = remaining > 0;

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={cn(
          "rounded-xl border border-dashed border-foreground/20 bg-foreground/[0.03] p-3 transition-colors",
          canAdd && "hover:border-primary-300 hover:bg-primary-50/40"
        )}
      >
        <div className="flex flex-wrap items-start gap-2">
          {value.map((url, i) => (
            <div
              key={url}
              className={cn(
                "group relative h-24 w-24 overflow-hidden rounded-lg border border-border-light bg-card",
                i === 0 && "ring-2 ring-primary"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Зураг ${i + 1}`}
                className="h-full w-full object-cover"
              />
              {i === 0 && (
                <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 rounded bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground">
                  <Star className="h-2.5 w-2.5" />
                  Гол
                </span>
              )}
              <div className="absolute inset-0 flex items-end justify-end gap-1 bg-gradient-to-t from-black/55 to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => setPrimary(i)}
                    title="Гол зураг болгох"
                    className="rounded bg-white/90 p-1 text-[10px] text-amber-700 hover:bg-white"
                  >
                    <Star className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void removeAt(i)}
                  title="Хасах"
                  className="rounded bg-white/90 p-1 text-rose-700 hover:bg-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}

          {uploading.map((u) => (
            <div
              key={u.id}
              className="relative flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-border-light bg-card text-center"
            >
              <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
              <span className="px-1 text-[9px] text-muted-foreground tabular-nums">
                {Math.round(u.percent)}%
              </span>
              <div className="absolute right-1 bottom-1 left-1 h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-[width]"
                  style={{ width: `${Math.round(u.percent)}%` }}
                />
              </div>
            </div>
          ))}

          {canAdd && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-foreground/25 bg-card text-muted-foreground transition-colors hover:border-primary-300 hover:bg-primary-50/40 hover:text-primary-700"
            >
              <ImagePlus className="h-5 w-5" />
              <span className="text-[10px]">Зураг нэмэх</span>
            </button>
          )}
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          PNG / JPG / WEBP — нэг тус бүр 5MB-аас бага. Хамгийн ихдээ {max} зураг.
          Эхний зураг нь гол зураг болно.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={PRODUCT_IMAGE_ACCEPT.join(",")}
        multiple
        className="sr-only"
        onChange={onPick}
      />
    </div>
  );
}
