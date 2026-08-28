import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";

// ---------------------------------------------------------------------------
// Сугалаат аян — lottery campaigns.
//
// marketing_campaigns/{id}
//   ├ tickets/{id}       one per issued ticket, stamped with its draw period
//   ├ participants/{uid} cumulative grams and tickets issued
//   └ draws/{period}     the settled result for one draw period
//
// Writes all go through the saveCampaign / campaignDraw functions: the
// collection is world-readable so the app can show the running campaign, and a
// client that could write it could mint its own tickets.
// ---------------------------------------------------------------------------

/** Gold is bought in fractions of a gram, so the rate is quoted per 0.1g. */
export const GRAM_UNIT = 0.1;

/** Docs written under the current rules. Anything else is read-only history. */
export const SCHEMA_VERSION = 2;

export type CampaignStatus = "draft" | "active" | "completed";
export type DrawFrequency = "weekly" | "monthly";
export type TicketStatus = "active" | "won" | "expired";

export type Campaign = {
  id: string;
  name: string;
  description: string;
  status: CampaignStatus;
  start_date: Timestamp | null;
  end_date: Timestamp | null;
  signup_tickets: number;
  tickets_per_unit: number;
  draw_frequency: DrawFrequency;
  cover_image: string | null; // 21:9
  campaign_image: string | null; // 3:4
  modal_enabled: boolean;
  modal_image: string | null; // 16:9
  modal_title: string;
  modal_body: string;
  total_participants: number;
  total_tickets: number;
  schema_version?: number;
  created_at?: Timestamp;
  updated_at?: Timestamp;
  updated_by_name?: string;
};

export type CampaignTicket = {
  id: string;
  user_id: string;
  ticket_code: string;
  draw_period: number;
  source: "purchase" | "signup";
  status: TicketStatus;
  order_id: string | null;
  prize?: string | null;
  created_at?: Timestamp;
};

export type DrawWinner = {
  user_id: string;
  user_name: string;
  ticket_code: string;
  ticket_id: string;
  prize: string | null;
  picked: "manual" | "random";
  drawn_by_name?: string;
};

export type CampaignDraw = {
  id: string;
  draw_period: number;
  status: "drawn" | "closed";
  period_start: Timestamp | null;
  period_end: Timestamp | null;
  winners?: DrawWinner[];
};

export const STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: "Ноорог",
  active: "Идэвхтэй",
  completed: "Дууссан",
};

export const FREQUENCY_LABEL: Record<DrawFrequency, string> = {
  weekly: "7 хоног тутам",
  monthly: "Сар тутам",
};

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  active: "Идэвхтэй",
  won: "Хожсон",
  expired: "Дууссан",
};

/** A campaign written before the current rules — read-only history. */
export function isLegacyCampaign(c: { schema_version?: number }): boolean {
  return Number(c.schema_version) !== SCHEMA_VERSION;
}

function toCampaign(id: string, d: Record<string, unknown>): Campaign {
  return {
    id,
    name: (d.name as string) ?? "",
    description: (d.description as string) ?? "",
    status: ((d.status as string) ?? "draft") as CampaignStatus,
    start_date: (d.start_date as Timestamp) ?? null,
    end_date: (d.end_date as Timestamp) ?? null,
    signup_tickets: Number(d.signup_tickets ?? 0),
    tickets_per_unit: Number(d.tickets_per_unit ?? 0),
    draw_frequency: ((d.draw_frequency as string) ?? "weekly") as DrawFrequency,
    cover_image: (d.cover_image as string) ?? null,
    campaign_image: (d.campaign_image as string) ?? null,
    modal_enabled: Boolean(d.modal_enabled),
    modal_image: (d.modal_image as string) ?? null,
    modal_title: (d.modal_title as string) ?? "",
    modal_body: (d.modal_body as string) ?? "",
    total_participants: Number(d.total_participants ?? 0),
    total_tickets: Number(d.total_tickets ?? 0),
    schema_version: d.schema_version as number | undefined,
    created_at: d.created_at as Timestamp | undefined,
    updated_at: d.updated_at as Timestamp | undefined,
    updated_by_name: d.updated_by_name as string | undefined,
  };
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  const snap = await getDocs(
    query(collection(getDb(), "marketing_campaigns"), orderBy("start_date", "desc"))
  );
  return snap.docs.map((d) => toCampaign(d.id, d.data()));
}

