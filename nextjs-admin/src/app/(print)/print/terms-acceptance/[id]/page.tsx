"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Printer, X } from "lucide-react";
import { TermsPreview } from "@/components/terms/TermsPreview";
import {
  fetchAcceptance,
  fetchGoldGoals,
  fetchTerm,
  fetchTermVersion,
  TERM_KEYS,
  type LangText,
  type TermAcceptance,
} from "@/lib/firestore/terms";

type Loaded = {
  acceptance: TermAcceptance & { terms_key: string; title: string };
  /** Гарын үсэг зурсан хувилбарын текст */
  text: { title: LangText; body: LangText } | null;
  /** Текст яг тэр хувилбарынх мөн эсэх */
  exactVersion: boolean;
  /** Алтан хуримтлалын зорилт (гр), аппаас оруулсан; байхгүй бол null */
  goldGoal: number | null;
};

const fmtDateTime = (t: { toDate: () => Date } | null) =>
  t
    ? t.toDate().toLocaleString("mn-MN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export default function TermsAcceptancePrintPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      const acceptance = await fetchAcceptance(id);
      if (!acceptance) {
        if (alive) setError("Зөвшөөрлийн баримт олдсонгүй.");
        return;
      }
      // Эхлээд яг зурсан хувилбарыг, байхгүй бол одоогийн текстийг (ижил хувилбар бол).
      const ver = await fetchTermVersion(acceptance.terms_key, acceptance.version);
      let text: Loaded["text"] = ver ? { title: ver.title, body: ver.body } : null;
      let exact = !!ver;
      if (!text) {
        const cur = await fetchTerm(acceptance.terms_key);
        if (cur) {
          text = { title: cur.title, body: cur.body };
          exact = cur.version === acceptance.version;
        }
      }
      const goals = await fetchGoldGoals([acceptance.user_id]).catch(() => ({}) as Record<string, number | null>);
      const goldGoal = goals[acceptance.user_id] ?? null;
      if (alive) setData({ acceptance, text, exactVersion: exact, goldGoal });
    })().catch((err) => {
      console.error(err);
      if (alive) setError("Ачааллахад алдаа гарлаа.");
    });
    return () => {
      alive = false;
    };
  }, [id]);

  if (error) {
    return <div className="p-8 text-[13px] text-rose-600">{error}</div>;
  }
  if (!data) {
    return (
      <div className="flex items-center justify-center gap-2 p-12 text-[13px] text-neutral-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Ачааллаж байна...
      </div>
    );
  }

  const a = data.acceptance;
  const meta = TERM_KEYS.find((m) => m.key === a.terms_key);
  const title = data.text?.title.mn || a.title || meta?.label || a.terms_key;
  const body = data.text?.body.mn ?? "";

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 print:bg-white">
      <style>{`
        @page { size: A4; margin: 16mm; }
        @media print {
          .no-print { display: none !important; }
          .sheet { box-shadow: none !important; margin: 0 !important; width: auto !important; padding: 0 !important; }
          body { background: #fff !important; }
        }
      `}</style>

      {/* Дээд товчнууд — хэвлэхэд харагдахгүй */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3">
        <div className="text-[13px] text-neutral-600">
          {meta?.label ?? a.terms_key} · хувилбар v{a.version} · {a.user_name || a.user_id}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-neutral-700"
          >
            <Printer className="h-4 w-4" /> Хэвлэх / PDF
          </button>
          <button
            type="button"
            onClick={() => window.close()}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-[13px] text-neutral-700 hover:bg-neutral-50"
          >
            <X className="h-4 w-4" /> Хаах
          </button>
        </div>
      </div>

      <article className="sheet mx-auto my-6 w-[210mm] bg-white p-[16mm] shadow-md">
        {/* Толгой */}
        <header className="mb-6 border-b border-neutral-300 pb-4">
          <div className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
            Үйлчилгээний нөхцөл зөвшөөрсөн баримт
          </div>
          <h1 className="mt-1 text-[18px] font-semibold leading-snug">{title}</h1>
          <div className="mt-1 text-[12px] text-neutral-600">
            Хувилбар v{a.version}
            {!data.exactVersion && (
              <span className="ml-2 text-rose-600">
                (анхааруулга: яг энэ хувилбарын текст архивт олдсонгүй, одоогийн текст харуулав)
              </span>
            )}
          </div>
        </header>

        {/* Хэрэглэгч */}
        <section className="mb-6 grid grid-cols-2 gap-x-8 gap-y-1 text-[12px]">
          <div><span className="text-neutral-500">Захиалагч:</span> <b>{a.user_name || "—"}</b></div>
          <div><span className="text-neutral-500">Утас:</span> {a.user_phone || "—"}</div>
          <div><span className="text-neutral-500">Хэрэглэгчийн ID:</span> <span className="font-mono text-[11px]">{a.user_id}</span></div>
          <div><span className="text-neutral-500">Зөвшөөрсөн огноо:</span> {fmtDateTime(a.accepted_at)}</div>
          <div><span className="text-neutral-500">Төхөөрөмж:</span> {a.platform || "—"}</div>
          <div>
            <span className="text-neutral-500">Алтан хуримтлалын зорилт:</span>{" "}
            <b>{data.goldGoal != null ? `${data.goldGoal} гр` : "—"}</b>
          </div>
          <div><span className="text-neutral-500">Баримтын дугаар:</span> <span className="font-mono text-[11px]">{a.id}</span></div>
        </section>

        {/* Нөхцөлийн текст */}
        <section className="mb-8">
          {body ? (
            <TermsPreview title="" body={body} className="text-[12px] leading-relaxed [&_p]:mb-1 [&_div]:text-neutral-900" />
          ) : (
            <p className="text-[12px] text-rose-600">Нөхцөлийн текст олдсонгүй.</p>
          )}
        </section>

        {/* Гарын үсэг */}
        <section className="break-inside-avoid border-t border-neutral-300 pt-4">
          <div className="text-[12px] text-neutral-700">
            Захиалагч энэхүү нөхцөлийг бүрэн уншиж танилцан, хүлээн зөвшөөрч аппликейшн дээр
            гарын үсэг зурав.
          </div>
          <div className="mt-3 flex items-end gap-6">
            <div>
              <div className="text-[11px] text-neutral-500">Захиалагчийн гарын үсэг</div>
              <div className="mt-1 inline-block rounded border border-neutral-300 bg-white p-1">
                {a.signature_png ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`data:image/png;base64,${a.signature_png}`}
                    alt="Гарын үсэг"
                    className="h-[32mm] w-[80mm] object-contain"
                  />
                ) : (
                  <div className="flex h-[32mm] w-[80mm] items-center justify-center text-[11px] text-neutral-400">
                    гарын үсэггүй
                  </div>
                )}
              </div>
            </div>
            <div className="text-[12px] leading-relaxed">
              <div><b>{a.user_name || a.user_id}</b></div>
              <div>{fmtDateTime(a.accepted_at)}</div>
            </div>
          </div>
        </section>
      </article>
    </div>
  );
}
