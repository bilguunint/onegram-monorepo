import type { ReactNode } from "react";
import { AuthGate } from "@/components/layout/AuthGate";

/**
 * Хэвлэх хуудсуудын layout: нэвтрэлт шаардана, харин хажуугийн цэс,
 * толгой хэсэггүй тул хэвлэхэд цэвэр гарна.
 */
export default function PrintLayout({ children }: { children: ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
