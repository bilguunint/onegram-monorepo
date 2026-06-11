/**
 * Product-catalog PDF generator (client-only).
 *
 * Renders every product into a polished, multi-page A4 presentation with the
 * product's first image, price and description. Optionally:
 *   - renders Chinese (Simplified) text — caller passes already-translated
 *     name/description and we switch to a CJK font;
 *   - converts the MNT price into USD or CNY using an admin-supplied rate.
 *
 * IMPORTANT: this module pulls in `@react-pdf/renderer` (browser-only) and the
 * embedded fonts, so it must only ever be imported dynamically from a client
 * event handler — never from a server component.
 */
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";

// ---------------------------------------------------------------------------
// Fonts. Noto Sans (Latin+Cyrillic) for Mongolian, Noto Sans SC for Chinese.
// Registered lazily, once, the first time each family is needed.
// ---------------------------------------------------------------------------
let latinRegistered = false;
let cjkRegistered = false;

function ensureFonts(zh: boolean) {
  if (!latinRegistered) {
    Font.register({
      family: "NotoSans",
      fonts: [
        { src: "/fonts/NotoSans-Regular.ttf", fontWeight: 400 },
        { src: "/fonts/NotoSans-Bold.ttf", fontWeight: 700 },
      ],
    });
    latinRegistered = true;
  }
  if (zh && !cjkRegistered) {
    Font.register({
      family: "NotoSansSC",
      fonts: [{ src: "/fonts/NotoSansSC-Regular.otf", fontWeight: 400 }],
    });
    cjkRegistered = true;
  }
  // Never hyphenate — keeps Chinese/Cyrillic words intact.
  Font.registerHyphenationCallback((word) => [word]);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type CatalogCurrency = {
  /** "USD" | "CNY" */
  code: string;
  /** "$" | "¥" */
  symbol: string;
  /** How many MNT one unit of `code` is worth (e.g. 1 USD = 3450 ₮). */
  rate: number;
};

export type CatalogProduct = {
  id: string;
  name: string;
  description: string;
  /** Pre-fetched data URL of the first image, or null when unavailable. */
  imageData: string | null;
  priceMnt: number;
  minMonths: number;
  maxMonths: number;
  stock: number | null;
};

export type CatalogOptions = {
  /** Render Chinese text + CJK font. `products` must already be translated. */
  zh: boolean;
  /** When set, show the converted price alongside (or instead of) MNT. */
  currency?: CatalogCurrency | null;
  /** Pre-formatted "generated at" date string. */
  generatedAt: string;
};

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------
const LABELS = {
  mn: {
    title: "Бүтээгдэхүүний танилцуулга",
    products: "Нийт бараа",
    months: "Хугацаа",
    monthsUnit: "сар",
    stock: "Нөөц",
    unlimited: "Хязгааргүй",
    noImage: "Зураггүй",
    page: "Хуудас",
  },
  zh: {
    title: "产品介绍",
    products: "产品总数",
    months: "分期",
    monthsUnit: "个月",
    stock: "库存",
    unlimited: "无限",
    noImage: "无图片",
    page: "第",
  },
};

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
const MNT_FMT = new Intl.NumberFormat("mn-MN", { maximumFractionDigits: 0 });
const FX_FMT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMnt(n: number): string {
  return `${MNT_FMT.format(Math.round(n))}₮`;
}

// The ₮ glyph is missing from the CJK font, so Chinese pages spell out "MNT".
function formatMntPlain(n: number): string {
  return `${MNT_FMT.format(Math.round(n))} MNT`;
}

function formatFx(priceMnt: number, c: CatalogCurrency): string {
  const value = c.rate > 0 ? priceMnt / c.rate : 0;
  return `${c.symbol}${FX_FMT.format(value)}`;
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------
const GOLD = "#A9842F";
const INK = "#1A1A1A";
const GRAY = "#6B7280";
const BORDER = "#E5E7EB";
const SOFT = "#F9FAFB";

function makeStyles(fontFamily: string) {
  return StyleSheet.create({
    page: {
      fontFamily,
      paddingTop: 40,
      paddingBottom: 44,
      paddingHorizontal: 32,
      backgroundColor: "#FFFFFF",
      color: INK,
    },
    header: {
      marginBottom: 18,
      paddingBottom: 12,
      borderBottomWidth: 2,
      borderBottomColor: GOLD,
    },
    headerTitle: { fontSize: 20, fontWeight: 700, color: INK },
    headerMeta: { marginTop: 4, fontSize: 9, color: GRAY },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    card: {
      width: "48.5%",
      marginBottom: 14,
      borderWidth: 1,
      borderColor: BORDER,
      borderRadius: 8,
      overflow: "hidden",
      backgroundColor: "#FFFFFF",
    },
    imageBox: {
      height: 150,
      backgroundColor: SOFT,
      alignItems: "center",
      justifyContent: "center",
    },
    image: { width: "100%", height: 150, objectFit: "cover" },
    noImageText: { fontSize: 9, color: GRAY },
    body: { padding: 10 },
    name: { fontSize: 11, fontWeight: 700, color: INK, marginBottom: 5 },
    priceRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 5 },
    priceMain: { fontSize: 13, fontWeight: 700, color: GOLD },
    priceSub: { fontSize: 8, color: GRAY, marginLeft: 6 },
    metaRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 6 },
    metaItem: { fontSize: 8, color: GRAY, marginRight: 10 },
    metaStrong: { color: INK },
    desc: { fontSize: 8.5, color: "#4B5563", lineHeight: 1.4 },
    footer: {
      position: "absolute",
      bottom: 22,
      left: 32,
      right: 32,
      flexDirection: "row",
      justifyContent: "space-between",
      fontSize: 8,
      color: GRAY,
      borderTopWidth: 1,
      borderTopColor: BORDER,
      paddingTop: 6,
    },
  });
}

