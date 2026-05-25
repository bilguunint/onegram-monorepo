import {
  getDownloadURL,
  ref as storageRef,
  uploadBytesResumable,
} from "firebase/storage";
import { getFirebaseAuth, getFirebaseStorage } from "@/lib/firebase/client";

const CLOSE_INVESTMENT_URL =
  "https://us-central1-grammgold.cloudfunctions.net/closeInvestment";

export type CloseInvestmentRequest = {
  investmentId: string;
  attachFile: string;
  closeDate: string; // ISO date string
};

export type CloseInvestmentResponse = {
  success?: boolean;
  message?: string;
  investmentId?: string;
  closedBalance?: number;
  error?: string;
};

export async function uploadContractFile(
  investmentId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const timestamp = Date.now();
  const path = `contracts/${investmentId}_${timestamp}_${file.name}`;
  const ref = storageRef(getFirebaseStorage(), path);
  const task = uploadBytesResumable(ref, file);

  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => {
        if (snap.totalBytes > 0) {
          const percent = (snap.bytesTransferred / snap.totalBytes) * 100;
          onProgress?.(percent);
        }
      },
      (error) => reject(error),
      () => resolve()
    );
  });

  return getDownloadURL(task.snapshot.ref);
}

export async function closeInvestment(
  req: CloseInvestmentRequest
): Promise<CloseInvestmentResponse> {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new Error("Админ эрхээр нэвтэрсэн эсэхээ шалгана уу.");
  }
  const token = await user.getIdToken();
  const res = await fetch(CLOSE_INVESTMENT_URL, {
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
    /* empty body */
  }

  if (!res.ok) {
    const obj = (payload ?? {}) as Record<string, unknown>;
    const msg =
      (typeof obj.error === "string" && obj.error) ||
      (typeof obj.message === "string" && obj.message) ||
      `Үйлдэл амжилтгүй (${res.status}).`;
    throw new Error(msg);
  }
  return (payload ?? {}) as CloseInvestmentResponse;
}
