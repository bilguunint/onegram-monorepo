import { getFirebaseAuth } from "@/lib/firebase/client";

const AI_CHAT_URL = "https://us-central1-grammgold.cloudfunctions.net/aiChat";

export type AiChatRequest = {
  message: string;
  conversationId?: string | null;
};

export type AiChatResponse = {
  message: string;
  conversationId: string;
  model?: string;
};

export async function sendAiMessage(req: AiChatRequest): Promise<AiChatResponse> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Нэвтрээгүй байна.");
  const token = await user.getIdToken();
  const res = await fetch(AI_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(req),
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
      (typeof obj.error === "string" && obj.error) ||
      (typeof obj.message === "string" && obj.message) ||
      `API error: ${res.status}`;
    throw new Error(msg);
  }

  const d = (payload ?? {}) as Record<string, unknown>;
  return {
    message: String(d.message ?? ""),
    conversationId: String(d.conversationId ?? ""),
    model: typeof d.model === "string" ? d.model : undefined,
  };
}
