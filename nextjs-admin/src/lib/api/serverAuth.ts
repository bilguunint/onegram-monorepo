import "server-only";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { isValidRole, type AdminRole } from "@/lib/auth/roles";

export type RequesterAdmin = {
  uid: string;
  name: string;
  email: string | null;
  role: AdminRole;
};

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireAdmin(
  req: Request,
  allowedRoles?: AdminRole[]
): Promise<RequesterAdmin> {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    throw new HttpError(401, "Authorization header дутуу байна.");
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    throw new HttpError(401, "Token дутуу байна.");
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    throw new HttpError(401, "Token хүчингүй байна.");
  }

  const uid = decoded.uid;
  const snap = await adminDb.collection("admins").doc(uid).get();
  if (!snap.exists) {
    throw new HttpError(403, "Танд admin эрх алга.");
  }
  const data = snap.data() as { name?: string; email?: string; role?: string };
  if (!isValidRole(data.role)) {
    throw new HttpError(403, "Admin эрх хүчингүй байна.");
  }
  if (allowedRoles && !allowedRoles.includes(data.role)) {
    throw new HttpError(403, "Энэ үйлдлийг гүйцэтгэх эрхгүй байна.");
  }

  return {
    uid,
    name: data.name || "",
    email: data.email ?? decoded.email ?? null,
    role: data.role,
  };
}

export function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return Response.json({ status: "failed", msg: err.message }, { status: err.status });
  }
  const msg = err instanceof Error ? err.message : "Дотоод алдаа.";
  return Response.json({ status: "failed", msg }, { status: 500 });
}
