const MNT = new Intl.NumberFormat("mn-MN", { maximumFractionDigits: 0 });
const GRAM = new Intl.NumberFormat("mn-MN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});
const PERCENT = new Intl.NumberFormat("mn-MN", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const INT = new Intl.NumberFormat("mn-MN", { maximumFractionDigits: 0 });
const COMPACT_DEC = new Intl.NumberFormat("mn-MN", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatMNT(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${MNT.format(n)}₮`;
}

// Compact MNT: 1.5 тэрбум₮ / 32 сая₮ / 145 мянган₮ / 8,234₮
export function formatCompactMNT(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${COMPACT_DEC.format(n / 1_000_000_000)} тэрбум₮`;
  if (abs >= 1_000_000) return `${COMPACT_DEC.format(n / 1_000_000)} сая₮`;
  if (abs >= 100_000) return `${COMPACT_DEC.format(n / 1_000)} мянган₮`;
  return `${MNT.format(n)}₮`;
}

export function formatGram(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${GRAM.format(n)} гр`;
}

// Compact gram: 1.5 кг / 145 гр (no breaking space between number and unit)
export function formatCompactGram(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1000) return `${COMPACT_DEC.format(n / 1000)} кг`;
  return `${GRAM.format(n)} гр`;
}

export function formatInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return INT.format(n);
}

export function formatPercent(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${PERCENT.format(n)}%`;
}

// "2026-05" → "2026 оны 5-р сар"
export function monthLabel(monthKey: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!m) return monthKey;
  const [, year, month] = m;
  return `${year} оны ${parseInt(month, 10)}-р сар`;
}

// "2026-05-22" → "2026.05.22"
export function dateLabel(dateKey: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return dateKey;
  return dateKey.replaceAll("-", ".");
}

export function currentMonthKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function previousMonthKey(d: Date = new Date()): string {
  const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return currentMonthKey(prev);
}

export function percentChange(
  current: number | null | undefined,
  previous: number | null | undefined
): number | null {
  if (current == null || previous == null || !Number.isFinite(current) || !Number.isFinite(previous)) {
    return null;
  }
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}
