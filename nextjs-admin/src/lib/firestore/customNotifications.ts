import {
  collection,
  getDocs,
  orderBy,
  query,
  type Timestamp,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";

export type NotificationType = "custom" | "promotion" | string;

export type CustomNotification = {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  targetType?: "all" | "specific" | string;
  targetUserIds?: string[] | null;
  totalUsers?: number;
  createdAt?: Timestamp | null;
};

export async function fetchCustomNotifications(): Promise<CustomNotification[]> {
  const q = query(
    collection(getDb(), "custom-notifications"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const raw = d.data() as Partial<CustomNotification>;
    return {
      id: d.id,
      title: raw.title ?? "",
      body: raw.body ?? "",
      type: raw.type ?? "custom",
      targetType: raw.targetType ?? "all",
      targetUserIds: raw.targetUserIds ?? null,
      totalUsers: raw.totalUsers ?? 0,
      createdAt: raw.createdAt ?? null,
    } satisfies CustomNotification;
  });
}

export function formatNotificationDate(
  ts: Timestamp | string | null | undefined
): string {
  if (!ts) return "-";
  let d: Date;
  if (typeof ts === "string") d = new Date(ts);
  else if (typeof ts === "object" && "toDate" in ts) d = ts.toDate();
  else return "-";
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
