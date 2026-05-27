import {
  getDownloadURL,
  ref as storageRef,
  uploadBytesResumable,
} from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase/client";

export const WITHDRAW_ATTACHMENT_ACCEPT = "image/*,application/pdf";
export const WITHDRAW_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024; // 10MB
export const WITHDRAW_ATTACHMENT_MAX_COUNT = 5;

export async function uploadWithdrawAttachment(
  withdrawId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const ts = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `withdraws/${withdrawId}/${ts}_${safeName}`;
  const ref = storageRef(getFirebaseStorage(), path);
  const task = uploadBytesResumable(ref, file);
  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => {
        if (snap.totalBytes > 0) {
          onProgress?.((snap.bytesTransferred / snap.totalBytes) * 100);
        }
      },
      (err) => reject(err),
      () => resolve()
    );
  });
  return getDownloadURL(task.snapshot.ref);
}
