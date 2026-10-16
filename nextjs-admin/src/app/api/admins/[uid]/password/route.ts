import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { errorResponse, HttpError, requireAdmin } from "@/lib/api/serverAuth";

export const dynamic = "force-dynamic";

/**
 * Админы нууц үгийг шинээр тавина (зөвхөн "admin" эрхтэй хэрэглэгч).
 * Шинэ нууц үг хэрэглэгчид харагдахгүй, зөвхөн Firebase Auth дээр солигдоно;
 * хуучин session-уудыг хүчингүй болгохын тулд refresh token-уудыг цуцална.
 */
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ uid: string }> }
) {
  try {
    const requester = await requireAdmin(req, ["admin"]);
    const { uid } = await ctx.params;
    if (!uid) throw new HttpError(400, "uid дутуу байна.");

    const body = (await req.json().catch(() => ({}))) as { password?: unknown };
    const password = typeof body.password === "string" ? body.password : "";
    if (password.length < 6) {
      throw new HttpError(400, "Нууц үг хамгийн багадаа 6 тэмдэгт байна.");
    }

    const snap = await adminDb.collection("admins").doc(uid).get();
    if (!snap.exists) throw new HttpError(404, "Admin олдсонгүй.");

    await adminAuth.updateUser(uid, { password });
    // Хуучин нууц үгээр нэвтэрсэн төхөөрөмжүүдийг гаргана (өөрийгөө солих бол үлдээнэ).
    if (uid !== requester.uid) {
      await adminAuth.revokeRefreshTokens(uid);
    }

    await adminDb.collection("admins").doc(uid).set(
      {
        password_reset_at: new Date(),
        password_reset_by: requester.uid,
      },
      { merge: true }
    );

    return Response.json({ status: "success" });
  } catch (err) {
    return errorResponse(err);
  }
}
