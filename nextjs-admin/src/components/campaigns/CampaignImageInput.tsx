"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_MAX_BYTES,
  uploadProductImage,
} from "@/lib/api/productImages";

type Props = {
  label: string;
  /** Aspect the app renders this slot at, e.g. "21 / 9". */
  ratio: string;
  hint?: string;
  /** Caps the preview width so a 21:9 banner does not swallow the dialog. */
  maxWidth: string;
  campaignId: string;
  value: string | null;
  onChange: (url: string | null) => void;
};

/**
 * One image slot, previewed at the exact aspect ratio the app will crop it to
 * — a 21:9 banner picked from a square thumbnail is how you end up with a
 * cover whose subject is out of frame.
 */
export function CampaignImageInput({
  label,
  ratio,
  hint,
  maxWidth,
  campaignId,
  value,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      const ext = `.${(file.name.split(".").pop() ?? "").toLowerCase()}`;
      if (!PRODUCT_IMAGE_ACCEPT.includes(ext)) {
        toast.error(`Зөвшөөрөгдөх төрөл: ${PRODUCT_IMAGE_ACCEPT.join(", ")}`);
        return;
      }
      if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
        toast.error("Зураг 5MB-аас бага байх ёстой.");
        return;
      }
      setBusy(true);
      try {
        const url = await uploadProductImage(`campaigns/${campaignId}`, file);
        onChange(url);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Зураг оруулж чадсангүй");
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [campaignId, onChange]
  );

  return (
    <div className="space-y-1.5" style={{ maxWidth }}>
      <div className="flex items-baseline justify-between gap-2">
        <Label>{label}</Label>
        <span className="text-[10px] text-muted-foreground">
          {ratio.replace(" / ", ":")}
          {hint ? ` · ${hint}` : ""}
        </span>
      </div>

      <div
        className={cn(
          "relative w-full overflow-hidden rounded-lg border border-border-light bg-muted/40",
          !value && "border-dashed"
        )}
        style={{ aspectRatio: ratio }}
      >
        {value ? (
          <Image
            src={value}
            alt={label}
            fill
            sizes="240px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted/60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {busy ? "Оруулж байна…" : "Зураг оруулах"}
          </button>
        )}
      </div>

      {value && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <Upload className="mr-1 h-3 w-3" />
            )}
            Солих
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => onChange(null)}
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Хасах
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={PRODUCT_IMAGE_ACCEPT.join(",")}
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
