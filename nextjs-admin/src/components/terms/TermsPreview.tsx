"use client";

import { cn } from "@/lib/utils";

/**
 * Нөхцөлийн текстийг апптай ижил дүрмээр урьдчилан харуулна:
 *   "# Гарчиг" бүлгийн гарчиг · "- мөр" цэгтэй мөр · хоосон мөр зай ·
 *   бусад мөр догол мөр. {name} хувьсагчийг жишээ утгаар солино.
 */
const SAMPLE: Record<string, string> = {
  percent: "10",
  valuation: "3,600,000,000",
  units: "100,000",
  price: "36,000",
  months: "24",
  growth: "24",
  buyback: "53,280",
};

function subst(text: string): string {
  return text.replace(/\{(\w+)\}/g, (m, name: string) => SAMPLE[name] ?? m);
}

export function TermsPreview({
  title,
  body,
  className,
}: {
  title: string;
  body: string;
  className?: string;
}) {
  const lines = subst(body).split("\n");
  return (
    <div className={cn("text-[13px] leading-relaxed text-foreground", className)}>
      {title && <div className="mb-2 text-[15px] font-semibold">{subst(title)}</div>}
      {lines.map((raw, i) => {
        const line = raw.trimEnd();
        if (!line.trim()) return <div key={i} className="h-2" />;
        if (line.startsWith("# ")) {
          return (
            <div key={i} className="mt-3 mb-1.5 text-[13px] font-semibold text-primary-600 dark:text-primary-400">
              {line.slice(2).trim()}
            </div>
          );
        }
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <div key={i} className="mb-1 flex gap-2 pl-1">
              <span className="text-primary-600">•</span>
              <span>{line.slice(2).trim()}</span>
            </div>
          );
        }
        return (
          <p key={i} className="mb-1.5">
            {line}
          </p>
        );
      })}
    </div>
  );
}
