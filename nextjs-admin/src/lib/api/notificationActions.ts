const SEND_NOTIFICATION_URL =
  "https://sendcustomnotification-yuv3eg5qha-uc.a.run.app";

export type SendNotificationRequest = {
  title: string;
  body: string;
  type?: "custom" | "promotion" | string;
  userIds?: string[];
};

export type SendNotificationResponse = {
  success?: boolean;
  message?: string;
  [k: string]: unknown;
};

export async function sendCustomNotification(
  req: SendNotificationRequest
): Promise<SendNotificationResponse> {
  const res = await fetch(SEND_NOTIFICATION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
      (typeof obj.message === "string" && obj.message) ||
      (typeof obj.error === "string" && obj.error) ||
      `Мэдэгдэл илгээхэд алдаа гарлаа (${res.status}).`;
    throw new Error(msg);
  }
  return (payload ?? {}) as SendNotificationResponse;
}
