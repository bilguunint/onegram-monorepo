import {
  collection,
  doc,
  getDoc,
  getDocs,
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
//   ├ tickets/{id}       one per issued ticket; draw_number is null until swept
//   ├ participants/{uid} cumulative grams and tickets issued
//   └ draws/{n}          one numbered draw and the winners marked against it
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
export type TicketStatus = "active" | "drawn" | "won";

export type Campaign = {
  id: string;
  name: string;
  description: string;
  status: CampaignStatus;
  start_date: Timestamp | null;
  end_date: Timestamp | null;
  signup_tickets: number;
  tickets_per_unit: number;
  cover_image: string | null; // 21:9
  campaign_image: string | null; // 3:4
  modal_enabled: boolean;
  modal_image: string | null; // 16:9
  modal_title: string;
  modal_body: string;
  total_participants: number;
  total_tickets: number;
  draw_count: number;
  schema_version?: number;
  created_at?: Timestamp;
  updated_at?: Timestamp;
  updated_by_name?: string;
};

export type CampaignTicket = {
  id: string;
  user_id: string;
  ticket_code: string;
  /** null while the ticket is still in the live pool. */
  draw_number: number | null;
  source: "purchase" | "signup";
  status: TicketStatus;
  order_id: string | null;
  prize?: string | null;
  created_at?: Timestamp;
};

export type DrawWinner = {
  user_id: string;
  user_name: string;
  user_phone?: string | null;
  ticket_code: string;
  ticket_id: string;
  prize: string | null;
  marked_by_name?: string;
};

export type CampaignDraw = {
  id: string;
  draw_number: number;
  ticket_count: number;
  started_at: Timestamp | null;
  started_by_name?: string;
  winners: DrawWinner[];
};

export const STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: "Ноорог",
  active: "Идэвхтэй",
  completed: "Дууссан",
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
    cover_image: (d.cover_image as string) ?? null,
    campaign_image: (d.campaign_image as string) ?? null,
    modal_enabled: Boolean(d.modal_enabled),
    modal_image: (d.modal_image as string) ?? null,
    modal_title: (d.modal_title as string) ?? "",
    modal_body: (d.modal_body as string) ?? "",
    total_participants: Number(d.total_participants ?? 0),
    total_tickets: Number(d.total_tickets ?? 0),
    draw_count: Number(d.draw_count ?? 0),
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
        draw_number: Number(v.draw_number ?? 0),
        ticket_count: Number(v.ticket_count ?? 0),
        started_at: (v.started_at as Timestamp) ?? null,
        started_by_name: v.started_by_name as string | undefined,
        winners: (v.winners as DrawWinner[]) ?? [],
      };
    })
    .sort((a, b) => b.draw_number - a.draw_number);
}

/**
 * Every ticket of one draw, or — with `null` — the live pool that the next
 * draw will sweep up. Uncapped on purpose: the whole set is what gets exported
 * to the spreadsheet the winners are picked from, so a partial read would hand
 * someone a draw that quietly left entrants out.
 */
export async function fetchDrawTickets(
  campaignId: string,
  drawNumber: number | null
): Promise<CampaignTicket[]> {
  const snap = await getDocs(
    query(
      collection(getDb(), "marketing_campaigns", campaignId, "tickets"),
      where("draw_number", "==", drawNumber)
    )
  );
  return snap.docs
    .map((d) => {
      const v = d.data();
      return {
        id: d.id,
        user_id: (v.user_id as string) ?? "",
        ticket_code: (v.ticket_code as string) ?? "",
        draw_number: (v.draw_number as number | null) ?? null,
        source: ((v.source as string) ?? "purchase") as CampaignTicket["source"],
        status: ((v.status as string) ?? "active") as TicketStatus,
        order_id: (v.order_id as string) ?? null,
        prize: (v.prize as string) ?? null,
        created_at: v.created_at as Timestamp | undefined,
      };
    })
    .sort((a, b) => a.ticket_code.localeCompare(b.ticket_code));
}

/** How many tickets are waiting for the next draw. */
export async function countPendingTickets(campaignId: string): Promise<number> {
  const snap = await getDocs(
    query(
      collection(getDb(), "marketing_campaigns", campaignId, "tickets"),
      where("draw_number", "==", null)
    )
  );
  return snap.size;
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
