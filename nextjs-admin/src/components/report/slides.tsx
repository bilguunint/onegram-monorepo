"use client";

import type { ReactNode } from "react";
import {
  Activity,
  Banknote,
  Bell,
  Boxes,
  Building2,
  Coins,
  CreditCard,
  Crown,
  Eye,
  Gift,
  Globe,
  Landmark,
  LineChart,
  Lock,
  MapPin,
  Package,
  Percent,
  PiggyBank,
  ReceiptText,
  Scale,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  UserCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  fCompactGram,
  fCompactMNT,
  fInt,
  strings,
  type Lang,
} from "@/lib/report/i18n";
import { currentMonthKey, percentChange } from "@/lib/format";
import type { ReportData } from "@/lib/report/data";
import { MoMBadge } from "@/components/report/ReportParts";
import {
  DailyTrendChart,
  MonthlyRevenueBarChart,
} from "@/components/report/charts";

export type SlideDef = { id: string; node: ReactNode };

// ---------------------------------------------------------------------------
// Bilingual narrative content for the investor deck.
// ---------------------------------------------------------------------------
type IconItem = { icon: LucideIcon; title: string; desc?: string };
type StepItem = { icon: LucideIcon; text: string };

type Narrative = {
  brand: string;
  liveEyebrow: string;
  s1Title: string;
  s1Subtitle: string;
  s2Title: string;
  s2Body: string[];
  s3Title: string;
  s3Intro: string;
  s3Items: IconItem[];
  s4Title: string;
  s4Body: string[];
  s5Title: string;
  s5Steps: StepItem[];
  s6Title: string;
  s6Items: IconItem[];
  s7Title: string;
  s7Intro: string;
  s7Items: IconItem[];
  s8Title: string;
  s8Body: string[];
  s8Items: IconItem[];
  s9Title: string;
  s9Body: string[];
  s9Highlight: string;
  s10Title: string;
  s10Intro: string;
  s10Items: IconItem[];
  s11Title: string;
  s11Items: IconItem[];
  s12Title: string;
  s12Body: string;
};

