import { getFirebaseAuth } from "@/lib/firebase/client";
import type { CampaignStatus } from "@/lib/firestore/campaigns";

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

export type StartDrawResponse = {
  draw_number: number;
  ticket_count: number;
};

/**
 * Opens the next draw, sweeping every ticket not already in one out of the
 * live pool. Tickets earned after this wait for the following draw.
 */
export async function startDraw(campaignId: string): Promise<StartDrawResponse> {
  return post(CAMPAIGN_DRAW_URL, { campaign_id: campaignId, action: "start" });
}

export type MarkWinnerResponse = {
  ticket_code: string;
  user_id: string;
  user_name: string;
  prize: string | null;
  draw_number: number;
};

/**
 * Records a code that won. The winners are picked outside this system — the
 * codes go out as a spreadsheet and only the result comes back.
 */
export async function markWinner(req: {
  campaign_id: string;
  draw_number: number;
  ticket_code: string;
  prize: string;
}): Promise<MarkWinnerResponse> {
  return post(CAMPAIGN_DRAW_URL, { ...req, action: "winner" });
}
