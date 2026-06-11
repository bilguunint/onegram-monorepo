"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Product } from "@/lib/firestore/products";
import { getProductPrimaryImage } from "@/lib/products";
import {
  fetchImageDataUrl,
  translateProductsToChinese,
} from "@/lib/api/catalogActions";
import type { CatalogProduct } from "@/lib/pdf/catalogPdf";

type Step = "translate" | "currencyAsk" | "currencyConfig";
type CurrencyCode = "USD" | "CNY";

const CURRENCY: Record<CurrencyCode, { symbol: string; label: string }> = {
  USD: { symbol: "$", label: "Америк доллар (USD)" },
  CNY: { symbol: "¥", label: "Хятад юань (CNY)" },
};

export function CatalogPdfButton({ products }: { products: Product[] }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("translate");
  const [zh, setZh] = useState(false);
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>("USD");
  const [rate, setRate] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyMsg, setBusyMsg] = useState("");

  const start = () => {
    if (products.length === 0) {
      toast.error("Бараа байхгүй байна.");
      return;
    }
    setStep("translate");
    setZh(false);
    setCurrencyCode("USD");
    setRate("");
    setOpen(true);
  };

  const close = () => {
    if (busy) return;
    setOpen(false);
  };

  const chooseTranslate = (useZh: boolean) => {
    setZh(useZh);
    setStep("currencyAsk");
  };

  const chooseCurrency = (useCurrency: boolean) => {
    if (useCurrency) {
      setStep("currencyConfig");
    } else {
      void generate(null);
    }
  };

  const submitCurrency = () => {
    const r = parseFloat(rate.replace(/,/g, ""));
    if (!Number.isFinite(r) || r <= 0) {
      toast.error("Ханшийг зөв оруулна уу (0-ээс их тоо).");
      return;
    }
    void generate({
      code: currencyCode,
      symbol: CURRENCY[currencyCode].symbol,
      rate: r,
    });
  };

  async function generate(
    currency: { code: string; symbol: string; rate: number } | null
  ) {
    setBusy(true);
    try {
      // 1) Pre-fetch the first image of every product as a data URL.
      setBusyMsg("Зургуудыг бэлдэж байна…");
      const imageData = await Promise.all(
        products.map((p) => fetchImageDataUrl(getProductPrimaryImage(p)))
      );

      // 2) Optionally translate name/description to Chinese.
      let names = products.map((p) => p.name);
      let descriptions = products.map((p) => p.description ?? "");
      if (zh) {
        setBusyMsg("Хятад хэл рүү орчуулж байна…");
        const translated = await translateProductsToChinese(
          products.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description ?? "",
          }))
        );
        const byId = new Map(translated.map((t) => [t.id, t]));
        names = products.map((p) => byId.get(p.id)?.name || p.name);
        descriptions = products.map(
          (p) => byId.get(p.id)?.description || p.description || ""
        );
      }

      const catalogProducts: CatalogProduct[] = products.map((p, i) => ({
        id: p.id,
        name: names[i],
        description: descriptions[i],
        imageData: imageData[i],
        priceMnt: p.price,
        minMonths: p.min_months,
        maxMonths: p.max_months,
        stock: p.stock,
      }));

      // 3) Build + download the PDF (dynamic import keeps react-pdf client-only).
      setBusyMsg("PDF үүсгэж байна…");
      const generatedAt = new Date().toISOString().slice(0, 10);
      const { generateCatalogPdf } = await import("@/lib/pdf/catalogPdf");
      await generateCatalogPdf(catalogProducts, {
        zh,
        currency,
        generatedAt,
      });

      toast.success("PDF танилцуулга татагдлаа.");
      setOpen(false);
    } catch (err) {
      console.error("Catalog PDF error:", err);
      toast.error(err instanceof Error ? err.message : "PDF үүсгэхэд алдаа гарлаа.");
    } finally {
      setBusy(false);
      setBusyMsg("");
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={start}
        disabled={products.length === 0}
      >
        <FileDown className="h-3.5 w-3.5" />
        PDF танилцуулга
      </Button>

      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
        <DialogContent className="sm:max-w-md">
          {busy ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-[13px] text-foreground/80">{busyMsg}</p>
            </div>
          ) : step === "translate" ? (
            <>
              <DialogHeader>
                <DialogTitle>Хятад хэл рүү орчуулах уу?</DialogTitle>
                <DialogDescription>
                  Барааны нэр болон тайлбарыг ChatGPT-ээр хятад (简体中文) хэл рүү
                  орчуулж танилцуулгад харуулна.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => chooseTranslate(false)}>
                  Үгүй, монголоор
                </Button>
                <Button onClick={() => chooseTranslate(true)}>
                  Тийм, хятадаар
                </Button>
              </DialogFooter>
            </>
          ) : step === "currencyAsk" ? (
            <>
              <DialogHeader>
                <DialogTitle>Валютын ханш өөрчлөх үү?</DialogTitle>
                <DialogDescription>
                  Төгрөгийн үнийг сонгосон валют руу хөрвүүлж харуулах боломжтой.
                  Үгүй бол үнийг төгрөгөөр харуулна.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => chooseCurrency(false)}>
                  Үгүй, төгрөгөөр
                </Button>
                <Button onClick={() => chooseCurrency(true)}>
                  Тийм, хөрвүүлэх
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Валют ба ханш</DialogTitle>
                <DialogDescription>
                  Хөрвүүлэх валютаа сонгоод 1 нэгж нь хэдэн төгрөг болохыг
                  оруулна уу.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-1">
                <div className="space-y-1.5">
                  <Label htmlFor="catalog-currency">Валют</Label>
                  <Select
                    id="catalog-currency"
                    value={currencyCode}
                    onChange={(e) =>
                      setCurrencyCode(e.target.value as CurrencyCode)
                    }
                  >
                    <option value="USD">{CURRENCY.USD.label}</option>
                    <option value="CNY">{CURRENCY.CNY.label}</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="catalog-rate">
                    Ханш — 1 {currencyCode} хэдэн төгрөг вэ?
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-muted-foreground">
                      1 {currencyCode} =
                    </span>
                    <Input
                      id="catalog-rate"
                      inputMode="decimal"
                      placeholder="жишээ нь 3450"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      autoFocus
                    />
                    <span className="text-[13px] text-muted-foreground">₮</span>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setStep("currencyAsk")}>
                  Буцах
                </Button>
                <Button onClick={submitCurrency}>PDF үүсгэх</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