const CONTENT: Record<Lang, Narrative> = {
  mn: {
    brand: "Их Хаадын Чулуу",
    liveEyebrow: "Бодит үзүүлэлт",
    s1Title: "Дижитал алт өмчлөх платформ",
    s1Subtitle:
      "Гар утасны аппликейшнээр бодит алтыг худалдан авч, хадгалж, бэлэглэж, удирдаарай.",
    s2Title: "Компанийн танилцуулга",
    s2Body: [
      "Их Хаадын Чулуу нь хэрэглэгчдэд гар утасны аппликейшнээр бодит физик алтыг граммаар худалдан авах боломжийг олгодог Монголын дижитал алтны платформ юм.",
      "Энэхүү платформ нь жирийн хэрэглэгчдэд алт өмчлөхийг энгийн, хүртээмжтэй, ил тод болгодог.",
    ],
    s3Title: "Шийдвэрлэх асуудал",
    s3Intro: "Уламжлалт алтны хөрөнгө оруулалт олон хүнд хүндрэлтэй байдаг:",
    s3Items: [
      { icon: Banknote, title: "Алт ихэвчлэн том хэмжээний эхний хөрөнгө шаарддаг." },
      { icon: Lock, title: "Физик хадгалалт, аюулгүй байдал тав тухгүй." },
      { icon: LineChart, title: "Үнийн хөдөлгөөнийг хянахад жирийн хэрэглэгчдэд хэцүү." },
      { icon: Smartphone, title: "Залуу хэрэглэгчдэд бодит хөрөнгөд хуримтлуулах энгийн арга хэрэгтэй." },
    ],
    s4Title: "Бидний шийдэл",
    s4Body: [
      "Их Хаадын Чулуу нь хэрэглэгчдэд багахан граммаас эхлэн алт худалдан авах боломжийг олгоно.",
      "Хэрэглэгчид Монголбанкны өдрийн алтны ханшаар алт худалдан авч, аппликейшн дотроо алтны үлдэгдлээ хянаж, дараа нь албан ёсны салбараас физик алтаа авах боломжтой.",
    ],
    s5Title: "Үндсэн ажиллагаа",
    s5Steps: [
      { icon: UserCheck, text: "Хэрэглэгч бүртгүүлж, бүртгэлээ баталгаажуулна." },
      { icon: LineChart, text: "Өдрийн алтны ханшийг шалгана." },
      { icon: Scale, text: "Худалдан авах алтны хэмжээгээ сонгоно." },
      { icon: CreditCard, text: "Холбосон төлбөрийн системээр төлбөрөө хийнэ." },
      { icon: Wallet, text: "Алтны үлдэгдэл хэтэвчинд нэмэгдэнэ." },
      { icon: Gift, text: "Хадгалах, бэлэглэх эсвэл физик алтаа авах боломжтой." },
    ],
    s6Title: "Гол боломжууд",
    s6Items: [
      { icon: Wallet, title: "Дижитал алтны хэтэвч" },
      { icon: Scale, title: "Граммаар алт худалдан авах" },
      { icon: Activity, title: "Бодит цагийн үлдэгдэл хяналт" },
      { icon: Gift, title: "Хэрэглэгч хооронд алт бэлэглэх" },
      { icon: ReceiptText, title: "Гүйлгээний түүх" },
      { icon: Bell, title: "Push мэдэгдэл" },
      { icon: Package, title: "Физик алт олголт" },
      { icon: PiggyBank, title: "Урт хугацааны хуримтлал" },
    ],
    s7Title: "Бизнес загвар",
    s7Intro:
      "Бизнес загвар нь алт худалдан авах гүйлгээ, үйлчилгээний шимтгэл, премиум санхүүгийн боломжууд болон ирээдүйн түншлэлд тулгуурладаг. Орлогын үндсэн эх үүсвэрүүд:",
    s7Items: [
      { icon: Percent, title: "Гүйлгээний маржин / үйлчилгээний шимтгэл" },
      { icon: PiggyBank, title: "Алт хуримтлалын төлөвлөгөө" },
      { icon: Crown, title: "Премиум бүртгэлийн боломжууд" },
      { icon: Building2, title: "Байгууллагын түншлэл" },
      { icon: ShoppingBag, title: "Физик бүтээгдэхүүний борлуулалт" },
      { icon: Landmark, title: "Алтаар баталгаажсан санхүүгийн бүтээгдэхүүн" },
    ],
    s8Title: "Яагаад алт гэж?",
    s8Body: [
      "Алт бол урт хугацааны итгэлтэй үнэ цэнийн хадгалуур юм.",
      "Монгол хэрэглэгчдэд алт нь инфляци, валютын эрсдэл, богино хугацааны зах зээлийн тодорхойгүй байдлаас хамгаална.",
    ],
    s8Items: [
      { icon: ShieldCheck, title: "Урт хугацааны үнэ цэнийн хадгалуур" },
      { icon: Banknote, title: "Инфляци, валютын эрсдэлээс хамгаална" },
      { icon: Smartphone, title: "Дижитал үед хүртээмжтэй" },
    ],
    s9Title: "Зах зээлийн байр суурь",
    s9Body: [
      "Их Хаадын Чулуу нь уламжлалт алт өмчлөлийг орчин үеийн финтекийн хялбар байдалтай хослуулдаг.",
    ],
    s9Highlight: "Энэ бол зүгээр нэг алтны дэлгүүр биш — дижитал алт хуримтлалын экосистем юм.",
    s10Title: "Хэрэглэгчийн үнэ цэнэ",
    s10Intro: "Хэрэглэгчдэд платформ дараах боломжийг олгоно:",
    s10Items: [
      { icon: Coins, title: "Бодит алтанд хялбар хүрэх" },
      { icon: Scale, title: "Багахан дүнгээс эхлэх" },
      { icon: Eye, title: "Ил тод үнэ" },
      { icon: Lock, title: "Найдвартай үлдэгдэл хяналт" },
      { icon: Gift, title: "Хялбар бэлэглэл" },
      { icon: PiggyBank, title: "Урт хугацааны баялаг бүтээх" },
    ],
    s11Title: "Ирээдүйн төлөвлөгөө",
    s11Items: [
      { icon: PiggyBank, title: "Алтаар баталгаажсан хуримтлалын бүтээгдэхүүн" },
      { icon: CreditCard, title: "Хэсэгчилсэн төлбөрөөр алт худалдан авах төлөвлөгөө" },
      { icon: Banknote, title: "Алтаар баталгаажсан зээлийн боломж" },
      { icon: MapPin, title: "Илүү олон салбарын олголтын цэг" },
      { icon: Boxes, title: "Блокчэйнд суурилсан бодит хөрөнгийн токенжуулалт" },
      { icon: Globe, title: "Зохицуулалтаас хамааран олон улсын зах зээлд тэлэх" },
    ],
    s12Title: "Физик алт ба дижитал санхүүг холбосон гүүр",
    s12Body:
      "Их Хаадын Чулуу нь физик алт ба дижитал санхүүгийн хооронд гүүр барьж байна. Бидний эрхэм зорилго бол бодит алт өмчлөхийг хүн бүрт энгийн, итгэлтэй, хүртээмжтэй болгох явдал.",
  },
  en: {
    brand: "Ikh Khaadiin Chuluu",
    liveEyebrow: "Live metrics",
    s1Title: "Digital Gold Ownership Platform",
    s1Subtitle: "Buy, save, gift, and manage real gold through a mobile app.",
    s2Title: "Company Introduction",
    s2Body: [
      "Ikh Khaadiin Chuluu is a Mongolian digital gold platform that allows users to purchase real physical gold by grams through a mobile application.",
      "The platform makes gold ownership simple, accessible, and transparent for everyday users.",
    ],
    s3Title: "The Problem",
    s3Intro: "Traditional gold investment is difficult for many people because:",
    s3Items: [
      { icon: Banknote, title: "Gold usually requires large upfront capital." },
      { icon: Lock, title: "Physical storage and security are inconvenient." },
      { icon: LineChart, title: "Price tracking is not easy for regular customers." },
      { icon: Smartphone, title: "Young users need a simpler way to save in real assets." },
    ],
    s4Title: "Our Solution",
    s4Body: [
      "Ikh Khaadiin Chuluu allows users to buy gold starting from small gram amounts.",
      "Users can purchase gold based on the daily MongolBank gold price, track their gold balance in the app, and later receive physical gold from official branches.",
    ],
    s5Title: "Core Workflow",
    s5Steps: [
      { icon: UserCheck, text: "User registers and verifies their account." },
      { icon: LineChart, text: "User checks the daily gold price." },
      { icon: Scale, text: "User chooses the amount of gold to buy." },
      { icon: CreditCard, text: "User pays through integrated payment methods." },
      { icon: Wallet, text: "Gold balance is added to the user's wallet." },
      { icon: Gift, text: "User can save, gift, or withdraw physical gold." },
    ],
    s6Title: "Key Features",
    s6Items: [
      { icon: Wallet, title: "Digital gold wallet" },
      { icon: Scale, title: "Buy gold by grams" },
      { icon: Activity, title: "Real-time balance tracking" },
      { icon: Gift, title: "Gold gifting between users" },
      { icon: ReceiptText, title: "Transaction history" },
      { icon: Bell, title: "Push notifications" },
      { icon: Package, title: "Physical gold pickup" },
      { icon: PiggyBank, title: "Long-term saving support" },
    ],
    s7Title: "Business Model",
    s7Intro:
      "The business model is built around gold purchase transactions, service fees, premium financial features, and future partnerships. Main revenue opportunities include:",
    s7Items: [
      { icon: Percent, title: "Transaction margin or service fee" },
      { icon: PiggyBank, title: "Gold saving plans" },
      { icon: Crown, title: "Premium account features" },
      { icon: Building2, title: "Corporate partnerships" },
      { icon: ShoppingBag, title: "Physical product sales" },
      { icon: Landmark, title: "Future gold-backed financial products" },
    ],
    s8Title: "Why Gold?",
    s8Body: [
      "Gold is a trusted long-term store of value.",
      "For Mongolian users, gold provides protection against inflation, currency risk, and short-term market uncertainty.",
    ],
    s8Items: [
      { icon: ShieldCheck, title: "Long-term store of value" },
      { icon: Banknote, title: "Protection from inflation & currency risk" },
      { icon: Smartphone, title: "Accessible for the digital generation" },
    ],
    s9Title: "Market Position",
    s9Body: [
      "Ikh Khaadiin Chuluu combines traditional gold ownership with modern fintech convenience.",
    ],
    s9Highlight: "It is not only a gold shop — it is a digital gold saving ecosystem.",
    s10Title: "User Value",
    s10Intro: "For customers, the platform provides:",
    s10Items: [
      { icon: Coins, title: "Easy access to real gold" },
      { icon: Scale, title: "Small starting amount" },
      { icon: Eye, title: "Transparent pricing" },
      { icon: Lock, title: "Secure balance tracking" },
      { icon: Gift, title: "Convenient gifting" },
      { icon: PiggyBank, title: "Long-term wealth building" },
    ],
    s11Title: "Future Roadmap",
    s11Items: [
      { icon: PiggyBank, title: "Gold-backed savings products" },
      { icon: CreditCard, title: "Installment-based gold purchase plans" },
      { icon: Banknote, title: "Gold-backed loan opportunities" },
      { icon: MapPin, title: "More branch pickup locations" },
      { icon: Boxes, title: "Blockchain-based real-world asset tokenization" },
      { icon: Globe, title: "Expansion to international markets, subject to regulation" },
    ],
    s12Title: "A bridge between physical gold and digital finance",
    s12Body:
      "Ikh Khaadiin Chuluu is building a bridge between physical gold and digital finance. Our mission is to make real gold ownership simple, trusted, and accessible for everyone.",
  },
};

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------
function SlideShell({
  brand,
  eyebrow,
  title,
  note,
  children,
}: {
  brand: string;
  eyebrow?: string;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full w-full flex-col rounded-2xl border border-border-light bg-card p-8 sm:p-14">
      <div className="mb-6 shrink-0 sm:mb-8">
        <div className="mb-2.5 text-[13px] font-semibold uppercase tracking-[0.24em] text-primary-600 sm:text-[15px]">
          {eyebrow ?? brand}
        </div>
        <h2 className="text-[32px] font-bold leading-tight text-foreground sm:text-[48px]">
          {title}
        </h2>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
      {note && (
        <div className="mt-5 shrink-0 text-[13px] text-muted-foreground sm:text-[14px]">
          {note}
        </div>
      )}
    </div>
  );
}

