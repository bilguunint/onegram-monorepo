import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";

// ---------------------------------------------------------------------------
// Үйлчилгээний нөхцөл — terms/{key}
//  Апп нөхцөл бүрийг энэ коллекцоос уншина (app/lib/repositories/terms_repository.dart).
//  Хадгалах бүрд version +1, өмнөх хувилбар terms/{key}/versions/{n}-д хадгалагдана.
//
//  Текстийн формат (апп, админы preview ижил):
//    "# Гарчиг"  бүлгийн гарчиг · "- мөр" цэгтэй мөр · хоосон мөр зай ·
//    бусад мөр энгийн догол мөр · "{percent}" гэх мэт хувьсагч апп дээр солигдоно.
// ---------------------------------------------------------------------------

export const TERM_LANGS = ["mn", "en", "zh", "ru"] as const;
export type TermLang = (typeof TERM_LANGS)[number];
export const LANG_LABEL: Record<TermLang, string> = {
  mn: "Монгол",
  en: "English",
  zh: "中文",
  ru: "Русский",
};

export type TermMeta = {
  key: string;
  label: string;
  /** Апп дээр хаана харагдах вэ */
  where: string;
  /** Апп дээр солигдох хувьсагчууд */
  placeholders: string[];
};

export const TERM_KEYS: TermMeta[] = [
  {
    key: "general",
    label: "Ерөнхий үйлчилгээний нөхцөл",
    where: "Алт захиалах дэлгэц, бүртгүүлэх, Бусад → Үйлчилгээний нөхцөл",
    placeholders: [],
  },
  {
    key: "privacy",
    label: "Нууцлалын бодлого",
    where: "Бусад → Нууцлалын бодлого",
    placeholders: [],
  },
  {
    key: "gift",
    label: "Бэлэглэх үйлчилгээний нөхцөл",
    where: "Бэлэг илгээх дэлгэц",
    placeholders: [],
  },
  {
    key: "withdraw",
    label: "Биетээр авах үйлчилгээний нөхцөл",
    where: "Биетээр авах хүсэлтийн дэлгэц (салбарын хаяг тусдаа харагдана)",
    placeholders: [],
  },
  {
    key: "installment",
    label: "Хуваан төлөх үйлчилгээний нөхцөл",
    where: "Хуваан төлөлт эхлүүлэх цонх",
    placeholders: [],
  },
  {
    key: "refund",
    label: "Буцаан олголтын нөхцөл",
    where: "Хуваан төлөлт цуцлах дэлгэц",
    placeholders: ["{percent}"],
  },
  {
    key: "shuteen",
    label: "Шүтээн хуур хөтөлбөрийн нөхцөл",
    where: "Шүтээн хуур худалдан авах дэлгэц",
    placeholders: ["{valuation}", "{units}", "{price}", "{months}", "{growth}", "{buyback}"],
  },
];

export type LangText = Record<TermLang, string>;

export type TermDoc = {
  key: string;
  title: LangText;
  body: LangText;
  version: number;
  updated_at: Timestamp | null;
  updated_by: string | null;
};

export type TermVersion = {
  version: number;
  title: LangText;
  body: LangText;
  saved_at: Timestamp | null;
  saved_by: string | null;
};

export function emptyLangText(): LangText {
  return { mn: "", en: "", zh: "", ru: "" };
}

function toLangText(v: unknown): LangText {
  const out = emptyLangText();
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    for (const l of TERM_LANGS) out[l] = typeof o[l] === "string" ? (o[l] as string) : "";
  }
  return out;
}

function mapDoc(key: string, d: Record<string, unknown>): TermDoc {
  return {
    key,
    title: toLangText(d.title),
    body: toLangText(d.body),
    version: Number(d.version ?? 0),
    updated_at: (d.updated_at as Timestamp) ?? null,
    updated_by: typeof d.updated_by === "string" ? d.updated_by : null,
  };
}

export async function fetchAllTerms(): Promise<Map<string, TermDoc>> {
  const snap = await getDocs(collection(getDb(), "terms"));
  const out = new Map<string, TermDoc>();
  for (const d of snap.docs) out.set(d.id, mapDoc(d.id, d.data()));
  return out;
}

export async function fetchTerm(key: string): Promise<TermDoc | null> {
  const snap = await getDoc(doc(getDb(), "terms", key));
  if (!snap.exists()) return null;
  return mapDoc(key, snap.data());
}

export async function fetchTermVersions(key: string): Promise<TermVersion[]> {
  const snap = await getDocs(
    query(collection(getDb(), "terms", key, "versions"), orderBy("version", "desc"))
  );
  return snap.docs.map((d) => {
    const v = d.data();
    return {
      version: Number(v.version ?? 0),
      title: toLangText(v.title),
      body: toLangText(v.body),
      saved_at: (v.saved_at as Timestamp) ?? null,
      saved_by: typeof v.saved_by === "string" ? v.saved_by : null,
    };
  });
}

