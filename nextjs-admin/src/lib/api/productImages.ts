import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytesResumable,
} from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase/client";

export const PRODUCT_IMAGE_ACCEPT = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5MB per image
export const PRODUCT_IMAGE_MAX_COUNT = 5;

export async function uploadProductImage(
  productId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const ts = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `products/${productId}/${ts}_${safeName}`;
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

/**
 * Best-effort delete of a product image from Firebase Storage. Failures are
 * swallowed (e.g. if the URL no longer maps to a Storage path).
 */
export async function deleteProductImage(downloadUrl: string): Promise<void> {
  try {
    const u = new URL(downloadUrl);
    // Firebase v9 download URLs encode the storage path in the /o/ segment
    const m = u.pathname.match(/\/o\/(.+)$/);
    if (!m) return;
    const path = decodeURIComponent(m[1]);
    await deleteObject(storageRef(getFirebaseStorage(), path));
  } catch {
    /* ignore – upload-then-delete is best-effort */
  }
}