function clampDescription(text: string, zh: boolean): string {
  const max = zh ? 90 : 180;
  const t = (text || "").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------
function CatalogDocument({
  products,
  opts,
}: {
  products: CatalogProduct[];
  opts: CatalogOptions;
}) {
  const L = opts.zh ? LABELS.zh : LABELS.mn;
  const family = opts.zh ? "NotoSansSC" : "NotoSans";
  const s = makeStyles(family);
  const c = opts.currency ?? null;

  return (
    <Document title={L.title}>
      <Page size="A4" style={s.page} wrap>
        <View style={s.header} fixed>
          <Text style={s.headerTitle}>{L.title}</Text>
          <Text style={s.headerMeta}>
            {`OneGram  ·  ${L.products}: ${products.length}  ·  ${opts.generatedAt}`}
          </Text>
        </View>

        <View style={s.grid}>
          {products.map((p) => (
            <View key={p.id} style={s.card} wrap={false}>
              <View style={s.imageBox}>
                {p.imageData ? (
                  // eslint-disable-next-line jsx-a11y/alt-text
                  <Image src={p.imageData} style={s.image} />
                ) : (
                  <Text style={s.noImageText}>{L.noImage}</Text>
                )}
              </View>
              <View style={s.body}>
                <Text style={s.name}>{p.name || "—"}</Text>

                <View style={s.priceRow}>
                  {c ? (
                    // Currency selected: show the converted price. On Chinese
                    // pages show ONLY the selected currency (no MNT).
                    opts.zh ? (
                      <Text style={s.priceMain}>{formatFx(p.priceMnt, c)}</Text>
                    ) : (
                      <>
                        <Text style={s.priceMain}>
                          {formatFx(p.priceMnt, c)}
                        </Text>
                        <Text style={s.priceSub}>{formatMnt(p.priceMnt)}</Text>
                      </>
                    )
                  ) : opts.zh ? (
                    <Text style={s.priceMain}>
                      {formatMntPlain(p.priceMnt)}
                    </Text>
                  ) : (
                    <Text style={s.priceMain}>{formatMnt(p.priceMnt)}</Text>
                  )}
                </View>

                <View style={s.metaRow}>
                  <Text style={s.metaItem}>
                    {`${L.months}: `}
                    <Text style={s.metaStrong}>
                      {`${p.minMonths}–${p.maxMonths} ${L.monthsUnit}`}
                    </Text>
                  </Text>
                </View>

                {p.description ? (
                  <Text style={s.desc}>
                    {clampDescription(p.description, opts.zh)}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        <View style={s.footer} fixed>
          <Text>{L.title}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              opts.zh
                ? `${L.page} ${pageNumber} / ${totalPages} 页`
                : `${L.page} ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

// ---------------------------------------------------------------------------
// Public entry: build the PDF blob and trigger a browser download.
// ---------------------------------------------------------------------------
export async function generateCatalogPdf(
  products: CatalogProduct[],
  opts: CatalogOptions
): Promise<void> {
  ensureFonts(opts.zh);
  const blob = await pdf(
    <CatalogDocument products={products} opts={opts} />
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const stamp = opts.generatedAt.replace(/[^0-9]/g, "").slice(0, 8) || "catalog";
  const suffix = opts.zh ? "zh" : "mn";
  const fx = opts.currency ? `-${opts.currency.code.toLowerCase()}` : "";
  a.download = `onegram-catalog-${suffix}${fx}-${stamp}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke a tick later so the download has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