export async function fetchCampaign(id: string): Promise<Campaign | null> {
  const snap = await getDoc(doc(getDb(), "marketing_campaigns", id));
  return snap.exists() ? toCampaign(snap.id, snap.data()) : null;
}

export async function fetchDraws(campaignId: string): Promise<CampaignDraw[]> {
  const snap = await getDocs(
    collection(getDb(), "marketing_campaigns", campaignId, "draws")
  );
  return snap.docs
    .map((d) => {
      const v = d.data();
      return {
        id: d.id,
        draw_period: Number(v.draw_period ?? 0),
        status: (v.status as CampaignDraw["status"]) ?? "drawn",
        period_start: (v.period_start as Timestamp) ?? null,
        period_end: (v.period_end as Timestamp) ?? null,
        winners: (v.winners as DrawWinner[]) ?? [],
      };
    })
    .sort((a, b) => a.draw_period - b.draw_period);
}

/**
 * Tickets for one draw period. Capped because a busy period can hold thousands
 * and the table only ever shows a sample — the counts come from the draw doc
 * and the campaign totals, not from this.
 */
export async function fetchPeriodTickets(
  campaignId: string,
  period: number,
  max = 200
): Promise<CampaignTicket[]> {
  const snap = await getDocs(
    query(
      collection(getDb(), "marketing_campaigns", campaignId, "tickets"),
      where("draw_period", "==", period),
      limit(max)
    )
  );
  return snap.docs.map((d) => {
    const v = d.data();
    return {
      id: d.id,
      user_id: (v.user_id as string) ?? "",
      ticket_code: (v.ticket_code as string) ?? "",
      draw_period: Number(v.draw_period ?? 0),
      source: ((v.source as string) ?? "purchase") as CampaignTicket["source"],
      status: ((v.status as string) ?? "active") as TicketStatus,
      order_id: (v.order_id as string) ?? null,
      prize: (v.prize as string) ?? null,
      created_at: v.created_at as Timestamp | undefined,
    };
  });
}

// ---------------------------------------------------------------------------
// Draw period maths — mirrors functions/src/campaign/campaignShared.js.
// Both sides must agree on which period a moment falls in, so keep them in step.
// ---------------------------------------------------------------------------

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function drawPeriodIndex(c: Campaign, when: Date = new Date()): number {
  const start = c.start_date?.toDate();
  if (!start || when <= start) return 0;
  if (c.draw_frequency === "monthly") {
    let months =
      (when.getFullYear() - start.getFullYear()) * 12 +
      (when.getMonth() - start.getMonth());
    if (when.getDate() < start.getDate()) months -= 1;
    return Math.max(0, months);
  }
  return Math.max(0, Math.floor((when.getTime() - start.getTime()) / WEEK_MS));
}

export function drawPeriodBounds(
  c: Campaign,
  index: number
): { start: Date; end: Date } | null {
  const start = c.start_date?.toDate();
  if (!start) return null;
  const from = new Date(start.getTime());
  const to = new Date(start.getTime());
  if (c.draw_frequency === "monthly") {
    from.setMonth(from.getMonth() + index);
    to.setMonth(to.getMonth() + index + 1);
  } else {
    from.setTime(start.getTime() + index * WEEK_MS);
    to.setTime(start.getTime() + (index + 1) * WEEK_MS);
  }
  const end = c.end_date?.toDate();
  if (end && to > end) to.setTime(end.getTime());
  return { start: from, end: to };
}

export function totalDrawPeriods(c: Campaign): number {
  const end = c.end_date?.toDate();
  if (!end) return 1;
  return drawPeriodIndex(c, new Date(end.getTime() - 1)) + 1;
}

/** How many tickets a purchase of `grams` earns under this campaign's rate. */
export function ticketsForGrams(c: Campaign, grams: number): number {
  if (!(c.tickets_per_unit > 0) || !(grams > 0)) return 0;
  return Math.floor(Number((grams / GRAM_UNIT).toFixed(6))) * c.tickets_per_unit;
}

export function isRunning(c: Campaign, now: Date = new Date()): boolean {
  if (c.status !== "active") return false;
  const s = c.start_date?.toDate();
  const e = c.end_date?.toDate();
  return Boolean(s && e && now >= s && now <= e);
}

export function newCampaignId(): string {
  return doc(collection(getDb(), "marketing_campaigns")).id;
}
