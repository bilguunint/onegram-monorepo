import { getFirebaseAuth } from "@/lib/firebase/client";
import type { CampaignStatus, DrawFrequency } from "@/lib/firestore/campaigns";

const BASE = "https://us-central1-grammgold.cloudfunctions.net";
const SAVE_CAMPAIGN_URL = `${BASE}/saveCampaign`;
const CAMPAIGN_DRAW_URL = `${BASE}/campaignDraw`;

export type SaveCampaignRequest = {
  id?: string | null;
  name: string;
  description: string;
  status: CampaignStatus;
  start_date: string; // ISO
  end_date: string; // ISO
  signup_tickets: number;
  tickets_per_unit: number;
  draw_frequency: DrawFrequency;
  cover_image: string | null;
  campaign_image: string | null;
  modal_enabled: boolean;
  modal_image: string | null;
  modal_title: string;
  modal_body: string;
};

async function post<T>(url: string, body: unknown): Promise<T> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Хэрэглэгч нэвтрээгүй байна.");
  const token = await user.getIdToken();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // A non-JSON body means the function itself failed; surface it verbatim.
  }
  if (!res.ok) {
    const msg =
      (parsed as { error?: string } | null)?.error ?? text ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return parsed as T;
}

export async function saveCampaign(
  req: SaveCampaignRequest
): Promise<{ id: string; status: CampaignStatus }> {
  return post(SAVE_CAMPAIGN_URL, req);
}

export type DrawWinnerResponse = {
  ticket_code: string;
  user_id: string;
  user_name: string;
  prize: string | null;
  draw_period: number;
};

/** Picks a winner — at random from the period's live tickets, or by code. */
export async function drawWinner(req: {
  campaign_id: string;
  draw_period: number;
  prize: string;
  ticket_code?: string;
}): Promise<DrawWinnerResponse> {
  return post(CAMPAIGN_DRAW_URL, { ...req, action: "draw" });
}

/** Retires the period's remaining tickets so the next one starts empty. */
export async function closeDrawPeriod(req: {
  campaign_id: string;
  draw_period: number;
}): Promise<{ expired: number; draw_period: number }> {
  return post(CAMPAIGN_DRAW_URL, { ...req, action: "close" });
}
