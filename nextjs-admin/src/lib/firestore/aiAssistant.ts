import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
  type DocumentData,
} from "firebase/firestore";
import { getDb, getFirebaseAuth } from "@/lib/firebase/client";

export type AiConversationListItem = {
  id: string;
  title: string;
  messageCount: number;
  updatedAt: Timestamp | null;
  createdAt: Timestamp | null;
};

export type AiChatRole = "user" | "assistant";

export type AiChatMessage = {
  role: AiChatRole;
  content: string;
  /** ISO string or Firestore timestamp depending on writer */
  timestamp?: string | Timestamp | null;
};

export type AiConversationDetail = {
  id: string;
  title: string;
  messages: AiChatMessage[];
};

export type AiReportType = "pdf" | "word" | string;

export type AiReport = {
  id: string;
  title: string;
  type: AiReportType;
  fileName?: string;
  url?: string;
  downloadUrl?: string;
  size?: number;
  createdAt: Timestamp | string | null;
};

function uid(): string {
  const u = getFirebaseAuth().currentUser;
  if (!u) throw new Error("Нэвтрээгүй байна.");
  return u.uid;
}

export async function fetchAiConversations(): Promise<AiConversationListItem[]> {
  const q = query(
    collection(getDb(), "ai_conversations"),
    where("adminUid", "==", uid()),
    orderBy("updatedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const raw = d.data() as DocumentData;
    const messages = Array.isArray(raw.messages) ? raw.messages : [];
    return {
      id: d.id,
      title: raw.title || "Яриа",
      messageCount: messages.length,
      updatedAt: raw.updatedAt ?? null,
      createdAt: raw.createdAt ?? null,
    } satisfies AiConversationListItem;
  });
}

export async function fetchAiConversation(
  conversationId: string
): Promise<AiConversationDetail> {
  const snap = await getDoc(doc(getDb(), "ai_conversations", conversationId));
  if (!snap.exists()) throw new Error("Яриа олдсонгүй.");
  const data = snap.data() as DocumentData;
  const raw = Array.isArray(data.messages) ? data.messages : [];
  return {
    id: snap.id,
    title: data.title || "Яриа",
    messages: raw.map((m: DocumentData) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: String(m.content ?? ""),
      timestamp: m.timestamp ?? null,
    })),
  };
}

export async function deleteAiConversation(conversationId: string): Promise<void> {
  await deleteDoc(doc(getDb(), "ai_conversations", conversationId));
}

export async function fetchAiReports(): Promise<AiReport[]> {
  const q = query(
    collection(getDb(), "ai_reports"),
    where("createdBy", "==", uid()),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const raw = d.data() as DocumentData;
    return {
      id: d.id,
      title: raw.title || raw.fileName || "Тайлан",
      type: raw.type ?? "pdf",
      fileName: raw.fileName,
      url: raw.url,
      downloadUrl: raw.downloadUrl ?? raw.url,
      size: raw.size,
      createdAt: raw.createdAt ?? null,
    } satisfies AiReport;
  });
}

export async function deleteAiReport(reportId: string): Promise<void> {
  await deleteDoc(doc(getDb(), "ai_reports", reportId));
}

export function formatChatTime(value: string | Timestamp | null | undefined): string {
  if (!value) return "";
  let d: Date;
  if (typeof value === "string") d = new Date(value);
  else if (typeof value === "object" && "toDate" in value) d = value.toDate();
  else return "";
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatSidebarDate(value: Timestamp | string | null | undefined): string {
  if (!value) return "";
  let d: Date;
  if (typeof value === "string") d = new Date(value);
  else if (typeof value === "object" && "toDate" in value) d = value.toDate();
  else return "";
  if (Number.isNaN(d.getTime())) return "";
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hh}:${mm}`;
}

export function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