function IconGrid({ items, cols }: { items: IconItem[]; cols: string }) {
  return (
    <div className={`grid h-full auto-rows-fr gap-4 sm:gap-5 ${cols}`}>
      {items.map((it, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-2xl border border-border-light bg-background/40 p-5 sm:p-6"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 sm:h-14 sm:w-14">
            <it.icon className="h-6 w-6 sm:h-7 sm:w-7" />
          </span>
          <div className="min-w-0">
            <div className="text-[16px] font-semibold leading-snug text-foreground sm:text-[20px]">
              {it.title}
            </div>
            {it.desc && (
              <div className="mt-1 text-[13px] leading-relaxed text-muted-foreground sm:text-[15px]">
                {it.desc}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function NumberedSteps({ steps }: { steps: StepItem[] }) {
  return (
    <div className="grid h-full auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {steps.map((s, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-2xl border border-border-light bg-background/40 p-5 sm:p-6"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-500 text-[16px] font-bold text-primary-foreground">
            {i + 1}
          </span>
          <div className="flex items-center gap-2.5">
            <s.icon className="h-5 w-5 shrink-0 text-primary-600 sm:h-6 sm:w-6" />
            <span className="text-[15px] leading-relaxed text-foreground sm:text-[18px]">
              {s.text}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Prose({
  paragraphs,
  highlight,
}: {
  paragraphs: string[];
  highlight?: string;
}) {
  return (
    <div className="flex h-full max-w-4xl flex-col justify-center gap-5">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-[18px] leading-relaxed text-foreground/90 sm:text-[26px]">
          {p}
        </p>
      ))}
      {highlight && (
        <p className="text-[22px] font-semibold leading-snug text-primary-600 sm:text-[32px]">
          {highlight}
        </p>
      )}
    </div>
  );
}

function BigStat({ label, value, sub }: { label: string; value: string; sub?: ReactNode }) {
  return (
    <div className="flex flex-col justify-center rounded-2xl border border-border-light bg-background/40 p-5 sm:p-7">
      <div className="text-[14px] text-muted-foreground sm:text-[16px]">{label}</div>
      <div className="mt-2 text-[30px] font-bold leading-none tabular-nums text-foreground sm:text-[46px]">
        {value}
      </div>
      {sub && <div className="mt-2.5 text-[13px] text-muted-foreground sm:text-[14px]">{sub}</div>}
    </div>
  );
}

function BigStatInline({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[13px] text-muted-foreground sm:text-[15px]">{label}</div>
      <div className="text-[26px] font-bold leading-none tabular-nums text-foreground sm:text-[36px]">
        {value}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Slide builder
// ---------------------------------------------------------------------------
export function buildReportSlides(data: ReportData, lang: Lang): SlideDef[] {
  const t = strings(lang);
  const c = CONTENT[lang];

  const o = data.snapshot.overall;
  const gd = data.snapshot.goldDistribution;
  const cur = data.snapshot.currentMonth;
  const prev = data.snapshot.previousMonth;
  const wt = data.withdrawOverall?.by_withdraw_type;

  const activation =
    o && o.total_users > 0 ? (o.users_with_gold / o.total_users) * 100 : null;
  const penetration =
    gd && gd.totalUsers > 0 ? (gd.usersWithGold / gd.totalUsers) * 100 : null;

  const cmk = currentMonthKey();
  const newUsersThisMonth = data.snapshot.dailyUsers
    .filter((d) => d.date.startsWith(cmk))
    .reduce((s, d) => s + d.new_users, 0);

  // ---- Narrative slides (1–11) ----
  const title: SlideDef = {
    id: "title",
    node: (
      <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl border border-border-light bg-gradient-to-br from-primary-50 to-card p-12 text-center">
        <div className="flex items-center gap-2.5 text-[15px] font-semibold uppercase tracking-[0.32em] text-primary-600 sm:text-[18px]">
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
          {c.brand}
        </div>
        <h1 className="mt-6 text-[40px] font-bold leading-tight text-foreground sm:text-[72px]">
          {c.s1Title}
        </h1>
        <p className="mt-5 max-w-3xl text-[18px] text-muted-foreground sm:text-[26px]">
          {c.s1Subtitle}
        </p>
      </div>
    ),
  };

  const intro: SlideDef = {
    id: "intro",
    node: (
      <SlideShell brand={c.brand} title={c.s2Title}>
        <Prose paragraphs={c.s2Body} />
      </SlideShell>
    ),
  };

  const problem: SlideDef = {
    id: "problem",
    node: (
      <SlideShell brand={c.brand} title={c.s3Title}>
        <div className="flex h-full flex-col">
          <p className="mb-6 text-[16px] text-muted-foreground sm:text-[22px]">{c.s3Intro}</p>
          <div className="min-h-0 flex-1">
            <IconGrid items={c.s3Items} cols="grid-cols-1 sm:grid-cols-2" />
          </div>
        </div>
      </SlideShell>
    ),
  };

  const solution: SlideDef = {
    id: "solution",
    node: (
      <SlideShell brand={c.brand} title={c.s4Title}>
        <Prose paragraphs={c.s4Body} />
      </SlideShell>
    ),
  };

  const workflow: SlideDef = {
    id: "workflow",
    node: (
      <SlideShell brand={c.brand} title={c.s5Title}>
        <NumberedSteps steps={c.s5Steps} />
      </SlideShell>
    ),
  };

  const features: SlideDef = {
    id: "features",
    node: (
      <SlideShell brand={c.brand} title={c.s6Title}>
        <IconGrid items={c.s6Items} cols="grid-cols-2 sm:grid-cols-2 lg:grid-cols-4" />
      </SlideShell>
    ),
  };

  const businessModel: SlideDef = {
    id: "business-model",
    node: (
      <SlideShell brand={c.brand} title={c.s7Title}>
        <div className="flex h-full flex-col">
          <p className="mb-6 text-[16px] leading-relaxed text-muted-foreground sm:text-[22px]">
            {c.s7Intro}
          </p>
          <div className="min-h-0 flex-1">
            <IconGrid items={c.s7Items} cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
          </div>
        </div>
      </SlideShell>
    ),
  };

  const whyGold: SlideDef = {
    id: "why-gold",
    node: (
      <SlideShell brand={c.brand} title={c.s8Title}>
        <div className="flex h-full flex-col gap-6">
          <div className="shrink-0 space-y-3">
            {c.s8Body.map((p, i) => (
              <p
                key={i}
                className="text-[18px] leading-relaxed text-foreground/90 sm:text-[24px]"
              >
                {p}
              </p>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            <IconGrid items={c.s8Items} cols="grid-cols-1 sm:grid-cols-3" />
          </div>
        </div>
      </SlideShell>
    ),
  };

  const market: SlideDef = {
    id: "market",
    node: (
      <SlideShell brand={c.brand} title={c.s9Title}>
        <Prose paragraphs={c.s9Body} highlight={c.s9Highlight} />
      </SlideShell>
    ),
  };

  const userValue: SlideDef = {
    id: "user-value",
    node: (
      <SlideShell brand={c.brand} title={c.s10Title}>
        <div className="flex h-full flex-col">
          <p className="mb-6 text-[16px] text-muted-foreground sm:text-[22px]">{c.s10Intro}</p>
          <div className="min-h-0 flex-1">
            <IconGrid items={c.s10Items} cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
          </div>
        </div>
      </SlideShell>
    ),
  };

  const roadmap: SlideDef = {
    id: "roadmap",
    node: (
      <SlideShell brand={c.brand} title={c.s11Title}>
        <IconGrid items={c.s11Items} cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
      </SlideShell>
    ),
  };

  // ---- Live data slides (current traction) ----
  const overview: SlideDef = {
    id: "data-overview",
    node: (
      <SlideShell brand={c.brand} eyebrow={c.liveEyebrow} title={t.secOverview} note={t.fxNote || undefined}>
        <div className="grid h-full auto-rows-fr grid-cols-2 gap-4 sm:gap-5">
          <BigStat label={t.kRevenue} value={fCompactMNT(o?.total_revenue_all_time, lang)} />
          <BigStat
            label={t.kUsers}
            value={fInt(o?.total_users, lang)}
            sub={activation == null ? undefined : `${activation.toFixed(1)}% ${t.kActivation}`}
          />
          <BigStat label={t.kGoldSold} value={fCompactGram(o?.total_gold_sold_all_time, lang)} />
          <BigStat label={t.kBuyback} value={fCompactMNT(wt?.sold_to_us?.total_price_mnt, lang)} />
        </div>
      </SlideShell>
    ),
  };

  const revenue: SlideDef = {
    id: "data-revenue",
    node: (
      <SlideShell brand={c.brand} eyebrow={c.liveEyebrow} title={t.secMonthlyRevenue} note={t.fxNote || undefined}>
        <div className="flex h-full flex-col">
          <div className="mb-3 flex flex-wrap items-end gap-x-6 gap-y-2">
            <BigStatInline label={t.kRevenue} value={fCompactMNT(o?.total_revenue_all_time, lang)} />
            <div>
              <div className="text-[12px] text-muted-foreground">{t.revenueThisMonth}</div>
              <div className="flex items-center gap-2">
                <div className="text-[22px] font-semibold leading-none tabular-nums text-foreground sm:text-[26px]">
                  {fCompactMNT(cur?.total_revenue, lang)}
                </div>
                <MoMBadge value={percentChange(cur?.total_revenue, prev?.total_revenue)} lang={lang} />
              </div>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <MonthlyRevenueBarChart months={data.snapshot.recentMonths} lang={lang} fill />
          </div>
        </div>
      </SlideShell>
    ),
  };

  const growth: SlideDef = {
    id: "data-growth",
    node: (
      <SlideShell brand={c.brand} eyebrow={c.liveEyebrow} title={t.secUserGrowth}>
        <div className="flex h-full flex-col">
          <div className="mb-2 flex flex-wrap items-end gap-x-6 gap-y-2">
            <BigStatInline label={t.kUsers} value={fInt(o?.total_users, lang)} />
            <BigStatInline label={t.mNewUsers} value={fInt(newUsersThisMonth, lang)} />
            <BigStatInline
              label={t.withGold}
              value={penetration == null ? "—" : `${penetration.toFixed(1)}%`}
            />
          </div>
          <div className="min-h-0 flex-1">
            <DailyTrendChart
              points={data.snapshot.dailyUsers.map((d) => ({ date: d.date, value: d.new_users }))}
              lang={lang}
              kind="count"
              seriesLabel={t.sNewUsers}
              fill
            />
          </div>
        </div>
      </SlideShell>
    ),
  };

  // ---- Closing ----
  const closing: SlideDef = {
    id: "closing",
    node: (
      <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl border border-border-light bg-gradient-to-br from-primary-50 to-card p-12 text-center">
        <div className="text-[14px] font-semibold uppercase tracking-[0.3em] text-primary-600 sm:text-[17px]">
          {c.brand}
        </div>
        <h2 className="mt-5 max-w-4xl text-[32px] font-bold leading-tight text-foreground sm:text-[52px]">
          {c.s12Title}
        </h2>
        <p className="mt-5 max-w-3xl text-[17px] leading-relaxed text-muted-foreground sm:text-[24px]">
          {c.s12Body}
        </p>
        <div className="mt-8 flex items-center gap-5 text-primary-500">
          <Coins className="h-7 w-7 sm:h-8 sm:w-8" />
          <Landmark className="h-7 w-7 sm:h-8 sm:w-8" />
          <PiggyBank className="h-7 w-7 sm:h-8 sm:w-8" />
          <Globe className="h-7 w-7 sm:h-8 sm:w-8" />
        </div>
      </div>
    ),
  };

  return [
    title,
    intro,
    problem,
    solution,
    workflow,
    features,
    businessModel,
    whyGold,
    market,
    userValue,
    roadmap,
    overview,
    revenue,
    growth,
    closing,
  ];
}
