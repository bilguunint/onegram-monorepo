import { getFirebaseAuth } from "@/lib/firebase/client";

export type TranslatedProduct = {
  id: string;
  name: string;
  description: string;
};

/**
 * Ask the server (OpenAI) to translate product names/descriptions into
 * Simplified Chinese. Returns one entry per input id (falls back to the
 * original text server-side for anything the model drops).
 */
export async function translateProductsToChinese(
  items: { id: string; name: string; description: string }[]
): Promise<TranslatedProduct[]> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Нэвтрэх шаардлагатай.");
  const token = await user.getIdToken();

  const res = await fetch("/api/translate-products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ items }),
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    /* no body */
  }
  if (!res.ok) {
    const obj = (payload ?? {}) as Record<string, unknown>;
    const msg =
      (typeof obj.msg === "string" && obj.msg) ||
      `Орчуулга амжилтгүй (${res.status}).`;
    throw new Error(msg);
  }
  const data = (payload as { data?: TranslatedProduct[] })?.data ?? [];
  return data;
}

/**
 * Fetch an image URL and return it as a data URL so @react-pdf can embed it
 * without hitting the network during render. Returns null on any failure
 * (missing URL, CORS, network) — the PDF then shows a "no image" placeholder.
 */
export async function fetchImageDataUrl(
  url: string | null | undefined
): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith("image/")) return null;
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) ?? null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
