"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Eye, History, Loader2, PenLine, Printer, Save, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TermsPreview } from "@/components/terms/TermsPreview";
import {
  emptyLangText,
  fetchAcceptances,
  fetchGoldGoals,
  fetchTerm,
  fetchTermVersions,
  LANG_LABEL,
  saveTerm,
  TERM_KEYS,
  TERM_LANGS,
  type LangText,
  type TermAcceptance,
  type TermDoc,
  type TermLang,
  type TermVersion,
} from "@/lib/firestore/terms";

type Tab = "edit" | "history" | "acceptances";

const fmtDate = (t: { toDate: () => Date } | null) =>
  t ? t.toDate().toLocaleString("mn-MN") : "—";

export default function TermEditPage() {
  const params = useParams<{ key: string }>();
  const key = params?.key ?? "";
  const meta = TERM_KEYS.find((m) => m.key === key) ?? null;
  const { user, adminData } = useAuth();
  const canEdit = adminData?.role === "admin" || adminData?.role === "manager";

  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState<TermDoc | null>(null);
  const [title, setTitle] = useState<LangText>(emptyLangText());
  const [body, setBody] = useState<LangText>(emptyLangText());
  const [lang, setLang] = useState<TermLang>("mn");
  const [tab, setTab] = useState<Tab>("edit");
  const [saving, setSaving] = useState(false);
  const [versions, setVersions] = useState<TermVersion[] | null>(null);
  const [acceptances, setAcceptances] = useState<TermAcceptance[] | null>(null);
  /** uid -> алтан хуримтлалын зорилт (гр), аппаас оруулсан */
  const [goldGoals, setGoldGoals] = useState<Record<string, number | null>>({});
  const [openSig, setOpenSig] = useState<TermAcceptance | null>(null);

  useEffect(() => {
    if (!key) return;
    let alive = true;
    fetchTerm(key)
      .then((d) => {
        if (!alive) return;
        setDoc(d);
        if (d) {
          setTitle(d.title);
          setBody(d.body);
        } else if (meta) {
          setTitle({ ...emptyLangText(), mn: meta.label });
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Нөхцөл ачааллахад алдаа гарлаа.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // meta is derived from key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (tab === "history" && versions === null && key) {
      fetchTermVersions(key)
        .then(setVersions)
        .catch((err) => {
          console.error(err);
          toast.error("Хувилбарын түүх ачааллахад алдаа гарлаа.");
        });
    }
    if (tab === "acceptances" && acceptances === null && key) {
      fetchAcceptances(key)
        .then((rows) => {
          setAcceptances(rows);
          fetchGoldGoals(rows.map((r) => r.user_id))
            .then(setGoldGoals)
            .catch((err) => console.error("gold_goal_grams:", err));
        })
        .catch((err) => {
          console.error(err);
          toast.error("Зөвшөөрлүүдийг ачааллахад алдаа гарлаа.");
        });
    }
  }, [tab, key, versions, acceptances]);

  const dirty = useMemo(() => {
    const base = doc ?? { title: emptyLangText(), body: emptyLangText() };
    return TERM_LANGS.some((l) => base.title[l] !== title[l] || base.body[l] !== body[l]);
  }, [doc, title, body]);

  const save = async () => {
    if (!user || !canEdit) return;
    setSaving(true);
    try {
      const v = await saveTerm(key, { title, body }, user.uid);
      const fresh = await fetchTerm(key);
      setDoc(fresh);
      setVersions(null);
      toast.success(`Хадгалагдлаа — хувилбар ${v}. Хэрэглэгчид шинэ хувилбарт дахин гарын үсэг зурна.`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Хадгалахад алдаа гарлаа.");
    } finally {
      setSaving(false);
    }
  };

  if (!meta) {
    return (
      <div className="space-y-3">
        <p className="text-[13px] text-muted-foreground">Ийм нөхцөл тодорхойлогдоогүй: {key}</p>
        <Link href="/terms">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" /> Буцах
          </Button>
        </Link>
      </div>
    );
  }

  const TABS: { key: Tab; label: string; icon: typeof PenLine }[] = [
    { key: "edit", label: "Засварлах", icon: PenLine },
    { key: "history", label: "Хувилбарын түүх", icon: History },
    { key: "acceptances", label: "Гарын үсэг зурсан", icon: Users },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Link href="/terms" className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Үйлчилгээний нөхцөл
          </Link>
          <h1 className="text-[18px] font-semibold text-foreground">{meta.label}</h1>
          <p className="text-[12px] text-muted-foreground">
            {meta.where}
            {doc ? ` · одоогийн хувилбар v${doc.version} · ${fmtDate(doc.updated_at)}` : " · Firestore-д хараахан үүсээгүй"}
          </p>
        </div>
        {tab === "edit" && (
          <Button size="sm" onClick={save} disabled={!canEdit || saving || !dirty}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {doc ? `Хадгалах (v${doc.version + 1})` : "Үүсгэх (v1)"}
          </Button>
        )}
      </header>

      <div className="flex gap-1 border-b border-border-light">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-[12px] font-medium transition-colors",
              tab === t.key
                ? "border-primary-600 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-[12px] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
          Ачааллаж байна...
        </div>
      ) : tab === "edit" ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <section className="space-y-3 rounded-xl border border-border-light bg-card p-4">
            <div className="flex flex-wrap gap-1">
              {TERM_LANGS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                    lang === l
                      ? "bg-primary-600 text-white"
                      : "bg-foreground/[0.05] text-muted-foreground hover:text-foreground"
                  )}
                >
                  {LANG_LABEL[l]}
                  {!body[l].trim() && <span className="ml-1 text-[10px] opacity-70">(хоосон)</span>}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="term-title">Гарчиг ({LANG_LABEL[lang]})</Label>
              <Input
                id="term-title"
                value={title[lang]}
                disabled={!canEdit}
                onChange={(e) => setTitle({ ...title, [lang]: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="term-body">Текст ({LANG_LABEL[lang]})</Label>
              <Textarea
                id="term-body"
                rows={28}
                value={body[lang]}
                disabled={!canEdit}
                onChange={(e) => setBody({ ...body, [lang]: e.target.value })}
                className="font-mono text-[12px] leading-relaxed"
                spellCheck={false}
              />
            </div>
            <div className="rounded-lg bg-foreground/[0.04] p-3 text-[11px] leading-relaxed text-muted-foreground">
              <div className="mb-1 font-medium text-foreground">Форматын дүрэм</div>
              <div><code># Гарчиг</code> — бүлгийн гарчиг</div>
              <div><code>- мөр</code> — цэгтэй мөр</div>
              <div>хоосон мөр — зай; бусад мөр — энгийн догол мөр</div>
              {meta.placeholders.length > 0 && (
                <div className="mt-1">
                  Апп дээр автоматаар солигдох хувьсагч:{" "}
                  {meta.placeholders.map((p) => (
                    <code key={p} className="mr-1">{p}</code>
                  ))}
                </div>
              )}
              <div className="mt-1">
                Монгол текст заавал. Бусад хэл хоосон бол апп монголыг харуулна. Хадгалах бүрд
                хувилбар нэмэгдэж, хэрэглэгч дараагийн удаа дахин гарын үсэг зурна — жижиг
                үсгийн алдаа засахдаа ч үүнийг анхаарна уу.
              </div>
            </div>
            {!canEdit && (
              <p className="text-[11px] text-rose-600">Зөвхөн админ, менежер засварлана.</p>
            )}
          </section>

          <section className="rounded-xl border border-border-light bg-card p-4">
            <div className="mb-3 flex items-center gap-2 text-[12px] font-medium text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              Апп дээр ингэж харагдана ({LANG_LABEL[lang]})
            </div>
            <div className="max-h-[720px] overflow-y-auto rounded-lg border border-border-light bg-background/40 p-4">
              <TermsPreview title={title[lang] || title.mn} body={body[lang] || body.mn} />
            </div>
          </section>
        </div>
      ) : tab === "history" ? (
        <section className="rounded-xl border border-border-light bg-card p-4">
          {versions === null ? (
            <div className="flex items-center gap-2 py-6 text-[12px] text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Ачааллаж байна...
            </div>
          ) : versions.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-muted-foreground">Хувилбар алга.</p>
          ) : (
            <div className="space-y-2">
              {versions.map((v) => (
                <details key={v.version} className="rounded-lg border border-border-light p-3">
                  <summary className="cursor-pointer text-[12px]">
                    <span className="mr-2 rounded bg-primary-50 px-1.5 py-0.5 font-medium text-primary-700">v{v.version}</span>
                    <span className="text-muted-foreground">{fmtDate(v.saved_at)} · {v.saved_by ?? "—"}</span>
                    <span className="ml-2 font-medium text-foreground">{v.title.mn}</span>
                  </summary>
                  <div className="mt-3 max-h-[480px] overflow-y-auto rounded-lg bg-background/40 p-3">
                    <TermsPreview title={v.title.mn} body={v.body.mn} />
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-xl border border-border-light bg-card p-4">
          {acceptances === null ? (
            <div className="flex items-center gap-2 py-6 text-[12px] text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Ачааллаж байна...
            </div>
          ) : acceptances.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-muted-foreground">
              Гарын үсэг зурсан хэрэглэгч алга.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-[12px]">
                <thead>
                  <tr className="border-b border-border-light text-left text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    <th className="px-3 py-2">Хэрэглэгч</th>
                    <th className="px-3 py-2">Утас</th>
                    <th className="px-3 py-2">Хуримтлалын зорилт</th>
                    <th className="px-3 py-2">Хувилбар</th>
                    <th className="px-3 py-2">Огноо</th>
                    <th className="px-3 py-2">Төхөөрөмж</th>
                    <th className="px-3 py-2">Гарын үсэг</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {acceptances.map((a) => (
                    <tr key={a.id} className="border-b border-border-light/60 last:border-0 hover:bg-muted/40">
                      <td className="px-3 py-2">
                        <div className="font-medium text-foreground">{a.user_name || "—"}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{a.user_id}</div>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{a.user_phone || "—"}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {goldGoals[a.user_id] != null ? (
                          <span className="font-medium text-foreground">{goldGoals[a.user_id]} гр</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[11px] font-medium",
                            doc && a.version === doc.version
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                              : "bg-foreground/[0.06] text-muted-foreground"
                          )}
                        >
                          v{a.version}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{fmtDate(a.accepted_at)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{a.platform || "—"}</td>
                      <td className="px-3 py-2">
                        {a.signature_png ? (
                          <button type="button" onClick={() => setOpenSig(a)} className="rounded border border-border-light bg-white p-0.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`data:image/png;base64,${a.signature_png}`}
                              alt="Гарын үсэг"
                              className="h-10 w-24 object-contain"
                            />
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <a
                          href={`/print/terms-acceptance/${encodeURIComponent(a.id)}`}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-center gap-1 rounded-md border border-border-light px-2 py-1 text-[11px] text-foreground hover:bg-muted"
                          title="Нөхцөлийн текст + гарын үсэг, хэвлэх боломжтой"
                        >
                          <Printer className="h-3.5 w-3.5" /> Харах / Хэвлэх
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {openSig && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
              onClick={() => setOpenSig(null)}
            >
              <div className="max-w-[720px] rounded-xl bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${openSig.signature_png}`}
                  alt="Гарын үсэг"
                  className="max-h-[70vh] w-full object-contain"
                />
                <div className="mt-2 text-[12px] text-neutral-700">
                  {openSig.user_name || openSig.user_id} · v{openSig.version} · {fmtDate(openSig.accepted_at)}
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