/** Хэрэглэгчийн гарын үсэгтэй зөвшөөрөл (terms_acceptances/{uid}_{key}_v{n}). */
export type TermAcceptance = {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  version: number;
  accepted_at: Timestamp | null;
  platform: string;
  /** base64 PNG (цагаан дэвсгэр, хар зураас) */
  signature_png: string;
};

function mapAcceptance(id: string, v: Record<string, unknown>): TermAcceptance {
  return {
    id,
    user_id: String(v.user_id ?? ""),
    user_name: String(v.user_name ?? ""),
    user_phone: String(v.user_phone ?? ""),
    version: Number(v.version ?? 0),
    accepted_at: (v.accepted_at as Timestamp) ?? null,
    platform: String(v.platform ?? ""),
    signature_png: String(v.signature_png ?? ""),
  };
}

/** Нэг зөвшөөрлийн баримт + түүний нөхцөлийн түлхүүр, гарчиг (хэвлэх хуудсанд). */
export async function fetchAcceptance(
  id: string
): Promise<(TermAcceptance & { terms_key: string; title: string }) | null> {
  const snap = await getDoc(doc(getDb(), "terms_acceptances", id));
  if (!snap.exists()) return null;
  const v = snap.data();
  return {
    ...mapAcceptance(snap.id, v),
    terms_key: String(v.terms_key ?? ""),
    title: String(v.title ?? ""),
  };
}

/** Тухайн хувилбарын нөхцөлийн текст — гарын үсэг зурсан яг тэр хувилбараар харуулахад. */
export async function fetchTermVersion(key: string, version: number): Promise<TermVersion | null> {
  const snap = await getDoc(doc(getDb(), "terms", key, "versions", String(version)));
  if (!snap.exists()) return null;
  const v = snap.data();
  return {
    version: Number(v.version ?? version),
    title: toLangText(v.title),
    body: toLangText(v.body),
    saved_at: (v.saved_at as Timestamp) ?? null,
    saved_by: typeof v.saved_by === "string" ? v.saved_by : null,
  };
}

/**
 * Хэрэглэгчдийн алтан хуримтлалын зорилт (users/{uid}.gold_goal_grams, аппаас оруулсан).
 * uid -> грамм; тохируулаагүй бол null.
 */
export async function fetchGoldGoals(userIds: string[]): Promise<Record<string, number | null>> {
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  const out: Record<string, number | null> = {};
  for (const id of ids) out[id] = null;
  const CHUNK = 30; // Firestore "in" хязгаар
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const snap = await getDocs(
      query(collection(getDb(), "users"), where(documentId(), "in", chunk))
    );
    for (const d of snap.docs) {
      const g = d.data().gold_goal_grams;
      out[d.id] = typeof g === "number" && g > 0 ? g : null;
    }
  }
  return out;
}

export async function fetchAcceptances(key: string, max = 300): Promise<TermAcceptance[]> {
  const snap = await getDocs(
    query(collection(getDb(), "terms_acceptances"), where("terms_key", "==", key), limit(max))
  );
  const rows = snap.docs.map((d) => mapAcceptance(d.id, d.data()));
  rows.sort((a, b) => (b.accepted_at?.toMillis() ?? 0) - (a.accepted_at?.toMillis() ?? 0));
  return rows;
}

/**
 * Хадгална: version +1, шинэ хувилбарыг versions/{n}-д давхар бичнэ.
 * Монгол текст заавал байна; бусад хэл хоосон бол апп монголыг харуулна.
 */
export async function saveTerm(
  key: string,
  draft: { title: LangText; body: LangText },
  savedBy: string
): Promise<number> {
  const trim = (t: LangText): LangText => ({
    mn: t.mn.trim(),
    en: t.en.trim(),
    zh: t.zh.trim(),
    ru: t.ru.trim(),
  });
  const title = trim(draft.title);
  const body = trim(draft.body);
  if (!title.mn) throw new Error("Монгол гарчиг хоосон байна.");
  if (!body.mn) throw new Error("Монгол текст хоосон байна.");

  const db = getDb();
  const ref = doc(db, "terms", key);
  return runTransaction(db, async (tx) => {
    const cur = await tx.get(ref);
    const version = (cur.exists() ? Number(cur.data().version ?? 0) : 0) + 1;
    tx.set(ref, {
      key,
      title,
      body,
      version,
      updated_at: serverTimestamp(),
      updated_by: savedBy,
    });
    tx.set(doc(db, "terms", key, "versions", String(version)), {
      version,
      title,
      body,
      saved_at: serverTimestamp(),
      saved_by: savedBy,
    });
    return version;
  });
}
